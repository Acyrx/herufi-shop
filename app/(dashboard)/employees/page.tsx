"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getInitials } from "@/lib/utils";
import { Edit, Plus, Search, Trash2, UserSquare2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EmployeeRecord {
  id: string;
  role: string;
  is_active: boolean;
  hired_at: string;
  permissions: string[];
  user: { full_name: string; email: string; phone?: string; avatar_url?: string };
  shop?: { name: string };
}

const ROLES = [
  { value: "cashier", label: "Cashier" },
  { value: "manager", label: "Manager" },
  { value: "stock_manager", label: "Stock Manager" },
  { value: "delivery_manager", label: "Delivery Manager" },
  { value: "sales_agent", label: "Sales Agent" },
];

const PERMISSIONS = [
  "view_inventory", "edit_inventory", "view_orders", "process_orders",
  "view_customers", "edit_customers", "view_reports", "view_financial",
  "process_refunds", "manage_discounts",
];

const ROLE_COLORS: Record<string, "success" | "info" | "warning" | "default"> = {
  manager: "success",
  cashier: "info",
  stock_manager: "warning",
  delivery_manager: "default",
  sales_agent: "info",
};

export default function EmployeesPage() {
  const supabase = createClient();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  const [form, setForm] = useState({ role: "cashier", permissions: [] as string[] });

  useEffect(() => { fetchEmployees(); }, []);

  async function fetchEmployees() {
    setLoading(true);
    const { data } = await supabase
      .from("employees")
      .select("*, user:profiles(full_name, email, phone, avatar_url), shop:shops(name)")
      .eq("is_active", true)
      .order("hired_at", { ascending: false });
    setEmployees(data ?? []);
    setLoading(false);
  }

  const filtered = employees.filter((e) =>
    e.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSearchUser() {
    if (!searchUser.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url")
      .or(`email.ilike.%${searchUser}%,phone.ilike.%${searchUser}%,full_name.ilike.%${searchUser}%`)
      .limit(5);
    setFoundUsers(data ?? []);
    setSearching(false);
  }

  async function assignEmployee() {
    if (!selectedUser) { toast.error("Select a user"); return; }
    setSaving(true);

    const { error } = await supabase.from("employees").insert({
      user_id: selectedUser.id,
      role: form.role,
      permissions: form.permissions,
      is_active: true,
      hired_at: new Date().toISOString(),
    });

    if (error) toast.error("Failed to assign employee");
    else toast.success(`${selectedUser.full_name} assigned as ${form.role}`);

    setSaving(false);
    setShowAdd(false);
    resetForm();
    fetchEmployees();
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Remove this employee?")) return;
    await supabase.from("employees").update({ is_active: false }).eq("id", id);
    toast.success("Employee removed");
    fetchEmployees();
  }

  function resetForm() {
    setForm({ role: "cashier", permissions: [] });
    setSelectedUser(null);
    setSearchUser("");
    setFoundUsers([]);
  }

  function togglePermission(perm: string) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Employees</h2>
          <p className="text-muted-foreground text-sm">{employees.length} active employees</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} size="sm">
          <Plus size={14} /> Assign Employee
        </Button>
      </div>

      <Input placeholder="Search employees..." icon={<Search size={14} />} value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-36 bg-card rounded-xl border border-border animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-muted-foreground">
            <UserSquare2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>No employees found</p>
          </div>
        ) : (
          filtered.map((e) => (
            <Card key={e.id} className="hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                {e.user?.avatar_url ? (
                  <img src={e.user.avatar_url} className="w-10 h-10 rounded-full object-cover shrink-0" alt={e.user.full_name} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {getInitials(e.user?.full_name ?? "?")}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{e.user?.full_name}</p>
                    <Badge variant={ROLE_COLORS[e.role] ?? "default"}>{e.role.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{e.user?.email}</p>
                  {e.user?.phone && <p className="text-xs text-muted-foreground">{e.user.phone}</p>}
                  {e.shop && <p className="text-xs text-primary mt-1">{e.shop.name}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">Since {formatDate(e.hired_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground flex-1">{e.permissions?.length ?? 0} permissions</p>
                <button onClick={() => handleDeactivate(e.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Assign Employee Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); resetForm(); }} title="Assign Employee" size="lg">
        <div className="space-y-4">
          {/* User search */}
          <div>
            <label className="text-sm font-medium text-foreground">Search User</label>
            <div className="flex gap-2 mt-1.5">
              <Input
                placeholder="Search by email, phone, or name"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
              />
              <Button onClick={handleSearchUser} loading={searching} variant="outline">Search</Button>
            </div>
          </div>

          {foundUsers.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              {foundUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-0 ${selectedUser?.id === u.id ? "bg-primary/10" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {getInitials(u.full_name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email} {u.phone ? `• ${u.phone}` : ""}</p>
                  </div>
                  {selectedUser?.id === u.id && <Badge variant="success" className="ml-auto">Selected</Badge>}
                </button>
              ))}
            </div>
          )}

          {selectedUser && (
            <>
              <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={ROLES} />

              <div>
                <label className="text-sm font-medium text-foreground">Permissions</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PERMISSIONS.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      <span className="text-xs text-foreground capitalize">{perm.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancel</Button>
            <Button onClick={assignEmployee} loading={saving} disabled={!selectedUser}>Assign Employee</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
