import { insightsCache } from "@/lib/cache";
import { getClientIp, rateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const CHAT_LIMIT = 20;    // requests per window
const CHAT_WINDOW = 60_000; // 1 minute

export async function POST(request: Request) {
  // Rate limit: 20 chat messages per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`chat:${ip}`, CHAT_LIMIT, CHAT_WINDOW);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, mode } = body as {
    messages: { role: "user" | "model"; parts: [{ text: string }] }[];
    mode: "owner" | "customer";
  };

  // Input validation
  if (!["owner", "customer"].includes(mode)) {
    return Response.json({ error: "Invalid mode" }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }
  const lastText = messages[messages.length - 1]?.parts?.[0]?.text ?? "";
  if (typeof lastText !== "string" || lastText.trim().length === 0 || lastText.length > 2000) {
    return Response.json({ error: "Message must be 1–2000 characters" }, { status: 400 });
  }

  const supabase = await createClient();
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

  let systemContext = "";

  if (mode === "owner") {
    // Fetch real business context for owner
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [
      { data: orders },
      { data: lowStock },
      { data: expiring },
      { data: topItems },
      { data: recentOrders },
    ] = await Promise.all([
      supabase.from("orders").select("total, status, created_at").gte("created_at", weekAgo).eq("payment_status", "paid"),
      supabase.from("products").select("name, quantity, low_stock_threshold, unit, selling_price").filter("quantity", "lte", "low_stock_threshold").eq("is_active", true).limit(15),
      supabase.from("products").select("name, expiry_date, quantity, unit").not("expiry_date", "is", null).lte("expiry_date", new Date(Date.now() + 14 * 86400000).toISOString()).eq("is_active", true),
      supabase.from("order_items").select("quantity, unit_price, products(name, cost_price)").gte("created_at", weekAgo).limit(300),
      supabase.from("orders").select("order_number, total, status, payment_method, created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    const weekRevenue = (orders ?? []).reduce((s, o) => s + o.total, 0);

    const productSales: Record<string, { qty: number; revenue: number; profit: number }> = {};
    (topItems ?? []).forEach((item: any) => {
      const name = item.products?.name ?? "Unknown";
      const cost = item.products?.cost_price ?? 0;
      if (!productSales[name]) productSales[name] = { qty: 0, revenue: 0, profit: 0 };
      productSales[name].qty += item.quantity;
      productSales[name].revenue += item.quantity * item.unit_price;
      productSales[name].profit += item.quantity * (item.unit_price - cost);
    });

    const topProductsStr = Object.entries(productSales)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 8)
      .map(([name, d]) => `${name}: ${d.qty} sold, TZS ${d.revenue.toLocaleString()} revenue`)
      .join("\n");

    systemContext = `You are Herufi AI, a smart business assistant for a Tanzanian retail/wholesale shop owner.

LIVE BUSINESS DATA (last 7 days):
Revenue: TZS ${weekRevenue.toLocaleString()}
Orders completed: ${orders?.length ?? 0}

LOW STOCK PRODUCTS (need restocking):
${lowStock?.map((p) => `- ${p.name}: ${p.quantity} ${p.unit} left (threshold: ${p.low_stock_threshold})`).join("\n") || "None"}

EXPIRING WITHIN 14 DAYS:
${expiring?.map((p) => `- ${p.name}: expires ${p.expiry_date}, ${p.quantity} ${p.unit} in stock`).join("\n") || "None"}

TOP SELLING PRODUCTS:
${topProductsStr || "No sales data yet"}

RECENT ORDERS:
${recentOrders?.map((o) => `- ${o.order_number}: TZS ${o.total.toLocaleString()} (${o.status})`).join("\n") || "None"}

You help the owner understand their business. Be concise, specific, and use the data above.
Answer in the same language the user writes in (Swahili or English).
Format numbers with commas. Use TZS for currency. Keep responses under 200 words.`;

  } else {
    // Customer mode — fetch available products
    const { data: products } = await supabase
      .from("products")
      .select("name, selling_price, quantity, unit, description, category:categories(name)")
      .eq("is_active", true)
      .gt("quantity", 0)
      .limit(100);

    const productList = (products ?? [])
      .map((p: any) => `- ${p.name}: TZS ${p.selling_price.toLocaleString()}/${p.unit}${p.category?.name ? ` [${p.category.name}]` : ""}${p.description ? ` — ${p.description}` : ""}`)
      .join("\n");

    systemContext = `You are Herufi AI, a friendly shopping assistant for a Tanzanian marketplace.

AVAILABLE PRODUCTS:
${productList || "No products available yet"}

Help customers find products, compare prices, and make good purchasing decisions.
- Suggest relevant products based on their needs
- Mention prices in TZS
- If they ask for something not in stock, suggest alternatives
- Be friendly and helpful
- Answer in the same language they write in (Swahili or English)
- Keep responses concise and practical`;
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: { role: "user", parts: [{ text: systemContext }] },
  });

  // Build history (exclude the last user message which we'll send separately)
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: m.parts,
  }));

  const lastMessage = messages[messages.length - 1].parts[0].text;

  const chat = model.startChat({ history });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(lastMessage);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (e: any) {
        controller.enqueue(encoder.encode(`\n\n[Error: ${e.message}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-RateLimit-Limit": String(CHAT_LIMIT),
      "X-RateLimit-Remaining": String(rl.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
    },
  });
}
