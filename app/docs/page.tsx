import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { renderMarkdown } from "@/lib/markdown";
import { DocsLangContent } from "./DocsLangContent";
import { Store, Users, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation — How to Use Herufi",
  description:
    "Learn how to use Herufi — the business management platform for Tanzania and Africa. Guides for shop owners, employees, and customers. Available in English and Swahili.",
  alternates: { canonical: "/docs" },
};

function readDoc(lang: "en" | "sw", file: string) {
  return readFileSync(join(process.cwd(), "docs", lang, file), "utf-8");
}

export default function DocsPage() {
  // Both languages rendered on the server — client component picks the right one
  const enHtml = renderMarkdown(readDoc("en", "index.md"));
  const swHtml = renderMarkdown(readDoc("sw", "index.md"));

  // Guide cards — bilingual labels embedded in the HTML
  const cardsEnHtml = buildCardsHtml("en");
  const cardsSwHtml = buildCardsHtml("sw");

  return (
    <article className="max-w-3xl">
      <DocsLangContent enHtml={cardsEnHtml + enHtml} swHtml={cardsSwHtml + swHtml} />
    </article>
  );
}

// Build the guide-card grid as HTML so it flows through the same switcher
function buildCardsHtml(lang: "en" | "sw") {
  const cards = lang === "en"
    ? [
        { href: "/docs/owner",    icon: "🏪", title: "Owner Guide",    desc: "Create shops, manage inventory, run the POS, assign employees, track finances, and use AI insights." },
        { href: "/docs/employee", icon: "👤", title: "Employee Guide",  desc: "Get assigned to a shop, choose your workspace, use the POS, manage orders, and view inventory." },
        { href: "/docs/customer", icon: "🛍️", title: "Customer Guide",  desc: "Browse the marketplace, add to cart, check out, track orders, earn loyalty points, and use the AI assistant." },
      ]
    : [
        { href: "/docs/owner",    icon: "🏪", title: "Mwongozo wa Mmiliki",    desc: "Unda maduka, simamia bidhaa, tumia POS, teua wafanyakazi, fuatilia fedha, na tumia maarifa ya AI." },
        { href: "/docs/employee", icon: "👤", title: "Mwongozo wa Mfanyakazi",  desc: "Pata uteuzi wa duka, chagua mazingira ya kazi, tumia POS, simamia maagizo, na angalia bidhaa." },
        { href: "/docs/customer", icon: "🛍️", title: "Mwongozo wa Mteja",       desc: "Vinjari soko, ongeza mkobani, fanya malipo, fuatilia maagizo, na pata pointi za uaminifu." },
      ];

  const readLabel = lang === "en" ? "Read guide →" : "Soma mwongozo →";

  return `
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem;">
  ${cards.map(c => `
  <a href="${c.href}" style="display:flex;flex-direction:column;gap:.75rem;padding:1.25rem;border-radius:1rem;border:1px solid var(--border);background:var(--card);text-decoration:none;transition:box-shadow .15s">
    <span style="font-size:1.5rem">${c.icon}</span>
    <div>
      <p style="font-weight:600;font-size:.875rem;color:var(--foreground);margin:0">${c.title}</p>
      <p style="font-size:.8rem;color:var(--muted-foreground);margin:.25rem 0 0;line-height:1.5">${c.desc}</p>
    </div>
    <span style="font-size:.8rem;font-weight:500;color:var(--primary);margin-top:auto">${readLabel}</span>
  </a>`).join("")}
</div>`;
}
