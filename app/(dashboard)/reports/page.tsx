"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useShop } from "@/lib/context/shop";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download, FileSpreadsheet, FileText, FileDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

type ReportType = "sales" | "inventory" | "financial" | "employees";

export default function ReportsPage() {
  const supabase = createClient();
  const { shopId, currentShop } = useShop();
  const [reportType, setReportType] = useState<ReportType>("sales");
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [generating, setGenerating] = useState(false);

  async function fetchReportData() {
    switch (reportType) {
      case "sales": {
        let q = supabase
          .from("orders")
          .select("order_number, total, status, payment_method, created_at, customers(name)")
          .gte("created_at", dateFrom)
          .lte("created_at", dateTo + "T23:59:59");
        if (shopId) q = q.eq("shop_id", shopId);
        const { data } = await q;
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
        let q2 = supabase
          .from("products")
          .select("name, sku, quantity, low_stock_threshold, cost_price, selling_price, unit, expiry_date")
          .eq("is_active", true);
        if (shopId) q2 = q2.eq("shop_id", shopId);
        const { data } = await q2;
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
        let q3 = supabase
          .from("transactions")
          .select("type, category, amount, description, payment_method, date")
          .gte("date", dateFrom)
          .lte("date", dateTo);
        if (shopId) q3 = q3.eq("shop_id", shopId);
        const { data } = await q3;
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
        let q4 = supabase
          .from("employees")
          .select("role, is_active, hired_at, permissions, user:profiles(full_name, email)")
          .eq("is_active", true);
        if (shopId) q4 = q4.eq("shop_id", shopId);
        const { data } = await q4;
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

  async function downloadPDF() {
    setGenerating(true);
    try {
      const data = await fetchReportData();
      if (!data.length) { toast.error("No data found"); return; }

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = margin;

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      const titles: Record<string, string> = { sales: "Sales Report", inventory: "Inventory Report", financial: "Financial Report", employees: "Employee Report" };
      doc.text(`${currentShop?.name ?? "HERUFI"} — ${titles[reportType]}`, margin, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      const period = reportType === "sales" || reportType === "financial" ? `${dateFrom} to ${dateTo}` : "Current data";
      doc.text(`Period: ${period}  |  Generated: ${new Date().toLocaleString()}`, margin, y);
      y += 8;

      // Line
      doc.setDrawColor(200);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      // Headers
      const headers = Object.keys(data[0]);
      const colW = (pageW - 2 * margin) / headers.length;
      doc.setTextColor(0);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 4, pageW - 2 * margin, 7, "F");
      headers.forEach((h, i) => doc.text(h, margin + i * colW + 1, y));
      y += 6;

      // Rows
      doc.setFont("helvetica", "normal");
      data.slice(0, 60).forEach((row, idx) => {
        if (y > 185) { doc.addPage(); y = margin; }
        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 4, pageW - 2 * margin, 7, "F");
        }
        headers.forEach((h, i) => {
          const val = String(row[h as keyof typeof row] ?? "").slice(0, 20);
          doc.text(val, margin + i * colW + 1, y);
        });
        y += 7;
      });

      if (data.length > 60) {
        y += 3;
        doc.setFont("helvetica", "italic");
        doc.setTextColor(120);
        doc.text(`... ${data.length - 60} more rows — download Excel for full data`, margin, y);
      }

      doc.save(`herufi_${reportType}_report_${dateFrom}_${dateTo}.pdf`);
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error("Failed to generate PDF");
      console.error(e);
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
            <Button onClick={downloadPDF} loading={generating} variant="outline">
              <FileDown size={16} className="text-red-600" />
              Download PDF
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
