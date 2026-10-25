import type { NextConfig } from "next"

const securityHeaders = [
  // Prevent site from being embedded in iframes (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't send full URL as referrer to external sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features that portfolio doesn't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Force HTTPS for 1 year (only active over HTTPS — safe on Vercel)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Basic CSP — allows the Three.js canvas, Google Fonts, self assets.
  // Tighten script-src further once you audit all inline scripts.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Framer Motion + Three.js need inline styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Next.js uses inline scripts for hydration; nonce-based CSP requires
      // more Next.js config — 'unsafe-inline' is the pragmatic starting point
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Three.js WebGL canvas + blob URLs for worker threads
      "worker-src 'self' blob:",
      "img-src 'self' data: blob: https:",
      // Visitor tracker + IPInfo calls
      "connect-src 'self' https://ipinfo.io https://discord.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
