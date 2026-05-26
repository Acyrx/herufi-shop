"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLang } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";
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

const COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#f59e0b", "#3b82f6"];

type Period = "7d" | "30d" | "90d";

interface SalesPoint { date: string; revenue: number; orders: number; profit: number }
interface TopProduct { name: string; value: number; revenue: number }

export function DashboardCharts({ shopId }: { shopId: string }) {
  const supabase = createClient();
  const { t } = useLang();
  const [period, setPeriod] = useState<Period>("7d");
  const [salesData, setSalesData] = useState<SalesPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [period, shopId]);

  async function fetchData() {
    setLoading(true);
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const from = new Date(Date.now() - days * 86400000).toISOString();

    // Fetch orders with items and product info in one query
    const { data: orders } = await supabase
      .from("orders")
      .select("total, created_at, order_items(quantity, unit_price, products(name, cost_price))")
      .eq("shop_id", shopId)
      .gte("created_at", from)
      .eq("payment_status", "paid")
      .order("created_at");

    // Aggregate by date and build top products map in a single pass
    const byDate: Record<string, { revenue: number; orders: number; cost: number }> = {};
    const productMap: Record<string, { name: string; value: number; revenue: number }> = {};

    (orders ?? []).forEach((o: any) => {
      const date = new Date(o.created_at).toLocaleDateString("en-TZ", {
        month: "short",
        day: "numeric",
      });
      if (!byDate[date]) byDate[date] = { revenue: 0, orders: 0, cost: 0 };
      byDate[date].revenue += o.total;
      byDate[date].orders += 1;

      (o.order_items ?? []).forEach((item: any) => {
        const costPrice = item.products?.cost_price ?? 0;
        byDate[date].cost += costPrice * item.quantity;

        const name: string = item.products?.name ?? "Unknown";
        if (!productMap[name]) productMap[name] = { name, value: 0, revenue: 0 };
        productMap[name].value += item.quantity;
        productMap[name].revenue += item.quantity * item.unit_price;
      });
    });

    const salesArr: SalesPoint[] = Object.entries(byDate).map(([date, v]) => ({
      date,
      revenue: v.revenue,
      orders: v.orders,
      profit: v.revenue - v.cost || v.revenue * 0.22,
    }));
    setSalesData(salesArr);

    const top = Object.values(productMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    setTopProducts(top);

    setLoading(false);
  }

  const totalRevenue = salesData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = salesData.reduce((s, d) => s + d.orders, 0);

  if (loading) {
    return (
      <div className="grid lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-72 bg-card rounded-xl border border-border animate-pulse ${i === 1 ? "lg:col-span-2" : ""}`} />
        ))}
      </div>
    );
  }

  const empty = salesData.length === 0;

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Revenue Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>{t.dashboard.revenueOverview}</CardTitle>
              {!empty && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatCurrency(totalRevenue)} · {totalOrders} {t.dashboard.orders}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              {(["7d", "30d", "90d"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${period === p ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {empty ? (
            <div className="h-60 flex items-center justify-center text-muted-foreground text-sm text-center px-4">
              {t.dashboard.noSalesDataChart}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(v, name) => [formatCurrency(Number(v)), name === "revenue" ? t.dashboard.revenue : t.dashboard.profit]}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" name={t.dashboard.revenue} stroke="#16a34a" fill="url(#rev)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="profit" name={t.dashboard.profit} stroke="#22c55e" fill="url(#prof)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Products Pie */}
      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.topProducts}</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm text-center">
              {t.dashboard.noProductSales}
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={topProducts} cx="50%" cy="50%" innerRadius={48} outerRadius={75} paddingAngle={2} dataKey="value">
                    {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v, _, p) => [`${v} ${t.dashboard.sold} · ${formatCurrency(p.payload.revenue)}`, p.payload.name]}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 space-y-1.5">
                {topProducts.map((p, i) => (
                  <li key={p.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                    <span className="flex-1 truncate text-foreground">{p.name}</span>
                    <span className="text-muted-foreground">{p.value} {t.dashboard.sold}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      {/* Orders Bar */}
      <Card className="lg:col-span-3">
        <CardHeader><CardTitle>{t.dashboard.dailyOrders}</CardTitle></CardHeader>
        <CardContent>
          {empty ? (
            <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
              {t.dashboard.noOrdersInPeriod}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={salesData} barSize={Math.max(8, Math.min(32, 200 / salesData.length))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [v, t.dashboard.orders]}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="orders" name={t.dashboard.orders} fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
