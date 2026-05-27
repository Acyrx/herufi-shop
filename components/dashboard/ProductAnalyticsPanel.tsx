"use client";

import { useEffect, useState } from "react";
import {
  X,
  Package,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Period = "7d" | "30d" | "90d";

export interface AnalyticsProduct {
  id: string;
  name: string;
  sku: string;
  category?: { name: string };
  quantity: number;
  low_stock_threshold: number;
  cost_price: number;
  selling_price: number;
  expiry_date?: string;
  unit: string;
  image_url?: string;
}

interface SalesPoint {
  date: string;
  units: number;
  revenue: number;
  cost: number;
  profit: number;
}

interface Props {
  product: AnalyticsProduct | null;
  shopId: string;
  onClose: () => void;
}

function KpiCard({
  label,
  value,
  sub,
  colorClass = "text-foreground",
}: {
  label: string;
  value: string;
  sub?: string;
  colorClass?: string;
}) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 border border-border/60">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold leading-tight ${colorClass}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export function ProductAnalyticsPanel({ product, shopId, onClose }: Props) {
  const supabase = createClient();
  const [period, setPeriod] = useState<Period>("30d");
  const [salesData, setSalesData] = useState<SalesPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalUnits, setTotalUnits] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (product) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, period]);

  async function fetchData() {
    if (!product) return;
    setLoading(true);

    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const from = new Date(Date.now() - days * 86400000).toISOString();

    // Step 1 — fetch paid orders for this shop in the window
    const { data: orders } = await supabase
      .from("orders")
      .select("id, created_at")
      .eq("shop_id", shopId)
      .eq("payment_status", "paid")
      .gte("created_at", from);

    const orderIds = (orders ?? []).map((o: { id: string }) => o.id);
    const orderDateMap: Record<string, string> = Object.fromEntries(
      (orders ?? []).map((o: { id: string; created_at: string }) => [o.id, o.created_at])
    );

    // Step 2 — fetch order_items for this product in those orders
    let items: { quantity: number; unit_price: number; order_id: string }[] = [];
    if (orderIds.length > 0) {
      const { data } = await supabase
        .from("order_items")
        .select("quantity, unit_price, order_id")
        .eq("product_id", product.id)
        .in("order_id", orderIds);
      items = data ?? [];
    }

    // Aggregate by day
    const byDate: Record<string, { units: number; revenue: number; cost: number }> = {};
    let tUnits = 0, tRevenue = 0, tCost = 0;

    items.forEach((item) => {
      const raw = orderDateMap[item.order_id];
      if (!raw) return;
      const date = new Date(raw).toLocaleDateString("en-TZ", {
        month: "short",
        day: "numeric",
      });
      if (!byDate[date]) byDate[date] = { units: 0, revenue: 0, cost: 0 };
      const qty = item.quantity ?? 0;
      const price = item.unit_price ?? 0;
      const cost = (product.cost_price ?? 0) * qty;
      byDate[date].units += qty;
      byDate[date].revenue += qty * price;
      byDate[date].cost += cost;
      tUnits += qty;
      tRevenue += qty * price;
      tCost += cost;
    });

    // Sort chronologically
    const arr: SalesPoint[] = Object.entries(byDate)
      .map(([date, v]) => ({
        date,
        units: v.units,
        revenue: v.revenue,
        cost: v.cost,
        profit: v.revenue - v.cost,
      }))
      .sort((a, b) => new Date(a.date + " 2025").getTime() - new Date(b.date + " 2025").getTime());

    setSalesData(arr);
    setTotalUnits(tUnits);
    setTotalRevenue(tRevenue);
    setTotalCost(tCost);
    setLoading(false);
  }

  if (!product) return null;

  const profit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : "0.0";
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const velocity = (totalUnits / days).toFixed(2);
  const perUnitProfit = (product.selling_price ?? 0) - (product.cost_price ?? 0);
  const perUnitMargin =
    (product.selling_price ?? 0) > 0
      ? ((perUnitProfit / product.selling_price) * 100).toFixed(1)
      : "0.0";
  const daysUntilStockout =
    Number(velocity) > 0 ? Math.floor(product.quantity / Number(velocity)) : null;
  const barSize = Math.max(6, Math.min(28, Math.floor(360 / (salesData.length || 1))));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[100]"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[700px] bg-background border-l border-border shadow-2xl z-[110] flex flex-col overflow-hidden animate-fade-in">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <Package size={18} className="text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-base truncate leading-tight">
                {product.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {product.sku}
                {product.category?.name ? ` · ${product.category.name}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {/* Period toggle */}
            <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
              {(["7d", "30d", "90d"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors font-medium ${
                    period === p
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-muted rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {/* ── KPI cards ───────────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard
                  label="Units Sold"
                  value={String(totalUnits)}
                  sub={`${velocity} / day avg`}
                  colorClass={totalUnits > 0 ? "text-primary" : "text-muted-foreground"}
                />
                <KpiCard
                  label={`Revenue (${period})`}
                  value={formatCurrency(totalRevenue)}
                  sub={`Cost: ${formatCurrency(totalCost)}`}
                />
                <KpiCard
                  label="Total Profit"
                  value={formatCurrency(profit)}
                  sub={`${margin}% margin`}
                  colorClass={profit >= 0 ? "text-primary" : "text-destructive"}
                />
                <KpiCard
                  label="Profit / Unit"
                  value={formatCurrency(perUnitProfit)}
                  sub={`${perUnitMargin}% margin`}
                  colorClass={
                    perUnitProfit >= 0 ? "text-primary" : "text-destructive"
                  }
                />
              </div>

              {/* ── Current stock strip ─────────────────────────────────── */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card rounded-xl border border-border p-3">
                  <p className="text-[11px] text-muted-foreground">Current Stock</p>
                  <p
                    className={`text-xl font-bold mt-0.5 ${
                      product.quantity === 0
                        ? "text-destructive"
                        : product.quantity <= product.low_stock_threshold
                        ? "text-amber-600"
                        : "text-foreground"
                    }`}
                  >
                    {product.quantity}
                    <span className="text-sm font-medium text-muted-foreground ml-1">
                      {product.unit}
                    </span>
                  </p>
                </div>
                <div className="bg-card rounded-xl border border-border p-3">
                  <p className="text-[11px] text-muted-foreground">Cost Price</p>
                  <p className="text-xl font-bold mt-0.5">
                    {formatCurrency(product.cost_price)}
                  </p>
                </div>
                <div className="bg-card rounded-xl border border-border p-3">
                  <p className="text-[11px] text-muted-foreground">Selling Price</p>
                  <p className="text-xl font-bold mt-0.5">
                    {formatCurrency(product.selling_price)}
                  </p>
                </div>
              </div>

              {/* ── No data state ───────────────────────────────────────── */}
              {salesData.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <ShoppingCart
                    size={44}
                    className="text-muted-foreground/25 mb-3"
                  />
                  <p className="font-medium text-muted-foreground">
                    No sales in the last {period}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sales data will appear here once orders are recorded.
                  </p>
                </div>
              ) : (
                <>
                  {/* ── Sales velocity chart ────────────────────────────── */}
                  <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-primary" />
                      Sales Velocity — units per day
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={salesData}>
                        <defs>
                          <linearGradient
                            id="unitGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#16a34a"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="95%"
                              stopColor="#16a34a"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          formatter={(v) => [`${v} ${product.unit}`, "Units Sold"]}
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="units"
                          stroke="#16a34a"
                          fill="url(#unitGrad)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#16a34a" }}
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* ── Revenue / Cost / Profit bar chart ──────────────── */}
                  <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-sm font-semibold mb-3">
                      Revenue · Cost · Profit breakdown
                    </p>
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={salesData} barSize={barSize} barGap={2}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                          tickFormatter={(v) =>
                            `${(v / 1000).toFixed(0)}K`
                          }
                        />
                        <Tooltip
                          formatter={(v, name) => [
                            formatCurrency(Number(v)),
                            name,
                          ]}
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar
                          dataKey="revenue"
                          name="Revenue"
                          fill="#16a34a"
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="cost"
                          name="Cost"
                          fill="#f59e0b"
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="profit"
                          name="Profit"
                          fill="#3b82f6"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* ── Stock forecast insight ──────────────────────────── */}
                  {daysUntilStockout !== null && (
                    <div
                      className={`rounded-xl p-4 flex items-start gap-3 border ${
                        daysUntilStockout <= 7
                          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30"
                          : daysUntilStockout <= 30
                          ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30"
                          : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          daysUntilStockout <= 7
                            ? "bg-red-100 dark:bg-red-900/30"
                            : daysUntilStockout <= 30
                            ? "bg-amber-100 dark:bg-amber-900/30"
                            : "bg-green-100 dark:bg-green-900/30"
                        }`}
                      >
                        {daysUntilStockout <= 30 ? (
                          <AlertTriangle
                            size={16}
                            className={
                              daysUntilStockout <= 7
                                ? "text-red-600"
                                : "text-amber-600"
                            }
                          />
                        ) : (
                          <TrendingUp size={16} className="text-green-600" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            daysUntilStockout <= 7
                              ? "text-red-900 dark:text-red-200"
                              : daysUntilStockout <= 30
                              ? "text-amber-900 dark:text-amber-200"
                              : "text-green-900 dark:text-green-200"
                          }`}
                        >
                          Stock Forecast
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            daysUntilStockout <= 7
                              ? "text-red-700 dark:text-red-400"
                              : daysUntilStockout <= 30
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-green-700 dark:text-green-400"
                          }`}
                        >
                          At the current rate of{" "}
                          <strong>
                            {velocity} {product.unit}/day
                          </strong>
                          , current stock of{" "}
                          <strong>
                            {product.quantity} {product.unit}
                          </strong>{" "}
                          will last approximately{" "}
                          <strong>~{daysUntilStockout} days</strong>
                          {daysUntilStockout <= 7
                            ? " — restock immediately!"
                            : daysUntilStockout <= 30
                            ? " — consider restocking soon."
                            : "."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Per-day summary table ───────────────────────────── */}
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold">Daily Breakdown</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/30 text-muted-foreground">
                            <th className="text-left px-4 py-2.5 font-medium">Date</th>
                            <th className="text-right px-4 py-2.5 font-medium">Units</th>
                            <th className="text-right px-4 py-2.5 font-medium">Revenue</th>
                            <th className="text-right px-4 py-2.5 font-medium">Cost</th>
                            <th className="text-right px-4 py-2.5 font-medium">Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...salesData].reverse().map((row) => (
                            <tr
                              key={row.date}
                              className="border-t border-border/50 hover:bg-muted/20 transition-colors"
                            >
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {row.date}
                              </td>
                              <td className="px-4 py-2.5 text-right font-medium">
                                {row.units}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                {formatCurrency(row.revenue)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-amber-600">
                                {formatCurrency(row.cost)}
                              </td>
                              <td
                                className={`px-4 py-2.5 text-right font-semibold ${
                                  row.profit >= 0
                                    ? "text-primary"
                                    : "text-destructive"
                                }`}
                              >
                                {formatCurrency(row.profit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-border bg-muted/30 font-semibold">
                            <td className="px-4 py-2.5 text-muted-foreground">
                              Total
                            </td>
                            <td className="px-4 py-2.5 text-right">{totalUnits}</td>
                            <td className="px-4 py-2.5 text-right">
                              {formatCurrency(totalRevenue)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-amber-600">
                              {formatCurrency(totalCost)}
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right ${
                                profit >= 0 ? "text-primary" : "text-destructive"
                              }`}
                            >
                              {formatCurrency(profit)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
