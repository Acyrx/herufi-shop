"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { useLang } from "@/lib/i18n/context";
import { useShop } from "@/lib/context/shop";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
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

const COLORS = ["#16a34a", "#22c55e", "#86efac", "#f59e0b", "#ef4444", "#3b82f6"];

export default function AnalyticsPage() {
  const supabase = createClient();
  const { t } = useLang();
  const { shopId, currentShop } = useShop();
  const [period, setPeriod] = useState("7d");
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, profit: 0 });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) fetchData();
    else setLoading(false);
  }, [period, shopId]);

  async function fetchData() {
    if (!shopId) return;
    setLoading(true);
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const from = new Date(Date.now() - days * 86400000).toISOString();

    const { data: orders } = await supabase
      .from("orders")
      .select("total, created_at, payment_status")
      .eq("shop_id", shopId)
      .gte("created_at", from)
      .eq("payment_status", "paid");

    const paidOrders = orders ?? [];
    const revenue = paidOrders.reduce((s, o) => s + o.total, 0);

    const byDate: Record<string, { revenue: number; orders: number }> = {};
    paidOrders.forEach((o) => {
      const date = new Date(o.created_at).toLocaleDateString("en-TZ", { month: "short", day: "numeric" });
      if (!byDate[date]) byDate[date] = { revenue: 0, orders: 0 };
      byDate[date].revenue += o.total;
      byDate[date].orders += 1;
    });

    const salesArr = Object.entries(byDate).map(([date, v]) => ({ date, ...v, profit: v.revenue * 0.22 }));
    setSalesData(salesArr);
    setStats({ revenue, orders: paidOrders.length, customers: 0, profit: revenue * 0.22 });

    // Top products — filter via shop's orders
    const { data: items } = await supabase
      .from("order_items")
      .select("quantity, unit_price, products(name), order:orders!inner(shop_id)")
      .eq("order.shop_id", shopId)
      .limit(200);

    const productSales: Record<string, { name: string; revenue: number; sold: number }> = {};
    (items ?? []).forEach((item: any) => {
      const name = item.products?.name ?? "Unknown";
      if (!productSales[name]) productSales[name] = { name, revenue: 0, sold: 0 };
      productSales[name].revenue += item.quantity * item.unit_price;
      productSales[name].sold += item.quantity;
    });

    const top = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    setTopProducts(top);
    setLoading(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">{t.analytics.title}</h2>
          <p className="text-muted-foreground text-sm">{currentShop ? currentShop.name + " · " : ""}{t.analytics.subtitle}</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {["7d", "30d", "90d"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >{p}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t.analytics.totalRevenue} value={formatCurrency(stats.revenue)} icon={<DollarSign size={20} className="text-primary" />} />
        <StatCard title={t.analytics.totalOrders} value={stats.orders} icon={<ShoppingCart size={20} className="text-blue-600" />} iconBg="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard title={t.analytics.estimatedProfit} value={formatCurrency(stats.profit)} icon={<TrendingUp size={20} className="text-green-600" />} iconBg="bg-green-100 dark:bg-green-900/30" />
        <StatCard title={t.analytics.avgOrder} value={formatCurrency(stats.orders > 0 ? stats.revenue / stats.orders : 0)} icon={<BarChart3 size={20} className="text-purple-600" />} iconBg="bg-purple-100 dark:bg-purple-900/30" />
      </div>

      {/* Revenue & Orders Chart */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>{t.analytics.revenueTrend}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="url(#grad1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t.analytics.ordersPerDay}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={salesData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="orders" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader><CardTitle>{t.analytics.topProducts}</CardTitle></CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t.analytics.noData}</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const maxRevenue = topProducts[0]?.revenue ?? 1;
                const pct = (p.revenue / maxRevenue) * 100;
                return (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="text-sm text-primary font-semibold">{formatCurrency(p.revenue)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{p.sold} {t.analytics.unitsSold}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
