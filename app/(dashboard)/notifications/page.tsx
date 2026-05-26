"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLang } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import { AlertTriangle, Bell, BellOff, Check, CheckCheck, Package, ShoppingCart, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const ICONS: Record<string, React.ReactNode> = {
  low_stock: <Package size={16} className="text-amber-600" />,
  expiry: <AlertTriangle size={16} className="text-red-500" />,
  order: <ShoppingCart size={16} className="text-blue-600" />,
  payment: <Zap size={16} className="text-green-600" />,
  employee: <Check size={16} className="text-purple-600" />,
  system: <Bell size={16} className="text-muted-foreground" />,
};

const TYPE_COLORS: Record<string, "warning" | "danger" | "info" | "success" | "default"> = {
  low_stock: "warning",
  expiry: "danger",
  order: "info",
  payment: "success",
  employee: "default",
  system: "default",
};

export default function NotificationsPage() {
  const supabase = createClient();
  const { t } = useLang();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setNotifications(data ?? []);
    setLoading(false);
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success(t.notifications.allMarkedRead);
  }

  const filtered = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {t.notifications.title}
            {unreadCount > 0 && <Badge variant="danger">{unreadCount} {t.notifications.new}</Badge>}
          </h2>
          <p className="text-muted-foreground text-sm">{t.notifications.subtitle}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck size={14} /> {t.notifications.markAllRead}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${filter === f ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
          >{f === "all" ? t.notifications.all : t.notifications.unread}{f === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}</button>
        ))}
      </div>

      <div className="space-y-2">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-20 bg-card rounded-xl border border-border animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <Card className="py-16 text-center">
            <BellOff size={40} className="mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">{filter === "unread" ? t.notifications.noUnread : t.notifications.noNotifications}</p>
          </Card>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`flex gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                n.is_read
                  ? "bg-card border-border"
                  : "bg-primary/5 border-primary/20 hover:bg-primary/10"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                {ICONS[n.type] ?? <Bell size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${n.is_read ? "text-foreground" : "text-foreground"}`}>{n.title}</p>
                    <Badge variant={TYPE_COLORS[n.type] ?? "default"}>{n.type.replace("_", " ")}</Badge>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1 animate-pulse-dot" />}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(n.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
