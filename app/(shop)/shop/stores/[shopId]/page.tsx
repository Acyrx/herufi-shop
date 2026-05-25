"use client";

import { Badge } from "@/components/ui/badge";
import { useLang } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface Shop {
  id: string;
  name: string;
  logo_url?: string;
  location: string;
  contact_phone?: string;
  contact_email?: string;
  business_category?: string;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
  quantity: number;
  image_url?: string;
  unit: string;
  category?: { name: string };
  low_stock_threshold: number;
}

export default function ShopStorePage() {
  const params = useParams<{ shopId: string }>();
  const supabase = createClient();
  const { lang } = useLang();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (params.shopId) load(params.shopId);
  }, [params.shopId]);

  async function load(shopId: string) {
    setLoading(true);

    const [{ data: shopData }, { data: productData }] = await Promise.all([
      supabase
        .from("shops")
        .select("id, name, logo_url, location, contact_phone, contact_email, business_category")
        .eq("id", shopId)
        .eq("is_active", true)
        .single(),
      supabase
        .from("products")
        .select("id, name, selling_price, quantity, image_url, unit, low_stock_threshold, category:categories(name)")
        .eq("shop_id", shopId)
        .eq("is_active", true)
        .order("name"),
    ]);

    setShop(shopData as unknown as Shop | null);
    setProducts((productData ?? []) as unknown as Product[]);
    setLoading(false);
  }

  const categories = [...new Set(
    products.map((p) => p.category?.name).filter(Boolean) as string[]
  )];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "all" || p.category?.name === selectedCategory;
    return matchSearch && matchCategory;
  });

  const inStockCount = products.filter((p) => p.quantity > 0).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-muted rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-56 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="py-24 text-center">
        <Store size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground mb-4">
          {lang === "sw" ? "Duka halipatikani" : "Shop not found"}
        </p>
        <Link href="/shop" className="text-primary hover:underline text-sm">
          ← {lang === "sw" ? "Rudi Dukani" : "Back to Shop"}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        {lang === "sw" ? "Rudi Dukani" : "Back to Shop"}
      </Link>

      {/* Shop header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Logo / Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <Store size={36} className="text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{shop.name}</h1>
                {shop.business_category && (
                  <Badge variant="info" className="mt-1">{shop.business_category}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 text-sm">
                <Package size={14} className="text-primary" />
                <span className="font-semibold">{inStockCount}</span>
                <span className="text-muted-foreground">
                  {lang === "sw" ? "bidhaa zinazopatikana" : "products in stock"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin size={13} className="text-primary shrink-0" />
                {shop.location}
              </span>
              {shop.contact_phone && (
                <a
                  href={`tel:${shop.contact_phone}`}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Phone size={13} />
                  {shop.contact_phone}
                </a>
              )}
              {shop.contact_email && (
                <a
                  href={`mailto:${shop.contact_email}`}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Mail size={13} />
                  {shop.contact_email}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-foreground">
            {lang === "sw" ? "Bidhaa Zinazopatikana" : "Available Products"}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filtered.length})
            </span>
          </h2>
        </div>

        {/* Search + Category filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder={lang === "sw" ? "Tafuta bidhaa..." : "Search products..."}
              icon={<Search size={14} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`shrink-0 px-3 py-2 text-xs rounded-lg border transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary text-white border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {lang === "sw" ? "Zote" : "All"}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-3 py-2 text-xs rounded-lg border transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Package size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">
              {lang === "sw" ? "Hakuna bidhaa zilizopatikana" : "No products found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/shop/${p.id}`}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-200"
              >
                <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Package size={28} className="text-muted-foreground/30" />
                  )}
                  {p.quantity === 0 && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="text-xs font-semibold text-muted-foreground bg-background/80 px-2 py-1 rounded-full">
                        {lang === "sw" ? "Haipatikani" : "Out of stock"}
                      </span>
                    </div>
                  )}
                  {p.quantity > 0 && p.quantity <= 5 && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {p.quantity} left
                    </span>
                  )}
                </div>
                <div className="p-3">
                  {p.category && (
                    <p className="text-[10px] text-muted-foreground mb-0.5">{p.category.name}</p>
                  )}
                  <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {p.name}
                  </p>
                  <p className="text-base font-bold text-primary mt-1.5">
                    {formatCurrency(p.selling_price)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">/ {p.unit}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
