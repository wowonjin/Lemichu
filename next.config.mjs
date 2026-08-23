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
