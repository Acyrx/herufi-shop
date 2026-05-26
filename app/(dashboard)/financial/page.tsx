"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { useShop } from "@/lib/context/shop";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  "Rent", "Electricity", "Water", "Staff Salaries", "Transport",
  "Marketing", "Maintenance", "Supplier Payment", "Other",
];

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  payment_method: string;
  date: string;
  created_at: string;
}

export default function FinancialPage() {
  const supabase = createClient();
  const { shopId, currentShop } = useShop();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: "expense",
    category: "Other",
    amount: "",
    description: "",
    payment_method: "cash",
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (shopId) fetchTransactions();
    else setLoading(false);
  }, [shopId]);

  async function fetchTransactions() {
    if (!shopId) return;
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("shop_id", shopId)
      .order("date", { ascending: false })
      .limit(50);
    setTransactions(data ?? []);
    setLoading(false);
  }

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  async function handleSave() {
    if (!form.amount || !form.description) { toast.error("Fill all required fields"); return; }
    if (!shopId) { toast.error("No shop selected"); return; }
    setSaving(true);

    const { error } = await supabase.from("transactions").insert({
      shop_id: shopId,
      type: form.type,
      category: form.category,
      amount: parseFloat(form.amount),
      description: form.description,
      payment_method: form.payment_method,
      date: form.date,
    });

    if (error) toast.error("Failed to save transaction");
    else toast.success("Transaction recorded");

    setSaving(false);
    setShowAdd(false);
    setForm({ type: "expense", category: "Other", amount: "", description: "", payment_method: "cash", date: new Date().toISOString().slice(0, 10) });
    fetchTransactions();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Financial</h2>
          <p className="text-muted-foreground text-sm">{currentShop ? currentShop.name + " · " : ""}Profit, expenses & cash flow</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus size={14} /> Record Transaction
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(income)}
          icon={<ArrowUpRight size={20} className="text-green-600" />}
          iconBg="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(expenses)}
          icon={<ArrowDownLeft size={20} className="text-red-500" />}
          iconBg="bg-red-100 dark:bg-red-900/30"
        />
        <StatCard
          title="Net Balance"
          value={formatCurrency(balance)}
          icon={<DollarSign size={20} className={balance >= 0 ? "text-primary" : "text-destructive"} />}
          iconBg={balance >= 0 ? "bg-primary/10" : "bg-destructive/10"}
        />
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left pb-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left pb-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                  <th className="text-left pb-3 font-medium text-muted-foreground hidden md:table-cell">Method</th>
                  <th className="text-right pb-3 font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No transactions yet</td></tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-3 text-xs text-muted-foreground">{formatDate(t.date)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {t.type === "income"
                            ? <ArrowUpRight size={14} className="text-green-600 shrink-0" />
                            : <ArrowDownLeft size={14} className="text-red-500 shrink-0" />}
                          <span className="font-medium">{t.description}</span>
                        </div>
                      </td>
                      <td className="py-3 hidden sm:table-cell text-muted-foreground">{t.category}</td>
                      <td className="py-3 hidden md:table-cell text-muted-foreground capitalize">{t.payment_method.replace("_", " ")}</td>
                      <td className={`py-3 text-right font-bold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Transaction Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Record Transaction">
        <div className="space-y-3">
          <div className="flex gap-2">
            {["income", "expense"].map((type) => (
              <button key={type} onClick={() => setForm({ ...form, type })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border capitalize ${form.type === type ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
              >{type}</button>
            ))}
          </div>
          <Input label="Amount (TZS) *" type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input label="Description *" placeholder="What was this for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <Select label="Payment Method" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
            options={[
              { value: "cash", label: "Cash" },
              { value: "mpesa", label: "M-Pesa" },
              { value: "bank_transfer", label: "Bank Transfer" },
              { value: "card", label: "Card" },
            ]} />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Save Transaction</Button>
        </div>
      </Modal>
    </div>
  );
}
