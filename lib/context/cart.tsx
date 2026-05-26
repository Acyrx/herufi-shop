"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  productId: string;
  shopId: string;
  shopName: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  unit: string;
  maxQty: number;
}

export interface ShopGroup {
  shopId: string;
  shopName: string;
  items: CartItem[];
  subtotal: number;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  shopGroups: ShopGroup[];
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("herufi_cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("herufi_cart", JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(newItem: Omit<CartItem, "quantity"> & { quantity?: number }) {
    setItems(prev => {
      const existing = prev.find(i => i.productId === newItem.productId);
      if (existing) {
        return prev.map(i =>
          i.productId === newItem.productId
            ? { ...i, quantity: Math.min(i.quantity + (newItem.quantity ?? 1), i.maxQty) }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: newItem.quantity ?? 1 }];
    });
    setIsOpen(true);
  }

  function removeItem(productId: string) {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) { removeItem(productId); return; }
    setItems(prev =>
      prev.map(i =>
        i.productId === productId ? { ...i, quantity: Math.min(qty, i.maxQty) } : i
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const shopGroups: ShopGroup[] = Object.values(
    items.reduce((acc, item) => {
      if (!acc[item.shopId]) {
        acc[item.shopId] = { shopId: item.shopId, shopName: item.shopName, items: [], subtotal: 0 };
      }
      acc[item.shopId].items.push(item);
      acc[item.shopId].subtotal += item.price * item.quantity;
      return acc;
    }, {} as Record<string, ShopGroup>)
  );

  return (
    <CartContext.Provider value={{
      items, isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem, removeItem, updateQty, clearCart,
      itemCount, total, shopGroups,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
