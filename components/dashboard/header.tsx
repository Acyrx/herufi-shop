"use client";

import { useLang } from "@/lib/i18n/context";
import { getInitials } from "@/lib/utils";
import { Bell, Moon, Search, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface HeaderProps {
  user?: { full_name: string; avatar_url?: string };
  notificationCount?: number;
}

// Map pathname → translation key
const PAGE_KEYS: Record<string, keyof ReturnType<typeof useLang>["t"]> = {
  "/dashboard": "dashboard",
  "/inventory": "inventory",
  "/pos": "pos",
  "/orders": "orders",
  "/customers": "customers",
  "/employees": "employees",
  "/analytics": "analytics",
  "/financial": "financial",
  "/reports": "reports",
  "/shops": "shops",
  "/notifications": "notifications",
  "/settings": "settings",
};

export function Header({ user, notificationCount = 0 }: HeaderProps) {
  const [dark, setDark] = useState(false);
  const { t, lang, setLang } = useLang();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // Derive page title from pathname
  const pageKey = Object.keys(PAGE_KEYS).find((k) => pathname.startsWith(k));
  const sectionKey = pageKey ? PAGE_KEYS[pageKey] : null;
  const title = sectionKey
    ? (t[sectionKey] as any).title ?? "Herufi"
    : "Herufi";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-card/80 backdrop-blur-md border-b border-border">
      <div>
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === "en" ? "sw" : "en")}
          className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={lang === "en" ? "Switch to Swahili" : "Switch to English"}
        >
          <span>{lang === "en" ? "🇹🇿" : "🇬🇧"}</span>
          <span>{lang === "en" ? "SW" : "EN"}</span>
        </button>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] rounded-full flex items-center justify-center font-bold">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User avatar */}
        {user && (
          <Link href="/settings" className="flex items-center gap-2">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover border-2 border-primary/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                {getInitials(user.full_name)}
              </div>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
