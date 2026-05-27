"use client";

import { useLang } from "@/lib/i18n/context";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle,
  Package,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function LandingPage() {
  const { t, lang, setLang } = useLang();
  const [mobileMenu, setMobileMenu] = useState(false);

  const FEATURES = [
    {
      icon: Package,
      title: "Smart Inventory",
      desc:
        lang === "sw"
          ? "Fuatilia hisa, tarehe za kuisha, na mapendekezo ya kujaza upya kutoka AI."
          : "Track stock, expiry dates, and get AI-powered restock recommendations.",
    },
    {
      icon: ShoppingCart,
      title: lang === "sw" ? "Mfumo wa Mauzo" : "Point of Sale",
      desc:
        lang === "sw"
          ? "Kiolesura cha haraka cha muuzaji na scan ya barcode, risiti na hali ya nje ya mtandao."
          : "Fast cashier interface with barcode scanning, receipts and offline mode.",
    },
    {
      icon: BarChart3,
      title: lang === "sw" ? "Takwimu na Ripoti" : "Analytics & Reports",
      desc:
        lang === "sw"
          ? "Dashibodi nzuri na grafu za mapato, KPI na ripoti zinazoweza kupakuliwa."
          : "Beautiful dashboards with revenue charts, KPIs and exportable reports.",
    },
    {
      icon: Users,
      title: lang === "sw" ? "Wateja na Wafanyakazi" : "Customers & Employees",
      desc:
        lang === "sw"
          ? "Pointi za uaminifu, usimamizi wa mkopo, na ufikiaji wa wafanyakazi kulingana na jukumu."
          : "Loyalty points, credit management, and role-based employee access.",
    },
    {
      icon: Building2,
      title: lang === "sw" ? "Maduka Mengi" : "Multi-Shop",
      desc:
        lang === "sw"
          ? "Simamia matawi mengi kutoka akaunti moja na ulinganishe utendaji."
          : "Manage multiple branches from one account with performance comparisons.",
    },
    {
      icon: Sparkles,
      title: lang === "sw" ? "Maarifa ya AI" : "AI Business Insights",
      desc:
        lang === "sw"
          ? "Herufi AI inachambua data yako na kutoa ushauri wa biashara unaoweza kufanywa."
          : "Herufi AI analyzes your data and gives actionable business advice.",
    },
  ];

  const PLANS = [
    {
      name: lang === "sw" ? "Msingi" : "Starter",
      price: lang === "sw" ? "Bure" : "Free",
      period: lang === "sw" ? "Milele" : "Forever",
      features:
        lang === "sw"
          ? ["Duka 1", "Bidhaa 100", "Muuzaji 2", "Analytics msingi"]
          : ["1 shop", "100 products", "2 cashiers", "Basic analytics"],
      cta: lang === "sw" ? "Anza Sasa" : "Get Started",
      href: "/signup",
    },
    {
      name: "Business",
      price: "TZS 25,000",
      period: lang === "sw" ? "/mwezi" : "/month",
      features:
        lang === "sw"
          ? [
              "Maduka 5",
              "Bidhaa zisizo na kikomo",
              "Waajiriwa wote",
              "Analytics kamili",
              "Usaidizi AI",
            ]
          : [
              "5 shops",
              "Unlimited products",
              "All employees",
              "Full analytics",
              "AI insights",
            ],
      cta: lang === "sw" ? "Jaribu Bure" : "Try Free",
      href: "/signup",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: lang === "sw" ? "Wasiliana" : "Contact Us",
      period: "",
      features:
        lang === "sw"
          ? [
              "Maduka yasiyohesabika",
              "Muundo maalum",
              "Mafunzo ya timu",
              "Usaidizi 24/7",
            ]
          : [
              "Unlimited shops",
              "Custom setup",
              "Team training",
              "24/7 support",
            ],
      cta: lang === "sw" ? "Wasiliana Nasi" : "Contact Us",
      href: "/signup",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenu(true)}
              className="md:hidden w-9 h-9 rounded-xl border border-border flex items-center justify-center bg-card"
            >
              <Menu size={18} />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="rounded-lg flex items-center justify-center">
                <Image
                  src="/logo/favicon.png"
                  width={42}
                  height={42}
                  alt="logo"
                />
              </div>

              <div className="flex flex-col leading-none">
                <span className="font-bold text-base sm:text-lg">Herufi</span>

                <span className="hidden sm:block text-[11px] text-muted-foreground">
                  Smart Commerce
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Language */}
            <div className="hidden md:flex gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  lang === "en"
                    ? "bg-card text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🇬🇧 EN
              </button>

              <button
                onClick={() => setLang("sw")}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  lang === "sw"
                    ? "bg-card text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🇹🇿 SW
              </button>
            </div>

            {/* Desktop Nav */}
            <Link
              href="/docs"
              className="hidden md:inline text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {lang === "sw" ? "Mwongozo" : "Docs"}
            </Link>
            <Link
              href="/shop"
              className="hidden md:inline text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.shop}
            </Link>

            {/* Sign In */}
            <Link
              href="/login"
              className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.landing.signIn}
            </Link>

            {/* CTA */}
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 h-10 px-4 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              <span className="hidden sm:inline">{t.nav.getStarted}</span>

              <span className="sm:hidden">Start</span>

              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* BACKDROP */}
          <div
            onClick={() => setMobileMenu(false)}
            className="absolute inset-0 bg-black/40"
          />

          {/* SIDEBAR */}
          <div className="absolute left-0 top-0 h-full w-[280px] bg-background border-r border-border p-5 flex flex-col">
            {/* TOP */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <Store size={18} className="text-white" />
                </div>

                <span className="font-bold text-lg">Herufi</span>
              </div>

              <button
                onClick={() => setMobileMenu(false)}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* LINKS */}
            <div className="flex flex-col gap-1">
              <Link
                href="/docs"
                onClick={() => setMobileMenu(false)}
                className="px-3 py-3 rounded-xl hover:bg-muted transition-colors"
              >
                {lang === "sw" ? "Mwongozo" : "Docs"}
              </Link>
              <Link
                href="/shop"
                onClick={() => setMobileMenu(false)}
                className="px-3 py-3 rounded-xl hover:bg-muted transition-colors"
              >
                {t.nav.shop}
              </Link>

              <Link
                href="/login"
                onClick={() => setMobileMenu(false)}
                className="px-3 py-3 rounded-xl hover:bg-muted transition-colors"
              >
                {t.landing.signIn}
              </Link>

              <Link
                href="/signup"
                onClick={() => setMobileMenu(false)}
                className="px-3 py-3 rounded-xl bg-primary text-white"
              >
                {t.nav.getStarted}
              </Link>
            </div>

            {/* LANGUAGE */}
            <div className="mt-6">
              <p className="text-xs text-muted-foreground mb-2 px-1">
                Language
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setLang("en")}
                  className={`flex-1 h-10 rounded-xl text-sm ${
                    lang === "en" ? "bg-primary text-white" : "bg-muted"
                  }`}
                >
                  🇬🇧 EN
                </button>

                <button
                  onClick={() => setLang("sw")}
                  className={`flex-1 h-10 rounded-xl text-sm ${
                    lang === "sw" ? "bg-primary text-white" : "bg-muted"
                  }`}
                >
                  🇹🇿 SW
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Sparkles size={14} />
          {t.landing.badge}
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-foreground leading-tight mb-6">
          {t.landing.heroTitle}
          <br />
          <span className="text-primary">{t.landing.heroHighlight}</span>
        </h1>
        <p id="hero-description" className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          {t.landing.heroDesc}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 h-12 px-8 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
          >
            {t.landing.startFree} <ArrowRight size={16} />
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 h-12 px-8 border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors"
          >
            <ShoppingCart size={16} />
            {t.catalog.shopNow}
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
          {[
            t.landing.noCreditCard,
            t.landing.freeTrial,
            t.landing.cancelAnytime,
          ].map((txt) => (
            <span key={txt} className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-primary" />
              {txt}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-3">
          {t.landing.features}
        </h2>
        <p className="text-muted-foreground text-center mb-12">
          {t.landing.featuresDesc}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="p-6 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">
            {t.landing.pricing}
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            {t.landing.pricingDesc}
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-xl border ${
                  (plan as any).highlight
                    ? "border-primary bg-primary shadow-lg shadow-primary/20 text-white"
                    : "border-border bg-card"
                }`}
              >
                <h3
                  className={`font-bold text-lg mb-1 ${
                    (plan as any).highlight ? "text-white" : "text-foreground"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span
                    className={`text-3xl font-bold ${
                      (plan as any).highlight ? "text-white" : "text-foreground"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${
                      (plan as any).highlight
                        ? "text-white/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-center gap-2 text-sm ${
                        (plan as any).highlight
                          ? "text-white/90"
                          : "text-muted-foreground"
                      }`}
                    >
                      <CheckCircle
                        size={14}
                        className={
                          (plan as any).highlight
                            ? "text-white"
                            : "text-primary"
                        }
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full text-center py-2.5 rounded-lg font-medium text-sm transition-colors ${
                    (plan as any).highlight
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Store size={14} className="text-white" />
            </div>
            <span className="font-bold">Herufi</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Herufi. {t.landing.footer} 🇹🇿
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/docs" className="hover:text-foreground">
              {lang === "sw" ? "Mwongozo" : "Docs"}
            </Link>
            <Link href="/shop" className="hover:text-foreground">
              {t.nav.shop}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
