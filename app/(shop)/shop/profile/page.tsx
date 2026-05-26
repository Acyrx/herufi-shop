"use client";

import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  CheckCircle2,
  Gift,
  Loader2,
  Package,
  Pencil,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Profile {
  full_name: string;
  phone: string;
  email: string;
  avatar_url?: string;
}

interface CustomerSummary {
  total_orders: number;
  total_loyalty_points: number;
}

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({ full_name: "", phone: "", email: "" });
  const [summary, setSummary] = useState<CustomerSummary>({ total_orders: 0, total_loyalty_points: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUserId(data.user.id);
      fetchProfile(data.user.id, data.user.email ?? "");
    });
  }, []);

  async function fetchProfile(uid: string, email: string) {
    const { data: p } = await supabase
      .from("profiles")
      .select("full_name, phone, email, avatar_url")
      .eq("id", uid)
      .single();

    setProfile({
      full_name: p?.full_name ?? "",
      phone: p?.phone ?? "",
      email: p?.email ?? email,
      avatar_url: p?.avatar_url ?? undefined,
    });

    // Aggregate loyalty points and order count across all customer records
    const { data: customers } = await supabase
      .from("customers")
      .select("id, loyalty_points")
      .eq("user_id", uid);

    const customerIds = (customers ?? []).map(c => c.id);
    const totalPoints = (customers ?? []).reduce((s, c) => s + (c.loyalty_points ?? 0), 0);

    let totalOrders = 0;
    if (customerIds.length > 0) {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("customer_id", customerIds);
      totalOrders = count ?? 0;
    }

    setSummary({ total_orders: totalOrders, total_loyalty_points: totalPoints });
    setLoading(false);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile updated");
      setEditing(false);
    }
    setSaving(false);
  }

  const initials = profile.full_name
    ? profile.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : profile.email[0]?.toUpperCase() ?? "U";

  if (loading) {
    return (
      <div className="max-w-md mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded-lg" />
        <div className="h-40 bg-muted rounded-2xl" />
        <div className="h-56 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-5 animate-fade-in pb-12">
      {/* Nav */}
      <div className="flex items-center gap-3">
        <Link
          href="/shop"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-xl font-bold text-foreground">My Profile</h1>
      </div>

      {/* Avatar + stats */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center gap-4">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border-2 border-primary/20 overflow-hidden">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{profile.full_name || "Customer"}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>

        {/* Stats row */}
        <div className="w-full grid grid-cols-2 gap-3">
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
              <Package size={16} />
            </div>
            <p className="text-xl font-bold text-foreground">{summary.total_orders}</p>
            <p className="text-[11px] text-muted-foreground">Total Orders</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 text-center border border-amber-100 dark:border-amber-900">
            <div className="flex items-center justify-center gap-1.5 text-amber-600 mb-1">
              <Gift size={16} />
            </div>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{summary.total_loyalty_points}</p>
            <p className="text-[11px] text-amber-600/80">Loyalty Points</p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <User size={15} className="text-primary" />
            <span className="font-semibold text-sm text-foreground">Personal Information</span>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Full name */}
          <div>
            <label className="block text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1.5">
              Full Name
            </label>
            {editing ? (
              <input
                type="text"
                value={profile.full_name}
                onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your full name"
              />
            ) : (
              <p className="text-sm text-foreground font-medium">{profile.full_name || "—"}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1.5">
              Phone Number
            </label>
            {editing ? (
              <input
                type="tel"
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="+255 XXX XXX XXX"
              />
            ) : (
              <p className="text-sm text-foreground font-medium">{profile.phone || "—"}</p>
            )}
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1.5">
              Email Address
            </label>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Email cannot be changed here.</p>
          </div>

          {/* Save / cancel */}
          {editing && (
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-10 flex items-center justify-center gap-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><CheckCircle2 size={14} /> Save Changes</>}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="flex-1 h-10 flex items-center justify-center text-sm font-medium border border-border rounded-xl hover:bg-muted transition-colors text-foreground"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        <Link
          href="/shop/orders"
          className="flex items-center justify-between px-5 py-3.5 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <Package size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">My Orders</span>
          </div>
          <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{summary.total_orders}</span>
        </Link>
        <Link
          href="/shop"
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted transition-colors"
        >
          <Gift size={16} className="text-amber-500" />
          <span className="text-sm font-medium text-foreground">Loyalty Points — {summary.total_loyalty_points} pts</span>
        </Link>
      </div>
    </div>
  );
}
