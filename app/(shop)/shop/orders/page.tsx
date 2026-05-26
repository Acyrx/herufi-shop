"use client";

import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Receipt,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  shop: { id: string; name: string; location: string } | null;
  order_items: { id: string; quantity: number; unit_price: number; total: number }[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending:    { label: "Pending",    icon: <Clock size={13} />,        color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
  confirmed:  { label: "Confirmed",  icon: <CheckCircle2 size={13} />, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
  processing: { label: "Processing", icon: <Package size={13} />,      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800" },
  shipped:    { label: "Shipped",    icon: <Truck size={13} />,        color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800" },
  delivered:  { label: "Delivered",  icon: <CheckCircle2 size={13} />, color: "text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
  cancelled:  { label: "Cancelled",  icon: <XCircle size={13} />,      color: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
};

export default function OrdersPage() {
  const supabase = createClient();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { setAuthed(false); setLoading(false); return; }
      setAuthed(true);
      fetchOrders();
    });
  }, []);

  async function fetchOrders() {
    const { data } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, payment_method, payment_status,
        subtotal, tax, total, created_at,
        shop:shops(id, name, location),
        order_items(id, quantity, unit_price, total)
      `)
      .order("created_at", { ascending: false });

    setOrders((data ?? []) as unknown as Order[]);
    setLoading(false);
  }

  if (authed === false) {
    return (
      <div className="py-24 text-center space-y-4">
        <Package size={48} className="mx-auto text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Sign in to view your orders.</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/shop"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">My Orders</h1>
          <p className="text-xs text-muted-foreground">Track and view all your purchases</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-card rounded-xl border border-border animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-24 text-center">
          <Package size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="font-semibold text-foreground mb-1">No orders yet</p>
          <p className="text-sm text-muted-foreground mb-4">Start shopping and your orders will appear here.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const itemCount = order.order_items.reduce((s, i) => s + i.quantity, 0);
            return (
              <Link
                key={order.id}
                href={`/shop/orders/${order.id}`}
                className="block bg-card border border-border rounded-xl hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-mono text-sm font-bold text-foreground">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.created_at).toLocaleDateString("en-TZ", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  {/* Shop + items */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Store size={12} />
                      <span className="truncate max-w-[140px]">{order.shop?.name ?? "Unknown shop"}</span>
                      <span>·</span>
                      <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-primary">{formatCurrency(order.total)}</p>
                      <Receipt size={14} className="text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
