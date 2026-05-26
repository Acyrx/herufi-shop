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

export const metadata: Metadata = {
  title: "Herufi — Smart Business Management",
  description: "POS, inventory, analytics, and AI insights for wholesalers and retailers in Tanzania and Africa.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Herufi",
  },
  icons: {
    icon: "/api/icon/32",
    apple: "/api/icon/180",
    shortcut: "/api/icon/32",
  },
  keywords: ["POS", "inventory", "Tanzania", "business management", "wholesale", "retail"],
  authors: [{ name: "Herufi" }],
  openGraph: {
    title: "Herufi — Smart Business Management",
    description: "Manage your shops, inventory, and employees in one platform.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sw" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
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
