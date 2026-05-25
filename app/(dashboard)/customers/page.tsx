"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Edit, Plus, Search, Star, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  loyalty_points: number;
  credit_limit: number;
  outstanding_credit: number;
  segment?: string;
  created_at: string;
}

const SEGMENT_COLORS: Record<string, "success" | "warning" | "info" | "default"> = {
  vip: "success",
  regular: "info",
  occasional: "warning",
  new: "default",
};

export default function CustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    credit_limit: "0",
    segment: "new",
  });

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    setLoading(true);
    const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    setCustomers(data ?? []);
    setLoading(false);
  }

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? "").includes(search) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);

    const payload = {
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      credit_limit: parseFloat(form.credit_limit) || 0,
      segment: form.segment,
      loyalty_points: editCustomer?.loyalty_points ?? 0,
      outstanding_credit: editCustomer?.outstanding_credit ?? 0,
    };

    if (editCustomer) {
      const { error } = await supabase.from("customers").update(payload).eq("id", editCustomer.id);
      if (error) toast.error("Failed to update");
      else toast.success("Customer updated");
    } else {
      const { error } = await supabase.from("customers").insert(payload);
      if (error) toast.error("Failed to add customer");
      else toast.success("Customer added");
    }

    setSaving(false);
    setShowAdd(false);
    setEditCustomer(null);
    resetForm();
    fetchCustomers();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this customer?")) return;
    await supabase.from("customers").delete().eq("id", id);
    toast.success("Customer deleted");
    fetchCustomers();
  }

  function openEdit(c: Customer) {
    setEditCustomer(c);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", credit_limit: String(c.credit_limit), segment: c.segment ?? "new" });
    setShowAdd(true);
  }

  function resetForm() {
    setForm({ name: "", phone: "", email: "", address: "", credit_limit: "0", segment: "new" });
    setEditCustomer(null);
  }

  const totalPoints = customers.reduce((s, c) => s + c.loyalty_points, 0);
  const totalCredit = customers.reduce((s, c) => s + c.outstanding_credit, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Customers</h2>
          <p className="text-muted-foreground text-sm">{customers.length} registered customers</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} size="sm">
          <Plus size={14} /> Add Customer
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-foreground">{customers.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Customers</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-primary">{totalPoints.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Loyalty Points</p>
        </Card>
        <Card className="text-center py-4 col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalCredit)}</p>
          <p className="text-xs text-muted-foreground mt-1">Outstanding Credit</p>
        </Card>
      </div>

      <Input placeholder="Search customers..." icon={<Search size={14} />} value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-36 bg-card rounded-xl border border-border animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-muted-foreground">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>No customers found</p>
          </div>
        ) : (
          filtered.map((c) => (
            <Card key={c.id} className="hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {getInitials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    {c.segment && <Badge variant={SEGMENT_COLORS[c.segment] ?? "default"} className="shrink-0">{c.segment}</Badge>}
                  </div>
                  {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                  {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1 text-amber-600">
                      <Star size={10} fill="currentColor" />
                      {c.loyalty_points} pts
                    </span>
                    {c.outstanding_credit > 0 && (
                      <span className="text-red-500">Credit: {formatCurrency(c.outstanding_credit)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground flex-1">Since {formatDate(c.created_at)}</p>
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Edit size={13} />
                </button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); resetForm(); }} title={editCustomer ? "Edit Customer" : "Add Customer"}>
        <div className="space-y-3">
          <Input label="Full Name *" placeholder="Customer name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Phone" placeholder="+255 XXX XXX XXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" placeholder="customer@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Address" placeholder="Location / address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label="Credit Limit (TZS)" type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} />
          <Select label="Segment" value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })}
            options={[{ value: "new", label: "New" }, { value: "regular", label: "Regular" }, { value: "occasional", label: "Occasional" }, { value: "vip", label: "VIP" }]} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editCustomer ? "Update" : "Add Customer"}</Button>
        </div>
      </Modal>
    </div>
  );
}
