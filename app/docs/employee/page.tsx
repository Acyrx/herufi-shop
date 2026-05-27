import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { renderMarkdown } from "@/lib/markdown";
import { DocsLangContent } from "../DocsLangContent";

export const metadata: Metadata = {
  title: "Employee Guide — Working on Herufi",
  description:
    "Guide for Herufi employees. Learn how to get assigned to a shop, use the POS, manage orders and inventory, view customers, and switch workspaces.",
  alternates: { canonical: "/docs/employee" },
};

export default function EmployeeGuidePage() {
  const enHtml = renderMarkdown(readFileSync(join(process.cwd(), "docs", "en", "employee.md"), "utf-8"));
  const swHtml = renderMarkdown(readFileSync(join(process.cwd(), "docs", "sw", "mfanyakazi.md"), "utf-8"));

  return <DocsLangContent enHtml={enHtml} swHtml={swHtml} />;
}
