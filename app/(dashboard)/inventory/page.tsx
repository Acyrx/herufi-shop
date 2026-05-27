"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProductAnalyticsPanel } from "@/components/dashboard/ProductAnalyticsPanel";
import type { AnalyticsProduct } from "@/components/dashboard/ProductAnalyticsPanel";
import { useShop } from "@/lib/context/shop";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, generateSKU, getStockStatus } from "@/lib/utils";
import {
  AlertTriangle,
  Barcode,
  BarChart2,
  Download,
  Edit,
  ImageIcon,
  Package,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  category?: { name: string };
  quantity: number;
  low_stock_threshold: number;
  cost_price: number;
  selling_price: number;
  expiry_date?: string;
  unit: string;
  is_active: boolean;
  image_url?: string;
}

const UNITS = ["pcs", "kg", "g", "L", "mL", "bags", "boxes", "cartons", "bottles", "packets"];

export default function InventoryPage() {
  const supabase = createClient();
  const { shopId, currentShop } = useShop();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [analyticsProduct, setAnalyticsProduct] = useState<AnalyticsProduct | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", sku: "", description: "", category_id: "",
    cost_price: "", selling_price: "", quantity: "",
    low_stock_threshold: "10", unit: "pcs",
    expiry_date: "", batch_number: "", barcode: "",
  });

  useEffect(() => {
    if (shopId) fetchProducts();
    else setLoading(false);
  }, [shopId]);

  async function fetchProducts() {
    if (!shopId) return;
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .eq("shop_id", shopId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  }

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    if (filter === "low_stock") return matchSearch && p.quantity <= p.low_stock_threshold;
    if (filter === "out_of_stock") return matchSearch && p.quantity === 0;
    if (filter === "expiring") return matchSearch && !!p.expiry_date && new Date(p.expiry_date) < new Date(Date.now() + 7 * 86400000);
    return matchSearch;
  });

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fakeEvent = { target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>;
      handleImageSelect(fakeEvent);
    }
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function uploadImage(productId: string): Promise<string | null> {
    if (!imageFile) return null;
    setUploadingImage(true);
    const ext = imageFile.name.split(".").pop() ?? "jpg";
    const path = `products/${productId}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, imageFile, { upsert: true });
    setUploadingImage(false);
    if (error) { toast.error("Image upload failed: " + error.message); return null; }
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
    return publicUrl;
  }

  async function handleSave() {
    if (!form.name || !form.selling_price || !form.quantity) { toast.error("Please fill in required fields"); return; }
    if (!shopId) { toast.error("No shop selected. Please select a shop first."); return; }
    setSaving(true);

    const basePayload = {
      shop_id: shopId,
      name: form.name,
      sku: form.sku || generateSKU(form.name),
      description: form.description || null,
      cost_price: parseFloat(form.cost_price) || 0,
      selling_price: parseFloat(form.selling_price),
      quantity: parseInt(form.quantity),
      low_stock_threshold: parseInt(form.low_stock_threshold) || 10,
      unit: form.unit,
      expiry_date: form.expiry_date || null,
      batch_number: form.batch_number || null,
      barcode: form.barcode || null,
    };

    if (editProduct) {
      let image_url = editProduct.image_url ?? null;
      if (imageFile) { const up = await uploadImage(editProduct.id); if (up) image_url = up; }
      const { error } = await supabase.from("products").update({ ...basePayload, image_url }).eq("id", editProduct.id);
      if (error) { toast.error("Failed to update: " + error.message); }
      else { toast.success("Product updated"); }
    } else {
      const { error } = await supabase.from("products").insert(basePayload);
      if (error) { toast.error("Failed to add product: " + error.message); setSaving(false); return; }
      if (imageFile) {
        const { data: newest } = await supabase.from("products").select("id").eq("shop_id", shopId).eq("sku", basePayload.sku).order("created_at", { ascending: false }).limit(1).single();
        if (newest) { const image_url = await uploadImage(newest.id); if (image_url) await supabase.from("products").update({ image_url }).eq("id", newest.id); }
      }
      toast.success("Product added");
    }

    setSaving(false);
    setShowAdd(false);
    setEditProduct(null);
    resetForm();
    fetchProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").update({ is_active: false }).eq("id", id);
    toast.success("Product removed");
    fetchProducts();
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setForm({
      name: p.name, sku: p.sku, description: "", category_id: "",
      cost_price: String(p.cost_price), selling_price: String(p.selling_price),
      quantity: String(p.quantity), low_stock_threshold: String(p.low_stock_threshold),
      unit: p.unit, expiry_date: p.expiry_date?.slice(0, 10) ?? "",
      batch_number: "", barcode: "",
    });
    if (p.image_url) setImagePreview(p.image_url); else clearImage();
    setShowAdd(true);
  }

  function resetForm() {
    setForm({ name: "", sku: "", description: "", category_id: "", cost_price: "", selling_price: "", quantity: "", low_stock_threshold: "10", unit: "pcs", expiry_date: "", batch_number: "", barcode: "" });
    setEditProduct(null);
    clearImage();
  }

  const stockBadge = (p: Product) => {
    const status = getStockStatus(p.quantity, p.low_stock_threshold);
    if (status === "out_of_stock") return <Badge variant="danger">Out of Stock</Badge>;
    if (status === "low_stock") return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-muted-foreground text-sm">
            {currentShop ? currentShop.name : "Select a shop"} · {products.length} products
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download size={14} /> Export
          </Button>
          <Button onClick={() => { resetForm(); setShowAdd(true); }} size="sm" disabled={!shopId}>
            <Plus size={14} /> Add Product
          </Button>
        </div>
      </div>

      {!shopId && !loading && (
        <div className="py-12 text-center text-muted-foreground">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No shop selected</p>
          <p className="text-sm mt-1">Select or create a shop from the sidebar to manage inventory.</p>
        </div>
      )}

      {shopId && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <Input placeholder="Search products..." icon={<Search size={14} />} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "low_stock", "out_of_stock", "expiring"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${filter === f ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                  {f === "all" ? "All" : f === "low_stock" ? "Low Stock" : f === "out_of_stock" ? "Out of Stock" : "Expiring"}
                </button>
              ))}
            </div>
          </div>

          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">SKU</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Stock</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Price</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Expiry</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td colSpan={7} className="p-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <Package size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No products found</p>
                        <Button size="sm" className="mt-3" onClick={() => setShowAdd(true)}><Plus size={14} /> Add First Product</Button>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setAnalyticsProduct(p)}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover" /> : <Package size={16} className="text-muted-foreground" />}
                            </div>
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.category?.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell font-mono text-xs text-muted-foreground">{p.sku}</td>
                        <td className="p-4">
                          <span className={`font-semibold ${p.quantity === 0 ? "text-destructive" : p.quantity <= p.low_stock_threshold ? "text-amber-600" : ""}`}>
                            {p.quantity} {p.unit}
                          </span>
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          <div>
                            <p className="font-semibold">{formatCurrency(p.selling_price)}</p>
                            <p className="text-xs text-muted-foreground">Cost: {formatCurrency(p.cost_price)}</p>
                          </div>
                        </td>
                        <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">
                          {p.expiry_date ? (
                            <span className={new Date(p.expiry_date) < new Date(Date.now() + 7 * 86400000) ? "text-red-500 font-medium" : ""}>
                              {new Date(p.expiry_date).toLocaleDateString()}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="p-4">{stockBadge(p)}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setAnalyticsProduct(p); }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="View analytics"
                            >
                              <BarChart2 size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── Product Analytics Panel ─────────────────────────────────────── */}
      {analyticsProduct && shopId && (
        <ProductAnalyticsPanel
          product={analyticsProduct}
          shopId={shopId}
          onClose={() => setAnalyticsProduct(null)}
        />
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); resetForm(); }} title={editProduct ? "Edit Product" : "Add Product"} size="lg">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-foreground mb-2">Product Image</p>
            <div onDragOver={(e) => e.preventDefault()} onDrop={handleImageDrop}
              className={cn("relative border-2 border-dashed rounded-xl transition-colors", imagePreview ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/40")}>
              {imagePreview ? (
                <div className="flex items-center gap-4 p-3">
                  <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{imageFile ? imageFile.name : "Current image"}</p>
                    {imageFile && <p className="text-xs text-muted-foreground">{(imageFile.size / 1024).toFixed(0)} KB</p>}
                    <button onClick={() => imageInputRef.current?.click()} className="text-xs text-primary hover:underline mt-1 block">Change image</button>
                  </div>
                  <button onClick={clearImage} className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => imageInputRef.current?.click()} className="w-full py-6 flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><ImageIcon size={18} /></div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Click or drag to upload</p>
                    <p className="text-xs mt-0.5">JPG, PNG, WEBP · max 5MB</p>
                  </div>
                </button>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Input label="Product Name *" placeholder="e.g. Rice 25kg" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <Input label="SKU" placeholder="Auto-generated" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Input label="Barcode" placeholder="Scan or enter barcode" icon={<Barcode size={14} />} value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          <Input label="Cost Price (TZS) *" type="number" placeholder="0" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
          <Input label="Selling Price (TZS) *" type="number" placeholder="0" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
          <Input label="Quantity in Stock *" type="number" placeholder="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <Input label="Low Stock Threshold" type="number" placeholder="10" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
          <Select label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} options={UNITS.map((u) => ({ value: u, label: u }))} />
          <Input label="Expiry Date" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          <Input label="Batch Number" placeholder="Optional" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} />
          <div className="sm:col-span-2">
            <Textarea label="Description" placeholder="Product description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancel</Button>
          <Button onClick={handleSave} loading={saving || uploadingImage}>
            {uploadingImage ? "Uploading image..." : editProduct ? "Update Product" : "Add Product"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
