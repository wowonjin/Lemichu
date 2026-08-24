/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  outputFileTracingExcludes: {
    "*": [
      "lemichu_전처리공유_2026_08_23/**",
      "__MACOSX/**",
      "items.*.csv",
      "colorsizes.*.csv",
    ],
  },
  async redirects() {
    return [
      { source: "/wishlist", destination: "/my", permanent: true },
      { source: "/cart", destination: "/my", permanent: true },
      { source: "/new-arrivals", destination: "/products?filter=new", permanent: true },
      { source: "/ranking", destination: "/products", permanent: true },
      { source: "/threads", destination: "/products", permanent: true },
      { source: "/sale", destination: "/products", permanent: true },
      { source: "/promotions", destination: "/products", permanent: true },
      { source: "/pre-owned", destination: "/products", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
