// ─── Field length caps (prevents DB buffer overflow) ─────────────────────────
export const LIMITS = {
  name:        80,
  email:       254,
  phone:       20,
  password:    128,
  shortText:   160,
  description: 1000,
  notes:       2000,
  search:      200,
  sku:         50,
  url:         500,
  category:    80,
  amount:      15,   // digit string
} as const;

// ─── Sanitize: strip HTML/script, normalize whitespace ───────────────────────
export function sanitize(raw: string, maxLen = 1000): string {
  return raw
    .replace(/<[^>]*>/g, "")          // strip tags
    .replace(/javascript:/gi, "")     // strip js URIs
    .replace(/on\w+\s*=/gi, "")       // strip event handlers
    .replace(/\s+/g, " ")             // collapse whitespace
    .trim()
    .slice(0, maxLen);
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/** Full name must be 2–3 words, each word ≥ 2 letters, letters/hyphens/apostrophes only. */
export function validateFullName(name: string): string | null {
  const cleaned = name.trim();
  if (!cleaned) return "Full name is required.";
  if (cleaned.length > LIMITS.name) return `Name too long (max ${LIMITS.name} chars).`;
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 2) return "Please enter your first and last name.";
  if (words.length > 3) return "Name should be 2 or 3 words.";
  const wordRe = /^[A-Za-zÀ-ÖØ-öø-ÿ''-]{2,}$/;
  for (const w of words) {
    if (!wordRe.test(w)) return "Name may only contain letters (no numbers or symbols).";
  }
  return null;
}

/** Basic RFC-5321 email check. */
export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return "Email is required.";
  if (v.length > LIMITS.email) return "Email is too long.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address.";
  return null;
}

/** Phone: 6–15 digits after stripping spaces/dashes. */
export function validatePhone(local: string): string | null {
  if (!local) return null; // optional
  const digits = local.replace(/[\s\-().]/g, "");
  if (!/^\d+$/.test(digits)) return "Phone number must contain digits only.";
  if (digits.length < 6) return "Phone number is too short.";
  if (digits.length > 15) return "Phone number is too long.";
  return null;
}

export interface PasswordResult {
  score: number;       // 0-5
  label: string;
  color: string;
  errors: string[];
}

/** Password: min 8 chars, uppercase, lowercase, digit, special char. */
export function validatePassword(pw: string): PasswordResult {
  const errors: string[] = [];
  if (pw.length < 8)              errors.push("At least 8 characters");
  if (!/[A-Z]/.test(pw))          errors.push("One uppercase letter");
  if (!/[a-z]/.test(pw))          errors.push("One lowercase letter");
  if (!/\d/.test(pw))             errors.push("One number");
  if (!/[^A-Za-z0-9]/.test(pw))  errors.push("One special character (!@#$…)");

  const score = 5 - errors.length;
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#16a34a"];
  return { score, label: labels[score] ?? "Very Weak", color: colors[score] ?? "#ef4444", errors };
}

// ─── Client-side rate limiter (localStorage) ─────────────────────────────────
const LS_KEY = "herufi_rl";

interface RLEntry { count: number; resetAt: number; lockedUntil?: number }

function getRLStore(): Record<string, RLEntry> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}"); } catch { return {}; }
}

function setRLStore(store: Record<string, RLEntry>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch {}
}

/**
 * Returns seconds remaining if locked, 0 if allowed.
 * Locks after `maxAttempts` in `windowSec` seconds; then lock for `lockSec`.
 */
export function clientRateLimit(
  action: string,
  maxAttempts = 5,
  windowSec = 60,
  lockSec = 900,
): number {
  if (typeof window === "undefined") return 0;
  const now = Date.now();
  const store = getRLStore();
  const entry: RLEntry = store[action] ?? { count: 0, resetAt: now + windowSec * 1000 };

  if (entry.lockedUntil && now < entry.lockedUntil) {
    return Math.ceil((entry.lockedUntil - now) / 1000);
  }

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowSec * 1000;
    delete entry.lockedUntil;
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    entry.lockedUntil = now + lockSec * 1000;
    entry.count = 0;
    store[action] = entry;
    setRLStore(store);
    return lockSec;
  }

  store[action] = entry;
  setRLStore(store);
  return 0;
}

/** Call after a successful action to clear the rate-limit counter. */
export function clearRateLimit(action: string) {
  if (typeof window === "undefined") return;
  const store = getRLStore();
  delete store[action];
  setRLStore(store);
}

// ─── Server-side rate limiter (in-memory, per API route) ─────────────────────
const serverMap = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries every 5 min to avoid leaking memory
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of serverMap) { if (now > v.resetAt) serverMap.delete(k); }
  }, 5 * 60_000);
}

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key      – usually IP address + action
 * @param max      – max requests per window
 * @param windowMs – window in milliseconds
 */
export function serverRateLimit(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = serverMap.get(key);

  if (!entry || now > entry.resetAt) {
    serverMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

/** Extract IP from a Next.js Request (handles proxies). */
export function getIP(req: Request): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
