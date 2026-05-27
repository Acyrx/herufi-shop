import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { PWARegister } from "@/components/pwa-register";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://herufi.com";

// ── SEO + GEO + AEO Metadata ────────────────────────────────────────────────
export const metadata: Metadata = {
  // ── Base & Titles ──────────────────────────────────────────────────────────
  metadataBase: new URL(BASE),
  title: {
    default: "Herufi — Smart Business Management for Tanzania & Africa",
    template: "%s | Herufi",
  },
  description:
    "Herufi is an all-in-one business management platform for wholesalers, retailers, and multi-shop owners in Tanzania and Africa. Includes POS, inventory management, AI insights, employee management, analytics, and customer loyalty — all in one mobile-first app.",

  // ── AEO: rich keywords ─────────────────────────────────────────────────────
  keywords: [
    "business management Tanzania",
    "POS system Tanzania",
    "inventory management Africa",
    "wholesale retail software Tanzania",
    "biashara Tanzania",
    "mfumo wa biashara",
    "Herufi",
    "duka management",
    "point of sale Tanzania",
    "stock management Tanzania",
    "employee management Africa",
    "loyalty points Tanzania",
    "AI business insights",
    "TZS POS system",
    "Swahili business app",
    "multi-shop management",
    "order management Tanzania",
    "financial tracking Africa",
  ],

  // ── Authors & Publisher ────────────────────────────────────────────────────
  authors: [{ name: "Herufi", url: BASE }],
  creator: "Herufi",
  publisher: "Herufi",

  // ── Canonical ─────────────────────────────────────────────────────────────
  alternates: {
    canonical: BASE,
    languages: {
      "en-TZ": `${BASE}/?lang=en`,
      "sw-TZ": `${BASE}/?lang=sw`,
      "en": `${BASE}/?lang=en`,
      "sw": `${BASE}/?lang=sw`,
    },
  },

  // ── Open Graph ─────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    url: BASE,
    siteName: "Herufi",
    title: "Herufi — Smart Business Management for Tanzania & Africa",
    description:
      "All-in-one POS, inventory, analytics, and AI insights for wholesalers and retailers. Manage multiple shops, employees, customers, and finances from one platform. Built for Tanzania and Africa.",
    locale: "en_TZ",
    alternateLocale: ["sw_TZ"],
    images: [
      {
        url: `${BASE}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Herufi — Smart Business Management Platform for Tanzania",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X Card ──────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Herufi — Smart Business Management for Tanzania & Africa",
    description:
      "All-in-one POS, inventory, AI insights, and analytics for wholesalers & retailers. Built for Tanzania and Africa.",
    images: [`${BASE}/og-image.png`],
    creator: "@HerufiApp",
    site: "@HerufiApp",
  },

  // ── PWA / App ──────────────────────────────────────────────────────────────
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Herufi",
    startupImage: ["/api/icon/180"],
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/api/icon/32", sizes: "32x32", type: "image/png" },
      { url: "/api/icon/192", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/api/icon/180", sizes: "180x180", type: "image/png" }],
    shortcut: "/api/icon/32",
  },

  // ── Crawling & Indexing ────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Verification (add your actual codes when available) ───────────────────
  // verification: {
  //   google: "YOUR_GOOGLE_SITE_VERIFICATION_CODE",
  //   yandex: "YOUR_YANDEX_CODE",
  // },

  // ── App category ──────────────────────────────────────────────────────────
  category: "business",
  classification: "Business Management Software",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16a34a" },
    { media: "(prefers-color-scheme: dark)", color: "#15803d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ── JSON-LD Structured Data ─────────────────────────────────────────────────
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE}/#organization`,
  name: "Herufi",
  url: BASE,
  logo: {
    "@type": "ImageObject",
    url: `${BASE}/logo/favicon.png`,
    width: 180,
    height: 180,
  },
  description:
    "Herufi is a smart business management platform for wholesalers, retailers, and multi-shop businesses in Tanzania and Africa.",
  foundingLocation: {
    "@type": "Place",
    name: "Dar es Salaam, Tanzania",
    address: {
      "@type": "PostalAddress",
      addressCountry: "TZ",
      addressRegion: "Dar es Salaam",
    },
  },
  areaServed: [
    { "@type": "Country", name: "Tanzania" },
    { "@type": "Country", name: "Kenya" },
    { "@type": "Country", name: "Uganda" },
    { "@type": "Country", name: "Rwanda" },
    { "@type": "Continent", name: "Africa" },
  ],
  knowsLanguage: ["en", "sw"],
  sameAs: [
    // Add social media profiles when available
  ],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${BASE}/#software`,
  name: "Herufi",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: [
    "Point of Sale",
    "Inventory Management",
    "Business Analytics",
    "Employee Management",
  ],
  operatingSystem: ["Web", "Android", "iOS"],
  description:
    "All-in-one business management platform with POS, inventory management, AI insights, employee management, analytics, and customer loyalty for wholesalers and retailers in Tanzania and Africa.",
  url: BASE,
  offers: [
    {
      "@type": "Offer",
      name: "Starter Plan",
      price: "0",
      priceCurrency: "TZS",
      description: "Free forever plan with 1 shop, 100 products, 2 cashiers",
    },
    {
      "@type": "Offer",
      name: "Business Plan",
      price: "25000",
      priceCurrency: "TZS",
      billingIncrement: "P1M",
      description:
        "5 shops, unlimited products, all employees, full analytics, AI insights",
    },
  ],
  featureList: [
    "Point of Sale (POS)",
    "Inventory Management",
    "AI-Powered Business Insights",
    "Multi-Shop Management",
    "Employee Management",
    "Customer Loyalty Points",
    "Analytics & Reports",
    "Financial Tracking",
    "Barcode Scanning",
    "Offline Mode",
    "PDF/Excel/CSV Exports",
    "Swahili Language Support",
  ],
  inLanguage: ["en", "sw"],
  availableOnDevice: "Mobile, Tablet, Desktop",
  screenshot: `${BASE}/og-image.png`,
  author: { "@id": `${BASE}/#organization` },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE}/#website`,
  url: BASE,
  name: "Herufi",
  description:
    "Smart business management platform for Tanzania and Africa — POS, inventory, AI insights, analytics.",
  inLanguage: ["en", "sw"],
  publisher: { "@id": `${BASE}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE}/shop?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// FAQ schema for AEO — answers questions AI/voice assistants commonly surface
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Herufi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Herufi is an all-in-one business management platform built for wholesalers, retailers, and multi-shop businesses in Tanzania and Africa. It combines Point of Sale (POS), inventory management, AI-powered insights, employee management, analytics, financial tracking, and customer loyalty into a single mobile-first application.",
      },
    },
    {
      "@type": "Question",
      name: "Does Herufi support Swahili?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Herufi fully supports both English and Swahili (Kiswahili). You can switch languages at any time from the app settings or the language toggle on any page.",
      },
    },
    {
      "@type": "Question",
      name: "How much does Herufi cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Herufi offers a free Starter plan (1 shop, 100 products, 2 cashiers) and a Business plan at TZS 25,000 per month (5 shops, unlimited products, all employees, full analytics and AI insights). Enterprise pricing is available for larger businesses.",
      },
    },
    {
      "@type": "Question",
      name: "Can I manage multiple shops with Herufi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Herufi supports multi-shop management. A single owner account can create and manage multiple shops, switch between branches, compare performance, and assign employees to different locations.",
      },
    },
    {
      "@type": "Question",
      name: "Does Herufi work offline?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Herufi is a Progressive Web App (PWA) with offline support. The POS can process sales without an internet connection, and data syncs automatically when connectivity is restored.",
      },
    },
    {
      "@type": "Question",
      name: "What currencies does Herufi support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Herufi defaults to Tanzanian Shillings (TZS) and is optimised for the East African market. Currency settings are configurable per shop.",
      },
    },
    {
      "@type": "Question",
      name: "How does the AI assistant in Herufi work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Herufi AI is powered by Google Gemini and runs entirely on the server. For shop owners, it analyses your live business data — sales trends, low stock, expiring products, revenue changes — and gives actionable recommendations in English or Swahili. For customers, it acts as a shopping assistant that knows your purchase history and available inventory.",
      },
    },
    {
      "@type": "Question",
      name: "Is Herufi available on Android?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Herufi is a mobile-first Progressive Web App (PWA) that works on any browser and can be installed on Android and iOS devices. It is optimised for Android-first use.",
      },
    },
  ],
};

// ── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sw"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* ── GEO meta tags ────────────────────────────────────────────────── */}
        <meta name="geo.region" content="TZ" />
        <meta name="geo.placename" content="Dar es Salaam, Tanzania" />
        <meta name="geo.position" content="-6.7924;39.2083" />
        <meta name="ICBM" content="-6.7924, 39.2083" />
        {/* ── AEO: Speakable – tell voice/AI engines what to read aloud ─────── */}
        <link rel="speakable" href="#hero-description" />
        {/* ── Preconnect for performance ────────────────────────────────────── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://scxgzauofehlkulvivnk.supabase.co" />
        {/* ── JSON-LD Structured Data ───────────────────────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Runs before React hydration to apply saved theme — prevents FOUC */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
        <Providers>{children}</Providers>
        <PWARegister />
      </body>
    </html>
  );
}
