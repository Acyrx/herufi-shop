"use client";

import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  Package,
  Printer,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  product: { id: string; name: string; image_url?: string; unit: string } | null;
}

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  created_at: string;
  shop: { id: string; name: string; location: string; contact_phone?: string } | null;
  customer: { id: string; name: string; phone?: string; email?: string } | null;
  order_items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending:    { label: "Pending",    icon: <Clock size={14} />,        color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  confirmed:  { label: "Confirmed",  icon: <CheckCircle2 size={14} />, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  processing: { label: "Processing", icon: <Package size={14} />,      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
  shipped:    { label: "Shipped",    icon: <Truck size={14} />,        color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" },
  delivered:  { label: "Delivered",  icon: <CheckCircle2 size={14} />, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
  cancelled:  { label: "Cancelled",  icon: <XCircle size={14} />,      color: "text-red-600 bg-red-50 dark:bg-red-950/30" },
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash on Delivery",
  mpesa: "M-Pesa",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

export default function OrderReceiptPage() {
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) fetchOrder(params.id);
  }, [params.id]);

  async function fetchOrder(id: string) {
    const { data } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, payment_method, payment_status,
        subtotal, tax, total, notes, created_at,
        shop:shops(id, name, location, contact_phone),
        customer:customers(id, name, phone, email),
        order_items(
          id, quantity, unit_price, discount, total,
          product:products(id, name, image_url, unit)
        )
      `)
      .eq("id", id)
      .single();

    setOrder(data as unknown as OrderDetail | null);
    setLoading(false);
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-2xl" />
        <div className="h-48 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-24 text-center">
        <Package size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground mb-4">Order not found.</p>
        <Link href="/shop/orders" className="text-primary hover:underline text-sm">← Back to Orders</Link>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const orderDate = new Date(order.created_at);

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-in pb-12">
      {/* Nav */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/shop/orders"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Orders
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      {/* Receipt card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/90 to-green-600 p-6 text-white">
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <Store size={14} />
            <span className="text-xs">Herufi Marketplace</span>
          </div>
          <h1 className="text-xl font-bold mb-0.5">Order Receipt</h1>
          <p className="font-mono text-sm opacity-90">{order.order_number}</p>
        </div>

        {/* Status + date */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
          <div className="text-right">
            <p className="text-xs font-semibold text-foreground">
              {orderDate.toLocaleDateString("en-TZ", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {orderDate.toLocaleTimeString("en-TZ", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {/* Shop + Customer info */}
        <div className="grid grid-cols-2 gap-px bg-border">
          {/* Shop */}
          <div className="bg-card px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">From</p>
            <p className="text-sm font-bold text-foreground">{order.shop?.name ?? "—"}</p>
            {order.shop?.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin size={10} /> {order.shop.location}
              </p>
            )}
            {order.shop?.contact_phone && (
              <p className="text-xs text-muted-foreground mt-0.5">{order.shop.contact_phone}</p>
            )}
          </div>

          {/* Customer */}
          <div className="bg-card px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">To</p>
            <p className="text-sm font-bold text-foreground">{order.customer?.name ?? "—"}</p>
            {order.customer?.phone && (
              <p className="text-xs text-muted-foreground mt-0.5">{order.customer.phone}</p>
            )}
            {order.customer?.email && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{order.customer.email}</p>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="border-t border-border">
          <div className="px-5 py-2 bg-muted/20 border-b border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Items</p>
          </div>
          <div className="divide-y divide-border">
            {order.order_items.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                {/* Image */}
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {item.product?.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={16} className="text-muted-foreground/30" />
                  )}
                </div>

                {/* Name + qty */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.product?.name ?? "Product"}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.unit_price)}/{item.product?.unit ?? "unit"}
                    {item.discount > 0 && (
                      <span className="ml-1.5 text-green-600">−{formatCurrency(item.discount)}</span>
                    )}
                  </p>
                </div>

                {/* Line total */}
                <p className="text-sm font-bold text-foreground shrink-0">{formatCurrency(item.total)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-border px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.tax > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="border-t border-border px-5 py-3 flex items-center justify-between bg-muted/20">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Payment Method</p>
            <p className="text-sm font-medium text-foreground">{PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
            order.payment_status === "paid"
              ? "bg-green-100 text-green-700 dark:bg-green-950/40"
              : "bg-amber-100 text-amber-700 dark:bg-amber-950/40"
          }`}>
            {order.payment_status === "paid" ? "Paid" : "Unpaid"}
          </span>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="border-t border-border px-5 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Notes</p>
            <p className="text-xs text-muted-foreground">{order.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 text-center">
          <p className="text-[10px] text-muted-foreground">Thank you for shopping with Herufi!</p>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{order.order_number}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex-1 h-10 flex items-center justify-center gap-2 text-sm font-medium border border-border rounded-xl hover:bg-muted transition-colors text-foreground"
        >
          <Printer size={15} /> Print Receipt
        </button>
        <Link
          href="/shop"
          className="flex-1 h-10 flex items-center justify-center gap-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
