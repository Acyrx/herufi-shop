"use client";

import { useCart } from "@/lib/context/cart";
import { useLang } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { type User } from "@supabase/supabase-js";
import {
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Sparkles,
  User as UserIcon,
  X,
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();

    toast.success("Signed out");

    setProfileOpen(false);
    setMobileMenu(false);

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
    <>
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setMobileMenu(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card"
            >
              <Menu size={18} />
            </button>

            {/* LOGO */}
            <Link href="/shop" className="flex items-center gap-2">
              <div className="rounded-lg flex items-center justify-center">
                <Image
                  src="/logo/favicon.png"
                  width={42}
                  height={42}
                  alt="logo"
                />
              </div>

              <div className="hidden sm:block">
                <span className="font-bold text-foreground">Herufi</span>

                <span className="text-xs text-muted-foreground ml-1.5">
                  {t.catalog.title}
                </span>
              </div>
            </Link>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            {/* DESKTOP AI */}
            <Link
              href="/shop/ai"
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 bg-primary/10 text-primary text-sm font-medium rounded-xl hover:bg-primary/20 transition-colors"
            >
              <Sparkles size={15} />
              {t.nav.aiAssistant}
            </Link>

            {/* CART */}
            <button
              onClick={openCart}
              className="relative h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted transition-colors"
            >
              <ShoppingCart size={18} />

              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>

            {/* PROFILE */}
            {user ? (
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20"
                >
                  {initials}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-11 w-52 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                    <div className="px-3 py-3 border-b border-border">
                      <p className="text-sm font-semibold truncate">
                        {user.user_metadata?.full_name}
                      </p>

                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/shop/profile"
                      className="flex items-center gap-2 px-3 py-3 hover:bg-muted text-sm"
                    >
                      <UserIcon size={15} />
                      My Profile
                    </Link>

                    <Link
                      href="/shop/orders"
                      className="flex items-center gap-2 px-3 py-3 hover:bg-muted text-sm"
                    >
                      <Package size={15} />
                      My Orders
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center h-9 px-4 bg-primary text-white text-sm font-medium rounded-xl"
              >
                {t.nav.signIn}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE SIDEBAR */}
      {mobileMenu && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* BACKDROP */}
          <div
            onClick={() => setMobileMenu(false)}
            className="absolute inset-0 bg-black/40"
          />

          {/* MENU */}
          <div className="absolute left-0 top-0 h-full w-[280px] bg-background border-r border-border p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo/favicon.png"
                  width={38}
                  height={38}
                  alt="logo"
                />

                <span className="font-bold text-lg">Herufi</span>
              </div>

              <button
                onClick={() => setMobileMenu(false)}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* AI */}
            <Link
              href="/shop/ai"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted"
            >
              <Sparkles size={18} />
              AI Assistant
            </Link>

            {/* PROFILE */}
            <Link
              href="/shop/profile"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted"
            >
              <UserIcon size={18} />
              My Profile
            </Link>

            {/* ORDERS */}
            <Link
              href="/shop/orders"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted"
            >
              <Package size={18} />
              My Orders
            </Link>

            {/* LANGUAGE */}
            <div className="mt-6">
              <p className="text-xs text-muted-foreground mb-2 px-2">
                Language
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setLang("en")}
                  className={`flex-1 h-10 rounded-xl text-sm ${
                    lang === "en" ? "bg-primary text-white" : "bg-muted"
                  }`}
                >
                  🇬🇧 English
                </button>

                <button
                  onClick={() => setLang("sw")}
                  className={`flex-1 h-10 rounded-xl text-sm ${
                    lang === "sw" ? "bg-primary text-white" : "bg-muted"
                  }`}
                >
                  🇹🇿 Swahili
                </button>
              </div>
            </div>

            {/* SIGN OUT */}
            {user && (
              <button
                onClick={handleSignOut}
                className="mt-auto flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
