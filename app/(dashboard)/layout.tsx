import { DashboardShell } from "@/components/dashboard/shell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  // Customers are not allowed in the dashboard — send them to the shop
  if (profile?.role === "customer") redirect("/shop");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_read", false);

  return (
    <DashboardShell
      user={profile ?? { full_name: user.email ?? "User" }}
      notificationCount={notifications?.length ?? 0}
    >
      {children}
    </DashboardShell>
  );
}
