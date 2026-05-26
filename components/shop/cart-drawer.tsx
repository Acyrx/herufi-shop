"use client";

import { useCart } from "@/lib/context/cart";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface OwnerShop {
  id: string;
  name: string;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash on Delivery" },
  { value: "mpesa", label: "M-Pesa" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, clearCart, itemCount, total, shopGroups } = useCart();
  const supabase = createClient();

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [placing, setPlacing] = useState(false);
  const [orderNumbers, setOrderNumbers] = useState<string[]>([]);

  // Owner purchase intent
  const [isOwner, setIsOwner] = useState(false);
  const [ownerShops, setOwnerShops] = useState<OwnerShop[]>([]);
  const [purchasePurpose, setPurchasePurpose] = useState<"personal" | "inventory">("personal");
  const [inventoryShopId, setInventoryShopId] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "owner" || profile?.role === "admin") {
        setIsOwner(true);
        const { data: shops } = await supabase
          .from("shops")
          .select("id, name")
          .eq("owner_id", data.user.id)
          .eq("is_active", true)
          .order("name");
        const shopList = (shops ?? []) as OwnerShop[];
        setOwnerShops(shopList);
        if (shopList.length > 0) setInventoryShopId(shopList[0].id);
      }
    });
  }, []);

  if (!isOpen) return null;

  async function handleCheckout() {
    if (!items.length) return;
    if (isOwner && purchasePurpose === "inventory" && !inventoryShopId) {
      toast.error("Please select which shop to add inventory to");
      return;
    }
    setPlacing(true);

    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          paymentMethod,
          purchasePurpose,
          inventoryShopId: purchasePurpose === "inventory" ? inventoryShopId : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Checkout failed");
        return;
      }

      setOrderNumbers(data.orders ?? []);
      clearCart();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  function reset() {
    setOrderNumbers([]);
    setPurchasePurpose("personal");
    closeCart();
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" onClick={reset} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-card border-l border-border shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary" />
            <span className="font-bold text-foreground">My Cart</span>
            {itemCount > 0 && !orderNumbers.length && (
              <span className="text-xs bg-primary text-white rounded-full px-2 py-0.5 font-medium">
                {itemCount}
              </span>
            )}
          </div>
          <button onClick={reset} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        {/* ── Success state ── */}
        {orderNumbers.length > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">Order Placed!</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {purchasePurpose === "inventory"
                  ? "Stock has been added to your shop and the expense recorded."
                  : "Your order has been sent to the shop. You'll receive confirmation shortly."}
              </p>
              {orderNumbers.map(n => (
                <div key={n} className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg text-sm font-mono font-semibold text-foreground mb-2">
                  {n}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={reset}
                className="px-4 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 font-medium transition-colors"
              >
                Continue Shopping
              </button>
              <Link
                href="/shop/orders"
                onClick={reset}
                className="px-4 py-2 text-sm border border-border text-foreground rounded-xl hover:bg-muted font-medium transition-colors"
              >
                View Orders
              </Link>
            </div>
          </div>

        ) : items.length === 0 ? (

          /* ── Empty state ── */
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <ShoppingBag size={28} className="text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Browse products and add items to your cart</p>
            </div>
            <button
              onClick={closeCart}
              className="px-4 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 font-medium transition-colors"
            >
              Browse Products
            </button>
          </div>

        ) : (

          /* ── Cart items ── */
          <>
            <div className="flex-1 overflow-y-auto">
              {shopGroups.map(group => (
                <div key={group.shopId} className="border-b border-border last:border-0">
                  {/* Shop header */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30">
                    <Store size={13} className="text-primary shrink-0" />
                    <span className="text-xs font-semibold text-foreground truncate">{group.shopName}</span>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-border">
                    {group.items.map(item => (
                      <div key={item.productId} className="flex gap-3 px-4 py-3">
                        {/* Image */}
                        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={20} className="text-muted-foreground/30" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate leading-tight">{item.productName}</p>
                          <p className="text-xs text-primary font-semibold mt-0.5">{formatCurrency(item.price)}/{item.unit}</p>

                          {/* Qty controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQty(item.productId, item.quantity - 1)}
                              className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="text-sm font-bold text-foreground w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQty(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= item.maxQty}
                              className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Item total + remove */}
                        <div className="flex flex-col items-end justify-between shrink-0">
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                          <p className="text-sm font-bold text-foreground">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shop subtotal */}
                  <div className="flex justify-between items-center px-4 py-2 bg-muted/20">
                    <span className="text-xs text-muted-foreground">Shop subtotal</span>
                    <span className="text-sm font-semibold">{formatCurrency(group.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Checkout footer ── */}
            <div className="border-t border-border p-4 space-y-3 shrink-0 bg-card/50">

              {/* Owner: purchase purpose */}
              {isOwner && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Purchase Type
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    <button
                      onClick={() => setPurchasePurpose("personal")}
                      className={`px-2 py-2 text-xs rounded-lg border transition-all font-medium ${
                        purchasePurpose === "personal"
                          ? "bg-primary text-white border-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Personal Use
                    </button>
                    <button
                      onClick={() => setPurchasePurpose("inventory")}
                      className={`flex items-center justify-center gap-1 px-2 py-2 text-xs rounded-lg border transition-all font-medium ${
                        purchasePurpose === "inventory"
                          ? "bg-primary text-white border-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Building2 size={11} /> Shop Inventory
                    </button>
                  </div>

                  {/* Shop selector when inventory mode */}
                  {purchasePurpose === "inventory" && ownerShops.length > 0 && (
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1 block">
                        Add stock to
                      </label>
                      <select
                        value={inventoryShopId}
                        onChange={(e) => setInventoryShopId(e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {ownerShops.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Stock will be added and recorded as an expense.
                      </p>
                    </div>
                  )}

                  {purchasePurpose === "inventory" && ownerShops.length === 0 && (
                    <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-lg px-3 py-2">
                      You have no active shops. Create one in the dashboard first.
                    </p>
                  )}
                </div>
              )}

              {/* Payment method */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={`px-2 py-1.5 text-xs rounded-lg border transition-all font-medium ${
                        paymentMethod === m.value
                          ? "bg-primary text-white border-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-2 border-t border-border">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>

              {/* Place order */}
              <button
                onClick={handleCheckout}
                disabled={placing || (isOwner && purchasePurpose === "inventory" && !inventoryShopId)}
                className="w-full h-12 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {placing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  `Place Order · ${formatCurrency(total)}`
                )}
              </button>

              <p className="text-[10px] text-muted-foreground text-center">
                {purchasePurpose === "inventory"
                  ? `Expense will be recorded in ${ownerShops.find(s => s.id === inventoryShopId)?.name ?? "your shop"}`
                  : `Shop owners will be notified immediately · ${shopGroups.length} shop${shopGroups.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
