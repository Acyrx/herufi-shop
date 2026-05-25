"use client";

import { useLang } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Home,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
  UserSquare2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Sidebar({ shopName = "Herufi" }: { shopName?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useLang();

  const navItems = [
    { href: "/dashboard", label: t.nav.dashboard, icon: Home },
    { href: "/shops", label: t.nav.myShops, icon: Building2 },
    { href: "/inventory", label: t.nav.inventory, icon: Package },
    { href: "/pos", label: t.nav.pos, icon: ShoppingCart },
    { href: "/orders", label: t.nav.orders, icon: ClipboardList },
    { href: "/customers", label: t.nav.customers, icon: Users },
    { href: "/employees", label: t.nav.employees, icon: UserSquare2 },
    { href: "/analytics", label: t.nav.analytics, icon: BarChart3 },
    { href: "/financial", label: t.nav.financial, icon: CreditCard },
    { href: "/reports", label: t.nav.reports, icon: ClipboardList },
    { href: "/notifications", label: t.nav.notifications, icon: Bell },
    { href: "/ai", label: t.nav.aiAssistant, icon: Sparkles },
    { href: "/settings", label: t.nav.settings, icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 bg-sidebar text-sidebar-foreground transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 p-4 h-16 border-b border-sidebar-muted",
          collapsed && "justify-center"
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Store size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-white truncate">{shopName}</p>
            <p className="text-[10px] text-sidebar-foreground/50">
              Business Platform
            </p>
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
