"use client";

import { useCart } from "@/lib/context/cart";
import { useLang } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { type User } from "@supabase/supabase-js";
import {
  LogOut,
  Package,
  ShoppingCart,
  Sparkles,
  Store,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

export function ShopNavbar() {
  const { t, lang, setLang } = useLang();
  const { itemCount, openCart } = useCart();
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    toast.success("Signed out");
    router.push("/login");
  }

  const initials = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string)
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/shop" className="flex items-center gap-2">
          <div className="rounded-lg flex items-center justify-center border-1">
            <Image src="/logo/favicon.png" width={50} height={50} alt="logo" />
          </div>
          <div>
            <span className="font-bold text-foreground">Herufi</span>
            <span className="text-xs text-muted-foreground ml-1.5">
              {t.catalog.title}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language switcher */}
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setLang("en")}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                lang === "en"
                  ? "bg-card text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇬🇧 EN
            </button>
            <button
              onClick={() => setLang("sw")}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                lang === "sw"
                  ? "bg-card text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇹🇿 SW
            </button>
          </div>

          {/* AI Assistant */}
          <Link
            href="/shop/ai"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Sparkles size={13} />
            {t.nav.aiAssistant}
          </Link>

          {/* Cart icon */}
          <button
            onClick={openCart}
            className="relative h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted transition-colors"
          >
            <ShoppingCart size={17} className="text-foreground" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>

          {/* Auth: profile menu or sign in */}
          {user ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm hover:bg-primary/20 transition-colors border border-primary/20"
              >
                {initials}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-11 w-52 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-3 py-2.5 border-b border-border">
                    {user.user_metadata?.full_name && (
                      <p className="text-sm font-semibold text-foreground truncate">
                        {user.user_metadata.full_name as string}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/shop/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <UserIcon size={14} className="text-muted-foreground" /> My
                    Profile
                  </Link>
                  <Link
                    href="/shop/orders"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Package size={14} className="text-muted-foreground" /> My
                    Orders
                  </Link>
                  <div className="border-t border-border" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 h-8 px-3 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t.nav.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
