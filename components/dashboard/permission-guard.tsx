"use client";

import { useShop } from "@/lib/context/shop";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ShieldOff } from "lucide-react";

/**
 * Route → required permission mapping.
 * ownerOnly: true  → employees can never access regardless of permissions.
 * permission: "x"  → employee must have permission "x" in their session.
 * Routes not listed here are accessible to all authenticated dashboard users.
 */
const ROUTE_RULES: Record<string, { permission?: string; ownerOnly?: boolean }> = {
  "/shops":      { ownerOnly: true },
  "/employees":  { ownerOnly: true },
  "/settings":   { ownerOnly: true },
  "/pos":        { permission: "process_orders" },
  "/inventory":  { permission: "view_inventory" },
  "/orders":     { permission: "view_orders" },
  "/sales":      { permission: "view_reports" },
  "/customers":  { permission: "view_customers" },
  "/analytics":  { permission: "view_reports" },
  "/financial":  { permission: "view_financial" },
  "/reports":    { permission: "view_reports" },
};

export function PermissionGuard({ children }: { children: React.ReactNode }) {
  const { isEmployeeMode, hasPermission, loading } = useShop();
  const pathname = usePathname();
  const router   = useRouter();

  // Detect employee session after mount so server and client render identically
  // (avoids hydration mismatch). Switches from false → true on first effect run.
  const [mightBeEmployee, setMightBeEmployee] = useState(false);
  useEffect(() => {
    setMightBeEmployee(!!localStorage.getItem("herufi_emp"));
  }, []);

  // Find the rule for the current route (prefix match)
  const rule = useMemo(
    () =>
      Object.entries(ROUTE_RULES).find(
        ([route]) => pathname === route || pathname.startsWith(route + "/")
      )?.[1],
    [pathname]
  );

  // Only deny once the context has finished loading
  const denied =
    !loading &&
    isEmployeeMode &&
    !!rule &&
    (rule.ownerOnly || (!!rule.permission && !hasPermission(rule.permission)));

  useEffect(() => {
    if (denied) router.replace("/dashboard");
  }, [denied, router]);

  // While the context is still loading AND we already know there's a stored
  // employee session AND the current route has a rule — show a spinner instead
  // of flashing restricted content.
  if (loading && mightBeEmployee && !!rule) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground animate-fade-in">
        <ShieldOff size={48} className="opacity-20" />
        <div className="text-center space-y-1">
          <p className="font-semibold text-foreground text-lg">Access Restricted</p>
          <p className="text-sm">You don't have permission to view this page.</p>
          <p className="text-xs text-muted-foreground/70">Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
