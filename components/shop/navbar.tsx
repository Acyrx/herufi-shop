"use client";

import { useLang } from "@/lib/i18n/context";
import { Sparkles, Store } from "lucide-react";
import Link from "next/link";

export function ShopNavbar() {
  const { t, lang, setLang } = useLang();

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Store size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-foreground">Herufi</span>
            <span className="text-xs text-muted-foreground ml-1.5">{t.catalog.title}</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${lang === "en" ? "bg-card text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              🇬🇧 EN
            </button>
            <button
              onClick={() => setLang("sw")}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${lang === "sw" ? "bg-card text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              🇹🇿 SW
            </button>
          </div>

          <Link
            href="/shop/ai"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Sparkles size={13} />
            {t.nav.aiAssistant}
          </Link>

          <Link href="/login"
            className="inline-flex items-center gap-1.5 h-8 px-3 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t.nav.signIn}
          </Link>
        </div>
      </div>
    </header>
  );
}
