"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLang } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle,
  MapPin,
  Package,
  Share2,
  ShoppingCart,
  Store,
  Tag,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ProductDetail {
  id: string;
  name: string;
  description?: string;
  selling_price: number;
  quantity: number;
  image_url?: string;
  unit: string;
  sku: string;
  shop_id?: string;
  category?: { id: string; name: string };
  shop?: { id: string; name: string; location: string; contact_phone?: string; business_category?: string };
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const { t } = useLang();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [related, setRelated] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) fetchProduct(params.id);
  }, [params.id]);

  async function fetchProduct(id: string) {
    setLoading(true);

    const { data: p } = await supabase
      .from("products")
      .select("id, name, description, selling_price, quantity, image_url, unit, sku, shop_id, category:categories(id, name), shop:shops(id, name, location, contact_phone, business_category)")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    const product = p as unknown as ProductDetail | null;
    setProduct(product);

    // Fetch related: same category, different product
    if (product?.category?.id) {
      const { data: rel } = await supabase
        .from("products")
        .select("id, name, selling_price, quantity, image_url, unit, category:categories(id, name), shop:shops(name, location)")
        .eq("category_id", product.category.id)
        .eq("is_active", true)
        .neq("id", id)
        .gt("quantity", 0)
        .limit(6);
      setRelated((rel ?? []) as unknown as ProductDetail[]);
    } else {
      const { data: rel } = await supabase
        .from("products")
        .select("id, name, selling_price, quantity, image_url, unit, category:categories(id, name), shop:shops(name, location)")
        .eq("is_active", true)
        .neq("id", id)
        .gt("quantity", 0)
        .limit(6);
      setRelated((rel ?? []) as unknown as ProductDetail[]);
    }

    setLoading(false);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: product?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded-lg" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded-lg" />
            <div className="h-4 bg-muted rounded-lg w-2/3" />
            <div className="h-12 bg-muted rounded-lg w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-24 text-center">
        <Package size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground mb-4">Product not found</p>
        <Link href="/shop">
          <Button variant="outline" size="sm">
            <ArrowLeft size={14} /> {t.catalog.backToCatalog}
          </Button>
        </Link>
      </div>
    );
  }

  const inStock = product.quantity > 0;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Breadcrumb */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        {t.catalog.backToCatalog}
      </Link>

      {/* Main product section */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl bg-muted border border-border overflow-hidden flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package size={80} className="text-muted-foreground/20" />
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-5">
          {/* Category + share */}
          <div className="flex items-center justify-between">
            {product.category && (
              <Badge variant="info">{product.category.name}</Badge>
            )}
            <button
              onClick={handleShare}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Share2 size={16} />
            </button>
          </div>

          {/* Name */}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div>
            <p className="text-3xl font-bold text-primary">{formatCurrency(product.selling_price)}</p>
            <p className="text-sm text-muted-foreground mt-0.5">per {product.unit}</p>
          </div>

          {/* Availability */}
          <div className={`flex items-center gap-2 text-sm font-medium ${inStock ? "text-green-600" : "text-red-500"}`}>
            {inStock ? (
              <>
                <CheckCircle size={16} />
                <span>{t.catalog.inStock}</span>
                {product.quantity <= 10 && (
                  <span className="text-amber-600 font-normal">— only {product.quantity} {product.unit} left</span>
                )}
              </>
            ) : (
              <>
                <XCircle size={16} />
                <span>{t.catalog.outOfStock}</span>
              </>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">{t.catalog.productDetails}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 py-4 border-t border-border text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">{t.catalog.sku}</p>
              <p className="font-mono font-medium">{product.sku}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">{t.catalog.unit}</p>
              <p className="font-medium capitalize">{product.unit}</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <Link href="/login" className="flex-1">
              <Button className="w-full" size="lg" disabled={!inStock}>
                <ShoppingCart size={18} />
                {inStock ? t.catalog.addToCart : t.catalog.outOfStock}
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            {inStock
              ? "Sign in to add to cart and place your order."
              : "This product is currently unavailable."}
          </p>

          {/* Shop info */}
          {product.shop && (
            <Card className="bg-muted/30 hover:border-primary/40 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Store size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{product.shop.name}</p>
                  {product.shop.business_category && (
                    <p className="text-[10px] text-primary font-medium">{product.shop.business_category}</p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {product.shop.location}
                  </p>
                  {product.shop.contact_phone && (
                    <a
                      href={`tel:${product.shop.contact_phone}`}
                      className="text-xs text-primary hover:underline mt-0.5 block"
                    >
                      {product.shop.contact_phone}
                    </a>
                  )}
                </div>
                {product.shop_id && (
                  <Link
                    href={`/shop/stores/${product.shop_id}`}
                    className="shrink-0 text-xs text-primary hover:underline font-medium flex items-center gap-1 mt-0.5"
                  >
                    View Shop →
                  </Link>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">{t.catalog.relatedProducts}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/shop/${p.id}`}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Package size={24} className="text-muted-foreground/30" />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {p.name}
                  </p>
                  <p className="text-sm font-bold text-primary mt-1">{formatCurrency(p.selling_price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
