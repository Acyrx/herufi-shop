"use client";

import Link from "next/link";
import Image from "next/image";

/* ── Social link icons ───────────────────────────────────────────────────── */
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const SOCIAL = [
  { href: "https://github.com/herufi", icon: GithubIcon, label: "GitHub" },
  { href: "https://x.com/HerufiApp", icon: XIcon, label: "X (Twitter)" },
  { href: "https://instagram.com/herufiapp", icon: InstagramIcon, label: "Instagram" },
  { href: "https://facebook.com/herufiapp", icon: FacebookIcon, label: "Facebook" },
  { href: "https://tiktok.com/@herufiapp", icon: TikTokIcon, label: "TikTok" },
  { href: "https://wa.me/255700000000", icon: WhatsAppIcon, label: "WhatsApp" },
];

interface FooterProps {
  lang: "en" | "sw";
}

export function LandingFooter({ lang }: FooterProps) {
  const t = lang === "sw";

  const cols = [
    {
      heading: t ? "Bidhaa" : "Product",
      links: [
        { href: "/#features", label: t ? "Vipengele" : "Features" },
        { href: "/#how-it-works", label: t ? "Jinsi inavyofanya kazi" : "How it works" },
        { href: "/pricing", label: t ? "Bei" : "Pricing" },
        { href: "/shop", label: t ? "Soko" : "Marketplace" },
        { href: "/docs", label: t ? "Mwongozo" : "Documentation" },
      ],
    },
    {
      heading: t ? "Kampuni" : "Company",
      links: [
        { href: "/about", label: t ? "Kuhusu Sisi" : "About Us" },
        { href: "/about#mission", label: t ? "Dhamira" : "Mission" },
        { href: "/about#values", label: t ? "Maadili" : "Values" },
        { href: "/about#careers", label: t ? "Kazi" : "Careers" },
      ],
    },
    {
      heading: t ? "Rasilimali" : "Resources",
      links: [
        { href: "/docs/owner", label: t ? "Mwongozo wa Mmiliki" : "Owner Guide" },
        { href: "/docs/employee", label: t ? "Mwongozo wa Mfanyakazi" : "Employee Guide" },
        { href: "/docs/customer", label: t ? "Mwongozo wa Mteja" : "Customer Guide" },
        { href: "/#faq", label: "FAQ" },
      ],
    },
    {
      heading: t ? "Msaada" : "Support",
      links: [
        { href: "mailto:support@herufi.com", label: t ? "Wasiliana Nasi" : "Contact Us" },
        { href: "https://wa.me/255700000000", label: "WhatsApp" },
        { href: "/#faq", label: t ? "Maswali Yanayoulizwa Mara kwa Mara" : "FAQ" },
        { href: "/privacy", label: t ? "Faragha" : "Privacy Policy" },
        { href: "/terms", label: t ? "Masharti" : "Terms of Service" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        {/* Top */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand col */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Image src="/logo/favicon.png" width={32} height={32} alt="Herufi" />
              <span className="font-bold text-lg">Herufi</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-xs">
              {t
                ? "Mfumo wa kisasa wa usimamizi wa biashara kwa wafanyabiashara wa Tanzania na Afrika."
                : "Smart business management platform built for wholesalers and retailers across Tanzania and Africa."}
            </p>
            {/* Social icons */}
            <div className="flex flex-wrap gap-2">
              {SOCIAL.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">{col.heading}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Herufi Technologies Ltd. {t ? "Haki zote zimehifadhiwa." : "All rights reserved."} 🇹🇿</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {t ? "Faragha" : "Privacy"}
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {t ? "Masharti" : "Terms"}
            </Link>
            <Link href="/about#contact" className="hover:text-foreground transition-colors">
              {t ? "Wasiliana" : "Contact"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
