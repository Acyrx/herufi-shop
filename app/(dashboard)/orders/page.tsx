"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useShop } from "@/lib/context/shop";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Eye, Package, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  product: { name: string } | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  notes: string | null;
  customer: { name: string } | null;
  order_items: OrderItem[];
}

const STATUS_COLORS: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  completed:  "success",
  delivered:  "success",
  pending:    "warning",
  confirmed:  "info",
  processing: "info",
  shipped:    "info",
  cancelled:  "danger",
  refunded:   "danger",
};

const NEXT_STATUS: Record<string, { label: string; value: string }[]> = {
  pending:    [{ label: "Confirm", value: "confirmed" }, { label: "Cancel", value: "cancelled" }],
  confirmed:  [{ label: "Mark Processing", value: "processing" }, { label: "Cancel", value: "cancelled" }],
  processing: [{ label: "Mark Shipped", value: "shipped" }, { label: "Cancel", value: "cancelled" }],
  shipped:    [{ label: "Mark Delivered", value: "delivered" }],
};

export default function OrdersPage() {
  const supabase = createClient();
  const { shopId, currentShop } = useShop();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (shopId) fetchOrders();
    else setLoading(false);
  }, [shopId]);

  async function fetchOrders() {
    if (!shopId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, payment_method, payment_status,
        subtotal, tax, total, created_at, notes,
        customer:customers(name),
        order_items(
          id, quantity, unit_price, discount, total,
          product:products(name)
        )
      `)
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    if (error) console.error("Orders fetch error:", error.message);
    setOrders((data ?? []) as unknown as Order[]);
    setLoading(false);
  }

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer?.name ?? "").toLowerCase().includes(search.toLowerCase());
    if (statusFilter !== "all") return matchSearch && o.status === statusFilter;
    return matchSearch;
  });

  async function updateStatus(id: string, status: string) {
    setUpdating(true);
    await supabase.from("orders").update({ status }).eq("id", id);
    setUpdating(false);
    await fetchOrders();
    setSelected(prev => prev ? { ...prev, status } : null);
  }

  const fmtPayment = (m: string | null) =>
    (m ?? "cash").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-muted-foreground text-sm">
            {currentShop ? currentShop.name + " · " : ""}
            {loading ? "Loading…" : `${orders.length} orders`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search orders or customer…"
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors capitalize ${
                statusFilter === s ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Order #</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Customer</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Payment</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td colSpan={7} className="p-4">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    {!shopId ? "Select a shop to view orders" : "No orders found"}
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-mono text-xs font-semibold">{o.order_number}</td>
                    <td className="p-4 hidden sm:table-cell text-muted-foreground">
                      {o.customer?.name ?? "Walk-in"}
                    </td>
                    <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">
                      {formatDateTime(o.created_at)}
                    </td>
                    <td className="p-4 font-bold text-right">{formatCurrency(o.total)}</td>
                    <td className="p-4">
                      <Badge variant={STATUS_COLORS[o.status] ?? "default"}>{o.status}</Badge>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground capitalize">
                      {fmtPayment(o.payment_method)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelected(o)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Order ${selected?.order_number ?? ""}`}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Customer</p>
                <p className="font-medium">{selected.customer?.name ?? "Walk-in"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Date</p>
                <p className="font-medium">{formatDateTime(selected.created_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Payment</p>
                <p className="font-medium">{fmtPayment(selected.payment_method)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Payment Status</p>
                <Badge variant={selected.payment_status === "paid" ? "success" : "warning"}>
                  {selected.payment_status ?? "unpaid"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Order Status</p>
                <Badge variant={STATUS_COLORS[selected.status] ?? "default"}>{selected.status}</Badge>
              </div>
              {selected.notes && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs mb-0.5">Notes</p>
                  <p className="text-sm">{selected.notes}</p>
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground">Item</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Unit Price</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.order_items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground text-xs">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    selected.order_items.map((item) => (
                      <tr key={item.id} className="border-t border-border/50">
                        <td className="p-3">{item.product?.name ?? "—"}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="p-3 text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="border-t-2 border-border bg-muted/20">
                  {selected.tax > 0 && (
                    <>
                      <tr>
                        <td colSpan={3} className="p-3 text-muted-foreground text-xs">Subtotal</td>
                        <td className="p-3 text-right text-sm">{formatCurrency(selected.subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="p-3 text-muted-foreground text-xs">Tax</td>
                        <td className="p-3 text-right text-sm">{formatCurrency(selected.tax)}</td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td colSpan={3} className="p-3 font-bold">Total</td>
                    <td className="p-3 text-right font-bold text-primary">{formatCurrency(selected.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Status actions */}
            {NEXT_STATUS[selected.status] && (
              <div className="flex gap-2 pt-1 flex-wrap">
                {NEXT_STATUS[selected.status].map(({ label, value }) => (
                  <Button
                    key={value}
                    onClick={() => updateStatus(selected.id, value)}
                    disabled={updating}
                    variant={value === "cancelled" ? "danger" : value === "delivered" ? "primary" : "outline"}
                    className="flex-1 min-w-[120px]"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
