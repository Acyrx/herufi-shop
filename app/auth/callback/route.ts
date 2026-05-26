import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role ?? "customer";
      const dest = role === "owner" || role === "employee" || role === "admin"
        ? "/dashboard"
        : "/shop";

      return NextResponse.redirect(new URL(dest, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login", url.origin));
}
