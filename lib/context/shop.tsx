"use client";

import { createClient } from "@/lib/supabase/client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const LS_SHOP_ID = "herufi_shop_id";
const LS_EMP    = "herufi_emp";

export interface Shop {
  id: string;
  name: string;
  logo_url?: string;
  location: string;
  business_category: string;
  currency: string;
  tax_rate: number;
  is_active: boolean;
}

export interface EmployeeSession {
  employeeId: string;
  shopId: string;
  shopName: string;
  role: string;
  permissions: string[];
}

interface ShopContextType {
  shops: Shop[];
  currentShop: Shop | null;
  shopId: string | null;
  setCurrentShop: (shop: Shop) => void;
  loading: boolean;
  refreshShops: () => Promise<void>;
  // Employee mode
  isEmployeeMode: boolean;
  employeeSession: EmployeeSession | null;
  hasPermission: (perm: string) => boolean;
  exitEmployeeMode: () => void;
}

const ShopContext = createContext<ShopContextType>({
  shops: [],
  currentShop: null,
  shopId: null,
  setCurrentShop: () => {},
  loading: true,
  refreshShops: async () => {},
  isEmployeeMode: false,
  employeeSession: null,
  hasPermission: () => true,
  exitEmployeeMode: () => {},
});

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [shops,          setShops]          = useState<Shop[]>([]);
  const [currentShop,    setCurrentShopState] = useState<Shop | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [employeeSession, setEmployeeSession] = useState<EmployeeSession | null>(null);

  const isEmployeeMode = employeeSession !== null;

  function hasPermission(perm: string): boolean {
    if (!isEmployeeMode) return true; // owners have all permissions
    return employeeSession?.permissions.includes(perm) ?? false;
  }

  // Fetch owner's own shops
  const fetchOwnerShops = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("shops")
      .select("id, name, logo_url, location, business_category, currency, tax_rate, is_active")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .order("created_at");

    const list = data ?? [];
    setShops(list);

    const persistedId = typeof window !== "undefined" ? localStorage.getItem(LS_SHOP_ID) : null;
    const persisted   = list.find((s) => s.id === persistedId);

    if (persisted) {
      setCurrentShopState(persisted);
    } else if (list.length > 0) {
      setCurrentShopState(list[0]);
      if (typeof window !== "undefined") localStorage.setItem(LS_SHOP_ID, list[0].id);
    }

    setLoading(false);
  }, []);

  // On mount: check localStorage for a saved employee session; fall back to owner shops
  const fetchShops = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const raw = typeof window !== "undefined" ? localStorage.getItem(LS_EMP) : null;
    if (raw) {
      try {
        const saved: EmployeeSession = JSON.parse(raw);

        // Re-validate the session against the DB (permissions may have changed)
        const { data: emp } = await supabase
          .from("employees")
          .select("id, permissions, shop:shops(id, name, logo_url, location, business_category, currency, tax_rate, is_active)")
          .eq("id", saved.employeeId)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();

        if (emp?.shop) {
          const shop    = emp.shop as unknown as Shop;
          const session = { ...saved, permissions: (emp.permissions as string[]) ?? saved.permissions };
          localStorage.setItem(LS_EMP, JSON.stringify(session));
          setEmployeeSession(session);
          setCurrentShopState(shop);
          setShops([shop]);
          setLoading(false);
          return;
        }

        // Session is stale or employee was deactivated
        localStorage.removeItem(LS_EMP);
      } catch {
        localStorage.removeItem(LS_EMP);
      }
    }

    await fetchOwnerShops();
  }, [fetchOwnerShops]);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  // Switch back to owner dashboard
  function exitEmployeeMode() {
    if (typeof window !== "undefined") localStorage.removeItem(LS_EMP);
    setEmployeeSession(null);
    fetchOwnerShops();
  }

  function setCurrentShop(shop: Shop) {
    if (isEmployeeMode) return; // employees cannot switch shops
    setCurrentShopState(shop);
    if (typeof window !== "undefined") localStorage.setItem(LS_SHOP_ID, shop.id);
  }

  return (
    <ShopContext.Provider value={{
      shops,
      currentShop,
      shopId: currentShop?.id ?? null,
      setCurrentShop,
      loading,
      refreshShops: fetchShops,
      isEmployeeMode,
      employeeSession,
      hasPermission,
      exitEmployeeMode,
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext);
}
