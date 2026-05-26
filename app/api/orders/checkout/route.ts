import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sanitize, LIMITS } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const CHECKOUT_LIMIT = 10;
const CHECKOUT_WINDOW = 60_000;
const ALLOWED_PAYMENT_METHODS = ["cash", "mobile_money", "card", "bank_transfer", "credit"];
const ALLOWED_PURPOSES = ["personal", "inventory"] as const;

interface CheckoutItem {
  productId: string;
  shopId: string;
  shopName: string;
  productName: string;
  price: number;
  quantity: number;
}

export async function POST(request: Request) {
  // Rate limit: 10 checkout attempts per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`checkout:${ip}`, CHECKOUT_LIMIT, CHECKOUT_WINDOW);
  if (!rl.success) return rateLimitResponse(rl);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to place an order" }, { status: 401 });

  // Auth-scoped rate limit: 10 per minute per user (prevents multi-IP abuse)
  const rlUser = rateLimit(`checkout:user:${user.id}`, CHECKOUT_LIMIT, CHECKOUT_WINDOW);
  if (!rlUser.success) return rateLimitResponse(rlUser);

  let body: {
    items: CheckoutItem[];
    paymentMethod: string;
    purchasePurpose?: "personal" | "inventory";
    inventoryShopId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let { items, paymentMethod = "cash", purchasePurpose = "personal", inventoryShopId } = body;

  // Validate and sanitize scalar fields
  if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) paymentMethod = "cash";
  if (!ALLOWED_PURPOSES.includes(purchasePurpose as "personal" | "inventory")) purchasePurpose = "personal";
  if (inventoryShopId && typeof inventoryShopId !== "string") inventoryShopId = undefined;

  if (!items?.length) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  if (items.length > 100) return NextResponse.json({ error: "Too many items in cart" }, { status: 400 });

  // Sanitize and validate each cart item
  items = items.map(item => ({
    productId:   String(item.productId   ?? "").slice(0, 64),
    shopId:      String(item.shopId      ?? "").slice(0, 64),
    shopName:    sanitize(String(item.shopName    ?? ""), LIMITS.shortText),
    productName: sanitize(String(item.productName ?? ""), LIMITS.shortText),
    price:    Math.max(0, Number(item.price)    || 0),
    quantity: Math.max(1, Math.min(9999, Math.floor(Number(item.quantity) || 1))),
  }));

  // Fetch user profile for customer name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email")
    .eq("id", user.id)
    .single();

  // Group items by shop
  const byShop = items.reduce((acc, item) => {
    if (!acc[item.shopId]) acc[item.shopId] = [];
    acc[item.shopId].push(item);
    return acc;
  }, {} as Record<string, CheckoutItem[]>);

  const orderNumbers: string[] = [];
  const errors: string[] = [];

  for (const [shopId, shopItems] of Object.entries(byShop)) {
    try {
      // 1. Find or create customer record for this shop
      let customerId: string | null = null;

      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .eq("shop_id", shopId)
        .maybeSingle();

      if (existing) {
        customerId = existing.id;
      } else {
        const { data: created, error: custErr } = await supabase
          .from("customers")
          .insert({
            shop_id: shopId,
            user_id: user.id,
            name: profile?.full_name ?? user.email ?? "Customer",
            phone: profile?.phone ?? null,
            email: profile?.email ?? user.email ?? null,
            segment: "new",
          })
          .select("id")
          .single();

        if (custErr || !created) {
          errors.push(`Could not create customer record for shop`);
          continue;
        }
        customerId = created.id;
      }

      // 2. Fetch shop tax rate
      const { data: shop } = await supabase
        .from("shops")
        .select("tax_rate")
        .eq("id", shopId)
        .single();

      const subtotal = shopItems.reduce((s, i) => s + i.price * i.quantity, 0);
      const taxRate = shop?.tax_rate ?? 0;
      const tax = Math.round(subtotal * (taxRate / 100));
      const total = subtotal + tax;

      // 3. Generate order number
      const orderNumber = `ONL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

      // 4. Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          shop_id: shopId,
          customer_id: customerId,
          order_number: orderNumber,
          status: "pending",
          payment_method: paymentMethod,
          payment_status: "unpaid",
          subtotal,
          tax,
          total,
          notes: `Online order via Herufi Shop`,
        })
        .select("id")
        .single();

      if (orderErr || !order) {
        errors.push(`Order creation failed: ${orderErr?.message}`);
        continue;
      }

      // 5. Create order items
      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(
          shopItems.map(item => ({
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.price,
            discount: 0,
            total: item.price * item.quantity,
          }))
        );

      if (itemsErr) {
        errors.push(`Order items failed: ${itemsErr.message}`);
        continue;
      }

      // 6. Decrement product inventory (fetch each qty then update atomically)
      for (const item of shopItems) {
        const { data: prod } = await supabase
          .from("products")
          .select("quantity")
          .eq("id", item.productId)
          .single();

        if (prod !== null && prod !== undefined) {
          await supabase
            .from("products")
            .update({ quantity: Math.max(0, prod.quantity - item.quantity) })
            .eq("id", item.productId);
        }
      }

      // 7. Award loyalty points (1 pt per 1000 TZS)
      const pointsEarned = Math.floor(total / 1000);
      if (pointsEarned > 0) {
        const { data: cust } = await supabase
          .from("customers")
          .select("loyalty_points")
          .eq("id", customerId)
          .single();
        if (cust) {
          await supabase
            .from("customers")
            .update({ loyalty_points: (cust.loyalty_points ?? 0) + pointsEarned })
            .eq("id", customerId);
        }
      }

      // 8. If owner bought for shop inventory: record expense + add stock to their shop
      if (purchasePurpose === "inventory" && inventoryShopId) {
        // Record as expense transaction
        const itemNames = shopItems.map(i => `${i.productName} ×${i.quantity}`).join(", ");
        await supabase.from("transactions").insert({
          shop_id: inventoryShopId,
          type: "expense",
          category: "Inventory Purchase",
          amount: total,
          description: `Purchased from ${shopItems[0].shopName}: ${itemNames}`,
          payment_method: paymentMethod,
          date: new Date().toISOString().slice(0, 10),
        });

        // Try to match products in the owner's target shop by name and add qty
        for (const item of shopItems) {
          const { data: targetProd } = await supabase
            .from("products")
            .select("id, quantity")
            .eq("shop_id", inventoryShopId)
            .ilike("name", item.productName)
            .maybeSingle();

          if (targetProd) {
            await supabase
              .from("products")
              .update({ quantity: targetProd.quantity + item.quantity })
              .eq("id", targetProd.id);
          }
        }
      }

      // Notifications are sent automatically via DB trigger (notify_new_order)
      orderNumbers.push(orderNumber);
    } catch (e: any) {
      errors.push(e.message);
    }
  }

  if (orderNumbers.length === 0) {
    return NextResponse.json({ error: errors[0] ?? "Checkout failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, orders: orderNumbers, errors });
}
