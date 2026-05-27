"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, X, Sparkles, Zap, ArrowRight, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { LandingNav } from "@/components/landing/Nav";
import { LandingFooter } from "@/components/landing/Footer";

type Lang = "en" | "sw";
type Cycle = "monthly" | "yearly";

const T = {
  en: {
    badge: "Pricing",
    title: "Simple, transparent pricing",
    sub: "Start free. Upgrade when you're ready. No surprises, no hidden fees.",
    toggle: ["Monthly", "Yearly"],
    yearlySave: "Save 20%",
    popular: "Most popular",
    plans: [
      {
        name: "Starter", price: { monthly: "Free", yearly: "Free" }, period: "forever",
        desc: "Perfect for a single shop getting started.",
        cta: "Start free", ctaHref: "/signup",
        features: [
          { text: "1 shop", ok: true },
          { text: "100 products", ok: true },
          { text: "2 employees / cashiers", ok: true },
          { text: "Basic analytics (7 days)", ok: true },
          { text: "POS with offline mode", ok: true },
          { text: "Order management", ok: true },
          { text: "50 AI tokens / month", ok: true },
          { text: "Multi-shop management", ok: false },
          { text: "PDF / Excel exports", ok: false },
          { text: "Priority support", ok: false },
        ],
      },
      {
        name: "Business", price: { monthly: "TZS 25,000", yearly: "TZS 20,000" }, period: "/month",
        desc: "For growing businesses with multiple locations.",
        cta: "Try free 14 days", ctaHref: "/signup",
        highlight: true,
        features: [
          { text: "5 shops", ok: true },
          { text: "Unlimited products", ok: true },
          { text: "Unlimited employees", ok: true },
          { text: "Full analytics (all time)", ok: true },
          { text: "POS with offline mode", ok: true },
          { text: "Order management", ok: true },
          { text: "500 AI tokens / month", ok: true },
          { text: "Multi-shop management", ok: true },
          { text: "PDF / Excel / CSV exports", ok: true },
          { text: "Email support", ok: true },
        ],
      },
      {
        name: "Enterprise", price: { monthly: "Custom", yearly: "Custom" }, period: "",
        desc: "For large chains, distributors, and platform integrations.",
        cta: "Contact us", ctaHref: "/about#contact",
        features: [
          { text: "Unlimited shops", ok: true },
          { text: "Unlimited products", ok: true },
          { text: "Unlimited employees", ok: true },
          { text: "Full analytics + custom reports", ok: true },
          { text: "POS with offline mode", ok: true },
          { text: "Priority order management", ok: true },
          { text: "Custom AI token quota", ok: true },
          { text: "Multi-shop management", ok: true },
          { text: "Custom integrations (API)", ok: true },
          { text: "24/7 dedicated support + onboarding", ok: true },
        ],
      },
    ],
    tokenTitle: "AI Token Packs",
    tokenSub: "Need more AI tokens? Buy top-up packs at any time — for both shop owners and customers.",
    tokenNote: "Tokens never expire. Use them for AI business insights (owners) or the AI shopping assistant (customers).",
    ownerTokens: "For Shop Owners",
    customerTokens: "For Customers",
    ownerPacks: [
      { tokens: "200 tokens", price: "TZS 2,000", desc: "Extra AI insights & inventory advice" },
      { tokens: "1,000 tokens", price: "TZS 8,000", desc: "Weekly deep-analysis sessions" },
      { tokens: "5,000 tokens", price: "TZS 30,000", desc: "High-volume stores & power users", badge: "Best value" },
    ],
    customerPacks: [
      { tokens: "100 tokens", price: "TZS 1,000", desc: "Casual shopping assistance" },
      { tokens: "500 tokens", price: "TZS 4,000", desc: "Regular shoppers & product research" },
      { tokens: "2,000 tokens", price: "TZS 12,000", desc: "Power shoppers & bulk buyers", badge: "Best value" },
    ],
    faqTitle: "Pricing FAQ",
    faqs: [
      { q: "What counts as one AI token?", a: "Each AI chat message or generated insight uses 1 token. Longer responses use 1-3 tokens. The exact usage is shown in your account settings." },
      { q: "Can I switch plans at any time?", a: "Yes. Upgrade or downgrade at any time. If you upgrade mid-month you're charged the difference. Downgrades take effect at the next billing cycle." },
      { q: "What happens when I run out of AI tokens?", a: "The AI features pause until the next monthly reset or until you buy a top-up pack. All other POS, inventory, and analytics features keep working normally." },
      { q: "Is there a free trial for Business?", a: "Yes — a 14-day free trial with no credit card required. Full Business plan features during the trial." },
      { q: "Do yearly plans auto-renew?", a: "Yes. Yearly plans auto-renew at the same rate. You'll receive a reminder email 14 days before renewal and can cancel any time." },
    ],
  },
  sw: {
    badge: "Bei",
    title: "Bei rahisi, wazi",
    sub: "Anza bure. Panda daraja ukiwa tayari. Hakuna mshangao, hakuna ada zilizofichwa.",
    toggle: ["Kila mwezi", "Kila mwaka"],
    yearlySave: "Okoa 20%",
    popular: "Maarufu sana",
    plans: [
      {
        name: "Msingi", price: { monthly: "Bure", yearly: "Bure" }, period: "milele",
        desc: "Nzuri kwa duka moja linaloanza.",
        cta: "Anza bure", ctaHref: "/signup",
        features: [
          { text: "Duka 1", ok: true },
          { text: "Bidhaa 100", ok: true },
          { text: "Wafanyakazi / wakaguzi 2", ok: true },
          { text: "Takwimu za msingi (siku 7)", ok: true },
          { text: "POS na msaada wa nje ya mtandao", ok: true },
          { text: "Usimamizi wa maagizo", ok: true },
          { text: "Tokeni 50 za AI / mwezi", ok: true },
          { text: "Usimamizi wa maduka mengi", ok: false },
          { text: "Maudhui ya PDF / Excel", ok: false },
          { text: "Msaada wa kipaumbele", ok: false },
        ],
      },
      {
        name: "Biashara", price: { monthly: "TZS 25,000", yearly: "TZS 20,000" }, period: "/mwezi",
        desc: "Kwa biashara zinazokua na maeneo mengi.",
        cta: "Jaribu bure siku 14", ctaHref: "/signup",
        highlight: true,
        features: [
          { text: "Maduka 5", ok: true },
          { text: "Bidhaa bila kikomo", ok: true },
          { text: "Wafanyakazi bila kikomo", ok: true },
          { text: "Takwimu kamili (wakati wote)", ok: true },
          { text: "POS na msaada wa nje ya mtandao", ok: true },
          { text: "Usimamizi wa maagizo", ok: true },
          { text: "Tokeni 500 za AI / mwezi", ok: true },
          { text: "Usimamizi wa maduka mengi", ok: true },
          { text: "Maudhui ya PDF / Excel / CSV", ok: true },
          { text: "Msaada wa barua pepe", ok: true },
        ],
      },
      {
        name: "Makampuni Makubwa", price: { monthly: "Maalum", yearly: "Maalum" }, period: "",
        desc: "Kwa minyororo mikubwa, wasambazaji, na ujumuishaji wa jukwaa.",
        cta: "Wasiliana nasi", ctaHref: "/about#contact",
        features: [
          { text: "Maduka yasiyo na kikomo", ok: true },
          { text: "Bidhaa bila kikomo", ok: true },
          { text: "Wafanyakazi bila kikomo", ok: true },
          { text: "Takwimu kamili + ripoti maalum", ok: true },
          { text: "POS na msaada wa nje ya mtandao", ok: true },
          { text: "Usimamizi wa maagizo wa kipaumbele", ok: true },
          { text: "Kota maalum ya tokeni za AI", ok: true },
          { text: "Usimamizi wa maduka mengi", ok: true },
          { text: "Ujumuishaji maalum (API)", ok: true },
          { text: "Msaada wa 24/7 + ujumuishaji", ok: true },
        ],
      },
    ],
    tokenTitle: "Pakiti za Tokeni za AI",
    tokenSub: "Unahitaji tokeni zaidi za AI? Nunua pakiti za ziada wakati wowote — kwa wamiliki wa maduka na wateja.",
    tokenNote: "Tokeni haziishi. Zitumie kwa maarifa ya biashara ya AI (wamiliki) au msaidizi wa manunuzi wa AI (wateja).",
    ownerTokens: "Kwa Wamiliki wa Maduka",
    customerTokens: "Kwa Wateja",
    ownerPacks: [
      { tokens: "Tokeni 200", price: "TZS 2,000", desc: "Maarifa ya ziada ya AI na ushauri wa bidhaa" },
      { tokens: "Tokeni 1,000", price: "TZS 8,000", desc: "Vikao vya uchambuzi wa kina kila wiki" },
      { tokens: "Tokeni 5,000", price: "TZS 30,000", desc: "Maduka ya wingi na watumiaji wakuu", badge: "Thamani bora" },
    ],
    customerPacks: [
      { tokens: "Tokeni 100", price: "TZS 1,000", desc: "Msaada wa manunuzi wa kawaida" },
      { tokens: "Tokeni 500", price: "TZS 4,000", desc: "Wanunuzi wa kawaida na utafiti wa bidhaa" },
      { tokens: "Tokeni 2,000", price: "TZS 12,000", desc: "Wanunuzi wakuu na wanunuzi wa jumla", badge: "Thamani bora" },
    ],
    faqTitle: "Maswali ya Bei",
    faqs: [
      { q: "Tokeni moja ya AI ni nini?", a: "Kila ujumbe wa mazungumzo ya AI au ufahamu unaozalishwa hutumia tokeni 1. Majibu marefu hutumia tokeni 1-3. Matumizi halisi yanaonyeshwa katika mipangilio ya akaunti yako." },
      { q: "Je, ninaweza kubadilisha mipango wakati wowote?", a: "Ndiyo. Panda au shuka daraja wakati wowote. Ukipanda daraja katikati ya mwezi unalipishwa tofauti. Kushuka daraja kunaanza katika mzunguko wa malipo unaofuata." },
      { q: "Nini kinatokea nikimaliza tokeni za AI?", a: "Vipengele vya AI vinasimama mpaka upya wa kila mwezi au mpaka ununuzi wa pakiti ya ziada. Vipengele vyote vingine vya POS, bidhaa, na takwimu vinaendelea kufanya kazi kawaida." },
      { q: "Je, kuna jaribio la bure la Biashara?", a: "Ndiyo — jaribio la siku 14 bila kadi ya mkopo. Vipengele kamili vya mpango wa Biashara wakati wa jaribio." },
      { q: "Je, mipango ya kila mwaka inajisasisha yenyewe?", a: "Ndiyo. Mipango ya kila mwaka inajisasisha kwa kiwango sawa. Utapokea barua pepe ya ukumbusho siku 14 kabla ya upya na unaweza kufuta wakati wowote." },
    ],
  },
};

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors">
        <span className="font-medium text-sm pr-4">{q}</span>
        {open ? <ChevronUp size={16} className="text-primary shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
      </button>
      {open && <div className="px-5 pb-4 text-sm text-muted-foreground border-t border-border bg-muted/20 pt-3">{a}</div>}
    </div>
  );
}

export default function PricingPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const t = T[lang];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav lang={lang} setLang={setLang} />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-14 text-center">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">{t.badge}</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t.title}</h1>
        <p className="text-lg text-muted-foreground mb-8">{t.sub}</p>
        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 bg-muted rounded-xl p-1">
          {(["monthly", "yearly"] as Cycle[]).map((c, i) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${cycle === c ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {t.toggle[i]}
              {c === "yearly" && <span className="ml-1.5 text-xs bg-primary text-white px-1.5 py-0.5 rounded-md font-semibold">{t.yearlySave}</span>}
            </button>
          ))}
        </div>
      </section>

      {/* ── Plans ───────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid sm:grid-cols-3 gap-6">
          {t.plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 flex flex-col gap-5 ${(plan as any).highlight ? "border-primary bg-primary text-white shadow-2xl shadow-primary/25 scale-[1.02]" : "border-border bg-card"}`}
            >
              {(plan as any).highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-primary text-xs font-bold px-3 py-1 rounded-full shadow">
                  {t.popular}
                </div>
              )}
              <div>
                <p className={`font-bold text-xl mb-1 ${(plan as any).highlight ? "text-white" : ""}`}>{plan.name}</p>
                <p className={`text-xs mb-3 ${(plan as any).highlight ? "text-white/70" : "text-muted-foreground"}`}>{plan.desc}</p>
                <div className="flex items-end gap-1">
                  <span className={`text-4xl font-black ${(plan as any).highlight ? "text-white" : ""}`}>{plan.price[cycle]}</span>
                  <span className={`text-sm pb-1 ${(plan as any).highlight ? "text-white/70" : "text-muted-foreground"}`}>{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className={`flex items-center gap-2.5 text-sm ${(plan as any).highlight ? "text-white/90" : f.ok ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {f.ok
                      ? <CheckCircle size={14} className={(plan as any).highlight ? "text-white shrink-0" : "text-primary shrink-0"} />
                      : <X size={14} className="shrink-0 opacity-40" />
                    }
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.ctaHref}
                className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${(plan as any).highlight ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-white hover:bg-primary/90"}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI Token Packs ──────────────────────────────────────────────── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Sparkles size={13} /> AI Tokens
            </div>
            <h2 className="text-3xl font-bold mb-3">{t.tokenTitle}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-2">{t.tokenSub}</p>
            <p className="text-xs text-muted-foreground">{t.tokenNote}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            {/* Owner packs */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                  <Zap size={14} className="text-white" />
                </div>
                <p className="font-bold">{t.ownerTokens}</p>
              </div>
              <div className="space-y-3">
                {t.ownerPacks.map((pack) => (
                  <div key={pack.tokens} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:shadow-sm transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Sparkles size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{pack.tokens}</p>
                        <p className="text-xs text-muted-foreground">{pack.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{pack.price}</p>
                      {(pack as any).badge && (
                        <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-medium">{(pack as any).badge}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Customer packs */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <p className="font-bold">{t.customerTokens}</p>
              </div>
              <div className="space-y-3">
                {t.customerPacks.map((pack) => (
                  <div key={pack.tokens} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-blue-400/40 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Sparkles size={16} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{pack.tokens}</p>
                        <p className="text-xs text-muted-foreground">{pack.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{pack.price}</p>
                      {(pack as any).badge && (
                        <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-medium">{(pack as any).badge}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8 flex items-center justify-center gap-1.5">
            <HelpCircle size={13} />
            {lang === "sw" ? "Pakiti za tokeni zinapatikana mara baada ya kujiandikisha na kufungua akaunti." : "Token packs are available immediately after signing up — purchase from your account settings."}
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-24 max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-center mb-10">{t.faqTitle}</h2>
        <div className="space-y-3">
          {t.faqs.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────────── */}
      <section className="bg-primary py-16 text-center text-white">
        <h2 className="text-3xl font-bold mb-3">{lang === "sw" ? "Anza leo bila kadi ya mkopo" : "Start today, no credit card needed"}</h2>
        <p className="text-white/80 mb-6">{lang === "sw" ? "Jiunge na maelfu ya biashara Tanzania." : "Join thousands of businesses across Tanzania."}</p>
        <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-8 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all">
          {lang === "sw" ? "Anza Bure" : "Get Started Free"} <ArrowRight size={16} />
        </Link>
      </section>

      <LandingFooter lang={lang} />
    </div>
  );
}
