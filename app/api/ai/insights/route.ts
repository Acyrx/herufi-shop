import { insightsCache } from "@/lib/cache";
import { getClientIp, rateLimit, rateLimitResponse, withRateLimitHeaders } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const INSIGHTS_LIMIT = 10;
const INSIGHTS_WINDOW = 60_000;
const INSIGHTS_TTL = 5 * 60_000; // cache insights 5 minutes per user

export async function GET(request: Request) {
  // Rate limit: 10 per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`insights:${ip}`, INSIGHTS_LIMIT, INSIGHTS_WINDOW);
  if (!rl.success) return rateLimitResponse(rl);

  const supabase = await createClient();

  // Return cached response for this user if fresh
  const { data: { user } } = await supabase.auth.getUser();
  const cacheKey = `insights:${user?.id ?? ip}`;
  const cached = insightsCache.get(cacheKey);
  if (cached) {
    return withRateLimitHeaders(
      Response.json(cached, { headers: { "X-Cache": "HIT", "Cache-Control": "private, max-age=300" } }),
      rl,
      INSIGHTS_LIMIT
    );
  }

  // Gather real business context
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

  const [
    { data: thisWeekOrders },
    { data: lastWeekOrders },
    { data: lowStock },
    { data: expiring },
    { data: topItems },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", weekAgo)
      .eq("payment_status", "paid"),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", twoWeeksAgo)
      .lt("created_at", weekAgo)
      .eq("payment_status", "paid"),
    supabase
      .from("products")
      .select("name, quantity, low_stock_threshold, unit")
      .filter("quantity", "lte", "low_stock_threshold")
      .eq("is_active", true)
      .limit(10),
    supabase
      .from("products")
      .select("name, expiry_date, quantity")
      .not("expiry_date", "is", null)
      .lte("expiry_date", new Date(now.getTime() + 10 * 86400000).toISOString())
      .eq("is_active", true)
      .limit(10),
    supabase
      .from("order_items")
      .select("quantity, products(name)")
      .gte("created_at", weekAgo)
      .limit(200),
  ]);

  const thisRevenue = (thisWeekOrders ?? []).reduce((s, o) => s + o.total, 0);
  const lastRevenue = (lastWeekOrders ?? []).reduce((s, o) => s + o.total, 0);
  const revenueChange =
    lastRevenue > 0
      ? (((thisRevenue - lastRevenue) / lastRevenue) * 100).toFixed(1)
      : null;

  // Aggregate top products
  const productSales: Record<string, number> = {};
  (topItems ?? []).forEach((item: any) => {
    const name = item.products?.name ?? "Unknown";
    productSales[name] = (productSales[name] ?? 0) + item.quantity;
  });
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => `${name} (${qty} sold)`);

  const context = `
You are an AI business analyst for a Tanzanian retail/wholesale business using the Herufi platform.

CURRENT BUSINESS DATA (last 7 days):
- Revenue this week: TZS ${thisRevenue.toLocaleString()}${
    revenueChange
      ? ` (${
          Number(revenueChange) >= 0 ? "+" : ""
        }${revenueChange}% vs last week)`
      : ""
  }
- Orders this week: ${thisWeekOrders?.length ?? 0}
- Low stock products: ${
    lowStock
      ?.map(
        (p) =>
          `${p.name} (${p.quantity} ${p.unit} left, threshold: ${p.low_stock_threshold})`
      )
      .join(", ") || "None"
  }
- Products expiring in 10 days: ${
    expiring?.map((p) => `${p.name} on ${p.expiry_date}`).join(", ") || "None"
  }
- Top selling products: ${topProducts.join(", ") || "No data yet"}

Generate exactly 3 concise, actionable business insights in JSON format. Each insight must be specific to the data above.

Return ONLY valid JSON array, no markdown:
[
  {"type": "trend", "title": "...", "message": "..."},
  {"type": "alert", "title": "...", "message": "..."},
  {"type": "suggestion", "title": "...", "message": "..."}
]

Types: "trend" (sales pattern), "alert" (urgent issue), "suggestion" (opportunity).
Keep each message under 100 characters. Be specific with numbers. Write in English.
`;

  try {
    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY!
    );
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(context);
    const text = result.response.text().trim();

    // Parse JSON, strip any markdown wrapping
    const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
    const insights = JSON.parse(jsonStr);
    const payload = { insights, meta: { thisRevenue, thisWeekOrders: thisWeekOrders?.length ?? 0 } };

    insightsCache.set(cacheKey, payload, INSIGHTS_TTL);
    return withRateLimitHeaders(
      Response.json(payload, { headers: { "X-Cache": "MISS", "Cache-Control": "private, max-age=300" } }),
      rl,
      INSIGHTS_LIMIT
    );
  } catch {
    // Fallback insights from real data
    const fallback = [];
    if (revenueChange) {
      fallback.push({
        type: "trend",
        title: "Revenue Trend",
        message: `Revenue ${Number(revenueChange) >= 0 ? "up" : "down"} ${Math.abs(Number(revenueChange))}% vs last week.`,
      });
    }
    if (lowStock && lowStock.length > 0) {
      fallback.push({
        type: "alert",
        title: "Low Stock",
        message: `${lowStock[0].name} has only ${lowStock[0].quantity} ${lowStock[0].unit} left. Restock soon.`,
      });
    }
    if (expiring && expiring.length > 0) {
      fallback.push({
        type: "alert",
        title: "Expiry Warning",
        message: `${expiring[0].name} expires on ${expiring[0].expiry_date}. Consider discounting.`,
      });
    }
    if (fallback.length === 0) {
      fallback.push({
        type: "suggestion",
        title: "Getting Started",
        message: "Start recording sales to see AI-powered insights about your business.",
      });
    }
    const payload = { insights: fallback, meta: { thisRevenue, thisWeekOrders: thisWeekOrders?.length ?? 0 } };
    insightsCache.set(cacheKey, payload, INSIGHTS_TTL);
    return withRateLimitHeaders(
      Response.json(payload, { headers: { "Cache-Control": "private, max-age=300" } }),
      rl,
      INSIGHTS_LIMIT
    );
  }
}
