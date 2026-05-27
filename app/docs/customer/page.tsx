import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { renderMarkdown } from "@/lib/markdown";
import { DocsLangContent } from "../DocsLangContent";

export const metadata: Metadata = {
  title: "Customer Guide — Shopping on Herufi",
  description:
    "Guide for Herufi customers. Browse the marketplace, track orders, earn loyalty points, and use the AI shopping assistant. Available in English and Swahili.",
  alternates: { canonical: "/docs/customer" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "How do I track my order on Herufi?", acceptedAnswer: { "@type": "Answer", text: "Go to Order History. Orders move: Pending → Confirmed → Processing → Shipped → Delivered." } },
    { "@type": "Question", name: "How do loyalty points work?", acceptedAnswer: { "@type": "Answer", text: "Earn 1 point per TZS 1,000 spent. Points show on your profile and can be redeemed at participating shops." } },
    { "@type": "Question", name: "Can I pay with M-Pesa on Herufi?", acceptedAnswer: { "@type": "Answer", text: "Yes — Cash on Delivery, Mobile Money (M-Pesa, Airtel Money), Card, and Bank Transfer are all supported." } },
    { "@type": "Question", name: "How do I use the AI shopping assistant?", acceptedAnswer: { "@type": "Answer", text: "Tap the AI icon in the shop interface. It answers in English or Swahili and remembers your past preferences." } },
  ],
};

export default function CustomerGuidePage() {
  const enHtml = renderMarkdown(readFileSync(join(process.cwd(), "docs", "en", "customer.md"), "utf-8"));
  const swHtml = renderMarkdown(readFileSync(join(process.cwd(), "docs", "sw", "mteja.md"), "utf-8"));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <DocsLangContent enHtml={enHtml} swHtml={swHtml} />
    </>
  );
}
