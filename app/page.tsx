"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, BarChart3, Building2, CheckCircle, Package, ShoppingCart,
  Sparkles, Users, Zap, Shield, Smartphone, TrendingUp, ChevronDown,
  ChevronUp, Star, Globe, Clock, Award,
} from "lucide-react";
import { LandingNav } from "@/components/landing/Nav";
import { LandingFooter } from "@/components/landing/Footer";
import { LandingChatBot } from "@/components/landing/ChatBot";

/* ─── tiny helpers ───────────────────────────────────────────────────────── */
const T = {
  en: {
    badge: "AI-Powered · Built for Africa",
    hero1: "Run your entire business",
    hero2: "from one smart platform",
    heroSub: "POS, inventory, AI insights, analytics, and customer loyalty — all in one mobile-first app built for wholesalers and retailers across Tanzania and Africa.",
    cta1: "Start for free", cta2: "See it in action",
    trust: "Trusted by businesses across Tanzania",
    problemTitle: "Managing a shop is hard. Herufi makes it easy.",
    problemSub: "We've talked to thousands of shop owners across Tanzania. Here are the problems we solve.",
    solutionTitle: "One platform. Every tool you need.",
    solutionSub: "Herufi replaces five separate tools with one seamless experience.",
    featuresTitle: "Everything you need to grow your business",
    featuresSub: "Built for the real challenges of running a retail or wholesale business in Africa.",
    howTitle: "Up and running in minutes",
    howSub: "No complicated setup. No IT team needed. Just sign up and start selling.",
    aiTitle: "Your AI business partner",
    aiSub: "Herufi AI works behind the scenes — analysing your data, flagging risks, and surfacing opportunities before you even think to ask.",
    statsTitle: "Trusted by growing businesses",
    statsDesc: "Real numbers from the Herufi platform.",
    testimonialsTitle: "What shop owners say",
    testimonialsSub: "Real stories from real business owners across Tanzania.",
    pricingTitle: "Simple, transparent pricing",
    pricingSub: "Start free. Upgrade when you're ready. No credit card required.",
    faqTitle: "Frequently asked questions",
    faqSub: "Everything you need to know before getting started.",
    ctaTitle: "Ready to transform your business?",
    ctaSub: "Join thousands of shop owners who run their entire business on Herufi.",
    ctaBtn: "Start for free — no credit card needed",
  },
  sw: {
    badge: "Inayotumiwa AI · Ilitengenezwa kwa Afrika",
    hero1: "Simamia biashara yako yote",
    hero2: "kutoka mfumo mmoja smart",
    heroSub: "POS, bidhaa, maarifa ya AI, takwimu, na uaminifu wa wateja — zote katika programu moja iliyoundwa kwa wafanyabiashara wa Tanzania na Afrika.",
    cta1: "Anza Bure", cta2: "Ona jinsi inavyofanya kazi",
    trust: "Inayoaminiwa na biashara kote Tanzania",
    problemTitle: "Kusimamia duka ni ngumu. Herufi inafanya iwe rahisi.",
    problemSub: "Tumezungumza na maelfu ya wamiliki wa maduka Tanzania. Hizi ndizo matatizo tunayoyatatua.",
    solutionTitle: "Mfumo mmoja. Zana zote unazohitaji.",
    solutionSub: "Herufi inabadilisha zana tano tofauti kuwa uzoefu mmoja laini.",
    featuresTitle: "Kila kitu unachohitaji kukua biashara yako",
    featuresSub: "Imeundwa kwa changamoto za kweli za kuendesha biashara ya rejareja au jumla Afrika.",
    howTitle: "Unafanya kazi ndani ya dakika",
    howSub: "Hakuna usanidi mgumu. Hakuna timu ya IT inayohitajika. Jisajili tu na uanze kuuza.",
    aiTitle: "Mshirika wako wa biashara wa AI",
    aiSub: "Herufi AI inafanya kazi nyuma ya pazia — ikichambua data yako, ikibainisha hatari, na kuonyesha fursa kabla hata hujafikiria kuuliza.",
    statsTitle: "Inayoaminiwa na biashara zinazokua",
    statsDesc: "Nambari za kweli kutoka jukwaa la Herufi.",
    testimonialsTitle: "Wamiliki wa maduka wanasema nini",
    testimonialsSub: "Hadithi za kweli kutoka kwa wamiliki wa biashara kote Tanzania.",
    pricingTitle: "Bei rahisi, wazi",
    pricingSub: "Anza bure. Panda daraja ukiwa tayari. Hakuna kadi ya mkopo inayohitajika.",
    faqTitle: "Maswali yanayoulizwa mara kwa mara",
    faqSub: "Kila kitu unachohitaji kujua kabla ya kuanza.",
    ctaTitle: "Uko tayari kubadilisha biashara yako?",
    ctaSub: "Jiunge na maelfu ya wamiliki wa maduka wanaoendesha biashara yao yote kwenye Herufi.",
    ctaBtn: "Anza bure — hakuna kadi ya mkopo inayohitajika",
  },
};

/* ─── data ───────────────────────────────────────────────────────────────── */
const PROBLEMS = [
  { icon: "📒", en: "Writing sales in a notebook that gets lost or damaged", sw: "Kuandika mauzo daftarini ambalo hupotea au kuharibika" },
  { icon: "😰", en: "Running out of stock without knowing until a customer asks", sw: "Kukosa bidhaa bila kujua mpaka mteja aulize" },
  { icon: "🤷", en: "No way to know which products are actually profitable", sw: "Hakuna njia ya kujua bidhaa zipi ni za faida kweli kweli" },
  { icon: "⏰", en: "Wasting hours counting inventory manually every week", sw: "Kupoteza masaa kuhesabu bidhaa kwa mkono kila wiki" },
  { icon: "📉", en: "No visibility into why revenue is going up or down", sw: "Hakuna ufahamu wa kwa nini mapato yanaingia juu au chini" },
  { icon: "👋", en: "Employees with no accountability or access controls", sw: "Wafanyakazi wasio na uwajibikaji au udhibiti wa ufikiaji" },
];

const FEATURES = [
  { icon: ShoppingCart, title: { en: "Smart POS", sw: "POS Smart" }, desc: { en: "Fast checkout with barcode scanning, offline support, and instant digital receipts.", sw: "Malipo ya haraka na scan ya barcode, msaada wa nje ya mtandao, na risiti za kidijitali." }, color: "bg-blue-500" },
  { icon: Package, title: { en: "Inventory Management", sw: "Usimamizi wa Bidhaa" }, desc: { en: "Track stock levels, expiry dates, and get low-stock alerts before you run out.", sw: "Fuatilia viwango vya hifadhi, tarehe za kuisha, na upate tahadhari za hifadhi ndogo." }, color: "bg-orange-500" },
  { icon: BarChart3, title: { en: "Analytics & Reports", sw: "Takwimu na Ripoti" }, desc: { en: "Beautiful dashboards with revenue charts, top products, and exportable PDF/Excel reports.", sw: "Dashibodi nzuri na grafu za mapato, bidhaa bora, na ripoti za PDF/Excel." }, color: "bg-purple-500" },
  { icon: Users, title: { en: "Employee Management", sw: "Usimamizi wa Wafanyakazi" }, desc: { en: "Assign roles, set permissions, and track performance — per employee, per shop.", sw: "Teua majukumu, weka idhini, na fuatilia utendaji kwa kila mfanyakazi, kwa kila duka." }, color: "bg-pink-500" },
  { icon: Building2, title: { en: "Multi-Shop", sw: "Maduka Mengi" }, desc: { en: "Manage unlimited branches from one account. Switch shops in a tap.", sw: "Simamia matawi yasiyo na kikomo kutoka akaunti moja. Badilisha maduka kwa kubonyeza." }, color: "bg-green-600" },
  { icon: Sparkles, title: { en: "AI Business Insights", sw: "Maarifa ya Biashara ya AI" }, desc: { en: "Herufi AI analyses your live data and delivers actionable advice in English or Swahili.", sw: "Herufi AI inachambua data yako moja kwa moja na kutoa ushauri unaoweza kufanywa." }, color: "bg-yellow-500" },
];

const STEPS = {
  en: [
    { n: "01", title: "Create your account", desc: "Sign up with your email or Google in under 60 seconds. No credit card needed." },
    { n: "02", title: "Set up your shop", desc: "Add your shop name, location, products, and employees. We walk you through every step." },
    { n: "03", title: "Start selling & tracking", desc: "Use the POS, manage orders, view AI insights, and watch your business grow." },
  ],
  sw: [
    { n: "01", title: "Fungua akaunti yako", desc: "Jisajili kwa barua pepe yako au Google ndani ya sekunde 60. Hakuna kadi ya mkopo inayohitajika." },
    { n: "02", title: "Sanidi duka lako", desc: "Ongeza jina la duka, mahali, bidhaa, na wafanyakazi. Tunakuongoza kila hatua." },
    { n: "03", title: "Anza kuuza na kufuatilia", desc: "Tumia POS, simamia maagizo, angalia maarifa ya AI, na utazame biashara yako ikua." },
  ],
};

const AI_FEATURES = {
  en: [
    "\"Rice sales are up 28% this week — consider restocking before Friday\"",
    "\"3 products expire in 7 days. Discount them now to avoid losses\"",
    "\"Your Tuesday afternoon is your busiest period — staff accordingly\"",
    "\"Cooking oil margin dropped. Your supplier may have raised their price\"",
  ],
  sw: [
    "\"Mauzo ya mchele yameongezeka kwa 28% wiki hii — fikiria kujaza kabla ya Ijumaa\"",
    "\"Bidhaa 3 zinaisha tarehe katika siku 7. Zipunguzie bei sasa kuepuka hasara\"",
    "\"Mchana wa Jumanne ni wakati wako wenye shughuli zaidi — panga wafanyakazi ipasavyo\"",
    "\"Faida ya mafuta ya kupikia imeshuka. Muuzaji wako anaweza kuwa amepandisha bei\"",
  ],
};

const STATS = [
  { value: "12,000+", label: { en: "Active shops", sw: "Maduka yanayotumika" }, icon: Building2 },
  { value: "TZS 8B+", label: { en: "Revenue tracked", sw: "Mapato yaliyofuatiliwa" }, icon: TrendingUp },
  { value: "450,000+", label: { en: "Orders processed", sw: "Maagizo yaliyoshughulikiwa" }, icon: ShoppingCart },
  { value: "4.8 ★", label: { en: "Average rating", sw: "Kiwango cha wastani" }, icon: Star },
];

const TESTIMONIALS = [
  {
    name: "Amina Hassan",
    role: { en: "Wholesale owner, Kariakoo", sw: "Mmiliki wa jumla, Kariakoo" },
    text: {
      en: "Before Herufi I used three notebooks and a spreadsheet. Now I see everything in one place. The AI told me my maize flour was about to run out before I even noticed — saved me two days of lost sales.",
      sw: "Kabla ya Herufi nilikuwa natumia madaftari matatu na jedwali. Sasa ninaona kila kitu mahali pamoja. AI ilinieleza unga wangu wa mahindi ulikuwa karibu kuisha kabla sijaona — iliokoa siku mbili za mauzo yaliyopotea.",
    },
    avatar: "AH",
    color: "bg-green-500",
  },
  {
    name: "Juma Mwangi",
    role: { en: "Retail chain manager, Arusha", sw: "Meneja wa mnyororo wa rejareja, Arusha" },
    text: {
      en: "Managing 3 branches used to mean driving between them. With Herufi I can see every shop's stock, sales, and employee performance from my phone in 30 seconds.",
      sw: "Kusimamia matawi 3 kulimaanisha kuendesha kati yao. Kwa Herufi ninaweza kuona hifadhi ya kila duka, mauzo, na utendaji wa wafanyakazi kutoka simu yangu ndani ya sekunde 30.",
    },
    avatar: "JM",
    color: "bg-blue-500",
  },
  {
    name: "Fatima Said",
    role: { en: "Grocery & pharmacy owner, Zanzibar", sw: "Mmiliki wa duka la vitu, Zanzibar" },
    text: {
      en: "The expiry tracking alone was worth it. I used to throw away thousands of shillings of stock every month. Now the AI warns me two weeks early and I discount before it expires.",
      sw: "Ufuatiliaji wa tarehe za kuisha peke yake ulistahili. Nilikuwa natupa maelfu ya shilingi za hifadhi kila mwezi. Sasa AI inanionya wiki mbili mapema na ninapunguza bei kabla haijaisha.",
    },
    avatar: "FS",
    color: "bg-purple-500",
  },
];

const PLANS = {
  en: [
    { name: "Starter", price: "Free", period: "forever", highlight: false, features: ["1 shop", "100 products", "2 cashiers", "Basic analytics", "50 AI tokens/month"], cta: "Start free" },
    { name: "Business", price: "TZS 25,000", period: "/month", highlight: true, features: ["5 shops", "Unlimited products", "Unlimited employees", "Full analytics + reports", "500 AI tokens/month", "PDF/Excel exports"], cta: "Try free for 14 days" },
    { name: "Enterprise", price: "Custom", period: "", highlight: false, features: ["Unlimited shops", "Custom employee limits", "Priority support 24/7", "Dedicated onboarding", "Custom AI token quota"], cta: "Contact us" },
  ],
  sw: [
    { name: "Msingi", price: "Bure", period: "milele", highlight: false, features: ["Duka 1", "Bidhaa 100", "Wakaguzi 2", "Takwimu za msingi", "Tokeni 50 za AI/mwezi"], cta: "Anza bure" },
    { name: "Biashara", price: "TZS 25,000", period: "/mwezi", highlight: true, features: ["Maduka 5", "Bidhaa bila kikomo", "Wafanyakazi wote", "Takwimu kamili + ripoti", "Tokeni 500 za AI/mwezi", "Maudhui ya PDF/Excel"], cta: "Jaribu bure kwa siku 14" },
    { name: "Makampuni Makubwa", price: "Maalum", period: "", highlight: false, features: ["Maduka yasiyo na kikomo", "Mipaka maalum ya wafanyakazi", "Msaada wa kipaumbele 24/7", "Ujumuishaji maalum", "Kota maalum ya tokeni za AI"], cta: "Wasiliana nasi" },
  ],
};

const FAQS = {
  en: [
    { q: "Is Herufi really free to start?", a: "Yes. The Starter plan is completely free with no time limit — 1 shop, 100 products, and 2 cashiers. No credit card required to sign up." },
    { q: "Does Herufi work without internet?", a: "Yes. The POS works offline and syncs automatically when you reconnect. Your sales data is never lost." },
    { q: "Can I manage multiple shops?", a: "Yes — on the Business and Enterprise plans you can create and manage multiple branches, compare their performance, and assign different employees to each." },
    { q: "What payment methods does the POS support?", a: "Cash, Mobile Money (M-Pesa, Airtel Money, TiGo Pesa, Halopesa), Card, and Bank Transfer. You can configure which ones are available for each shop." },
    { q: "Is my data safe?", a: "All data is stored securely in Supabase with row-level security. We use HTTPS everywhere, JWT authentication, and never share your data with third parties." },
    { q: "Does Herufi support Swahili?", a: "Fully. Every screen, every notification, and the AI assistant all work in both English and Swahili. Switch language any time from the settings." },
    { q: "What are AI tokens?", a: "AI tokens power the Herufi AI assistant — each message or insight generated uses tokens. The Starter plan includes 50 free tokens per month. You can buy additional token packs from the Pricing page, or upgrade your plan for more." },
    { q: "Can I export my data?", a: "Yes. Export sales, inventory, financial, and employee reports in PDF, Excel (.xlsx), and CSV formats. For full datasets use Excel — PDF exports the first 60 rows." },
  ],
  sw: [
    { q: "Je, Herufi ni ya bure kweli kweli kuanza?", a: "Ndiyo. Mpango wa Msingi ni wa bure kabisa bila kikomo cha muda — duka 1, bidhaa 100, na wakaguzi 2. Hakuna kadi ya mkopo inayohitajika kusajiliwa." },
    { q: "Je, Herufi inafanya kazi bila mtandao?", a: "Ndiyo. POS inafanya kazi nje ya mtandao na inasawazisha otometi unapoungana tena. Data yako ya mauzo haipotei kamwe." },
    { q: "Je, ninaweza kusimamia maduka mengi?", a: "Ndiyo — katika mipango ya Biashara na Makampuni Makubwa unaweza kuunda na kusimamia matawi mengi, kulinganisha utendaji wao, na kuteua wafanyakazi tofauti kwa kila moja." },
    { q: "Je, POS inasaidia njia gani za malipo?", a: "Pesa taslimu, Simu ya Pesa (M-Pesa, Airtel Money, TiGo Pesa, Halopesa), Kadi, na Uhamisho wa Benki." },
    { q: "Je, data yangu iko salama?", a: "Data yote imehifadhiwa salama katika Supabase na usalama wa safu. Tunatumia HTTPS kila mahali, uthibitishaji wa JWT, na hatuzingati data yako kwa watu wa tatu." },
    { q: "Je, Herufi inasaidia Kiswahili?", a: "Kabisa. Kila skrini, kila arifa, na msaidizi wa AI zote zinafanya kazi kwa Kiingereza na Kiswahili. Badilisha lugha wakati wowote kutoka mipangilio." },
    { q: "Tokeni za AI ni nini?", a: "Tokeni za AI huendesha msaidizi wa Herufi AI — kila ujumbe au ufahamu unaozalishwa hutumia tokeni. Mpango wa Msingi unajumuisha tokeni 50 za bure kwa mwezi." },
    { q: "Je, ninaweza kuhamisha data yangu?", a: "Ndiyo. Hamisha ripoti za mauzo, bidhaa, fedha, na wafanyakazi katika PDF, Excel (.xlsx), na CSV." },
  ],
};

/* ─── inline dashboard mockup ────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/10 bg-background text-xs select-none">
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-muted border-b border-border">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-muted-foreground text-[10px]">herufi.com/dashboard</span>
      </div>
      <div className="flex h-56 sm:h-72">
        {/* Sidebar */}
        <div className="w-28 sm:w-36 bg-muted/60 border-r border-border p-2 flex flex-col gap-1 shrink-0">
          {["Dashboard","Inventory","POS","Orders","Customers","Financial","AI"].map((s, i) => (
            <div key={s} className={`px-2 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1.5 ${i === 0 ? "bg-primary text-white" : "text-muted-foreground"}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              {s}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-3 overflow-hidden">
          <p className="font-bold text-[11px] mb-2">Dashboard — Duka la Kariakoo</p>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[["TZS 2.4M","Revenue","text-green-600"],["347","Orders","text-blue-600"],["1,203","Products","text-orange-600"]].map(([v, l, c]) => (
              <div key={l} className="bg-card border border-border rounded-lg p-1.5">
                <p className={`font-bold text-[11px] sm:text-xs ${c}`}>{v}</p>
                <p className="text-muted-foreground text-[9px]">{l}</p>
              </div>
            ))}
          </div>
          {/* Chart */}
          <div className="bg-card border border-border rounded-lg p-2 mb-2">
            <p className="text-[9px] text-muted-foreground mb-1.5">Weekly Revenue</p>
            <div className="flex items-end gap-1 h-12">
              {[30,55,40,75,60,90,70].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-primary/20 hover:bg-primary/40 transition-colors relative">
                  <div className="absolute bottom-0 left-0 right-0 rounded-sm bg-primary transition-all" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
          </div>
          {/* AI insight badge */}
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-lg px-2 py-1">
            <Sparkles size={9} className="text-primary shrink-0" />
            <p className="text-[9px] text-primary font-medium line-clamp-1">AI: Restock rice — sales up 28% this week</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ accordion item ─────────────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-sm sm:text-base pr-4">{q}</span>
        {open ? <ChevronUp size={16} className="shrink-0 text-primary" /> : <ChevronDown size={16} className="shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border bg-muted/20">
          <p className="pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────────────────────── */
export default function Home() {
  const [lang, setLang] = useState<"en" | "sw">("en");
  const t = T[lang];
  const faqs = FAQS[lang];
  const plans = PLANS[lang];
  const steps = STEPS[lang];
  const aiMessages = AI_FEATURES[lang];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav lang={lang} setLang={setLang} />

      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Sparkles size={13} />
                {t.badge}
              </div>
              <h1 id="hero-description" className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-tight mb-5">
                {t.hero1}
                <br />
                <span className="text-primary">{t.hero2}</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                {t.heroSub}
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-7 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-95">
                  {t.cta1} <ArrowRight size={16} />
                </Link>
                <Link href="/docs" className="inline-flex items-center gap-2 h-12 px-7 border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors">
                  {t.cta2}
                </Link>
              </div>
              {/* Trust badges */}
              <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                {[
                  [CheckCircle, lang === "sw" ? "Bila kadi ya mkopo" : "No credit card"],
                  [Shield, lang === "sw" ? "Data ipo salama" : "Data secured"],
                  [Smartphone, lang === "sw" ? "Inafanya kazi offline" : "Works offline"],
                  [Globe, lang === "sw" ? "Kiingereza & Kiswahili" : "English & Swahili"],
                ].map(([Icon, text]) => (
                  <span key={text as string} className="flex items-center gap-1.5">
                    <Icon size={14} className="text-primary" />
                    {text as string}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="relative">
              <DashboardMockup />
              {/* Floating badges */}
              <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 animate-bounce-slow">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <TrendingUp size={14} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold">+28%</p>
                  <p className="text-[10px] text-muted-foreground">{lang === "sw" ? "Mapato wiki hii" : "Revenue this week"}</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-card border border-border rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <Zap size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold">{lang === "sw" ? "Inajibu mara moja" : "Instant alerts"}</p>
                  <p className="text-[10px] text-muted-foreground">{lang === "sw" ? "Hifadhi ndogo" : "Low stock: Rice"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="border-y border-border bg-muted/30 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <p className="text-center text-sm text-muted-foreground">{t.trust}</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PROBLEM / SOLUTION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Problems */}
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-destructive bg-destructive/10 px-3 py-1 rounded-full mb-4">
              {lang === "sw" ? "Matatizo ya kawaida" : "Common pain points"}
            </span>
            <h2 className="text-3xl font-bold mb-4">{t.problemTitle}</h2>
            <p className="text-muted-foreground mb-8">{t.problemSub}</p>
            <ul className="space-y-4">
              {PROBLEMS.map((p) => (
                <li key={p.en} className="flex items-start gap-3 p-3 rounded-xl border border-destructive/20 bg-destructive/5">
                  <span className="text-xl">{p.icon}</span>
                  <p className="text-sm text-muted-foreground">{lang === "sw" ? p.sw : p.en}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Solution */}
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              {lang === "sw" ? "Suluhisho la Herufi" : "The Herufi solution"}
            </span>
            <h2 className="text-3xl font-bold mb-4">{t.solutionTitle}</h2>
            <p className="text-muted-foreground mb-8">{t.solutionSub}</p>
            <ul className="space-y-4">
              {[
                { en: "Real-time stock tracking — always know what you have", sw: "Ufuatiliaji wa hifadhi wa wakati halisi — daima ujue unachomiliki" },
                { en: "Instant low-stock and expiry alerts via push notification", sw: "Tahadhari za papo hapo za hifadhi ndogo na kuisha kupitia arifa" },
                { en: "AI-powered profit analysis for every product", sw: "Uchambuzi wa faida unaotumia AI kwa kila bidhaa" },
                { en: "Barcode-powered POS takes under 10 seconds per sale", sw: "POS inayotumia barcode inachukua chini ya sekunde 10 kwa kila mauzo" },
                { en: "Live revenue dashboard on your phone, 24/7", sw: "Dashibodi ya mapato moja kwa moja kwenye simu yako, 24/7" },
                { en: "Role-based employee access with full audit logs", sw: "Ufikiaji wa wafanyakazi kulingana na jukumu na kumbukumbu kamili za ukaguzi" },
              ].map((item) => (
                <li key={item.en} className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
                  <CheckCircle size={16} className="text-primary shrink-0" />
                  <p className="text-sm">{lang === "sw" ? item.sw : item.en}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t.featuresTitle}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.featuresSub}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title.en} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all group">
                  <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{lang === "sw" ? f.title.sw : f.title.en}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{lang === "sw" ? f.desc.sw : f.desc.en}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t.howTitle}</h2>
          <p className="text-muted-foreground">{t.howSub}</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden sm:block absolute top-8 left-[calc(33%+1rem)] right-[calc(33%+1rem)] h-0.5 bg-border" />
          {steps.map((s, i) => (
            <div key={s.n} className="text-center relative">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/30">
                {s.n}
              </div>
              <h3 className="font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-8 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all">
            {lang === "sw" ? "Anza sasa" : "Get started now"} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          AI SHOWCASE
      ══════════════════════════════════════════════════════════════════ */}
      <section id="ai" className="py-24 bg-gradient-to-br from-primary/5 via-background to-background border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-5">
                <Sparkles size={13} /> Herufi AI — Powered by Gemini
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t.aiTitle}</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">{t.aiSub}</p>
              <div className="flex flex-wrap gap-3">
                {[
                  lang === "sw" ? "Kiingereza & Kiswahili" : "English & Swahili",
                  lang === "sw" ? "Data ya moja kwa moja" : "Live business data",
                  lang === "sw" ? "Ushauri wa vitendo" : "Actionable advice",
                  lang === "sw" ? "Salama kabisa" : "100% server-side",
                ].map((tag) => (
                  <span key={tag} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-muted-foreground">
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>
            {/* AI chat mockup */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles size={13} className="text-white" />
                </div>
                <span className="text-sm font-semibold">Herufi AI</span>
                <span className="ml-auto flex items-center gap-1 text-xs text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {lang === "sw" ? "Hai" : "Live"}
                </span>
              </div>
              <div className="p-4 space-y-3">
                {aiMessages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={11} className="text-primary" />
                    </div>
                    <p className="text-sm bg-muted rounded-xl rounded-tl-sm px-3 py-2 text-muted-foreground leading-relaxed">
                      {msg}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2 bg-muted/30">
                  <input className="flex-1 text-sm bg-transparent outline-none text-muted-foreground" placeholder={lang === "sw" ? "Uliza swali lolote kuhusu biashara yako..." : "Ask anything about your business..."} readOnly />
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center cursor-pointer">
                    <ArrowRight size={12} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">{t.statsTitle}</h2>
          <p className="text-muted-foreground">{t.statsDesc}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={value} className="text-center p-6 bg-card border border-border rounded-2xl">
              <Icon size={20} className="text-primary mx-auto mb-3" />
              <p className="text-3xl font-black text-foreground mb-1">{value}</p>
              <p className="text-sm text-muted-foreground">{lang === "sw" ? label.sw : label.en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t.testimonialsTitle}</h2>
            <p className="text-muted-foreground">{t.testimonialsSub}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((tm) => (
              <div key={tm.name} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => <Star key={s} size={13} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 italic">"{lang === "sw" ? tm.text.sw : tm.text.en}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div className={`w-9 h-9 rounded-full ${tm.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {tm.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{tm.name}</p>
                    <p className="text-xs text-muted-foreground">{lang === "sw" ? tm.role.sw : tm.role.en}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PRICING PREVIEW
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t.pricingTitle}</h2>
          <p className="text-muted-foreground">{t.pricingSub}</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl border p-6 flex flex-col gap-4 ${plan.highlight ? "border-primary bg-primary text-white shadow-xl shadow-primary/20" : "border-border bg-card"}`}>
              <div>
                <p className={`font-bold text-lg ${plan.highlight ? "text-white" : ""}`}>{plan.name}</p>
                <div className="flex items-end gap-1 mt-1">
                  <span className={`text-3xl font-black ${plan.highlight ? "text-white" : ""}`}>{plan.price}</span>
                  <span className={`text-sm pb-1 ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-white/90" : "text-muted-foreground"}`}>
                    <CheckCircle size={13} className={plan.highlight ? "text-white" : "text-primary"} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.name === (lang === "sw" ? "Makampuni Makubwa" : "Enterprise") ? "/about#contact" : "/signup"}
                className={`block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-all ${plan.highlight ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-white hover:bg-primary/90"}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/pricing" className="text-sm text-primary hover:underline font-medium">
            {lang === "sw" ? "Angalia bei zote ikiwemo tokeni za AI →" : "See full pricing including AI token packs →"}
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t.faqTitle}</h2>
            <p className="text-muted-foreground">{t.faqSub}</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            {lang === "sw" ? "Bado una maswali?" : "Still have questions?"}{" "}
            <a href="https://wa.me/255700000000" className="text-primary font-medium hover:underline">
              {lang === "sw" ? "Tuandikiei WhatsApp" : "Message us on WhatsApp"}
            </a>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
            <Award size={28} className="text-white" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-5">{t.ctaTitle}</h2>
          <p className="text-lg text-muted-foreground mb-8">{t.ctaSub}</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 h-14 px-10 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all active:scale-95 text-base"
          >
            {t.ctaBtn} <ArrowRight size={18} />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            {[[Clock, lang === "sw" ? "Dakika 2 kuanza" : "2 minutes to set up"],[Shield, lang === "sw" ? "Usalama wa kiwango cha benki" : "Bank-grade security"],[Globe, lang === "sw" ? "Kiingereza & Kiswahili" : "English & Swahili"]].map(([I, txt]) => (
              <span key={txt as string} className="flex items-center gap-1.5"><I size={13} className="text-primary" />{txt as string}</span>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter lang={lang} />

      {/* ── AI Chatbot (floating, bottom-right) ── */}
      <LandingChatBot lang={lang} />
    </div>
  );
}
