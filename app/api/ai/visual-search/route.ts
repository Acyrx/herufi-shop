import { visualSearchCache } from "@/lib/cache";
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
  withRateLimitHeaders,
} from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHash } from "crypto";

const VS_LIMIT = 15;
const VS_WINDOW = 60_000;
const VS_TTL = 30 * 60_000; // cache per image hash for 30 minutes

export async function POST(request: Request) {
  // Rate limit: 15 visual searches per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`vsearch:${ip}`, VS_LIMIT, VS_WINDOW);
  if (!rl.success) return rateLimitResponse(rl);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("image") as File;
  if (!file)
    return Response.json({ error: "No image provided" }, { status: 400 });

  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "File must be an image" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: "Image must be under 5MB" }, { status: 400 });
  }

  // Convert file to base64
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.type;

  // Cache by content hash so identical images skip Gemini
  const hash = createHash("sha256")
    .update(Buffer.from(bytes))
    .digest("hex")
    .slice(0, 16);
  const cacheKey = `vsearch:${hash}`;
  const cached = visualSearchCache.get(cacheKey);
  if (cached) {
    return withRateLimitHeaders(
      Response.json(cached, { headers: { "X-Cache": "HIT" } }),
      rl,
      VS_LIMIT
    );
  }

  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const visionPrompt = `Analyze this image and identify the product(s) shown.
Return a JSON object with:
- "product_name": the name/type of product (e.g. "rice", "cooking oil", "sugar")
- "keywords": array of 5-8 search keywords to find this product (brand names, sizes, types)
- "category": product category (e.g. "Food & Beverages", "Electronics", "Clothing")
- "description": brief description of what you see

Return ONLY valid JSON, no markdown.`;

  let keywords: string[] = [];
  let productName = "";
  let description = "";

  try {
    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64 } },
      visionPrompt,
    ]);
    const text = result.response
      .text()
      .replace(/```json\n?|\n?```/g, "")
      .trim();
    const parsed = JSON.parse(text);
    productName = parsed.product_name ?? "";
    keywords = parsed.keywords ?? [];
    description = parsed.description ?? "";
  } catch {
    return withRateLimitHeaders(
      Response.json(
        { error: "Could not analyze image", products: [] },
        { status: 200 }
      ),
      rl,
      VS_LIMIT
    );
  }

  // Search products in DB using keywords
  const supabase = await createClient();
  const searchTerms = [productName, ...keywords].filter(Boolean);

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, selling_price, quantity, image_url, unit, description, category:categories(name)"
    )
    .eq("is_active", true)
    .gt("quantity", 0)
    .or(searchTerms.map((term) => `name.ilike.%${term}%`).join(","))
    .limit(12);

  const payload = {
    query: productName,
    description,
    keywords,
    products: products ?? [],
  };
  visualSearchCache.set(cacheKey, payload, VS_TTL);

  return withRateLimitHeaders(
    Response.json(payload, { headers: { "X-Cache": "MISS" } }),
    rl,
    VS_LIMIT
  );
}
