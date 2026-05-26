"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/context/cart";
import { useLang } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Package, Plus, Search, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description?: string;
  selling_price: number;
  quantity: number;
  image_url?: string;
  unit: string;
  category?: { name: string };
  shop?: { id: string; name: string; location: string };
}

export default function ShopPage() {
  const { addItem } = useCart();
  const supabase = createClient();
  const { t } = useLang();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc">("name");

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, description, selling_price, quantity, image_url, unit, category:categories(name), shop:shops(id, name, location)")
      .eq("is_active", true)
      .gt("quantity", 0)
      .order("name");

    const products = (data ?? []) as unknown as Product[];
    setProducts(products);

    // Extract unique categories
    const cats = [...new Set(products.map((p) => p.category?.name).filter(Boolean) as string[])];
    setCategories(cats);
    setLoading(false);
  }

  const filtered = products
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.shop?.name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === "all" || p.category?.name === selectedCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.selling_price - b.selling_price;
      if (sortBy === "price_desc") return b.selling_price - a.selling_price;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/90 to-green-600 p-6 md:p-10 text-white">
        <div className="flex items-center gap-2 mb-3 opacity-80">
          <Store size={16} />
          <span className="text-sm font-medium">Herufi Marketplace</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold mb-2">{t.catalog.title}</h1>
        <p className="opacity-80 text-sm md:text-base">{t.catalog.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder={t.catalog.searchProducts}
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 px-3 py-2 text-xs rounded-lg border transition-colors ${selectedCategory === "all" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            {t.catalog.allCategories}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-2 text-xs rounded-lg border transition-colors ${selectedCategory === cat ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
        >
          <option value="name">A – Z</option>
          <option value="price_asc">{t.catalog.price} ↑</option>
          <option value="price_desc">{t.catalog.price} ↓</option>
        </select>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "product" : "products"} found
        </p>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="h-56 bg-card rounded-xl border border-border animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <Package size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">{t.catalog.noProducts}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-200 flex flex-col"
            >
              {/* Image — click goes to product detail */}
              <Link href={`/shop/${p.id}`} className="block">
                <div className="relative w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Package size={32} className="text-muted-foreground/40" />
                  )}
                  {p.quantity <= 5 && p.quantity > 0 && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {p.quantity} left
                    </span>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="p-3 flex flex-col flex-1">
                {p.category && (
                  <p className="text-[10px] text-muted-foreground mb-1 truncate">{p.category.name}</p>
                )}
                <Link href={`/shop/${p.id}`} className="flex-1">
                  <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2 hover:text-primary transition-colors">
                    {p.name}
                  </p>
                </Link>
                <p className="text-base font-bold text-primary mt-1.5">{formatCurrency(p.selling_price)}</p>
                <p className="text-[10px] text-muted-foreground">/ {p.unit}</p>
                {p.shop && (
                  <p className="text-[10px] text-muted-foreground mt-1 truncate flex items-center gap-1">
                    <Store size={9} /> {p.shop.name}
                  </p>
                )}

                {/* Add to cart */}
                <button
                  onClick={() => {
                    if (!p.shop?.id) { toast.error("Shop info missing"); return; }
                    addItem({
                      productId: p.id,
                      shopId: p.shop.id,
                      shopName: p.shop.name,
                      productName: p.name,
                      price: p.selling_price,
                      imageUrl: p.image_url,
                      unit: p.unit,
                      maxQty: p.quantity,
                    });
                    toast.success(`${p.name} added to cart`);
                  }}
                  disabled={p.quantity === 0}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 h-8 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={13} />
                  {p.quantity === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
