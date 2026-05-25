interface Window {
  count: number;
  resetAt: number;
}

// In-memory store — resets on cold start; good enough for serverless edge protection
const store = new Map<string, Window>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

/**
 * Sliding-window rate limiter.
 * @param key      Unique key (e.g. `ip:route`)
 * @param limit    Max requests allowed per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count += 1;
  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
    retryAfterMs: 0,
  };
}

/** Extract client IP from request headers (works behind Vercel / Nginx proxies). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Build a 429 response with standard rate-limit headers. */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
        "X-RateLimit-Limit": "0",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}

/** Attach rate-limit info headers to an existing response. */
export function withRateLimitHeaders(response: Response, result: RateLimitResult, limit: number): Response {
  const clone = new Response(response.body, response);
  clone.headers.set("X-RateLimit-Limit", String(limit));
  clone.headers.set("X-RateLimit-Remaining", String(result.remaining));
  clone.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  return clone;
}
