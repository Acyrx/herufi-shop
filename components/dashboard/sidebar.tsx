"use client";

import { useShop, type Shop } from "@/lib/context/shop";
import { useLang } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Home,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  UserSquare2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const { t } = useLang();
  const { shops, currentShop, setCurrentShop, loading } = useShop();

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShopOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navItems = [
    { href: "/dashboard", label: t.nav.dashboard, icon: Home },
    { href: "/shops", label: t.nav.myShops, icon: Building2 },
    { href: "/inventory", label: t.nav.inventory, icon: Package },
    { href: "/pos", label: t.nav.pos, icon: ShoppingCart },
    { href: "/orders", label: t.nav.orders, icon: ClipboardList },
    { href: "/sales", label: "Sales", icon: TrendingUp },
    { href: "/customers", label: t.nav.customers, icon: Users },
    { href: "/employees", label: t.nav.employees, icon: UserSquare2 },
    { href: "/analytics", label: t.nav.analytics, icon: BarChart3 },
    { href: "/financial", label: t.nav.financial, icon: CreditCard },
    { href: "/reports", label: t.nav.reports, icon: ClipboardList },
    { href: "/notifications", label: t.nav.notifications, icon: Bell },
    { href: "/ai", label: t.nav.aiAssistant, icon: Sparkles },
    { href: "/settings", label: t.nav.settings, icon: Settings },
  ];

  function handleSwitchShop(shop: Shop) {
    setCurrentShop(shop);
    setShopOpen(false);
    // Reload current page to pick up new shop context
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 bg-sidebar text-sidebar-foreground transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Shop Switcher */}
      <div
        ref={dropRef}
        className={cn(
          "relative border-b border-sidebar-muted",
          collapsed ? "p-2" : "p-3"
        )}
      >
        {collapsed ? (
          <button
            onClick={() => {
              setCollapsed(false);
              setShopOpen(true);
            }}
            className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mx-auto"
            title={currentShop?.name ?? "Select shop"}
          >
            <div className="rounded-lg flex items-center justify-center">
              <Image
                src="/logo/favicon.png"
                width={50}
                height={50}
                alt="logo"
                className="rounded-xl"
              />
            </div>
          </button>
        ) : (
          <button
            onClick={() => setShopOpen((o) => !o)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-muted transition-colors"
          >
            <div className="rounded-lg flex items-center justify-center">
              <Image
                src="/logo/favicon.png"
                width={42}
                height={42}
                alt="logo"
                className="rounded-xl"
              />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-bold text-white text-sm truncate leading-tight">
                {loading ? "Loading…" : currentShop?.name ?? "Select shop"}
              </p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate leading-tight">
                {currentShop?.business_category ?? "No shop selected"}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={cn(
                "text-sidebar-foreground/50 transition-transform shrink-0",
                shopOpen && "rotate-180"
              )}
            />
          </button>
        )}

        {/* Shop Dropdown */}
        {shopOpen && !collapsed && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-2 max-h-60 overflow-y-auto">
              {shops.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No shops yet
                </p>
              ) : (
                shops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => handleSwitchShop(shop)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors text-sm",
                      currentShop?.id === shop.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Store size={13} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-xs">
                        {shop.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {shop.location}
                      </p>
                    </div>
                    {currentShop?.id === shop.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-border p-2">
              <Link
                href="/shops"
                onClick={() => setShopOpen(false)}
                className="flex items-center gap-2 p-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Plus size={12} />
                Manage / Add Shop
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 mx-2 py-2.5 rounded-lg text-sm transition-all duration-200 mb-0.5",
                collapsed && "justify-center px-2",
                active
                  ? "bg-sidebar-active text-white font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-white"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center w-full h-12 border-t border-sidebar-muted text-sidebar-foreground/50 hover:text-white transition-colors"
      >
        {collapsed ? (
          <ChevronRight size={16} />
        ) : (
          <span className="flex items-center gap-2 text-xs">
            <ChevronLeft size={16} />
            Collapse
          </span>
        )}
      </button>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLang();

  const mobileItems = [
    { href: "/dashboard", label: t.nav.dashboard, icon: Home },
    { href: "/inventory", label: t.nav.inventory, icon: Package },
    { href: "/pos", label: t.nav.pos, icon: ShoppingCart },
    { href: "/orders", label: t.nav.orders, icon: ClipboardList },
    { href: "/settings", label: t.nav.settings, icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16">
        {mobileItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-[10px] transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
