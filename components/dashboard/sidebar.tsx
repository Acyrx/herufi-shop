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
  LogOut,
  MoreHorizontal,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  UserSquare2,
  X,
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
  const { shops, currentShop, setCurrentShop, loading, isEmployeeMode, employeeSession, hasPermission, exitEmployeeMode } = useShop();

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

  // All nav items with optional permission/owner requirements
  const allNavItems = [
    { href: "/dashboard",     label: t.nav.dashboard,   icon: Home,        perm: null,               ownerOnly: false },
    { href: "/shops",         label: t.nav.myShops,     icon: Building2,   perm: null,               ownerOnly: true  },
    { href: "/inventory",     label: t.nav.inventory,   icon: Package,     perm: "view_inventory",   ownerOnly: false },
    { href: "/pos",           label: t.nav.pos,         icon: ShoppingCart,perm: null,               ownerOnly: false },
    { href: "/orders",        label: t.nav.orders,      icon: ClipboardList,perm: "view_orders",     ownerOnly: false },
    { href: "/sales",         label: "Sales",           icon: TrendingUp,  perm: "view_reports",     ownerOnly: false },
    { href: "/customers",     label: t.nav.customers,   icon: Users,       perm: "view_customers",   ownerOnly: false },
    { href: "/employees",     label: t.nav.employees,   icon: UserSquare2, perm: null,               ownerOnly: true  },
    { href: "/analytics",     label: t.nav.analytics,   icon: BarChart3,   perm: "view_reports",     ownerOnly: false },
    { href: "/financial",     label: t.nav.financial,   icon: CreditCard,  perm: "view_financial",   ownerOnly: false },
    { href: "/reports",       label: t.nav.reports,     icon: ClipboardList,perm: "view_reports",    ownerOnly: false },
    { href: "/notifications", label: t.nav.notifications,icon: Bell,       perm: null,               ownerOnly: false },
    { href: "/ai",            label: t.nav.aiAssistant, icon: Sparkles,    perm: null,               ownerOnly: false },
    { href: "/settings",      label: t.nav.settings,    icon: Settings,    perm: null,               ownerOnly: true  },
  ];

  const navItems = allNavItems.filter(item => {
    if (isEmployeeMode) {
      if (item.ownerOnly) return false;
      if (item.perm && !hasPermission(item.perm)) return false;
    }
    return true;
  });

  function handleSwitchShop(shop: Shop) {
    setCurrentShop(shop);
    setShopOpen(false);
    router.refresh();
  }

  function handleSwitchWorkspace() {
    exitEmployeeMode();
    router.push("/choose-context");
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 bg-sidebar text-sidebar-foreground transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Shop / Employee context switcher */}
      <div
        ref={dropRef}
        className={cn(
          "relative border-b border-sidebar-muted",
          collapsed ? "p-2" : "p-3"
        )}
      >
        {collapsed ? (
          <button
            onClick={() => { setCollapsed(false); if (!isEmployeeMode) setShopOpen(true); }}
            className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mx-auto"
            title={currentShop?.name ?? "Select shop"}
          >
            <Image src="/logo/favicon.png" width={50} height={50} alt="logo" className="rounded-xl" />
          </button>
        ) : isEmployeeMode ? (
          /* ── Employee mode banner ── */
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Store size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate leading-tight">
                {employeeSession?.shopName ?? currentShop?.name ?? "—"}
              </p>
              <p className="text-[10px] text-sidebar-foreground/50 capitalize leading-tight">
                {employeeSession?.role?.replace(/_/g, " ") ?? "Employee"}
              </p>
            </div>
          </div>
        ) : (
          /* ── Owner shop switcher ── */
          <button
            onClick={() => setShopOpen((o) => !o)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-muted transition-colors"
          >
            <Image src="/logo/favicon.png" width={42} height={42} alt="logo" className="rounded-xl" />
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
              className={cn("text-sidebar-foreground/50 transition-transform shrink-0", shopOpen && "rotate-180")}
            />
          </button>
        )}

        {/* Owner shop dropdown */}
        {shopOpen && !collapsed && !isEmployeeMode && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-2 max-h-60 overflow-y-auto">
              {shops.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No shops yet</p>
              ) : (
                shops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => handleSwitchShop(shop)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors text-sm",
                      currentShop?.id === shop.id ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Store size={13} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-xs">{shop.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{shop.location}</p>
                    </div>
                    {currentShop?.id === shop.id && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
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

        {/* Employee mode: switch workspace link below the banner */}
        {isEmployeeMode && !collapsed && (
          <button
            onClick={handleSwitchWorkspace}
            className="w-full flex items-center gap-2 mt-1.5 px-2 py-1.5 rounded-lg text-[10px] text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-muted transition-colors"
          >
            <LogOut size={10} />
            Switch workspace
          </button>
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
  const router = useRouter();
  const { t } = useLang();
  const {
    currentShop,
    isEmployeeMode,
    employeeSession,
    hasPermission,
    exitEmployeeMode,
  } = useShop();
  const [moreOpen, setMoreOpen] = useState(false);

  // All nav items with permission metadata (same as Sidebar)
  const allNavItems = [
    { href: "/dashboard",     label: t.nav.dashboard,      icon: Home,          perm: null,              ownerOnly: false },
    { href: "/shops",         label: t.nav.myShops,         icon: Building2,     perm: null,              ownerOnly: true  },
    { href: "/inventory",     label: t.nav.inventory,       icon: Package,       perm: "view_inventory",  ownerOnly: false },
    { href: "/pos",           label: t.nav.pos,             icon: ShoppingCart,  perm: null,              ownerOnly: false },
    { href: "/orders",        label: t.nav.orders,          icon: ClipboardList, perm: "view_orders",     ownerOnly: false },
    { href: "/sales",         label: "Sales",               icon: TrendingUp,    perm: "view_reports",    ownerOnly: false },
    { href: "/customers",     label: t.nav.customers,       icon: Users,         perm: "view_customers",  ownerOnly: false },
    { href: "/employees",     label: t.nav.employees,       icon: UserSquare2,   perm: null,              ownerOnly: true  },
    { href: "/analytics",     label: t.nav.analytics,       icon: BarChart3,     perm: "view_reports",    ownerOnly: false },
    { href: "/financial",     label: t.nav.financial,       icon: CreditCard,    perm: "view_financial",  ownerOnly: false },
    { href: "/reports",       label: t.nav.reports,         icon: ClipboardList, perm: "view_reports",    ownerOnly: false },
    { href: "/notifications", label: t.nav.notifications,   icon: Bell,          perm: null,              ownerOnly: false },
    { href: "/ai",            label: t.nav.aiAssistant,     icon: Sparkles,      perm: null,              ownerOnly: false },
    { href: "/settings",      label: t.nav.settings,        icon: Settings,      perm: null,              ownerOnly: true  },
  ];

  // Filter by role / permissions
  const visibleItems = allNavItems.filter(item => {
    if (isEmployeeMode) {
      if (item.ownerOnly) return false;
      if (item.perm && !hasPermission(item.perm)) return false;
    }
    return true;
  });

  // Bottom-bar primary slots (always the same 4 + More)
  const primaryHrefs = ["/dashboard", "/pos", "/inventory", "/ai"];
  const primaryItems = primaryHrefs
    .map(href => visibleItems.find(i => i.href === href))
    .filter(Boolean) as typeof visibleItems;

  // "More" drawer items = everything not in the bottom bar
  const primarySet = new Set(primaryHrefs);
  const moreItems = visibleItems.filter(i => !primarySet.has(i.href));

  // Count active items in moreItems for badge
  const moreHasActive = moreItems.some(
    i => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href))
  );

  function handleSwitchWorkspace() {
    setMoreOpen(false);
    exitEmployeeMode();
    router.push("/choose-context");
  }

  return (
    <>
      {/* ── Bottom nav bar ───────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-stretch justify-around h-16 px-1">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl text-[10px] font-medium transition-all",
                  active
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon size={20} className={active ? "stroke-[2.2px]" : ""} />
                <span className="truncate max-w-[52px] text-center leading-tight">{label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl text-[10px] font-medium transition-all relative",
              moreOpen || moreHasActive
                ? "text-primary bg-primary/8"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <div className="relative">
              <MoreHorizontal size={20} />
              {moreHasActive && !moreOpen && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary border-2 border-card" />
              )}
            </div>
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* ── More drawer backdrop ─────────────────────────────────────────── */}
      <div
        onClick={() => setMoreOpen(false)}
        className={cn(
          "md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200",
          moreOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* ── More drawer (slides up) ──────────────────────────────────────── */}
      <div
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-2xl border-t border-border transition-transform duration-300 ease-out",
          moreOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{ maxHeight: "78vh" }}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Shop / Employee context banner */}
        <div className="mx-4 mb-3 p-3 rounded-xl bg-muted/60 border border-border flex items-center gap-3">
          {isEmployeeMode ? (
            <>
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Store size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{employeeSession?.shopName ?? "Shop"}</p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {employeeSession?.role?.replace(/_/g, " ") ?? "Employee"}
                </p>
              </div>
              <button
                onClick={handleSwitchWorkspace}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-background border border-border px-3 py-1.5 rounded-lg transition-colors"
              >
                <LogOut size={12} />
                Switch
              </button>
            </>
          ) : (
            <>
              <Image src="/logo/favicon.png" width={36} height={36} alt="logo" className="rounded-xl shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {currentShop?.name ?? "No shop selected"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {currentShop?.business_category ?? "Select a shop"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Divider label */}
        <p className="px-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
          Navigation
        </p>

        {/* Nav grid — scrollable */}
        <div className="overflow-y-auto px-4 pb-20" style={{ maxHeight: "calc(78vh - 130px)" }}>
          {moreItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              All sections are in the bar below.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 pb-2">
              {moreItems.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 px-2 py-3.5 rounded-2xl border text-center transition-all active:scale-95",
                      active
                        ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
                        : "bg-muted/40 border-border/60 text-muted-foreground hover:border-primary/25 hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      active ? "bg-primary/15" : "bg-background border border-border"
                    )}>
                      <Icon size={20} className={active ? "text-primary" : ""} />
                    </div>
                    <span className="text-[11px] font-medium leading-tight line-clamp-2">{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom close bar */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-sm border-t border-border flex items-center justify-center px-4">
          <button
            onClick={() => setMoreOpen(false)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-muted border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
            Close
          </button>
        </div>
      </div>
    </>
  );
}
