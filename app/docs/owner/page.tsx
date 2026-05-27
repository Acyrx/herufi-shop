import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { renderMarkdown } from "@/lib/markdown";
import { DocsLangContent } from "../DocsLangContent";

export const metadata: Metadata = {
  title: "Owner Guide — Manage Your Shops with Herufi",
  description:
    "Complete guide for Herufi shop owners. Learn how to create shops, manage inventory, run the POS, assign employees, track finances, view analytics, and use the AI assistant.",
  alternates: { canonical: "/docs/owner" },
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Set Up and Manage a Shop on Herufi",
  description: "Step-by-step guide for setting up your business on the Herufi platform.",
  step: [
    { "@type": "HowToStep", position: 1, name: "Create an Account", text: "Open Herufi and tap 'Create account'. Choose 'Shop Owner' as your role." },
    { "@type": "HowToStep", position: 2, name: "Create Your First Shop", text: "Go to 'My Shops' → 'Add Shop'. Enter your shop name, location, currency (TZS), and category." },
    { "@type": "HowToStep", position: 3, name: "Add Products", text: "Go to 'Inventory' → 'Add Product'. Fill in cost price, selling price, quantity, and unit." },
    { "@type": "HowToStep", position: 4, name: "Process a Sale", text: "Go to 'POS', search for products, select payment method, and tap 'Charge'." },
    { "@type": "HowToStep", position: 5, name: "Assign Employees", text: "Go to 'Employees' → 'Assign Employee'. Search by name, email, or phone. Choose role and permissions." },
    { "@type": "HowToStep", position: 6, name: "Use AI Insights", text: "Go to 'AI Assistant' to get live business recommendations in English or Swahili." },
  ],
};

export default function OwnerGuidePage() {
  const enHtml = renderMarkdown(readFileSync(join(process.cwd(), "docs", "en", "owner.md"), "utf-8"));
  const swHtml = renderMarkdown(readFileSync(join(process.cwd(), "docs", "sw", "mmiliki.md"), "utf-8"));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <DocsLangContent enHtml={enHtml} swHtml={swHtml} />
    </>
  );
}
