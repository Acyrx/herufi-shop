"use client";

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/client";
import type { Shop, EmployeeSession } from "@/lib/context/shop";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, ChevronRight, LogOut, Plus, Shield, Store } from "lucide-react";
import Image from "next/image";

interface Assignment {
  id: string;
  role: string;
  permissions: string[];
  shop: Shop;
}

const LS_EMP     = "herufi_emp";
const LS_SHOP_ID = "herufi_shop_id";

const ROLE_PILL: Record<string, string> = {
  manager:          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cashier:          "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300",
  stock_manager:    "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-300",
  delivery_manager: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  sales_agent:      "bg-sky-100    text-sky-700    dark:bg-sky-900/30    dark:text-sky-300",
};

export default function ChooseContextPage() {
  const supabase = createClient();
  const router   = useRouter();

  const [loading,     setLoading]     = useState(true);
  const [userName,    setUserName]    = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [ownShops,    setOwnShops]    = useState<Shop[]>([]);
  const [choosing,    setChoosing]    = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [profileRes, empRes, shopsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single(),
        supabase
          .from("employees")
          .select("id, role, permissions, shop:shops(id, name, logo_url, location, business_category, currency, tax_rate, is_active)")
          .eq("user_id", user.id)
          .eq("is_active", true),
        supabase
          .from("shops")
          .select("id, name, logo_url, location, business_category, currency, tax_rate, is_active")
          .eq("owner_id", user.id)
          .eq("is_active", true)
          .order("created_at"),
      ]);

      const name = profileRes.data?.full_name?.split(" ")[0] ?? "there";
      const emps = (empRes.data ?? []) as unknown as Assignment[];

      setUserName(name);
      setAssignments(emps);
      setOwnShops(shopsRes.data ?? []);
      setLoading(false);

      // No employee assignments → skip straight to dashboard
      if (emps.length === 0) router.replace("/dashboard");
    }
    load();
  }, []);

  function chooseEmployee(a: Assignment) {
    setChoosing(a.id);
    const session: EmployeeSession = {
      employeeId: a.id,
      shopId:     a.shop.id,
      shopName:   a.shop.name,
      role:       a.role,
      permissions: a.permissions ?? [],
    };
    localStorage.setItem(LS_EMP,     JSON.stringify(session));
    localStorage.setItem(LS_SHOP_ID, a.shop.id);
    router.push("/dashboard");
  }

  function chooseOwner() {
    setChoosing("owner");
    localStorage.removeItem(LS_EMP); // ensure owner mode
    router.push("/dashboard");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <Image src="/logo/favicon.png" width={36} height={36} alt="Herufi" className="rounded-xl" />
          <span className="text-lg font-bold text-foreground">Herufi</span>
        </div>

        {/* Greeting */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            Choose a workspace to continue
          </p>
        </div>

        <div className="space-y-4">

          {/* ── Employee assignments ──────────────────────── */}
          {assignments.length > 0 && (
            <section>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-0.5">
                Work as Employee
              </p>
              <div className="space-y-2">
                {assignments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => chooseEmployee(a)}
                    disabled={choosing !== null}
                    className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-sm hover:bg-primary/[0.03] transition-all text-left group disabled:opacity-60 disabled:cursor-wait"
                  >
                    {/* Shop avatar */}
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {a.shop.logo_url
                        ? <img src={a.shop.logo_url} alt={a.shop.name} className="w-full h-full object-cover" />
                        : <Store size={22} className="text-primary" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-foreground truncate">{a.shop.name}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${ROLE_PILL[a.role] ?? "bg-muted text-muted-foreground"}`}>
                          {a.role.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.shop.location}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Shield size={10} className="text-muted-foreground/70" />
                        <span className="text-[10px] text-muted-foreground/70">
                          {a.permissions?.length ?? 0} permission{(a.permissions?.length ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {choosing === a.id
                      ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                      : <ChevronRight size={16} className="text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                    }
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Divider ───────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Own business ─────────────────────────────── */}
          <section>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-0.5">
              My Own Business
            </p>
            <button
              onClick={chooseOwner}
              disabled={choosing !== null}
              className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-sm hover:bg-primary/[0.03] transition-all text-left group disabled:opacity-60 disabled:cursor-wait"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {ownShops.length > 0
                  ? <Building2 size={22} className="text-foreground/70" />
                  : <Plus size={22} className="text-muted-foreground" />
                }
              </div>

              <div className="flex-1 min-w-0">
                {ownShops.length > 0 ? (
                  <>
                    <p className="font-semibold text-sm text-foreground">
                      {ownShops.length === 1 ? ownShops[0].name : `${ownShops.length} Shops`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Manage your own business as owner
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-sm text-foreground">Create my own shop</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Start and manage your own business
                    </p>
                  </>
                )}
              </div>

              {choosing === "owner"
                ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                : <ChevronRight size={16} className="text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
              }
            </button>
          </section>
        </div>

        {/* Hint */}
        <p className="text-center text-[11px] text-muted-foreground mt-6">
          You can switch workspaces anytime from the sidebar.
        </p>

        {/* Sign out */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
