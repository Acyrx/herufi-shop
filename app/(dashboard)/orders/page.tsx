"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Eye, Package, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total: number;
  created_at: string;
  customers?: { name: string };
  order_items?: Array<{ quantity: number; unit_price: number; products: { name: string } }>;
}

const STATUS_COLORS: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  completed: "success",
  pending: "warning",
  cancelled: "danger",
  processing: "info",
  refunded: "danger",
};

export default function OrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, customers(name), order_items(quantity, unit_price, products(name))")
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }

  const filtered = orders.filter((o) => {
    const matchSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.customers?.name ?? "").toLowerCase().includes(search.toLowerCase());
    if (statusFilter !== "all") return matchSearch && o.status === statusFilter;
    return matchSearch;
  });

  async function updateStatus(id: string, status: string) {
    await supabase.from("orders").update({ status }).eq("id", id);
    fetchOrders();
    setSelected(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-muted-foreground text-sm">{orders.length} total orders</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <Input placeholder="Search orders..." icon={<Search size={14} />} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "processing", "completed", "cancelled"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors capitalize ${statusFilter === s ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
            >{s}</button>
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
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Payment</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td colSpan={7} className="p-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-muted-foreground">
                  <Package size={40} className="mx-auto mb-3 opacity-30" />
                  No orders found
                </td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-mono text-xs font-semibold">{o.order_number}</td>
                  <td className="p-4 hidden sm:table-cell text-muted-foreground">{o.customers?.name ?? "Walk-in"}</td>
                  <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">{formatDateTime(o.created_at)}</td>
                  <td className="p-4 font-bold">{formatCurrency(o.total)}</td>
                  <td className="p-4"><Badge variant={STATUS_COLORS[o.status] ?? "default"}>{o.status}</Badge></td>
                  <td className="p-4 hidden lg:table-cell capitalize text-sm text-muted-foreground">{o.payment_method.replace("_", " ")}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => setSelected(o)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Order ${selected?.order_number}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{selected.customers?.name ?? "Walk-in"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{formatDateTime(selected.created_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment</p>
                <p className="font-medium capitalize">{selected.payment_method.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={STATUS_COLORS[selected.status] ?? "default"}>{selected.status}</Badge>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground">Item</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.order_items?.map((item, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="p-3">{item.products?.name}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">{formatCurrency(item.unit_price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-border bg-muted/20">
                  <tr>
                    <td colSpan={2} className="p-3 font-bold">Total</td>
                    <td className="p-3 text-right font-bold text-primary">{formatCurrency(selected.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {selected.status === "pending" && (
              <div className="flex gap-2 pt-2">
                <Button onClick={() => updateStatus(selected.id, "processing")} variant="outline" className="flex-1">Mark Processing</Button>
                <Button onClick={() => updateStatus(selected.id, "completed")} className="flex-1">Mark Completed</Button>
                <Button onClick={() => updateStatus(selected.id, "cancelled")} variant="danger" className="flex-1">Cancel</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
