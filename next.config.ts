import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone build untuk deploy VPS (jalan via `node .next/standalone/server.js`).
  output: "standalone",
};

export default nextConfig;
