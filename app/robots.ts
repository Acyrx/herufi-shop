import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://herufi.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep dashboard, API routes, auth callbacks out of crawler indexes
        disallow: [
          "/dashboard/",
          "/inventory/",
          "/pos/",
          "/employees/",
          "/financial/",
          "/settings/",
          "/choose-context/",
          "/api/",
          "/auth/",
        ],
      },
      // Allow AI crawlers to index public content for AEO
      {
        userAgent: "GPTBot",
        allow: ["/", "/shop", "/docs"],
        disallow: ["/api/", "/auth/", "/dashboard/"],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/", "/shop", "/docs"],
        disallow: ["/api/", "/auth/", "/dashboard/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/", "/shop", "/docs"],
        disallow: ["/api/", "/auth/", "/dashboard/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/shop", "/docs"],
        disallow: ["/api/", "/auth/", "/dashboard/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
