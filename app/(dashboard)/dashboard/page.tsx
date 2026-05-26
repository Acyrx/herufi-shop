"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { AIInsights } from "@/components/dashboard/ai-insights";
import { DashboardCharts } from "@/components/dashboard/charts";
import { useLang } from "@/lib/i18n/context";
import { useShop } from "@/lib/context/shop";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardStats {
  currentRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: { id: string; name: string; quantity: number; low_stock_threshold: number }[];
  expiringProducts: { id: string; name: string; expiry_date: string }[];
  recentOrders: any[];
}

export default function DashboardPage() {
  const supabase = createClient();
  const { t } = useLang();
  const { shopId, currentShop, loading: shopLoading } = useShop();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopLoading) return;
    if (shopId) {
      fetchStats(shopId);
    } else {
      setLoading(false);
      setStats(null);
    }
  }, [shopId, shopLoading]);

  async function fetchStats(id: string) {
    setLoading(true);
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: currentMonthOrders },
      { data: lastMonthOrders },
      { data: products },
      { data: customers },
      { data: lowStockProducts },
      { data: expiringProducts },
      { data: recentOrders },
    ] = await Promise.all([
      supabase.from("orders").select("total").eq("shop_id", id).eq("payment_status", "paid").gte("created_at", startOfMonth),
      supabase.from("orders").select("total").eq("shop_id", id).eq("payment_status", "paid").gte("created_at", startOfLastMonth).lte("created_at", endOfLastMonth),
      supabase.from("products").select("id").eq("shop_id", id).eq("is_active", true),
      supabase.from("customers").select("id").eq("shop_id", id),
      supabase
        .from("products")
        .select("id, name, quantity, low_stock_threshold")
        .eq("shop_id", id)
        .filter("quantity", "lte", "low_stock_threshold")
        .eq("is_active", true)
        .limit(5),
      supabase
        .from("products")
        .select("id, name, expiry_date")
        .eq("shop_id", id)
        .not("expiry_date", "is", null)
        .lte("expiry_date", in7Days)
        .limit(5),
      supabase
        .from("orders")
        .select("id, order_number, total, status, created_at, customers(name)")
        .eq("shop_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const currentRevenue = currentMonthOrders?.reduce((sum, o) => sum + o.total, 0) ?? 0;
    const lastRevenue = lastMonthOrders?.reduce((sum, o) => sum + o.total, 0) ?? 0;
    const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

    setStats({
      currentRevenue,
      revenueGrowth,
      totalOrders: currentMonthOrders?.length ?? 0,
      totalCustomers: customers?.length ?? 0,
      totalProducts: products?.length ?? 0,
      lowStockProducts: (lowStockProducts ?? []) as any[],
      expiringProducts: (expiringProducts ?? []) as any[],
      recentOrders: (recentOrders ?? []) as any[],
    });
    setLoading(false);
  }

  if (shopLoading || loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <Package size={48} className="text-muted-foreground opacity-40" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t.dashboard.noShopSelected}</h2>
          <p className="text-muted-foreground mt-1">{t.dashboard.noShopDesc}</p>
        </div>
        <Link
          href="/shops"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {t.dashboard.goToShops}
        </Link>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t.dashboard.welcome}</h2>
        <p className="text-muted-foreground mt-1">
          {currentShop?.name} · {t.dashboard.welcomeDesc}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t.dashboard.monthlyRevenue}
          value={formatCurrency(s.currentRevenue)}
          change={s.revenueGrowth}
          changeLabel={t.dashboard.vsLastMonth}
          icon={<DollarSign size={20} className="text-primary" />}
          iconBg="bg-primary/10"
        />
        <StatCard
          title={t.dashboard.totalOrders}
          value={s.totalOrders}
          icon={<ShoppingCart size={20} className="text-blue-600" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          title={t.dashboard.customers}
          value={s.totalCustomers}
          icon={<Users size={20} className="text-purple-600" />}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
        />
        <StatCard
          title={t.dashboard.products}
          value={s.totalProducts}
          icon={<Package size={20} className="text-orange-600" />}
          iconBg="bg-orange-100 dark:bg-orange-900/30"
        />
      </div>

      {/* Alerts */}
      {(s.lowStockProducts.length > 0 || s.expiringProducts.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {s.lowStockProducts.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-base">
                  <AlertTriangle size={18} />
                  {t.dashboard.lowStockAlert} ({s.lowStockProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {s.lowStockProducts.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{p.name}</span>
                      <Badge variant="warning">{p.quantity} left</Badge>
                    </li>
                  ))}
                </ul>
                <Link href="/inventory" className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 mt-3 hover:underline">
                  {t.common.viewAll} <ArrowRight size={12} />
                </Link>
              </CardContent>
            </Card>
          )}

          {s.expiringProducts.length > 0 && (
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400 text-base">
                  <AlertTriangle size={18} />
                  {t.dashboard.expiringSoon} ({s.expiringProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {s.expiringProducts.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{p.name}</span>
                      <Badge variant="danger">{new Date(p.expiry_date).toLocaleDateString()}</Badge>
                    </li>
                  ))}
                </ul>
                <Link href="/inventory" className="flex items-center gap-1 text-xs text-red-700 dark:text-red-400 mt-3 hover:underline">
                  {t.common.viewAll} <ArrowRight size={12} />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      <DashboardCharts shopId={shopId} />

      {/* AI Insights */}
      <AIInsights />

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t.dashboard.recentOrders}</CardTitle>
            <Link href="/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
              {t.common.viewAll} <ArrowRight size={14} />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">{t.dashboard.order}</th>
                  <th className="text-left py-2 text-muted-foreground font-medium hidden sm:table-cell">{t.orders.customer}</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">{t.common.amount}</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">{t.common.status}</th>
                </tr>
              </thead>
              <tbody>
                {s.recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-mono text-xs">{order.order_number}</td>
                    <td className="py-3 hidden sm:table-cell text-muted-foreground">
                      {order.customers?.name ?? t.orders.walkIn}
                    </td>
                    <td className="py-3 font-semibold">{formatCurrency(order.total)}</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          order.status === "completed" ? "success"
                          : order.status === "pending" ? "warning"
                          : order.status === "cancelled" ? "danger"
                          : "info"
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {s.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      {t.dashboard.noOrders}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
