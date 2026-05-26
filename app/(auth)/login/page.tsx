"use client";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      toast.success("Welcome back!");
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
      const role = profile?.role ?? "customer";
      const dest =
        role === "owner" || role === "employee" || role === "admin"
          ? "/dashboard"
          : "/shop";
      router.push(dest);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xl p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-1">Sign in</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Sign in to your Herufi account
      </p>

      {/* Google */}
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 h-10 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium mb-4"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path
            fill="#4285F4"
            d="M23.5 12.2c0-.8-.1-1.6-.2-2.4H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.5v2.9h3.9c2.3-2.1 3.6-5.2 3.6-8.5z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l4-3.1z"
          />
          <path
            fill="#EA4335"
            d="M12 4.8c1.7 0 3.2.6 4.4 1.8l3.3-3.3C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email or Phone"
          type="email"
          placeholder="you@example.com"
          icon={<Mail size={14} />}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          autoComplete="email"
        />
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          icon={<Lock size={14} />}
          iconRight={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          autoComplete="current-password"
        />
        <div className="flex items-center justify-end">
          <Link href="#" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-primary font-medium hover:underline"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
