import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardCharts } from "@/components/dashboard/charts";
import { AIInsights } from "@/components/dashboard/ai-insights";
import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch dashboard stats
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();

  const [
    { data: shops },
    { data: currentMonthOrders },
    { data: lastMonthOrders },
    { data: products },
    { data: customers },
    { data: lowStockProducts },
    { data: expiringProducts },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("shops").select("id, name").eq("owner_id", user.id).eq("is_active", true),
    supabase.from("orders").select("total").eq("payment_status", "paid").gte("created_at", startOfMonth),
    supabase.from("orders").select("total").eq("payment_status", "paid").gte("created_at", startOfLastMonth).lte("created_at", endOfLastMonth),
    supabase.from("products").select("id").eq("is_active", true),
    supabase.from("customers").select("id"),
    supabase.from("products").select("id, name, quantity, low_stock_threshold").filter("quantity", "lte", "low_stock_threshold").eq("is_active", true).limit(5),
    supabase.from("products").select("id, name, expiry_date").not("expiry_date", "is", null).lte("expiry_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()).limit(5),
    supabase.from("orders").select("id, order_number, total, status, created_at, customers(name)").order("created_at", { ascending: false }).limit(5),
  ]);

  const currentRevenue = currentMonthOrders?.reduce((sum, o) => sum + o.total, 0) ?? 0;
  const lastRevenue = lastMonthOrders?.reduce((sum, o) => sum + o.total, 0) ?? 0;
  const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back 👋</h2>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(currentRevenue)}
          change={revenueGrowth}
          changeLabel="vs last month"
          icon={<DollarSign size={20} className="text-primary" />}
          iconBg="bg-primary/10"
        />
        <StatCard
          title="Total Orders"
          value={currentMonthOrders?.length ?? 0}
          icon={<ShoppingCart size={20} className="text-blue-600" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          title="Customers"
          value={customers?.length ?? 0}
          icon={<Users size={20} className="text-purple-600" />}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
        />
        <StatCard
          title="Products"
          value={products?.length ?? 0}
          icon={<Package size={20} className="text-orange-600" />}
          iconBg="bg-orange-100 dark:bg-orange-900/30"
        />
      </div>

      {/* Alerts */}
      {((lowStockProducts?.length ?? 0) > 0 || (expiringProducts?.length ?? 0) > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {(lowStockProducts?.length ?? 0) > 0 && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-base">
                  <AlertTriangle size={18} />
                  Low Stock Alert ({lowStockProducts!.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lowStockProducts!.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{p.name}</span>
                      <Badge variant="warning">{p.quantity} left</Badge>
                    </li>
                  ))}
                </ul>
                <Link href="/inventory" className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 mt-3 hover:underline">
                  View all <ArrowRight size={12} />
                </Link>
              </CardContent>
            </Card>
          )}

          {(expiringProducts?.length ?? 0) > 0 && (
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400 text-base">
                  <AlertTriangle size={18} />
                  Expiring Soon ({expiringProducts!.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {expiringProducts!.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{p.name}</span>
                      <Badge variant="danger">{new Date(p.expiry_date!).toLocaleDateString()}</Badge>
                    </li>
                  ))}
                </ul>
                <Link href="/inventory" className="flex items-center gap-1 text-xs text-red-700 dark:text-red-400 mt-3 hover:underline">
                  View all <ArrowRight size={12} />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      <DashboardCharts />

      {/* AI Insights */}
      <AIInsights />

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Order</th>
                  <th className="text-left py-2 text-muted-foreground font-medium hidden sm:table-cell">Customer</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders?.map((order: any) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-mono text-xs">{order.order_number}</td>
                    <td className="py-3 hidden sm:table-cell text-muted-foreground">
                      {order.customers?.name ?? "Walk-in"}
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
                {!recentOrders?.length && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No orders yet. Start selling!
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
