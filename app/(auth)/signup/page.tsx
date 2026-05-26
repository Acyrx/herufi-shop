"use client";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const ROLES = [
  { value: "owner", label: "Shop Owner — I manage my own business" },
  { value: "customer", label: "Customer — I want to shop and track orders" },
];

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role: "owner",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name, phone: form.phone, role: form.role },
      },
    });

    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      // Create profile
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: form.full_name,
        phone: form.phone || null,
        role: form.role,
      });

      toast.success("Account created! Welcome to Herufi.");
      const dest = form.role === "customer" ? "/shop" : "/dashboard";
      router.push(dest);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xl p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-1">Create account</h2>
      <p className="text-muted-foreground text-sm mb-6">Start managing your business with Herufi</p>

      <button
        onClick={handleGoogleSignup}
        className="w-full flex items-center justify-center gap-3 h-10 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium mb-4"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path fill="#4285F4" d="M23.5 12.2c0-.8-.1-1.6-.2-2.4H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.5v2.9h3.9c2.3-2.1 3.6-5.2 3.6-8.5z" />
          <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z" />
          <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l4-3.1z" />
          <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.8l3.3-3.3C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
        </svg>
        Sign up with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSignup} className="space-y-3">
        <Input label="Full Name *" placeholder="John Doe" icon={<User size={14} />} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <Input label="Email *" type="email" placeholder="you@example.com" icon={<Mail size={14} />} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone (Optional)" placeholder="+255 XXX XXX XXX" icon={<Phone size={14} />} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Select label="I am a..." value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={ROLES} />
        <Input
          label="Password *"
          type={showPassword ? "text" : "password"}
          placeholder="At least 6 characters"
          icon={<Lock size={14} />}
          iconRight={<button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Input
          label="Confirm Password *"
          type="password"
          placeholder="Repeat your password"
          icon={<Lock size={14} />}
          value={form.confirm_password}
          onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
        />
        <Button type="submit" loading={loading} className="w-full">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
