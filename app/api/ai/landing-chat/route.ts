/**
 * /api/ai/landing-chat
 *
 * 4-step lookup pipeline (cheapest first):
 *
 *  1. Static FAQ trigger-phrase match   → free, in-memory, instant
 *  2. Supabase learned-cache lookup     → free, DB Jaccard ≥ 0.35
 *  3. Monthly IP rate-limit check       → 2 AI calls / 30 days per IP
 *  4. Gemini AI generation              → costs tokens; answer stored for future
 *
 * Response shape:
 *  { answer: string; source: "faq" | "cache" | "ai"; remaining?: number }
 */

import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Config ─────────────────────────────────────────────────────────────────
const AI_MONTHLY_LIMIT   = 2;
const AI_MONTHLY_WINDOW  = 30 * 24 * 60 * 60 * 1000; // 30 days
const JACCARD_THRESHOLD  = 0.35;  // minimum similarity to treat as "same question"
const CACHE_CANDIDATE_LIMIT = 25; // max DB rows to fetch for re-ranking

// ── Supabase (anon key — open RLS policies on landing_qa_cache) ─────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Text utilities ──────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  // English
  "a","an","the","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","shall","should","may","might","must","can",
  "could","to","for","of","in","on","at","by","with","from","up","about","into",
  "and","or","but","if","not","no","yes","any","all","both","few","more","most",
  "other","some","such","there","i","my","you","your","he","his","she","her","it",
  "we","our","they","their","me","him","us","them","this","that","these","those",
  "what","when","where","how","why","who","which","just","very","so","also","too",
  "get","use","make","give","tell","know","see","want","need",
  // Swahili
  "je","ni","ya","na","wa","kwa","za","la","si","au","pia","sana","hii","hiyo",
  "hizo","hawa","hilo","nini","wapi","lini","kwamba","lakini","bali","ama",
  "mimi","wewe","yeye","sisi","nyinye","wao","hiyo","hata",
]);

/** Strip punctuation, lowercase, remove stopwords, keep words ≥ 3 chars. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));
}

function normalizeQ(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Jaccard similarity between two keyword arrays.
 * Returns 0–1; higher = more similar.
 */
function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const w of setA) if (setB.has(w)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

// ── Cache helpers ───────────────────────────────────────────────────────────

interface CacheRow {
  id: string;
  question_norm: string;
  keywords: string[];
  answer_en: string | null;
  answer_sw: string | null;
}

/**
 * Look up the best matching cached answer using array-overlap pre-filter
 * + Jaccard re-ranking.
 * Returns null on miss (no match ≥ JACCARD_THRESHOLD).
 */
async function lookupCache(
  supabase: ReturnType<typeof getSupabase>,
  keywords: string[],
  lang: "en" | "sw"
): Promise<{ row: CacheRow; answer: string } | null> {
  if (keywords.length === 0) return null;

  // PostgreSQL array overlap filter — uses GIN index
  const pgArr = `{${keywords.join(",")}}`;
  const { data, error } = await supabase
    .from("landing_qa_cache")
    .select("id, question_norm, keywords, answer_en, answer_sw")
    .filter("keywords", "ov", pgArr)
    .limit(CACHE_CANDIDATE_LIMIT);

  if (error || !data || data.length === 0) return null;

  // Re-rank by Jaccard; pick best with a valid answer for requested lang
  let best: { row: CacheRow; answer: string; score: number } | null = null;

  for (const row of data as CacheRow[]) {
    const answer = lang === "en" ? row.answer_en : row.answer_sw;
    if (!answer) continue;  // this lang not yet cached for this question
    const score = jaccard(keywords, row.keywords);
    if (score >= JACCARD_THRESHOLD && score > (best?.score ?? 0)) {
      best = { row, answer, score };
    }
  }

  return best ? { row: best.row, answer: best.answer } : null;
}

/**
 * Persist a new AI-generated answer.
 * - INSERT on first occurrence.
 * - UPDATE the null language column on duplicate (same question, other lang).
 */
async function storeCache(
  supabase: ReturnType<typeof getSupabase>,
  questionRaw: string,
  keywords: string[],
  lang: "en" | "sw",
  answer: string
): Promise<void> {
  try {
    const norm = normalizeQ(questionRaw);
    const col  = lang === "en" ? "answer_en" : "answer_sw";

    // Attempt INSERT
    const { error: insertErr } = await supabase
      .from("landing_qa_cache")
      .insert({
        question_raw: questionRaw,
        question_norm: norm,
        keywords,
        answer_en: lang === "en" ? answer : null,
        answer_sw: lang === "sw" ? answer : null,
      });

    if (!insertErr) return; // success

    // 23505 = unique_violation (same question_norm already exists)
    if ((insertErr as { code?: string }).code === "23505") {
      // Fill in the missing language column (only if currently null)
      await supabase
        .from("landing_qa_cache")
        .update({ [col]: answer })
        .eq("question_norm", norm)
        .is(col, null);
    }
  } catch (err) {
    console.error("[landing-chat] storeCache error:", err);
    // Non-fatal — don't surface to user
  }
}

/** Bump hit_count + last_hit_at for a cache entry. */
async function recordCacheHit(
  supabase: ReturnType<typeof getSupabase>,
  id: string
): Promise<void> {
  try {
    // Read current count then increment (no atomic RPC needed — slight race is fine)
    const { data } = await supabase
      .from("landing_qa_cache")
      .select("hit_count")
      .eq("id", id)
      .single();

    if (data) {
      await supabase
        .from("landing_qa_cache")
        .update({ hit_count: (data.hit_count ?? 0) + 1, last_hit_at: new Date().toISOString() })
        .eq("id", id);
    }
  } catch {
    // Non-fatal
  }
}

// ── Static FAQ database ────────────────────────────────────────────────────
// Trigger-phrase matching (longest match wins). Serves before any DB call.

interface FAQEntry {
  id: string;
  triggers: string[];
  en: string;
  sw: string;
}

const FAQ_DATABASE: FAQEntry[] = [
  {
    id: "what_is",
    triggers: [
      "what is herufi","about herufi","herufi is","tell me about herufi",
      "explain herufi","herufi ni nini","herufi inafanya nini",
      "herufi maana","what does herufi do",
    ],
    en: "**Herufi** is an all-in-one business management platform built for retailers and wholesalers in Tanzania and Africa. 🚀\n\nIn one app you get:\n• **POS** — fast checkout, barcode scanning, offline support\n• **Inventory** — stock tracking, expiry alerts, low-stock warnings\n• **Analytics** — revenue charts, profit tracking, exportable reports\n• **AI Insights** — demand prediction, restocking recommendations\n• **Employee Management** — roles, permissions, performance\n• **Multi-Shop** — manage multiple branches from one account\n• **Customer Loyalty** — points system, purchase history\n• **Mobile Money** — M-Pesa, Airtel, TiGo Pesa, Halopesa\n\nWorks offline · Available in English & Swahili · Free to start.",
    sw: "**Herufi** ni jukwaa la usimamizi wa biashara lililojengwa kwa wafanyabiashara Tanzania na Afrika. 🚀\n\nKatika programu moja unapata:\n• **POS** — malipo ya haraka, scan barcode, inafanya kazi bila mtandao\n• **Bidhaa** — ufuatiliaji hifadhi, tahadhari za kuisha, onyo la hifadhi ndogo\n• **Takwimu** — grafu za mapato, ufuatiliaji faida, ripoti zinazoweza kuhamishwa\n• **Maarifa ya AI** — utabiri wa mahitaji, mapendekezo ya kujaza tena\n• **Usimamizi wa Wafanyakazi** — majukumu, idhini, utendaji\n• **Maduka Mengi** — simamia matawi mengi kutoka akaunti moja\n• **Uaminifu wa Wateja** — mfumo wa pointi, historia ya manunuzi\n• **Simu ya Pesa** — M-Pesa, Airtel, TiGo Pesa, Halopesa\n\nInafanya kazi bila mtandao · Kiingereza & Kiswahili · Bure kuanza.",
  },
  {
    id: "free_pricing",
    triggers: [
      "free","cost","pricing","how much","price","bure","bei","gharama",
      "pesa ngapi","subscription","ada","pay","malipo ya mpango","ni bei gani",
      "starter plan","business plan",
    ],
    en: "**Herufi is free to start!** 🎉\n\n**Starter** (Free forever):\n• 1 shop · 100 products · 2 cashiers\n• Basic analytics · 50 AI tokens/month\n\n**Business** (TZS 25,000/month):\n• 5 shops · Unlimited products & employees\n• Full analytics + reports · 500 AI tokens/month\n• PDF / Excel exports\n\n**Enterprise** — Custom pricing for unlimited shops.\n\nNo credit card needed. [See full pricing →](/pricing)",
    sw: "**Herufi ni ya bure kuanza!** 🎉\n\n**Msingi** (Bure milele):\n• Duka 1 · Bidhaa 100 · Wakaguzi 2\n• Takwimu za msingi · Tokeni 50 za AI/mwezi\n\n**Biashara** (TZS 25,000/mwezi):\n• Maduka 5 · Bidhaa & wafanyakazi bila kikomo\n• Takwimu kamili + ripoti · Tokeni 500 za AI/mwezi\n• Maudhui ya PDF/Excel\n\n**Makampuni Makubwa** — Bei maalum kwa maduka yasiyo na kikomo.\n\nHakuna kadi ya mkopo inayohitajika. [Angalia bei kamili →](/pricing)",
  },
  {
    id: "offline",
    triggers: [
      "offline","without internet","no internet","no wifi","without wifi",
      "bila mtandao","bila internet","bila wifi","hakuna mtandao",
      "works without","inafanya kazi bila","poor connection","mtandao mbaya",
    ],
    en: "**Yes — Herufi works offline!** 📴\n\nThe POS runs fully without internet. Sales are saved locally and automatically sync to the cloud when you reconnect.\n\nYou'll never lose a sale due to poor connectivity — perfect for busy markets and areas with unstable internet.",
    sw: "**Ndiyo — Herufi inafanya kazi bila mtandao!** 📴\n\nPOS inafanya kazi kikamilifu bila internet. Mauzo yanahifadhiwa ndani na yanasawazisha otometi kwenye wingu unapounganika tena.\n\nHutapoteza mauzo kamwe kwa sababu ya mtandao mbaya.",
  },
  {
    id: "multi_shop",
    triggers: [
      "multiple shops","many shops","branches","multi shop","more than one shop",
      "maduka mengi","matawi","duka zaidi","maduka kadhaa","manage branches",
    ],
    en: "**Yes — Herufi supports multiple shops/branches!** 🏪\n\nOn the **Business plan**:\n• Manage up to 5 shops from one account\n• Compare branch performance side-by-side\n• Assign different employees per branch\n• Transfer stock between branches\n• Consolidated reports across all shops\n\n**Enterprise** supports unlimited shops.",
    sw: "**Ndiyo — Herufi inasaidia maduka/matawi mengi!** 🏪\n\nKwenye **Mpango wa Biashara**:\n• Simamia maduka hadi 5 kutoka akaunti moja\n• Linganisha utendaji wa tawi kwa upande\n• Teua wafanyakazi tofauti kwa kila tawi\n• Hamisha hifadhi kati ya matawi\n• Ripoti zilizojumuishwa kwa maduka yote\n\n**Makampuni Makubwa** yanasaidia maduka yasiyo na kikomo.",
  },
  {
    id: "payment",
    triggers: [
      "payment","m-pesa","mpesa","airtel money","tigo pesa","halopesa",
      "mobile money","payment methods","malipo","njia za malipo","simu ya pesa",
    ],
    en: "**Herufi POS supports multiple payment methods:** 💳\n\n• **Cash** — traditional payments\n• **Mobile Money** — M-Pesa, Airtel Money, TiGo Pesa, Halopesa\n• **Card** — debit / credit cards\n• **Bank Transfer**\n\nEnable or disable specific methods per shop.",
    sw: "**POS ya Herufi inasaidia njia nyingi za malipo:** 💳\n\n• **Pesa Taslimu** — malipo ya kawaida\n• **Simu ya Pesa** — M-Pesa, Airtel Money, TiGo Pesa, Halopesa\n• **Kadi** — kadi za debit/credit\n• **Uhamisho wa Benki**",
  },
  {
    id: "security",
    triggers: [
      "secure","safe","data safe","privacy","security","hack","encrypted",
      "salama","usalama","data yangu","faragha","protected",
    ],
    en: "**Your data is fully secure with Herufi.** 🔒\n\n• Supabase with row-level security (RLS)\n• HTTPS everywhere — all data encrypted in transit\n• JWT authentication — secure session management\n• No third-party data sharing\n• Role-based employee access controls\n• Full audit logs for every action",
    sw: "**Data yako iko salama kabisa na Herufi.** 🔒\n\n• Supabase na usalama wa safu (RLS)\n• HTTPS kila mahali — data imefichwa wakati wa kusafiri\n• Uthibitishaji wa JWT — usimamizi salama wa kikao\n• Hakuna kushiriki na watu wa tatu\n• Udhibiti wa ufikiaji kulingana na jukumu\n• Kumbukumbu kamili za ukaguzi",
  },
  {
    id: "swahili",
    triggers: [
      "swahili","kiswahili","lugha","language","english","kiingereza","bilingual",
    ],
    en: "**Herufi fully supports both English and Kiswahili!** 🌍\n\nEvery screen, notification, and the AI assistant all work in both languages. Switch any time from your profile settings.",
    sw: "**Herufi inasaidia kikamilifu Kiingereza na Kiswahili!** 🌍\n\nKila skrini, arifa, na msaidizi wa AI zote zinafanya kazi kwa lugha zote mbili. Badilisha wakati wowote kutoka mipangilio yako.",
  },
  {
    id: "ai_features",
    triggers: [
      "ai token","tokens","ai credits","gemini","how does ai work","ai works",
      "tokeni","ai inafanya kazi","tokeni za ai","ai assistant","ai insights",
    ],
    en: "**Herufi AI is powered by Gemini (Google).** ✨\n\nTokens power the assistant:\n• **Starter** — 50 free tokens/month\n• **Business** — 500 tokens/month\n• **Enterprise** — custom quota\n\nThe AI analyses your live sales, inventory, and employee data to give actionable advice:\n> _\"Rice up 28% this week — restock before Friday\"_",
    sw: "**Herufi AI inaendeshwa na Gemini (Google).** ✨\n\nTokeni huendesha msaidizi:\n• **Msingi** — tokeni 50/mwezi\n• **Biashara** — tokeni 500/mwezi\n• **Makampuni Makubwa** — kota maalum\n\nAI inachambua mauzo, bidhaa na utendaji wa wafanyakazi kukupa ushauri unaoweza kufanywa.",
  },
  {
    id: "export",
    triggers: [
      "export","download","pdf","excel","csv","hamisha","pakua","ripoti",
      "download report","export data",
    ],
    en: "**Yes — Herufi supports full data export!** 📊\n\n• **PDF** — sales, inventory, financial, employee reports\n• **Excel (.xlsx)** — full datasets for analysis\n• **CSV** — import into other systems\n\nAvailable on Business and Enterprise plans.",
    sw: "**Ndiyo — Herufi inasaidia maudhui kamili ya data!** 📊\n\n• **PDF** — ripoti za mauzo, bidhaa, fedha, wafanyakazi\n• **Excel (.xlsx)** — seti kamili za data\n• **CSV** — kwa kuingiza kwenye mifumo mingine\n\nInapatikana kwenye mipango ya Biashara na Makampuni Makubwa.",
  },
  {
    id: "signup_how",
    triggers: [
      "how to sign up","how to register","create account","get started",
      "sign up","register","jinsi ya kusajili","jinsi ya kuanza",
      "fungua akaunti","jisajili","start free",
    ],
    en: "**Getting started with Herufi takes under 5 minutes — completely free!** ⚡\n\n1. Go to [herufi.com/signup](/signup)\n2. Sign up with email, phone, or Google\n3. Create your first shop\n4. Add products\n5. Start selling with the POS!\n\nNo credit card required.",
    sw: "**Kuanza na Herufi kunachukua chini ya dakika 5 — bure kabisa!** ⚡\n\n1. Nenda [herufi.com/signup](/signup)\n2. Jisajili kwa barua pepe, simu, au Google\n3. Unda duka lako la kwanza\n4. Ongeza bidhaa\n5. Anza kuuza na POS!\n\nHakuna kadi ya mkopo inayohitajika.",
  },
  {
    id: "inventory",
    triggers: [
      "inventory","stock tracking","low stock","expiry","barcode","sku",
      "kuisha","hifadhi ndogo","track inventory","bidhaa","hifadhi",
    ],
    en: "**Herufi has powerful inventory management!** 📦\n\n• Real-time stock tracking\n• Low-stock alerts before you run out\n• Expiry date tracking (14-day warnings)\n• Barcode / SKU generation and scanning\n• Product categories and variations\n• Batch tracking and supplier info\n• Stock transfer between branches\n• AI demand forecasting",
    sw: "**Herufi ina usimamizi mzuri wa bidhaa!** 📦\n\n• Ufuatiliaji wa hifadhi kwa wakati halisi\n• Tahadhari za hifadhi ndogo kabla ya kumalizika\n• Ufuatiliaji wa tarehe za kuisha (onyo la siku 14)\n• Uzalishaji na scan ya barcode/SKU\n• Makundi na tofauti za bidhaa\n• Ufuatiliaji wa kundi na muuzaji\n• Uhamisho wa hifadhi kati ya matawi\n• Utabiri wa mahitaji wa AI",
  },
  {
    id: "employees",
    triggers: [
      "employee","staff","cashier","manager","role","permission","assign employee",
      "wafanyakazi","mkaguzi","meneja","idhini","jukumu",
    ],
    en: "**Herufi has complete employee management!** 👥\n\n• Invite employees by phone / email / username\n• Assign roles: Cashier, Inventory Manager, Sales Agent, etc.\n• Custom permissions per employee\n• Assign to specific branches\n• Track sales performance\n• Full activity & audit logs",
    sw: "**Herufi ina usimamizi kamili wa wafanyakazi!** 👥\n\n• Alika wafanyakazi kwa simu/barua pepe/jina\n• Teua majukumu: Mkaguzi, Meneja wa Bidhaa, n.k.\n• Idhini maalum kwa kila mfanyakazi\n• Teua kwa matawi maalum\n• Fuatilia utendaji wa mauzo\n• Kumbukumbu kamili za shughuli",
  },
  {
    id: "pos",
    triggers: [
      "pos","point of sale","checkout","receipt","scan","barcode scan",
      "malipo ya haraka","risiti","fast checkout",
    ],
    en: "**Herufi POS is fast, simple, and works offline!** 🛒\n\n• Scan or search products\n• Supports barcode scanners\n• Discounts and automatic tax\n• Cash, Mobile Money, Card\n• Instant digital receipts\n• Daily closing reports\n• **Works offline** — auto-syncs when back online\n\nA complete sale in under 10 seconds.",
    sw: "**POS ya Herufi ni ya haraka, rahisi, na inafanya kazi bila mtandao!** 🛒\n\n• Scan au tafuta bidhaa\n• Inasaidia viskena vya barcode\n• Punguzo na kodi ya ushuru otometi\n• Pesa taslimu, simu ya pesa, kadi\n• Risiti za kidijitali za papo hapo\n• **Inafanya kazi bila mtandao** — inasawazisha otometi\n\nMauzo kamili chini ya sekunde 10.",
  },
  {
    id: "mobile",
    triggers: [
      "mobile app","android","ios","phone app","pwa","install app",
      "app ya simu","programu","android app",
    ],
    en: "**Herufi is mobile-first!** 📱\n\n• Works on any phone browser\n• **PWA** — install like a native app (no Play Store needed)\n• Android-optimized\n• Offline mode with auto-sync\n\nOpen **herufi.com** on your phone → tap \"Add to Home Screen\".",
    sw: "**Herufi inajengwa kwanza kwa simu!** 📱\n\n• Inafanya kazi kwenye kivinjari chochote cha simu\n• **PWA** — sakinisha kama programu ya asili\n• Iliyoboreshwa kwa Android\n• Hali ya nje ya mtandao na usawazishaji otometi\n\nFungua **herufi.com** kwenye simu → bonyeza \"Ongeza kwenye Skrini ya Nyumbani\".",
  },
  {
    id: "analytics",
    triggers: [
      "analytics","charts","revenue","profit","takwimu","grafu","mapato",
      "faida","statistics","best selling","top products",
    ],
    en: "**Herufi has beautiful, powerful analytics!** 📊\n\n• Revenue & profit (daily / weekly / monthly)\n• Best-selling products & categories\n• Employee performance comparisons\n• Branch comparisons\n• Revenue heatmaps\n• Export to PDF, Excel, CSV\n\nThe AI flags trends and risks automatically.",
    sw: "**Herufi ina takwimu nzuri na zenye nguvu!** 📊\n\n• Mapato na faida (kila siku/wiki/mwezi)\n• Bidhaa na makundi yanayouza zaidi\n• Ulinganisho wa utendaji wa wafanyakazi\n• Ulinganisho wa matawi\n• Ramani za joto za mapato\n• Hamisha kwa PDF, Excel, CSV\n\nAI inabainisha mwelekeo na hatari otometi.",
  },
];

function findFaqMatch(question: string): FAQEntry | null {
  const q   = question.toLowerCase();
  let best: FAQEntry | null = null;
  let bestLen = 0;

  for (const faq of FAQ_DATABASE) {
    for (const trigger of faq.triggers) {
      const t = trigger.toLowerCase();
      const matched =
        t.length >= 6
          ? q.includes(t)
          : new RegExp(
              `(?:^|\\s|[^a-z])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|[^a-z]|$)`
            ).test(q);
      if (matched && t.length > bestLen) {
        bestLen = t.length;
        best    = faq;
      }
    }
  }

  return bestLen >= 3 ? best : null;
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { question, lang } = body as { question?: unknown; lang?: unknown };

  if (typeof question !== "string" || question.trim().length === 0 || question.length > 500) {
    return Response.json({ error: "Invalid question (1–500 chars)" }, { status: 400 });
  }

  const resolvedLang: "en" | "sw" = lang === "sw" ? "sw" : "en";
  const q            = question.trim();
  const userKeywords = tokenize(q);

  // ── Step 1: Static FAQ trigger match ────────────────────────────────────
  const faqMatch = findFaqMatch(q);
  if (faqMatch) {
    return Response.json({
      answer: resolvedLang === "sw" ? faqMatch.sw : faqMatch.en,
      source: "faq",
    });
  }

  // ── Step 2: Supabase learned-cache lookup ────────────────────────────────
  const supabase = getSupabase();

  if (userKeywords.length > 0) {
    const cacheHit = await lookupCache(supabase, userKeywords, resolvedLang);
    if (cacheHit) {
      // Bump stats in the background — don't await
      void recordCacheHit(supabase, cacheHit.row.id);
      return Response.json({
        answer: cacheHit.answer,
        source: "cache",
      });
    }
  }

  // ── Step 3: Monthly IP rate-limit ────────────────────────────────────────
  const rl = rateLimit(`landing_ai:${ip}`, AI_MONTHLY_LIMIT, AI_MONTHLY_WINDOW);
  if (!rl.success) {
    return Response.json(
      {
        error:
          resolvedLang === "sw"
            ? "Umefika kikomo cha maswali 2 ya AI kwa mwezi. Jaribu tena mwezi ujao!"
            : "You've reached the limit of 2 AI questions per month. Try again next month!",
        remaining: 0,
      },
      {
        status: 429,
        headers: {
          "Retry-After":            String(Math.ceil(rl.retryAfterMs / 1000)),
          "X-RateLimit-Remaining":  "0",
          "X-RateLimit-Reset":      String(Math.ceil(rl.resetAt / 1000)),
        },
      }
    );
  }

  // ── Step 4: Gemini AI ────────────────────────────────────────────────────
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  const systemPrompt = `You are Herufi AI, a friendly assistant on the Herufi landing page.
Herufi is an all-in-one business management platform for retailers and wholesalers in Tanzania and Africa.

KEY FEATURES:
- POS with barcode scanning and offline support
- Inventory management (expiry tracking, low-stock alerts, batch tracking)
- Analytics dashboards with PDF/Excel/CSV exports
- Gemini-powered AI insights (demand prediction, restocking recommendations)
- Employee management with roles and permissions
- Multi-shop (manage multiple branches from one account)
- Customer loyalty points system
- Mobile Money: M-Pesa, Airtel Money, TiGo Pesa, Halopesa
- Works offline with automatic sync
- English and Kiswahili

PRICING:
- Starter: Free forever (1 shop, 100 products, 2 cashiers, 50 AI tokens/month)
- Business: TZS 25,000/month (5 shops, unlimited, 500 AI tokens/month)
- Enterprise: Custom (unlimited shops, priority support)

INSTRUCTIONS:
- Reply in ${resolvedLang === "sw" ? "Kiswahili (Swahili)" : "English"}
- Be friendly, concise — under 180 words
- Use **bold** for key terms, bullet lists where helpful
- Mention sign-up is free at /signup when relevant
- Unknown specifics → direct to /docs or support`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
  });

  try {
    const result = await model.generateContent(q);
    const answer = result.response.text();

    // Store in cache — fire and forget, never block the response
    void storeCache(supabase, q, userKeywords, resolvedLang, answer);

    return Response.json({
      answer,
      source: "ai",
      remaining: rl.remaining,
    });
  } catch (err: unknown) {
    console.error("[landing-chat] Gemini error:", err instanceof Error ? err.message : err);
    return Response.json(
      { error: "AI service temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }
}
