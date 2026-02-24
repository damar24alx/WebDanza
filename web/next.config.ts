import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";
const scriptSrcDirectives = ["'self'", "'unsafe-inline'"];
if (isDevelopment) {
  // Turbopack/Next dev overlays need eval in local development.
  scriptSrcDirectives.push("'unsafe-eval'");
}

const cloudStorageDriver = (process.env.MEDIA_STORAGE_DRIVER ?? "local").trim().toLowerCase();
const cloudMediaEnabled =
  cloudStorageDriver === "cloud" || cloudStorageDriver === "s3" || cloudStorageDriver === "r2";
const mediaCloudPublicBaseUrl = process.env.MEDIA_CLOUD_PUBLIC_BASE_URL?.trim();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      `script-src ${scriptSrcDirectives.join(" ")}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self'",
      "frame-src 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async rewrites() {
    if (!cloudMediaEnabled || !mediaCloudPublicBaseUrl) {
      return [];
    }

    const destinationBase = mediaCloudPublicBaseUrl.replace(/\/+$/, "");
    return [
      {
        source: "/media/uploads/:path*",
        destination: `${destinationBase}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
