import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Handle native modules like better-sqlite3
  serverExternalPackages: ["better-sqlite3"],

  // Empty turbopack config to silence warning (Turbopack is default in Next.js 16)
  turbopack: {},
};

export default nextConfig;
