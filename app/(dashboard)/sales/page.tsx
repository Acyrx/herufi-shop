"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useShop } from "@/lib/context/shop";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  ShoppingCart,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  created_at: string;
  customers?: { name: string } | null;
}

interface DailyStat {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
}

const STATUS_COLORS_MAP: Record<string, string> = {
  completed: "#16a34a",
  pending: "#f59e0b",
  processing: "#3b82f6",
  cancelled: "#ef4444",
  refunded: "#8b5cf6",
};

const STATUS_BADGE: Record<string, "success" | "warning" | "info" | "danger" | "default"> = {
  completed: "success",
  pending: "warning",
  processing: "info",
  cancelled: "danger",
  refunded: "danger",
};

const PERIODS = [
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
];

export default function SalesPage() {
  const supabase = createClient();
  const { shopId, currentShop } = useShop();
  const [period, setPeriod] = useState("30");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (shopId) fetchOrders();
    else setLoading(false);
  }, [period, shopId]);

  async function fetchOrders() {
    if (!shopId) return;
    setLoading(true);
    const from = new Date(Date.now() - parseInt(period) * 86400000).toISOString();
    const { data } = await supabase
      .from("orders")
      .select("*, customers(name)")
      .eq("shop_id", shopId)
      .gte("created_at", from)
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }

  // Computed stats
  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const estProfit = totalRevenue * 0.22;

  // Daily stats for charts
  const byDate: Record<string, DailyStat> = {};
  paidOrders.forEach((o) => {
    const date = new Date(o.created_at).toLocaleDateString("en-TZ", { month: "short", day: "numeric" });
    if (!byDate[date]) byDate[date] = { date, revenue: 0, orders: 0, profit: 0 };
    byDate[date].revenue += o.total;
    byDate[date].orders += 1;
    byDate[date].profit += o.total * 0.22;
  });
  const dailyData = Object.values(byDate).reverse();

  // Status breakdown for pie chart
  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
  });
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Filtered orders for table
  const filtered = orders.filter((o) => {
    const matchSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.customers?.name ?? "").toLowerCase().includes(search.toLowerCase());
    return statusFilter === "all" ? matchSearch : matchSearch && o.status === statusFilter;
  });

  // Export helpers
  function buildExportRows() {
    return filtered.map((o) => ({
      "Order Number": o.order_number,
      Customer: o.customers?.name ?? "Walk-in",
      Status: o.status,
      "Payment Method": o.payment_method,
      "Payment Status": o.payment_status,
      Subtotal: o.subtotal,
      Discount: o.discount,
      Tax: o.tax,
      Total: o.total,
      Date: formatDateTime(o.created_at),
    }));
  }

  async function downloadExcel() {
    setExporting(true);
    try {
      const rows = buildExportRows();
      if (!rows.length) { toast.error("No data to export"); return; }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales");
      // Summary sheet
      const summary = [
        { Metric: "Total Revenue", Value: totalRevenue },
        { Metric: "Total Orders", Value: totalOrders },
        { Metric: "Completed Orders", Value: completedOrders },
        { Metric: "Avg Order Value", Value: avgOrderValue },
        { Metric: "Est. Profit (22%)", Value: estProfit },
        { Metric: "Period (days)", Value: period },
        { Metric: "Generated At", Value: new Date().toLocaleString() },
      ];
      const ws2 = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, ws2, "Summary");
      XLSX.writeFile(wb, `herufi_sales_${period}days_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel report downloaded");
    } catch (e) {
      toast.error("Export failed");
    }
    setExporting(false);
  }

  async function downloadPDF() {
    setExporting(true);
    try {
      const rows = buildExportRows();
      if (!rows.length) { toast.error("No data to export"); return; }

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = margin;

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("HERUFI — Sales Report", margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Period: Last ${period} days  |  Generated: ${new Date().toLocaleString()}`, margin, y);
      y += 10;

      // Summary box
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const summaryItems = [
        `Revenue: TZS ${totalRevenue.toLocaleString()}`,
        `Orders: ${totalOrders}`,
        `Completed: ${completedOrders}`,
        `Avg Value: TZS ${Math.round(avgOrderValue).toLocaleString()}`,
        `Est. Profit: TZS ${Math.round(estProfit).toLocaleString()}`,
      ];
      doc.text(summaryItems.join("   |   "), margin, y);
      y += 8;

      // Separator
      doc.setDrawColor(200);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      // Table headers
      const cols = ["Order #", "Customer", "Status", "Payment", "Total (TZS)", "Date"];
      const colWidths = [40, 45, 28, 28, 35, 45];
      let x = margin;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 4, pageW - 2 * margin, 8, "F");
      cols.forEach((col, i) => {
        doc.text(col, x + 1, y);
        x += colWidths[i];
      });
      y += 6;

      // Table rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      rows.slice(0, 60).forEach((row, idx) => {
        if (y > 185) {
          doc.addPage();
          y = margin;
        }
        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 4, pageW - 2 * margin, 7, "F");
        }
        x = margin;
        const cells = [
          row["Order Number"],
          row["Customer"].slice(0, 18),
          row["Status"],
          row["Payment Method"],
          Number(row["Total"]).toLocaleString(),
          String(row["Date"]).slice(0, 18),
        ];
        cells.forEach((cell, i) => {
          doc.text(String(cell), x + 1, y);
          x += colWidths[i];
        });
        y += 7;
      });

      if (rows.length > 60) {
        y += 4;
        doc.setFont("helvetica", "italic");
        doc.setTextColor(120);
        doc.text(`... and ${rows.length - 60} more rows (download Excel for full data)`, margin, y);
      }

      doc.save(`herufi_sales_${period}days_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF report downloaded");
    } catch (e) {
      toast.error("PDF export failed");
      console.error(e);
    }
    setExporting(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Sales Overview</h2>
          <p className="text-muted-foreground text-sm">{currentShop ? currentShop.name + " · " : ""}Revenue, orders, and performance analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  period === p.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center py-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <DollarSign size={18} className="text-primary" />
          </div>
          <p className="text-xl font-bold">{loading ? "—" : formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
        </Card>
        <Card className="text-center py-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
            <ShoppingCart size={18} className="text-blue-600" />
          </div>
          <p className="text-xl font-bold">{loading ? "—" : totalOrders}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
        </Card>
        <Card className="text-center py-4">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
            <TrendingUp size={18} className="text-green-600" />
          </div>
          <p className="text-xl font-bold">{loading ? "—" : formatCurrency(estProfit)}</p>
          <p className="text-xs text-muted-foreground mt-1">Est. Profit (22%)</p>
        </Card>
        <Card className="text-center py-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
            <BarChart3 size={18} className="text-purple-600" />
          </div>
          <p className="text-xl font-bold">{loading ? "—" : formatCurrency(avgOrderValue)}</p>
          <p className="text-xs text-muted-foreground mt-1">Avg. Order Value</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(v, name) => [formatCurrency(Number(v)), name === "revenue" ? "Revenue" : "Profit"]}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#16a34a" fill="url(#revGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#3b82f6" fill="url(#profGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Order Status</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No orders yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS_MAP[entry.name] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders per Day Bar Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Orders per Day</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="orders" name="Orders" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders Table + Export */}
      <Card noPadding>
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <h3 className="font-semibold text-sm">Order Details</h3>
            <div className="flex gap-1 flex-wrap">
              {["all", "pending", "processing", "completed", "cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors capitalize ${
                    statusFilter === s ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="min-w-48">
              <Input
                placeholder="Search orders..."
                icon={<Search size={13} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={downloadExcel} loading={exporting}>
              <FileSpreadsheet size={14} className="text-green-600" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPDF} loading={exporting}>
              <FileText size={14} className="text-red-600" />
              PDF
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Order #</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Customer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Payment</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td colSpan={6} className="p-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    <ShoppingCart size={36} className="mx-auto mb-3 opacity-30" />
                    No orders found
                  </td>
                </tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-mono text-xs font-semibold">{o.order_number}</td>
                  <td className="p-4 hidden sm:table-cell text-muted-foreground text-xs">{o.customers?.name ?? "Walk-in"}</td>
                  <td className="p-4 font-bold text-sm">{formatCurrency(o.total)}</td>
                  <td className="p-4">
                    <Badge variant={STATUS_BADGE[o.status] ?? "default"}>{o.status}</Badge>
                  </td>
                  <td className="p-4 hidden md:table-cell capitalize text-xs text-muted-foreground">{o.payment_method.replace("_", " ")}</td>
                  <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">{formatDateTime(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="p-4 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
            <span>Showing {filtered.length} of {orders.length} orders</span>
            <span className="font-semibold text-foreground">Total: {formatCurrency(filtered.reduce((s, o) => s + o.total, 0))}</span>
          </div>
        )}
      </Card>
    </div>
  );
}
