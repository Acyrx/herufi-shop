"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Building2, Edit, MapPin, Phone, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const BUSINESS_CATEGORIES = [
  "Wholesale", "Retail", "Grocery", "Electronics", "Clothing & Fashion",
  "Hardware", "Pharmacy", "Restaurant & Food", "Agri-Business", "Other",
];

interface Shop {
  id: string;
  name: string;
  logo_url?: string;
  location: string;
  contact_phone?: string;
  contact_email?: string;
  business_category: string;
  currency: string;
  tax_rate: number;
  is_active: boolean;
  created_at: string;
}

export default function ShopsPage() {
  const supabase = createClient();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editShop, setEditShop] = useState<Shop | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    location: "",
    contact_phone: "",
    contact_email: "",
    business_category: "Retail",
    currency: "TZS",
    tax_rate: "18",
  });

  useEffect(() => { fetchShops(); }, []);

  async function fetchShops() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("shops").select("*").eq("owner_id", user.id).order("created_at");
    setShops(data ?? []);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.name || !form.location) { toast.error("Name and location are required"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      name: form.name,
      location: form.location,
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      business_category: form.business_category,
      currency: form.currency,
      tax_rate: parseFloat(form.tax_rate) || 18,
      owner_id: user?.id,
      is_active: true,
    };

    if (editShop) {
      const { error } = await supabase.from("shops").update(payload).eq("id", editShop.id);
      if (error) toast.error("Failed to update shop");
      else toast.success("Shop updated");
    } else {
      const { error } = await supabase.from("shops").insert(payload);
      if (error) toast.error("Failed to create shop");
      else toast.success("Shop created");
    }

    setSaving(false);
    setShowAdd(false);
    setEditShop(null);
    resetForm();
    fetchShops();
  }

  async function handleToggle(shop: Shop) {
    await supabase.from("shops").update({ is_active: !shop.is_active }).eq("id", shop.id);
    fetchShops();
  }

  function openEdit(s: Shop) {
    setEditShop(s);
    setForm({
      name: s.name,
      location: s.location,
      contact_phone: s.contact_phone ?? "",
      contact_email: s.contact_email ?? "",
      business_category: s.business_category,
      currency: s.currency,
      tax_rate: String(s.tax_rate),
    });
    setShowAdd(true);
  }

  function resetForm() {
    setForm({ name: "", location: "", contact_phone: "", contact_email: "", business_category: "Retail", currency: "TZS", tax_rate: "18" });
    setEditShop(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">My Shops</h2>
          <p className="text-muted-foreground text-sm">Manage your business locations</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} size="sm">
          <Plus size={14} /> New Shop
        </Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-card rounded-xl border border-border animate-pulse" />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <Card className="py-16 text-center">
          <Building2 size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground mb-4">No shops yet. Create your first shop to get started.</p>
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Create Shop
          </Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.map((shop) => (
            <Card key={shop.id} className={`hover:border-primary/30 transition-colors ${!shop.is_active ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 size={24} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-between">
                    <h3 className="font-bold text-foreground truncate">{shop.name}</h3>
                    <Badge variant={shop.is_active ? "success" : "default"}>
                      {shop.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Badge variant="info" className="mt-1">{shop.business_category}</Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin size={13} className="shrink-0" />
                  <span className="truncate">{shop.location}</span>
                </div>
                {shop.contact_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone size={13} className="shrink-0" />
                    <span>{shop.contact_phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>Tax: {shop.tax_rate}% • {shop.currency}</span>
                  <span>Since {formatDate(shop.created_at)}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => openEdit(shop)}>
                  <Edit size={13} /> Edit
                </Button>
                <Button
                  variant={shop.is_active ? "outline" : "primary"}
                  size="sm"
                  className="flex-1"
                  onClick={() => handleToggle(shop)}
                >
                  {shop.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); resetForm(); }} title={editShop ? "Edit Shop" : "Create New Shop"} size="lg">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Shop Name *" placeholder="e.g. Juma Wholesale Center" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Input label="Location *" placeholder="Street, City, Region" icon={<MapPin size={14} />} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <Input label="Phone" placeholder="+255 XXX XXX XXX" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
          <Input label="Email" type="email" placeholder="shop@email.com" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          <Select label="Business Category" value={form.business_category} onChange={(e) => setForm({ ...form, business_category: e.target.value })}
            options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <Select label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
            options={[{ value: "TZS", label: "TZS - Tanzanian Shilling" }, { value: "USD", label: "USD - US Dollar" }, { value: "KES", label: "KES - Kenyan Shilling" }]} />
          <div className="sm:col-span-2">
            <Input label="Tax Rate (%)" type="number" placeholder="18" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editShop ? "Update Shop" : "Create Shop"}</Button>
        </div>
      </Modal>
    </div>
  );
}
