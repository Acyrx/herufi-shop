"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, ChevronDown, Sparkles } from "lucide-react";

interface NavProps {
  lang: "en" | "sw";
  setLang: (l: "en" | "sw") => void;
}

type NavItem =
  | { label: string; children: { href: string; label: string }[] }
  | { href: string; label: string };

const LINKS: Record<"en" | "sw", NavItem[]> = {
  en: [
    {
      label: "Product",
      children: [
        { href: "/#features", label: "Features" },
        { href: "/#how-it-works", label: "How it works" },
        { href: "/#ai", label: "AI Insights" },
      ],
    },
    { href: "/pricing", label: "Pricing" },
    { href: "/docs", label: "Docs" },
    { href: "/about", label: "About" },
    { href: "/shop", label: "Marketplace" },
  ],
  sw: [
    {
      label: "Bidhaa",
      children: [
        { href: "/#features", label: "Vipengele" },
        { href: "/#how-it-works", label: "Jinsi inavyofanya kazi" },
        { href: "/#ai", label: "Maarifa ya AI" },
      ],
    },
    { href: "/pricing", label: "Bei" },
    { href: "/docs", label: "Mwongozo" },
    { href: "/about", label: "Kuhusu" },
    { href: "/shop", label: "Soko" },
  ],
};

export function LandingNav({ lang, setLang }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const links = LINKS[lang];

  return (
    // Fragment so the mobile drawer is a sibling of <nav>, NOT a child.
    // backdrop-blur-md on <nav> creates a CSS containing block — any
    // position:fixed child gets clipped to the nav's 64 px height and
    // disappears. Keeping the drawer outside avoids that entirely.
    <>
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo/favicon.png" width={36} height={36} alt="Herufi" />
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base">Herufi</span>
              <span className="hidden sm:block text-[10px] text-muted-foreground tracking-wide uppercase">
                {lang === "sw" ? "Biashara Smart" : "Smart Commerce"}
              </span>
            </div>
          </Link>

          {/* ── Desktop links ─────────────────────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map((item) =>
              "children" in item ? (
                <div key={item.label} className="relative">
                  <button
                    onClick={() => setDropOpen((v) => !v)}
                    onBlur={() => setTimeout(() => setDropOpen(false), 150)}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    {item.label}
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${dropOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {dropOpen && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-card border border-border rounded-xl shadow-lg py-1.5 z-50">
                      {item.children.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          onClick={() => setDropOpen(false)}
                          className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* ── Right actions ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            {/* Language toggle (desktop) */}
            <div className="hidden sm:flex gap-0.5 bg-muted rounded-lg p-0.5">
              {(["en", "sw"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors font-medium ${
                    lang === l
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l === "en" ? "🇬🇧 EN" : "🇹🇿 SW"}
                </button>
              ))}
            </div>

            <Link
              href="/login"
              className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              {lang === "sw" ? "Ingia" : "Sign In"}
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-sm shadow-primary/30"
            >
              <Sparkles size={13} />
              <span className="hidden sm:inline">{lang === "sw" ? "Anza Bure" : "Get Started"}</span>
              <span className="sm:hidden">Start</span>
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <Menu size={17} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ─────────────────────────────────────────────────────
          Rendered as a sibling of <nav> — NOT inside it — so that
          `position:fixed` is relative to the viewport and not clipped
          by the nav's backdrop-filter containing block.
      ──────────────────────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />

          {/* Slide-in panel */}
          <div className="absolute right-0 top-0 h-full w-[300px] max-w-[85vw] bg-background border-l border-border flex flex-col shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Image src="/logo/favicon.png" width={28} height={28} alt="Herufi" />
                <span className="font-bold text-base">Herufi</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Nav links */}
            <div className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
              {links.map((item) =>
                "children" in item ? (
                  <div key={item.label}>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-2 mt-2">
                      {item.label}
                    </p>
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors block"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>

            {/* Footer actions */}
            <div className="px-4 py-4 border-t border-border flex flex-col gap-2.5 shrink-0">
              {/* Language */}
              <div className="flex gap-2">
                {(["en", "sw"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`flex-1 h-9 rounded-xl text-sm font-medium transition-colors ${
                      lang === l ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {l === "en" ? "🇬🇧 English" : "🇹🇿 Swahili"}
                  </button>
                ))}
              </div>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="h-10 flex items-center justify-center rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                {lang === "sw" ? "Ingia" : "Sign In"}
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="h-10 flex items-center justify-center rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                {lang === "sw" ? "Anza Bure" : "Get Started Free"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
