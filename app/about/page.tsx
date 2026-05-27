"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Heart, Globe, Shield, Zap, Users, Target, TrendingUp,
  Mail, MessageCircle, Building2,
} from "lucide-react";
import { LandingNav } from "@/components/landing/Nav";
import { LandingFooter } from "@/components/landing/Footer";

const VALUES = [
  { icon: Heart, color: "bg-red-500", en: { title: "Built with empathy", desc: "We started by listening to shop owners, not by writing code. Every feature exists because a real business owner needed it." }, sw: { title: "Ilitengenezwa kwa huruma", desc: "Tulianza kwa kusikiliza wamiliki wa maduka, sio kwa kuandika code. Kila kipengele kipo kwa sababu mmiliki wa biashara wa kweli alihitaji." } },
  { icon: Globe, color: "bg-blue-500", en: { title: "Africa-first thinking", desc: "Mobile money, offline-first, Swahili UI, TZS currency — we design for African realities, not as an afterthought." }, sw: { title: "Kufikiri Afrika kwanza", desc: "Simu ya pesa, kutumika nje ya mtandao, kiolesura cha Kiswahili, sarafu ya TZS — tunaunda kwa uhalisia wa Afrika, sio kama wazo la baadaye." } },
  { icon: Shield, color: "bg-green-600", en: { title: "Radical transparency", desc: "Pricing you can see. Data you own. No algorithms deciding what you pay for. No dark patterns." }, sw: { title: "Uwazi mkubwa", desc: "Bei unazoweza kuona. Data unayomiliki. Hakuna algoriti zinazoamua unalolipa. Hakuna mifumo ya giza." } },
  { icon: Zap, color: "bg-yellow-500", en: { title: "Speed as a feature", desc: "A POS that takes 10 seconds per sale. A dashboard that loads in under 1 second. Performance is not optional." }, sw: { title: "Kasi kama kipengele", desc: "POS inayochukua sekunde 10 kwa mauzo. Dashibodi inayopakia chini ya sekunde 1. Utendaji si wa hiari." } },
];

const TEAM_CULTURE = [
  { en: "Remote-first team across Tanzania and East Africa", sw: "Timu ya mbali kote Tanzania na Afrika Mashariki" },
  { en: "Every employee uses Herufi to manage their own side business", sw: "Kila mfanyakazi anatumia Herufi kusimamia biashara yao ya upande" },
  { en: "Customer support responds in both English and Swahili", sw: "Msaada wa wateja unajibu kwa Kiingereza na Kiswahili" },
  { en: "Open-source core components shared back to the community", sw: "Sehemu za msingi za chanzo huria zinashirikishwa na jamii" },
];

const IMPACT = [
  { value: "12,000+", label: { en: "Active shops", sw: "Maduka yanayotumika" }, icon: Building2, color: "text-green-600" },
  { value: "7+", label: { en: "Countries in Africa", sw: "Nchi Afrika" }, icon: Globe, color: "text-blue-600" },
  { value: "TZS 8B+", label: { en: "Revenue tracked for businesses", sw: "Mapato yaliyofuatiliwa kwa biashara" }, icon: TrendingUp, color: "text-purple-600" },
  { value: "2", label: { en: "Languages (EN + SW)", sw: "Lugha (EN + SW)" }, icon: Users, color: "text-orange-600" },
];

const TIMELINE = [
  { year: "2023", en: "Herufi founded in Dar es Salaam after research with 200+ shop owners across Tanzania", sw: "Herufi ilianzishwa Dar es Salaam baada ya utafiti na wamiliki 200+ wa maduka kote Tanzania" },
  { year: "2024", en: "Launched POS, inventory, and basic analytics. First 500 shops onboarded.", sw: "Ilianzisha POS, bidhaa, na takwimu za msingi. Maduka ya kwanza 500 yaliunganishwa." },
  { year: "2025", en: "Added AI insights powered by Gemini, multi-shop support, and customer marketplace", sw: "Iliongeza maarifa ya AI yanayotumia Gemini, msaada wa maduka mengi, na soko la wateja" },
  { year: "2026", en: "Expanding to Kenya, Uganda, and Rwanda. Enterprise plan launched.", sw: "Inapanua Kenya, Uganda, na Rwanda. Mpango wa Makampuni Makubwa ulianzishwa." },
];

export default function AboutPage() {
  const [lang, setLang] = useState<"en" | "sw">("en");
  const sw = lang === "sw";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav lang={lang} setLang={setLang} />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-background pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Heart size={13} />
            {sw ? "Kuhusu Sisi" : "About Us"}
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6">
            {sw ? "Tunaunda kwa ajili ya biashara za" : "Building for the businesses that"}
            <br />
            <span className="text-primary">{sw ? "Afrika zinazostahili zaidi" : "power Africa"}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {sw
              ? "Herufi ilianzishwa Tanzania kwa dhamira moja: kutoa wafanyabiashara wa rejareja na jumla zana sawa za kisasa ambazo biashara kubwa zimekuwa nazo kwa miaka."
              : "Herufi was founded in Tanzania with a single mission: to give retail and wholesale businesses the same powerful modern tools that large enterprises have had for years."}
          </p>
        </div>
      </section>

      {/* ── Mission ───────────────────────────────────────────────────── */}
      <section id="mission" className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-4">
              <Target size={14} /> {sw ? "Dhamira Yetu" : "Our Mission"}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              {sw ? "Uchumi wa Afrika unaamuliwa na mamilioni ya maduka madogo." : "Africa's economy is driven by millions of small shops."}
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                {sw
                  ? "Karibu 90% ya biashara ndogondogo Tanzania bado zinatumia karatasi, madaftari, na hisia kutafuta ukweli kuhusu biashara zao. Zinakosa ufahamu. Zinakosa zana. Zinastahili zaidi."
                  : "Nearly 90% of small businesses in Tanzania still use paper, notebooks, and gut feelings to understand their business. They lack visibility. They lack tools. They deserve better."}
              </p>
              <p>
                {sw
                  ? "Herufi iliundwa kubadilisha hilo — kwa kujenga mfumo unaofanya kazi jinsi Afrika inavyofanya kazi: offline, kwa Kiswahili, na simu za bei nafuu, na akili bandia inayoelewa mazingira ya ndani."
                  : "Herufi was built to change that — by building a system that works the way Africa works: offline, in Swahili, on affordable phones, with AI that understands local context."}
              </p>
              <p>
                {sw
                  ? "Tunaunda biashara kutoka Tanzania, kwa Afrika, kwa ulimwengu."
                  : "We're building from Tanzania, for Africa, for the world."}
              </p>
            </div>
          </div>
          {/* Visual */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🇹🇿", title: sw ? "Tanzanian" : "Made in Tanzania", sub: sw ? "Dar es Salaam" : "Dar es Salaam, Tanzania" },
              { icon: "🌍", title: sw ? "Kwa Afrika" : "For Africa", sub: sw ? "Nchi 7+" : "7+ countries" },
              { icon: "🤝", title: sw ? "Inayomilikiwa na Jamii" : "Community driven", sub: sw ? "Maoni ya wamiliki 200+" : "200+ owner inputs" },
              { icon: "🚀", title: sw ? "Inakua Haraka" : "Fast growing", sub: sw ? "Maduka 12,000+" : "12,000+ shops" },
            ].map((card) => (
              <div key={card.title} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2 hover:border-primary/30 hover:shadow-md transition-all">
                <span className="text-3xl">{card.icon}</span>
                <p className="font-bold text-sm">{card.title}</p>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Impact stats ──────────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {IMPACT.map(({ value, label, icon: Icon, color }) => (
              <div key={value} className="text-center p-6 bg-card border border-border rounded-2xl">
                <Icon size={20} className={`${color} mx-auto mb-3`} />
                <p className="text-3xl font-black mb-1">{value}</p>
                <p className="text-sm text-muted-foreground">{sw ? label.sw : label.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story / Timeline ──────────────────────────────────────────── */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-center mb-14">
          {sw ? "Safari Yetu" : "Our Story"}
        </h2>
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-10">
            {TIMELINE.map((item) => (
              <div key={item.year} className="flex gap-8 items-start relative">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 z-10">
                  {item.year.slice(2)}
                </div>
                <div className="pb-4">
                  <p className="font-bold text-primary text-sm mb-1">{item.year}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{sw ? item.sw : item.en}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────── */}
      <section id="values" className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">{sw ? "Maadili Yetu" : "Our Values"}</h2>
            <p className="text-muted-foreground">{sw ? "Kanuni zinazoongoza kila uamuzi tunaoufanya." : "The principles that guide every decision we make."}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {VALUES.map((v) => {
              const Icon = v.icon;
              const content = sw ? v.sw : v.en;
              return (
                <div key={v.en.title} className="bg-card border border-border rounded-2xl p-6 flex gap-4 hover:border-primary/30 hover:shadow-md transition-all">
                  <div className={`w-11 h-11 rounded-xl ${v.color} flex items-center justify-center shrink-0`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-1">{content.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{content.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Team Culture ──────────────────────────────────────────────── */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">
              {sw ? "Timu Iliyoundwa ili Ielewe Biashara" : "A Team That Understands Business"}
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {sw
                ? "Wanachama wetu wa timu wanajua changamoto za kuendesha biashara Tanzania kwa sababu wamezipitia wenyewe. Sio wataalam wa nje — ni watu wanaojua hali halisi."
                : "Our team members know the challenges of running a business in Tanzania because they've lived them. Not outside consultants — people who understand the real situation."}
            </p>
            <ul className="space-y-3">
              {TEAM_CULTURE.map((item) => (
                <li key={item.en} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  {sw ? item.sw : item.en}
                </li>
              ))}
            </ul>
          </div>
          {/* Stat grid */}
          <div className="bg-gradient-to-br from-primary/5 to-background border border-primary/20 rounded-2xl p-8">
            <p className="text-sm font-semibold text-primary mb-6 uppercase tracking-widest">{sw ? "Alama za Timu" : "Team Highlights"}</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: "100%", l: sw ? "Watanzania" : "Tanzanian team" },
                { n: "3+", l: sw ? "Miaka ya uzoefu" : "Years building" },
                { n: "EN+SW", l: sw ? "Lugha za msaada" : "Support languages" },
                { n: "24/7", l: sw ? "Ufuatiliaji wa mfumo" : "System monitoring" },
              ].map(({ n, l }) => (
                <div key={n} className="text-center">
                  <p className="text-2xl font-black text-primary">{n}</p>
                  <p className="text-xs text-muted-foreground mt-1">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Careers teaser ────────────────────────────────────────────── */}
      <section id="careers" className="py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Users size={20} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">{sw ? "Jiunge na Timu Yetu" : "Join Our Team"}</h2>
          <p className="text-muted-foreground mb-6">
            {sw
              ? "Tunajumuisha watu wanaopenda kutatua matatizo ya kweli ya biashara Afrika. Kama uko tayari kuunda kitu kinachobadilisha maisha, tunataka kukusikia."
              : "We're looking for people who love solving real business problems in Africa. If you're ready to build something that changes lives, we want to hear from you."}
          </p>
          <a
            href="mailto:careers@herufi.com"
            className="inline-flex items-center gap-2 h-11 px-6 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
          >
            <Mail size={14} /> careers@herufi.com
          </a>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────── */}
      <section id="contact" className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">{sw ? "Wasiliana Nasi" : "Get in Touch"}</h2>
          <p className="text-muted-foreground">{sw ? "Tuko hapa kukusaidia — kwa njia yoyote unayopendelea." : "We're here to help — reach us however you prefer."}</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: Mail, title: "Email", val: "support@herufi.com", href: "mailto:support@herufi.com", color: "bg-blue-500" },
            { icon: MessageCircle, title: "WhatsApp", val: "+255 700 000 000", href: "https://wa.me/255700000000", color: "bg-green-500" },
            { icon: Building2, title: sw ? "Ofisi" : "Office", val: "Dar es Salaam, Tanzania", href: "https://maps.google.com/?q=Dar+es+Salaam", color: "bg-orange-500" },
          ].map(({ icon: Icon, title, val, href, color }) => (
            <a
              key={title}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-md transition-all text-center"
            >
              <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{val}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────── */}
      <section className="bg-primary py-16 text-center text-white">
        <h2 className="text-3xl font-bold mb-3">
          {sw ? "Tayari kuanza safari yako?" : "Ready to start your journey?"}
        </h2>
        <p className="text-white/80 mb-6 max-w-md mx-auto">
          {sw ? "Jiunge na maelfu ya biashara Tanzania zinazotumia Herufi kukua." : "Join thousands of businesses across Tanzania growing with Herufi."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-7 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all">
            {sw ? "Anza Bure" : "Get Started Free"} <ArrowRight size={16} />
          </Link>
          <Link href="/pricing" className="inline-flex items-center gap-2 h-12 px-7 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/30">
            {sw ? "Angalia Bei" : "View Pricing"}
          </Link>
        </div>
      </section>

      <LandingFooter lang={lang} />
    </div>
  );
}
