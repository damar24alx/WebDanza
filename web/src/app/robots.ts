import type { MetadataRoute } from "next";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/admin", "/api/admin/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
