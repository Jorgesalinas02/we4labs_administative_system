import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@we4labs/db", "@we4labs/shared"],
  experimental: {
    /** Menos JS en dev/build: imports desde barrels de lucide/recharts. */
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
