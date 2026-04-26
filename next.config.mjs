/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  // Vercel Hobby tier: 1,000 source images / 5,000 transforms per month.
  // We have 4,000+ cards × 60 thumbnails per browse page → blow the limit fast.
  // Solution: serve external CDN images directly (unoptimized) — they already
  // come pre-sized from Google CDN / TCGdex / OPTCG.
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "i.ebayimg.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "optcgapi.com" },
      { protocol: "https", hostname: "assets.tcgdex.net" },
    ],
  },
  // Production source maps off (reduce build size)
  productionBrowserSourceMaps: false,
  // Cache HTTP headers for static-ish assets
  async headers() {
    return [
      {
        source: "/:path((?!api).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600",
          },
        ],
      },
    ];
  },
  // Reduce middleware size + improve compile times
  experimental: {
    optimizePackageImports: ["recharts", "framer-motion", "date-fns"],
  },
};

export default nextConfig;
