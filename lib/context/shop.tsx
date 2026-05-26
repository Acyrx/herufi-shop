"use client";

import { createClient } from "@/lib/supabase/client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

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

interface ShopContextType {
  shops: Shop[];
  currentShop: Shop | null;
  shopId: string | null;
  setCurrentShop: (shop: Shop) => void;
  loading: boolean;
  refreshShops: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType>({
  shops: [],
  currentShop: null,
  shopId: null,
  setCurrentShop: () => {},
  loading: true,
  refreshShops: async () => {},
});

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [shops, setShops] = useState<Shop[]>([]);
  const [currentShop, setCurrentShopState] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShops = useCallback(async () => {
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

    const persistedId = typeof window !== "undefined" ? localStorage.getItem("herufi_shop_id") : null;
    const persisted = list.find((s) => s.id === persistedId);

    if (persisted) {
      setCurrentShopState(persisted);
    } else if (list.length > 0) {
      setCurrentShopState(list[0]);
      localStorage.setItem("herufi_shop_id", list[0].id);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  function setCurrentShop(shop: Shop) {
    setCurrentShopState(shop);
    localStorage.setItem("herufi_shop_id", shop.id);
  }

  return (
    <ShopContext.Provider value={{
      shops,
      currentShop,
      shopId: currentShop?.id ?? null,
      setCurrentShop,
      loading,
      refreshShops: fetchShops,
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext);
}
