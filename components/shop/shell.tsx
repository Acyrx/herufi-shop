"use client";

import { CartDrawer } from "@/components/shop/cart-drawer";
import { ShopNavbar } from "@/components/shop/navbar";
import { CartProvider } from "@/lib/context/cart";
import { Toaster } from "sonner";

export function ShopShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <ShopNavbar />
        <main className="max-w-7xl mx-auto px-4 py-8 pb-20">{children}</main>
        <CartDrawer />
        <Toaster richColors position="top-right" />
      </div>
    </CartProvider>
  );
}
