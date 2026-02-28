const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

// ── Content Security Policy ────────────────────────────────────────────────
// Tighten per-directive as you add external services.
// 'unsafe-inline' on script-src is required by Next.js hydration scripts.
// Remove it once you move to nonce-based CSP (next step after launch).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  // Images: own domain + external book cover sources + Google avatar CDN
  "img-src 'self' data: blob: https://books.google.com https://covers.openlibrary.org https://lh3.googleusercontent.com",
  // API calls + VOIP WebSocket connections
  "connect-src 'self' https://api.stripe.com https://api.daily.co wss: https:",
  // Stripe card element iframe
  "frame-src https://js.stripe.com",
  "font-src 'self'",
  "media-src 'self' blob:",   // camera/mic streams for VOIP
  "worker-src 'self' blob:",  // next-pwa service worker
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

// ── Security response headers (applied to every route) ────────────────────
const SECURITY_HEADERS = [
  // Prevent browsers from MIME-sniffing the content type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Deny rendering inside iframes (clickjacking protection)
  { key: "X-Frame-Options", value: "DENY" },
  // Enforce HTTPS for 2 years, include subdomains, allow preload
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Limit referrer info sent to third-party domains
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Camera/mic only allowed on the same origin (VOIP), no geolocation
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
  // Legacy XSS filter (belt-and-suspenders for older browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Prevent DNS prefetching leaking visited URLs
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Content-Security-Policy", value: CSP },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // Explicit allowlist — wildcard domains are not permitted
    domains: [
      "books.google.com",
      "covers.openlibrary.org",
      "lh3.googleusercontent.com",
    ],
  },

  async headers() {
    return [
      {
        // Apply security headers to every response
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
      {
        // CORS for API routes — restrict to same origin in production
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
          },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },

  // Prevent source maps reaching the client in production
  productionBrowserSourceMaps: false,
};

module.exports = withPWA(nextConfig);
