import {
  getClientIp,
  rateLimitResponse,
  rateLimit,
} from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const CHAT_LIMIT = 20;
const CHAT_WINDOW = 60_000;

export async function POST(request: Request) {
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
    sessionId?: string | null;
  };

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
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  // Get authenticated user + profile
  const { data: { user } } = await supabase.auth.getUser();
  let userGreeting = "";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    if (profile?.full_name) userGreeting = `\nYou are talking with: ${profile.full_name}`;
  }

  let systemContext = "";

  // ── OWNER MODE ──────────────────────────────────────────────────────────────
  if (mode === "owner") {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [
      { data: orders },
      { data: lowStock },
      { data: expiring },
      { data: topItems },
      { data: recentOrders },
      { data: employees },
    ] = await Promise.all([
      supabase.from("orders").select("total, status, created_at").gte("created_at", weekAgo).eq("payment_status", "paid"),
      supabase.from("products").select("name, quantity, low_stock_threshold, unit, selling_price").filter("quantity", "lte", "low_stock_threshold").eq("is_active", true).limit(15),
      supabase.from("products").select("name, expiry_date, quantity, unit").not("expiry_date", "is", null).lte("expiry_date", new Date(Date.now() + 14 * 86400000).toISOString()).eq("is_active", true),
      supabase.from("order_items").select("quantity, unit_price, products(name, cost_price)").gte("created_at", weekAgo).limit(300),
      supabase.from("orders").select("order_number, total, status, payment_method, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("employees").select("id, role, is_active").eq("is_active", true).limit(50),
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
      .map(([name, d]) => `${name}: ${d.qty} sold, TZS ${d.revenue.toLocaleString()} revenue, profit TZS ${d.profit.toLocaleString()}`)
      .join("\n");

    // Behavioral memory: owner's recent chat questions
    let ownerInterests = "";
    if (user) {
      const { data: ownerSessions } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("mode", "owner")
        .order("updated_at", { ascending: false })
        .limit(5);

      if (ownerSessions && ownerSessions.length > 0) {
        const sessionIds = ownerSessions.map(s => s.id);
        const { data: prevMsgs } = await supabase
          .from("chat_messages")
          .select("content")
          .in("session_id", sessionIds)
          .eq("role", "user")
          .order("created_at", { ascending: false })
          .limit(10);

        if (prevMsgs && prevMsgs.length > 0) {
          ownerInterests = `\nRECENT QUESTIONS FROM THIS OWNER:\n${prevMsgs.map(m => `- ${m.content}`).join("\n")}`;
        }
      }
    }

    systemContext = `You are Herufi AI, a smart business intelligence assistant for a Tanzanian retail/wholesale shop owner.${userGreeting}

LIVE BUSINESS DATA (last 7 days):
- Revenue: TZS ${weekRevenue.toLocaleString()}
- Orders completed: ${orders?.length ?? 0}
- Active employees: ${employees?.length ?? 0}

LOW STOCK PRODUCTS (need restocking urgently):
${lowStock?.map(p => `- ${p.name}: ${p.quantity} ${p.unit} left (threshold: ${p.low_stock_threshold})`).join("\n") || "None — good job!"}

EXPIRING WITHIN 14 DAYS:
${expiring?.map(p => `- ${p.name}: expires ${p.expiry_date}, ${p.quantity} ${p.unit} in stock`).join("\n") || "None"}

TOP SELLING PRODUCTS THIS WEEK:
${topProductsStr || "No sales data yet"}

RECENT ORDERS:
${recentOrders?.map(o => `- ${o.order_number}: TZS ${o.total.toLocaleString()} (${o.status}, ${o.payment_method})`).join("\n") || "None"}
${ownerInterests}

INSTRUCTIONS:
- Be concise, specific, and data-driven
- Answer in the same language the user writes in (Swahili or English)
- Format numbers with commas, use TZS for currency
- Use bullet points for lists
- Keep responses under 300 words unless asked for a detailed report
- Proactively point out risks (low stock, expiring goods, declining revenue)
- Give actionable recommendations, not just observations`;

  // ── CUSTOMER MODE ────────────────────────────────────────────────────────────
  } else {
    let customerInfo = "";
    let purchaseHistory = "";
    let behavioralInterests = "";

    if (user) {
      // Customer record
      const { data: customerRecord } = await supabase
        .from("customers")
        .select("id, name, loyalty_points, segment, outstanding_credit")
        .eq("user_id", user.id)
        .maybeSingle();

      if (customerRecord) {
        customerInfo = `
CUSTOMER PROFILE:
- Name: ${customerRecord.name}
- Loyalty Points: ${customerRecord.loyalty_points ?? 0} pts
- Status: ${customerRecord.segment ?? "new"}
- Outstanding Credit: TZS ${(customerRecord.outstanding_credit ?? 0).toLocaleString()}`;

        // Recent purchase history
        const { data: recentOrders } = await supabase
          .from("orders")
          .select("id, total, created_at")
          .eq("customer_id", customerRecord.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (recentOrders && recentOrders.length > 0) {
          const orderIds = recentOrders.map(o => o.id);
          const { data: items } = await supabase
            .from("order_items")
            .select("quantity, products(name, category:categories(name))")
            .in("order_id", orderIds);

          if (items && items.length > 0) {
            const catCounts: Record<string, number> = {};
            const productNames: string[] = [];
            (items as any[]).forEach(item => {
              const cat = item.products?.category?.name;
              if (cat) catCounts[cat] = (catCounts[cat] ?? 0) + item.quantity;
              if (item.products?.name) productNames.push(item.products.name);
            });
            const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
            purchaseHistory = `
PURCHASE HISTORY:
- Frequently buys: ${topCats.join(", ") || "N/A"}
- Recent products: ${[...new Set(productNames)].slice(0, 8).join(", ") || "N/A"}`;
          }
        }
      }

      // Behavioral algorithm: analyze recent chat messages to infer interests
      const { data: userSessions } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("mode", "customer")
        .order("updated_at", { ascending: false })
        .limit(8);

      if (userSessions && userSessions.length > 0) {
        const sessionIds = userSessions.map(s => s.id);
        const { data: recentMsgs } = await supabase
          .from("chat_messages")
          .select("content")
          .in("session_id", sessionIds)
          .eq("role", "user")
          .order("created_at", { ascending: false })
          .limit(15);

        if (recentMsgs && recentMsgs.length > 0) {
          behavioralInterests = `
BEHAVIORAL INTERESTS (inferred from past conversations — use to proactively recommend):
${recentMsgs.map(m => `- "${m.content}"`).join("\n")}`;
        }
      }
    }

    // Available products
    const { data: products } = await supabase
      .from("products")
      .select("name, selling_price, quantity, unit, description, category:categories(name)")
      .eq("is_active", true)
      .gt("quantity", 0)
      .order("name")
      .limit(100);

    const productList = (products ?? [])
      .map((p: any) =>
        `- ${p.name}: TZS ${p.selling_price.toLocaleString()}/${p.unit}` +
        (p.category?.name ? ` [${p.category.name}]` : "") +
        (p.description ? ` — ${p.description}` : "") +
        ` (${p.quantity} in stock)`
      )
      .join("\n");

    systemContext = `You are Herufi AI, a warm and knowledgeable shopping assistant for the Herufi marketplace in Tanzania.${userGreeting}
${customerInfo}
${purchaseHistory}
${behavioralInterests}

AVAILABLE PRODUCTS:
${productList || "No products available at the moment"}

INSTRUCTIONS:
- Greet the customer by name if you know it
- Suggest products based on their purchase history and behavioral interests
- Help them find what they need, compare prices, suggest alternatives
- Mention loyalty points if relevant
- Be warm, friendly and conversational
- Answer in the same language they write in (Swahili or English)
- Use TZS for all prices
- Keep responses clear and practical with formatting when helpful
- If a product they want is out of stock, suggest the closest alternative`;
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: { role: "user", parts: [{ text: systemContext }] },
  });

  const history = messages.slice(0, -1).map(m => ({ role: m.role, parts: m.parts }));
  const lastMessage = messages[messages.length - 1].parts[0].text;
  const chat = model.startChat({ history });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(lastMessage);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
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
