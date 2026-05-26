"use client";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import {
  LIMITS,
  clearRateLimit,
  clientRateLimit,
  sanitize,
  validateEmail,
  validateFullName,
  validatePassword,
} from "@/lib/security";
import { Eye, EyeOff, Lock, Mail, User, ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

const ROLES = [
  { value: "owner",    label: "Shop Owner — I manage my own business" },
  { value: "customer", label: "Customer — I want to shop and track orders" },
];

interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
  example: string;
  min: number;
  max: number;
}

const COUNTRIES: Country[] = [
  // East Africa — shown first
  { code: "TZ", dial: "+255", flag: "🇹🇿", name: "Tanzania",     example: "712 345 678", min: 9, max: 9  },
  { code: "KE", dial: "+254", flag: "🇰🇪", name: "Kenya",        example: "712 345 678", min: 9, max: 9  },
  { code: "UG", dial: "+256", flag: "🇺🇬", name: "Uganda",       example: "712 345 678", min: 9, max: 9  },
  { code: "RW", dial: "+250", flag: "🇷🇼", name: "Rwanda",       example: "788 123 456", min: 9, max: 9  },
  { code: "BI", dial: "+257", flag: "🇧🇮", name: "Burundi",      example: "79 123 456",  min: 8, max: 8  },
  { code: "ET", dial: "+251", flag: "🇪🇹", name: "Ethiopia",     example: "91 123 4567", min: 9, max: 9  },
  { code: "SS", dial: "+211", flag: "🇸🇸", name: "South Sudan",  example: "977 123 456", min: 9, max: 9  },
  { code: "SO", dial: "+252", flag: "🇸🇴", name: "Somalia",      example: "61 123 4567", min: 8, max: 9  },
  { code: "DJ", dial: "+253", flag: "🇩🇯", name: "Djibouti",     example: "77 123 456",  min: 8, max: 8  },
  { code: "ER", dial: "+291", flag: "🇪🇷", name: "Eritrea",      example: "7 123 456",   min: 7, max: 7  },
  // Southern Africa
  { code: "ZA", dial: "+27",  flag: "🇿🇦", name: "South Africa", example: "71 234 5678", min: 9, max: 9  },
  { code: "ZW", dial: "+263", flag: "🇿🇼", name: "Zimbabwe",     example: "71 234 5678", min: 9, max: 9  },
  { code: "ZM", dial: "+260", flag: "🇿🇲", name: "Zambia",       example: "95 512 3456", min: 9, max: 9  },
  { code: "MW", dial: "+265", flag: "🇲🇼", name: "Malawi",       example: "991 234 567", min: 9, max: 9  },
  { code: "MZ", dial: "+258", flag: "🇲🇿", name: "Mozambique",   example: "82 123 4567", min: 9, max: 9  },
  { code: "BW", dial: "+267", flag: "🇧🇼", name: "Botswana",     example: "71 234 567",  min: 8, max: 8  },
  { code: "NA", dial: "+264", flag: "🇳🇦", name: "Namibia",      example: "81 123 4567", min: 9, max: 9  },
  { code: "LS", dial: "+266", flag: "🇱🇸", name: "Lesotho",      example: "50 123 456",  min: 8, max: 8  },
  { code: "SZ", dial: "+268", flag: "🇸🇿", name: "Eswatini",     example: "76 123 456",  min: 8, max: 8  },
  { code: "MG", dial: "+261", flag: "🇲🇬", name: "Madagascar",   example: "32 123 4567", min: 9, max: 9  },
  // West Africa
  { code: "NG", dial: "+234", flag: "🇳🇬", name: "Nigeria",      example: "802 123 4567",min: 10,max: 10 },
  { code: "GH", dial: "+233", flag: "🇬🇭", name: "Ghana",        example: "24 123 4567", min: 9, max: 9  },
  { code: "SN", dial: "+221", flag: "🇸🇳", name: "Senegal",      example: "70 123 4567", min: 9, max: 9  },
  { code: "CI", dial: "+225", flag: "🇨🇮", name: "Côte d'Ivoire",example: "07 12 34 56", min: 10,max: 10 },
  { code: "ML", dial: "+223", flag: "🇲🇱", name: "Mali",         example: "65 123 456",  min: 8, max: 8  },
  { code: "BF", dial: "+226", flag: "🇧🇫", name: "Burkina Faso", example: "70 123 456",  min: 8, max: 8  },
  { code: "GN", dial: "+224", flag: "🇬🇳", name: "Guinea",       example: "620 123 456", min: 9, max: 9  },
  { code: "SL", dial: "+232", flag: "🇸🇱", name: "Sierra Leone", example: "76 123 456",  min: 8, max: 8  },
  { code: "LR", dial: "+231", flag: "🇱🇷", name: "Liberia",      example: "770 123 456", min: 8, max: 9  },
  { code: "GW", dial: "+245", flag: "🇬🇼", name: "Guinea-Bissau",example: "955 123 456", min: 9, max: 9  },
  { code: "TG", dial: "+228", flag: "🇹🇬", name: "Togo",         example: "90 112 345",  min: 8, max: 8  },
  { code: "BJ", dial: "+229", flag: "🇧🇯", name: "Benin",        example: "90 123 456",  min: 8, max: 8  },
  { code: "NE", dial: "+227", flag: "🇳🇪", name: "Niger",        example: "93 123 456",  min: 8, max: 8  },
  { code: "MR", dial: "+222", flag: "🇲🇷", name: "Mauritania",   example: "22 123 456",  min: 8, max: 8  },
  { code: "GM", dial: "+220", flag: "🇬🇲", name: "Gambia",       example: "701 2345",    min: 7, max: 7  },
  // Central Africa
  { code: "CM", dial: "+237", flag: "🇨🇲", name: "Cameroon",     example: "671 234 567", min: 9, max: 9  },
  { code: "CD", dial: "+243", flag: "🇨🇩", name: "DR Congo",     example: "812 345 678", min: 9, max: 9  },
  { code: "CG", dial: "+242", flag: "🇨🇬", name: "Congo",        example: "06 123 4567", min: 9, max: 9  },
  { code: "CF", dial: "+236", flag: "🇨🇫", name: "Central African Rep.", example: "75 123 456", min: 8, max: 8 },
  { code: "GA", dial: "+241", flag: "🇬🇦", name: "Gabon",        example: "06 123 4567", min: 9, max: 9  },
  { code: "TD", dial: "+235", flag: "🇹🇩", name: "Chad",         example: "63 123 456",  min: 8, max: 8  },
  { code: "GQ", dial: "+240", flag: "🇬🇶", name: "Equatorial Guinea", example: "222 123 456", min: 9, max: 9 },
  // North Africa
  { code: "EG", dial: "+20",  flag: "🇪🇬", name: "Egypt",        example: "100 123 4567",min: 10,max: 10 },
  { code: "MA", dial: "+212", flag: "🇲🇦", name: "Morocco",      example: "612 345 678", min: 9, max: 9  },
  { code: "TN", dial: "+216", flag: "🇹🇳", name: "Tunisia",      example: "20 123 456",  min: 8, max: 8  },
  { code: "DZ", dial: "+213", flag: "🇩🇿", name: "Algeria",      example: "551 234 567", min: 9, max: 9  },
  { code: "LY", dial: "+218", flag: "🇱🇾", name: "Libya",        example: "91 123 4567", min: 9, max: 9  },
  { code: "SD", dial: "+249", flag: "🇸🇩", name: "Sudan",        example: "91 123 4567", min: 9, max: 9  },
  // Europe
  { code: "GB", dial: "+44",  flag: "🇬🇧", name: "United Kingdom",example: "7911 123456",min: 10,max: 10 },
  { code: "DE", dial: "+49",  flag: "🇩🇪", name: "Germany",      example: "151 23456789",min: 10,max: 11 },
  { code: "FR", dial: "+33",  flag: "🇫🇷", name: "France",       example: "6 12 34 56 78",min: 9,max: 9 },
  { code: "IT", dial: "+39",  flag: "🇮🇹", name: "Italy",        example: "312 345 6789",min: 9, max: 10 },
  { code: "PT", dial: "+351", flag: "🇵🇹", name: "Portugal",     example: "912 345 678", min: 9, max: 9  },
  { code: "NL", dial: "+31",  flag: "🇳🇱", name: "Netherlands",  example: "6 12345678",  min: 9, max: 9  },
  // Americas
  { code: "US", dial: "+1",   flag: "🇺🇸", name: "United States",example: "201 555 0123",min: 10,max: 10 },
  { code: "CA", dial: "+1",   flag: "🇨🇦", name: "Canada",       example: "416 555 0123",min: 10,max: 10 },
  { code: "BR", dial: "+55",  flag: "🇧🇷", name: "Brazil",       example: "11 91234 5678",min: 10,max: 11},
  // Middle East & Asia
  { code: "AE", dial: "+971", flag: "🇦🇪", name: "UAE",          example: "50 123 4567", min: 9, max: 9  },
  { code: "SA", dial: "+966", flag: "🇸🇦", name: "Saudi Arabia", example: "51 234 5678", min: 9, max: 9  },
  { code: "IN", dial: "+91",  flag: "🇮🇳", name: "India",        example: "91234 56789", min: 10,max: 10 },
  { code: "CN", dial: "+86",  flag: "🇨🇳", name: "China",        example: "131 2345 6789",min: 11,max: 11},
  { code: "PK", dial: "+92",  flag: "🇵🇰", name: "Pakistan",     example: "301 234 5678",min: 10,max: 10 },
  { code: "QA", dial: "+974", flag: "🇶🇦", name: "Qatar",        example: "5512 3456",   min: 8, max: 8  },
];

export default function SignupPage() {
  const supabase = createClient();
  const router   = useRouter();

  const [form, setForm] = useState({
    full_name: "", email: "", localPhone: "", password: "", confirm_password: "", role: "owner",
  });
  const [country, setCountry]         = useState<Country>(COUNTRIES[0]);
  const [dialOpen, setDialOpen]       = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const dialRef   = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [lockSeconds,  setLockSeconds]  = useState(0);
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [pwResult,     setPwResult]     = useState(validatePassword(""));

  // Close dropdown on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (dialRef.current && !dialRef.current.contains(e.target as Node)) {
        setDialOpen(false);
        setCountrySearch("");
      }
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (dialOpen) {
      setCountrySearch("");
      const t = setTimeout(() => searchRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [dialOpen]);

  // Countdown timer when locked
  useEffect(() => {
    if (lockSeconds <= 0) return;
    const t = setTimeout(() => setLockSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [lockSeconds]);

  // Filter countries by search term (name or dial code)
  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dial.includes(countrySearch) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : COUNTRIES;

  function setField(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; });
    if (k === "password") setPwResult(validatePassword(v));
  }

  function validatePhoneLocal(local: string): string | null {
    if (!local) return null; // optional
    const digits = local.replace(/[\s\-().]/g, "");
    // Strip leading zero — users sometimes type it
    const normalized = digits.replace(/^0/, "");
    if (!/^\d+$/.test(normalized)) return "Phone number must contain digits only.";
    if (normalized.length < country.min)
      return `${country.name} numbers need ${country.min} digit${country.min !== 1 ? "s" : ""} (got ${normalized.length}).`;
    if (normalized.length > country.max)
      return `${country.name} numbers must not exceed ${country.max} digit${country.max !== 1 ? "s" : ""}.`;
    return null;
  }

  function validate(): boolean {
    const e: Record<string, string> = {};

    const nameErr = validateFullName(form.full_name);
    if (nameErr) e.full_name = nameErr;

    const emailErr = validateEmail(form.email);
    if (emailErr) e.email = emailErr;

    const phoneErr = validatePhoneLocal(form.localPhone);
    if (phoneErr) e.localPhone = phoneErr;

    if (!form.password) {
      e.password = "Password is required.";
    } else if (pwResult.errors.length > 0) {
      e.password = "Password does not meet all requirements.";
    }

    if (form.password !== form.confirm_password) {
      e.confirm_password = "Passwords do not match.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignup(ev: React.FormEvent) {
    ev.preventDefault();

    if (lockSeconds > 0) {
      toast.error(`Too many attempts. Try again in ${Math.ceil(lockSeconds / 60)} min.`);
      return;
    }

    if (!validate()) return;

    // Client-side rate limit: 5 attempts / 60 s → locks 15 min
    const wait = clientRateLimit("signup", 5, 60, 900);
    if (wait > 0) {
      setLockSeconds(wait);
      toast.error(`Too many sign-up attempts. Locked for ${Math.ceil(wait / 60)} min.`);
      return;
    }

    setLoading(true);

    const stripped = form.localPhone.replace(/[\s\-().]/g, "").replace(/^0/, "");
    const fullPhone = stripped ? `${country.dial}${stripped}` : "";

    const { data, error } = await supabase.auth.signUp({
      email:    sanitize(form.email, LIMITS.email),
      password: form.password,
      options: {
        data: {
          full_name: sanitize(form.full_name, LIMITS.name),
          phone:     fullPhone || null,
          role:      form.role,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      await supabase.from("profiles").upsert({
        id:        data.user.id,
        full_name: sanitize(form.full_name, LIMITS.name),
        phone:     fullPhone || null,
        role:      form.role,
      });
      clearRateLimit("signup");
      toast.success("Account created! Welcome to Herufi.");
      router.push(form.role === "customer" ? "/shop" : "/dashboard");
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

  const locked = lockSeconds > 0;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xl p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-1">Create account</h2>
      <p className="text-muted-foreground text-sm mb-6">Start managing your business with Herufi</p>

      <button
        type="button"
        onClick={handleGoogleSignup}
        className="w-full flex items-center justify-center gap-3 h-10 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium mb-4"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path fill="#4285F4" d="M23.5 12.2c0-.8-.1-1.6-.2-2.4H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.5v2.9h3.9c2.3-2.1 3.6-5.2 3.6-8.5z"/>
          <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z"/>
          <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l4-3.1z"/>
          <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.8l3.3-3.3C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/>
        </svg>
        Sign up with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSignup} className="space-y-4" noValidate autoComplete="off">

        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <Input
            label="Full Name *"
            placeholder="First Last"
            icon={<User size={14} />}
            value={form.full_name}
            onChange={e => setField("full_name", e.target.value)}
            maxLength={LIMITS.name}
            error={errors.full_name}
            autoComplete="name"
          />
          <p className="text-[10px] text-muted-foreground pl-0.5">
            Enter exactly 2 or 3 words (e.g. "Juma Ally Hassan")
          </p>
        </div>

        {/* Email */}
        <Input
          label="Email *"
          type="email"
          placeholder="you@example.com"
          icon={<Mail size={14} />}
          value={form.email}
          onChange={e => setField("email", e.target.value)}
          maxLength={LIMITS.email}
          error={errors.email}
          autoComplete="email"
        />

        {/* Phone with searchable country-code picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Phone (Optional)</label>

          <div className={`flex rounded-lg border transition-colors ${errors.localPhone ? "border-destructive" : "border-input"}`}>
            {/* Country picker trigger */}
            <div className="relative shrink-0" ref={dialRef}>
              <button
                type="button"
                onClick={() => setDialOpen(o => !o)}
                className="flex items-center gap-1.5 h-10 pl-3 pr-2 rounded-l-lg bg-muted/50 hover:bg-muted border-r border-input text-sm text-foreground transition-colors whitespace-nowrap"
                aria-label="Select country code"
              >
                <span className="text-base leading-none">{country.flag}</span>
                <span className="font-mono text-xs">{country.dial}</span>
                <ChevronDown
                  size={12}
                  className={`text-muted-foreground transition-transform duration-200 ${dialOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dialOpen && (
                <div className="absolute z-50 mt-1 left-0 w-72 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                  {/* Search box */}
                  <div className="p-2 border-b border-border">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted">
                      <Search size={13} className="text-muted-foreground shrink-0" />
                      <input
                        ref={searchRef}
                        type="text"
                        value={countrySearch}
                        onChange={e => setCountrySearch(e.target.value)}
                        placeholder="Search country or code…"
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      />
                    </div>
                  </div>

                  {/* Country list */}
                  <div className="max-h-56 overflow-y-auto">
                    {filteredCountries.length === 0 ? (
                      <p className="py-6 text-center text-xs text-muted-foreground">No countries found</p>
                    ) : (
                      filteredCountries.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setCountry(c);
                            setDialOpen(false);
                            setCountrySearch("");
                            if (errors.localPhone) setErrors(e => { const n = { ...e }; delete n.localPhone; return n; });
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${
                            c.code === country.code ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                          }`}
                        >
                          <span className="text-base leading-none">{c.flag}</span>
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="font-mono text-xs text-muted-foreground shrink-0">{c.dial}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Local number input — borderless, shares the wrapper border */}
            <input
              type="tel"
              inputMode="numeric"
              placeholder={country.example}
              value={form.localPhone}
              onChange={e => {
                const v = e.target.value.replace(/[^\d\s\-()+]/g, "");
                setField("localPhone", v);
              }}
              maxLength={LIMITS.phone}
              autoComplete="tel-national"
              className="flex-1 h-10 px-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none rounded-r-lg"
            />
          </div>

          {errors.localPhone && (
            <p className="text-xs text-destructive">{errors.localPhone}</p>
          )}
          <p className="text-[10px] text-muted-foreground pl-0.5">
            {country.name} · {country.dial} · {country.min === country.max ? `${country.min} digits` : `${country.min}–${country.max} digits`}
          </p>
        </div>

        {/* Role */}
        <Select
          label="I am a..."
          value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          options={ROLES}
        />

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <Input
            label="Password *"
            type={showPassword ? "text" : "password"}
            placeholder="Min 8 chars with uppercase, digit & symbol"
            icon={<Lock size={14} />}
            iconRight={
              <button type="button" onClick={() => setShowPassword(s => !s)} aria-label="Toggle password">
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
            value={form.password}
            onChange={e => setField("password", e.target.value)}
            maxLength={LIMITS.password}
            error={errors.password}
            autoComplete="new-password"
          />

          {/* Strength meter */}
          {form.password && (
            <div className="space-y-1">
              <div className="flex gap-1 h-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full transition-all duration-300"
                    style={{ background: i < pwResult.score ? pwResult.color : "var(--muted)" }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium" style={{ color: pwResult.color }}>
                  {pwResult.label}
                </span>
                {pwResult.errors.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    Missing: {pwResult.errors[0]}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <Input
          label="Confirm Password *"
          type={showConfirm ? "text" : "password"}
          placeholder="Repeat your password"
          icon={<Lock size={14} />}
          iconRight={
            <button type="button" onClick={() => setShowConfirm(s => !s)} aria-label="Toggle confirm">
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
          value={form.confirm_password}
          onChange={e => setField("confirm_password", e.target.value)}
          maxLength={LIMITS.password}
          error={errors.confirm_password}
          autoComplete="new-password"
        />

        {/* Lock notice */}
        {locked && (
          <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            Too many attempts. Try again in {Math.ceil(lockSeconds / 60)} min {lockSeconds % 60}s.
          </div>
        )}

        <Button type="submit" loading={loading} disabled={locked} className="w-full">
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
