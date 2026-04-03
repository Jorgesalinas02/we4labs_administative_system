import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@we4labs/db", "@we4labs/shared"],
};

export default nextConfig;
