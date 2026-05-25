"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type ReportType = "sales" | "inventory" | "financial" | "employees";

export default function ReportsPage() {
  const supabase = createClient();
  const [reportType, setReportType] = useState<ReportType>("sales");
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [generating, setGenerating] = useState(false);

  async function fetchReportData() {
    switch (reportType) {
      case "sales": {
        const { data } = await supabase
          .from("orders")
          .select("order_number, total, status, payment_method, created_at, customers(name)")
          .gte("created_at", dateFrom)
          .lte("created_at", dateTo + "T23:59:59");
        return (data ?? []).map((o: any) => ({
          "Order Number": o.order_number,
          Customer: o.customers?.name ?? "Walk-in",
          Total: o.total,
          Status: o.status,
          "Payment Method": o.payment_method,
          Date: formatDate(o.created_at),
        }));
      }
      case "inventory": {
        const { data } = await supabase
          .from("products")
          .select("name, sku, quantity, low_stock_threshold, cost_price, selling_price, unit, expiry_date")
          .eq("is_active", true);
        return (data ?? []).map((p: any) => ({
          Name: p.name,
          SKU: p.sku,
          Quantity: p.quantity,
          Unit: p.unit,
          "Low Stock Threshold": p.low_stock_threshold,
          "Cost Price": p.cost_price,
          "Selling Price": p.selling_price,
          "Expiry Date": p.expiry_date ?? "N/A",
        }));
      }
      case "financial": {
        const { data } = await supabase
          .from("transactions")
          .select("type, category, amount, description, payment_method, date")
          .gte("date", dateFrom)
          .lte("date", dateTo);
        return (data ?? []).map((t: any) => ({
          Type: t.type,
          Category: t.category,
          Amount: t.amount,
          Description: t.description,
          "Payment Method": t.payment_method,
          Date: t.date,
        }));
      }
      case "employees": {
        const { data } = await supabase
          .from("employees")
          .select("role, is_active, hired_at, permissions, user:profiles(full_name, email)")
          .eq("is_active", true);
        return (data ?? []).map((e: any) => ({
          Name: e.user?.full_name ?? "Unknown",
          Email: e.user?.email ?? "",
          Role: e.role,
          "Hired Date": formatDate(e.hired_at),
          Permissions: e.permissions?.join(", ") ?? "",
        }));
      }
      default:
        return [];
    }
  }

  async function downloadExcel() {
    setGenerating(true);
    try {
      const data = await fetchReportData();
      if (!data.length) { toast.error("No data found for the selected period"); return; }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, reportType);
      XLSX.writeFile(wb, `herufi_${reportType}_report_${dateFrom}_${dateTo}.xlsx`);
      toast.success("Report downloaded successfully");
    } catch {
      toast.error("Failed to generate report");
    }
    setGenerating(false);
  }

  async function downloadCSV() {
    setGenerating(true);
    try {
      const data = await fetchReportData();
      if (!data.length) { toast.error("No data found"); return; }

      const headers = Object.keys(data[0]);
      const rows = data.map((row) => headers.map((h) => `"${row[h as keyof typeof row]}"`).join(","));
      const csv = [headers.join(","), ...rows].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `herufi_${reportType}_report_${dateFrom}_${dateTo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Failed to generate CSV");
    }
    setGenerating(false);
  }

  const REPORT_TYPES = [
    { value: "sales", label: "Sales Report", desc: "Orders, revenue, and customer data" },
    { value: "inventory", label: "Inventory Report", desc: "Stock levels, prices, and expiry" },
    { value: "financial", label: "Financial Report", desc: "Income, expenses, and transactions" },
    { value: "employees", label: "Employee Report", desc: "Staff roles and permissions" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-muted-foreground text-sm">Export your business data</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {REPORT_TYPES.map((r) => (
          <button
            key={r.value}
            onClick={() => setReportType(r.value as ReportType)}
            className={`p-4 rounded-xl border text-left transition-all duration-200 ${
              reportType === r.value
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <p className={`font-semibold text-sm ${reportType === r.value ? "text-primary" : "text-foreground"}`}>{r.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Date Range (hide for inventory & employees) */}
      {(reportType === "sales" || reportType === "financial") && (
        <Card>
          <CardHeader><CardTitle className="text-base">Date Range</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Buttons */}
      <Card>
        <CardHeader><CardTitle className="text-base">Export Options</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={downloadExcel} loading={generating} variant="outline">
              <FileSpreadsheet size={16} className="text-green-600" />
              Download Excel (.xlsx)
            </Button>
            <Button onClick={downloadCSV} loading={generating} variant="outline">
              <FileText size={16} className="text-blue-600" />
              Download CSV
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Reports are generated from your live business data and downloaded directly to your device.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
