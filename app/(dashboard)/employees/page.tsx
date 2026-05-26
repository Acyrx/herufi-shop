"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useShop } from "@/lib/context/shop";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getInitials } from "@/lib/utils";
import {
  CheckCircle2,
  Edit,
  Plus,
  Search,
  Store,
  Trash2,
  UserSquare2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface EmployeeRecord {
  id: string;
  role: string;
  is_active: boolean;
  hired_at: string;
  permissions: string[];
  shop_id: string;
  user: { full_name: string; email?: string; phone?: string; avatar_url?: string };
  shop?: { id: string; name: string };
}

interface FoundUser {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
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

const ROLE_DEFAULTS: Record<string, string[]> = {
  cashier: ["view_inventory", "view_orders", "process_orders", "view_customers"],
  manager: ["view_inventory", "edit_inventory", "view_orders", "process_orders", "view_customers", "edit_customers", "view_reports", "view_financial", "process_refunds", "manage_discounts"],
  stock_manager: ["view_inventory", "edit_inventory", "view_orders", "view_reports"],
  delivery_manager: ["view_orders", "process_orders", "view_customers"],
  sales_agent: ["view_inventory", "view_orders", "process_orders", "view_customers", "manage_discounts"],
};

export default function EmployeesPage() {
  const supabase = createClient();
  const { shopId, currentShop, shops } = useShop();
  const hasMultipleShops = shops.length > 1;

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Assign modal
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [foundUsers, setFoundUsers] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedUser, setSelectedUser] = useState<FoundUser | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [role, setRole] = useState("cashier");
  const [permissions, setPermissions] = useState<string[]>(ROLE_DEFAULTS["cashier"]);

  // Edit modal
  const [editEmployee, setEditEmployee] = useState<EmployeeRecord | null>(null);
  const [editRole, setEditRole] = useState("cashier");
  const [editShopId, setEditShopId] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (shopId) fetchEmployees();
    else setLoading(false);
  }, [shopId]);

  useEffect(() => {
    if (showAdd) {
      setSelectedShopId(shopId ?? "");
      setSearchQuery("");
      setFoundUsers([]);
      setSearchError(null);
      setSelectedUser(null);
      setRole("cashier");
      setPermissions(ROLE_DEFAULTS["cashier"]);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showAdd, shopId]);

  async function fetchEmployees() {
    if (!shopId) return;
    setLoading(true);
    const { data } = await supabase
      .from("employees")
      .select("*, user:profiles(full_name, email, phone, avatar_url), shop:shops(id, name)")
      .eq("shop_id", shopId)
      .eq("is_active", true)
      .order("hired_at", { ascending: false });
    setEmployees(data ?? []);
    setLoading(false);
  }

  const filtered = employees.filter(
    (e) =>
      (e.user?.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.user?.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
  );

  // ── Search & Assign ──────────────────────────────────────
  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) { toast.error("Enter a name, email, or phone to search"); return; }
    setSearching(true);
    setSearchError(null);
    setFoundUsers([]);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url")
      .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(10);

    setSearching(false);

    if (error) {
      setSearchError(
        "Cannot search users. Run supabase/fix_employee_search.sql in your Supabase SQL Editor first."
      );
      return;
    }

    if (!data || data.length === 0) {
      setSearchError("No users found. The person must sign up first.");
    } else {
      setFoundUsers(data);
    }
  }

  function selectUser(user: FoundUser) {
    setSelectedUser(user);
    setFoundUsers([]);
    setSearchQuery("");
    setSearchError(null);
  }

  function handleRoleChange(newRole: string) {
    setRole(newRole);
    setPermissions(ROLE_DEFAULTS[newRole] ?? []);
  }

  function togglePermission(perm: string) {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  async function assignEmployee() {
    if (!selectedUser) { toast.error("Select a user first"); return; }
    const targetShopId = selectedShopId || shopId;
    if (!targetShopId) { toast.error("Select a shop"); return; }
    setSaving(true);

    const { data: existing } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", selectedUser.id)
      .eq("shop_id", targetShopId)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      toast.error(`${selectedUser.full_name} is already assigned to this shop`);
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("employees").insert({
      user_id: selectedUser.id,
      shop_id: targetShopId,
      role,
      permissions,
      is_active: true,
      hired_at: new Date().toISOString(),
    });

    setSaving(false);
    if (error) { toast.error("Failed to assign: " + error.message); return; }

    const shopName = shops.find((s) => s.id === targetShopId)?.name ?? "shop";
    toast.success(`${selectedUser.full_name} assigned as ${role.replace(/_/g, " ")} at ${shopName}`);
    setShowAdd(false);
    fetchEmployees();
  }

  // ── Edit ────────────────────────────────────────────────
  function openEdit(e: EmployeeRecord) {
    setEditEmployee(e);
    setEditRole(e.role);
    setEditShopId(e.shop_id);
    setEditPermissions(e.permissions ?? []);
  }

  function handleEditRoleChange(newRole: string) {
    setEditRole(newRole);
    // Ask if they want to apply role defaults
    setEditPermissions(ROLE_DEFAULTS[newRole] ?? []);
  }

  function toggleEditPermission(perm: string) {
    setEditPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  async function saveEdit() {
    if (!editEmployee) return;
    setEditSaving(true);

    const { error } = await supabase
      .from("employees")
      .update({
        role: editRole,
        shop_id: editShopId || editEmployee.shop_id,
        permissions: editPermissions,
      })
      .eq("id", editEmployee.id);

    setEditSaving(false);

    if (error) { toast.error("Failed to update: " + error.message); return; }

    toast.success("Employee updated");
    setEditEmployee(null);
    fetchEmployees();
  }

  // ── Remove ──────────────────────────────────────────────
  async function handleDeactivate(id: string) {
    if (!confirm("Remove this employee from the shop?")) return;
    await supabase.from("employees").update({ is_active: false }).eq("id", id);
    toast.success("Employee removed");
    fetchEmployees();
  }

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Employees</h2>
          <p className="text-muted-foreground text-sm">
            {currentShop ? currentShop.name + " · " : ""}{employees.length} employees
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" disabled={!shopId}>
          <Plus size={14} /> Assign Employee
        </Button>
      </div>

      {!shopId && !loading && (
        <div className="py-12 text-center text-muted-foreground">
          <Store size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No shop selected</p>
          <p className="text-sm mt-1">Select a shop from the sidebar to manage employees.</p>
        </div>
      )}

      {shopId && (
        <>
          <Input
            placeholder="Search by name, email, or role..."
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-36 bg-card rounded-xl border border-border animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-3 py-16 text-center text-muted-foreground">
                <UserSquare2 size={40} className="mx-auto mb-3 opacity-30" />
                <p>No employees found</p>
                <Button size="sm" className="mt-3" onClick={() => setShowAdd(true)}>
                  <Plus size={14} /> Assign First Employee
                </Button>
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
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">{e.user?.full_name}</p>
                        <Badge variant={ROLE_COLORS[e.role] ?? "default"}>{e.role.replace(/_/g, " ")}</Badge>
                      </div>
                      {e.user?.email && <p className="text-xs text-muted-foreground truncate">{e.user.email}</p>}
                      {e.user?.phone && <p className="text-xs text-muted-foreground">{e.user.phone}</p>}
                      {e.shop && (
                        <p className="text-xs text-primary mt-1 flex items-center gap-1">
                          <Store size={10} /> {e.shop.name}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">Since {formatDate(e.hired_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                    <p className="text-[10px] text-muted-foreground flex-1">
                      {e.permissions?.length ?? 0} permissions
                    </p>
                    <button
                      onClick={() => openEdit(e)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Edit employee"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => handleDeactivate(e.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remove employee"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* ── Assign Modal ─────────────────────────────────── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Assign Employee" size="lg">
        <div className="space-y-5">
          {/* Step 1 — Search */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">1. Find Registered User</p>
            {selectedUser ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-primary bg-primary/5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {getInitials(selectedUser.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{selectedUser.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser.email ?? selectedUser.phone ?? "—"}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedUser(null); setSearchQuery(""); }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    ref={searchInputRef}
                    placeholder="Search by name, email, or phone..."
                    icon={<Search size={14} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} loading={searching} variant="outline">Search</Button>
                </div>
                {searchError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-xs text-destructive whitespace-pre-line">{searchError}</p>
                  </div>
                )}
                {foundUsers.length > 0 && (
                  <div className="border border-border rounded-xl overflow-hidden">
                    {foundUsers.map((u, i) => (
                      <button
                        key={u.id}
                        onClick={() => selectUser(u)}
                        className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors ${i < foundUsers.length - 1 ? "border-b border-border/50" : ""}`}
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {getInitials(u.full_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {u.email ?? ""}{u.email && u.phone ? " · " : ""}{u.phone ?? ""}
                          </p>
                        </div>
                        <CheckCircle2 size={16} className="text-primary/40 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedUser && (
            <>
              {/* Step 2 — Shop (multi-shop only) */}
              {hasMultipleShops && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">2. Assign to Shop</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {shops.map((shop) => (
                      <button
                        key={shop.id}
                        onClick={() => setSelectedShopId(shop.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          selectedShopId === shop.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Store size={14} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{shop.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{shop.location}</p>
                        </div>
                        {selectedShopId === shop.id && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Role */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  {hasMultipleShops ? "3." : "2."} Role
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => handleRoleChange(r.value)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                        role === r.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Permissions auto-set for this role. Customize below.</p>
              </div>

              {/* Permissions */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  {hasMultipleShops ? "4." : "3."} Permissions
                </p>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-border bg-muted/20">
                  {PERMISSIONS.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={permissions.includes(perm)} onChange={() => togglePermission(perm)} className="w-3.5 h-3.5 accent-primary" />
                      <span className="text-xs text-foreground capitalize">{perm.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl p-3">
                <span className="font-medium text-foreground">{selectedUser.full_name}</span>
                <span>→</span>
                <span className="capitalize font-medium text-primary">{role.replace(/_/g, " ")}</span>
                <span>at</span>
                <span className="font-medium text-foreground">
                  {shops.find((s) => s.id === (selectedShopId || shopId))?.name ?? "selected shop"}
                </span>
                <span>·</span>
                <span>{permissions.length} permissions</span>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={assignEmployee} loading={saving} disabled={!selectedUser || !(selectedShopId || shopId)}>
              Assign Employee
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ───────────────────────────────────── */}
      <Modal
        open={!!editEmployee}
        onClose={() => setEditEmployee(null)}
        title="Edit Employee"
        size="lg"
      >
        {editEmployee && (
          <div className="space-y-5">
            {/* Employee info header */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border">
              {editEmployee.user?.avatar_url ? (
                <img src={editEmployee.user.avatar_url} className="w-12 h-12 rounded-full object-cover shrink-0" alt={editEmployee.user.full_name} />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  {getInitials(editEmployee.user?.full_name ?? "?")}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold">{editEmployee.user?.full_name}</p>
                {editEmployee.user?.email && <p className="text-sm text-muted-foreground truncate">{editEmployee.user.email}</p>}
                {editEmployee.user?.phone && <p className="text-sm text-muted-foreground">{editEmployee.user.phone}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">Hired {formatDate(editEmployee.hired_at)}</p>
              </div>
            </div>

            {/* Shop transfer (multi-shop only) */}
            {hasMultipleShops && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Transfer to Shop</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {shops.map((shop) => (
                    <button
                      key={shop.id}
                      onClick={() => setEditShopId(shop.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        editShopId === shop.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Store size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{shop.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{shop.location}</p>
                      </div>
                      {editShopId === shop.id && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Role */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Role</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => handleEditRoleChange(r.value)}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                      editRole === r.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {editRole !== editEmployee.role && (
                <p className="text-xs text-amber-600 mt-1.5">
                  Role changed from <span className="font-medium capitalize">{editEmployee.role.replace(/_/g, " ")}</span> → permissions reset to defaults.
                </p>
              )}
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">Permissions</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditPermissions(PERMISSIONS)}
                    className="text-xs text-primary hover:underline"
                  >
                    All
                  </button>
                  <span className="text-muted-foreground text-xs">·</span>
                  <button
                    onClick={() => setEditPermissions([])}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    None
                  </button>
                  <span className="text-muted-foreground text-xs">·</span>
                  <button
                    onClick={() => setEditPermissions(ROLE_DEFAULTS[editRole] ?? [])}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Reset defaults
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-border bg-muted/20">
                {PERMISSIONS.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editPermissions.includes(perm)}
                      onChange={() => toggleEditPermission(perm)}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    <span className="text-xs text-foreground capitalize">{perm.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {editPermissions.length} of {PERMISSIONS.length} permissions granted
              </p>
            </div>

            {/* Change summary */}
            {(editRole !== editEmployee.role || editShopId !== editEmployee.shop_id) && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                {editRole !== editEmployee.role && (
                  <p>Role: <span className="font-medium capitalize">{editEmployee.role.replace(/_/g, " ")}</span> → <span className="font-medium capitalize">{editRole.replace(/_/g, " ")}</span></p>
                )}
                {hasMultipleShops && editShopId && editShopId !== editEmployee.shop_id && (
                  <p>Shop: <span className="font-medium">{editEmployee.shop?.name}</span> → <span className="font-medium">{shops.find((s) => s.id === editShopId)?.name}</span></p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setEditEmployee(null)}>Cancel</Button>
              <Button onClick={saveEdit} loading={editSaving}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
