"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  Minus,
  Package,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  discount: number;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
  quantity: number;
  sku: string;
  unit: string;
  image_url?: string;
  category?: { name: string };
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "mpesa", label: "M-Pesa" },
  { value: "card", label: "Card" },
  { value: "credit", label: "Credit" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

export default function POSPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [taxRate] = useState(0.18);
  const [processing, setProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    searchRef.current?.focus();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .eq("is_active", true)
      .gt("quantity", 0)
      .order("name");
    setProducts(data ?? []);
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, product.quantity) }
            : i
        );
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.selling_price, quantity: 1, unit: product.unit, discount: 0 }];
    });
    setSearch("");
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => i.product_id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
        .filter((i) => i.quantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity * (1 - i.discount / 100), 0);
  const discountAmount = subtotal * (discount / 100);
  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * taxRate;
  const total = taxableAmount + tax;

  async function processCheckout() {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setProcessing(true);

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        status: "completed",
        payment_method: paymentMethod,
        payment_status: "paid",
        subtotal,
        discount: discountAmount,
        tax,
        total,
      })
      .select()
      .single();

    if (error || !order) {
      toast.error("Order failed. Please try again.");
      setProcessing(false);
      return;
    }

    // Insert order items
    const items = cart.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.price,
      discount: i.discount,
      total: i.price * i.quantity * (1 - i.discount / 100),
    }));

    await supabase.from("order_items").insert(items);

    // Update stock quantities
    for (const item of cart) {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        await supabase
          .from("products")
          .update({ quantity: product.quantity - item.quantity })
          .eq("id", item.product_id);
      }
    }

    toast.success(`Order ${orderNumber} completed!`);
    setLastReceipt(orderNumber);
    setCart([]);
    setDiscount(0);
    setProcessing(false);
    fetchProducts();
  }

  return (
    <div className="grid lg:grid-cols-5 gap-4 h-[calc(100vh-8rem)] animate-fade-in">
      {/* Product Grid */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              ref={searchRef}
              placeholder="Search product or scan barcode..."
              icon={<Search size={14} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.quantity === 0}
                className="bg-card border border-border rounded-xl p-3 text-left hover:border-primary hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="w-full h-16 bg-muted rounded-lg mb-2 flex items-center justify-center">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Package size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
                <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{p.name}</p>
                <p className="text-sm font-bold text-primary mt-1">{formatCurrency(p.selling_price)}</p>
                <p className="text-[10px] text-muted-foreground">{p.quantity} {p.unit} left</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 py-16 text-center text-muted-foreground">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                <p>No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart */}
      <div className="lg:col-span-2 flex flex-col gap-3">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <ShoppingCart size={16} className="text-primary" />
              Cart ({cart.length})
            </h3>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-destructive hover:underline flex items-center gap-1">
                <X size={12} /> Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                Add products to cart
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-xs text-primary font-semibold">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.product_id, -1)} className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground transition-colors">
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product_id, 1)} className="w-6 h-6 rounded-md bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors">
                      <Plus size={12} />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.product_id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Summary */}
        <Card>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Discount %</span>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-16 h-7 text-right text-sm border border-border rounded-md px-2 bg-card focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (18% VAT)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2 mt-2">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={PAYMENT_METHODS}
          />

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="flex-1" disabled={!lastReceipt}>
              <Printer size={14} />
              Receipt
            </Button>
            <Button onClick={processCheckout} loading={processing} className="flex-2 flex-1" disabled={cart.length === 0}>
              Checkout {cart.length > 0 && `(${formatCurrency(total)})`}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
