"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  Store,
  Users,
  ShoppingBag,
  Home,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { LangProvider, useLang } from "./LangContext";

const NAV_ITEMS = [
  { href: "/docs", label: "Overview", swLabel: "Muhtasari", icon: Home, exact: true },
  { href: "/docs/owner", label: "Owner Guide", swLabel: "Mwongozo wa Mmiliki", icon: Store },
  { href: "/docs/employee", label: "Employee Guide", swLabel: "Mwongozo wa Mfanyakazi", icon: Users },
  { href: "/docs/customer", label: "Customer Guide", swLabel: "Mwongozo wa Mteja", icon: ShoppingBag },
];

// ── Inner layout — can safely use useLang() because LangProvider is above it
function DocsLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { lang, setLang } = useLang();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (item: (typeof NAV_ITEMS)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const NavContent = () => (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon size={16} className={active ? "text-white" : "text-current"} />
            <span>{lang === "sw" ? item.swLabel : item.label}</span>
            {active && <ChevronRight size={14} className="ml-auto text-white/70" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md h-14 flex items-center px-4 gap-3">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={16} />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-4">
          <Image src="/logo/favicon.png" width={28} height={28} alt="Herufi logo" />
          <span className="font-bold text-sm hidden sm:block">Herufi</span>
        </Link>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <BookOpen size={14} />
          <span className="font-medium text-foreground">
            {lang === "sw" ? "Mwongozo" : "Documentation"}
          </span>
        </div>

        <div className="flex-1" />

        {/* Language toggle — directly calls setLang from context */}
        <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
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

        {/* Back to app */}
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {lang === "sw" ? "Rudi nyumbani" : "Back to app"}
        </Link>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* ── Desktop Sidebar ────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border/60 py-6 px-4 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
            {lang === "sw" ? "Miongozo" : "Guides"}
          </p>
          <NavContent />
        </aside>

        {/* ── Mobile Drawer ──────────────────────────────────────────────── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-72 bg-background border-r border-border p-5 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Image src="/logo/favicon.png" width={28} height={28} alt="Herufi logo" />
                  <span className="font-bold">Herufi Docs</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border"
                >
                  <X size={16} />
                </button>
              </div>
              <NavContent />
            </div>
          </div>
        )}

        {/* ── Main Content ───────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 py-8 px-4 sm:px-8 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Outer layout — wraps everything in the provider
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <DocsLayoutInner>{children}</DocsLayoutInner>
    </LangProvider>
  );
}
