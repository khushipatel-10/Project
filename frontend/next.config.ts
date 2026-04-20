import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Remove turbopack — it's dev-only and not needed for production
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
    ],
  },
  // Silence the "next/image" warnings for external Clerk avatar URLs
  experimental: {},
};

export default nextConfig;
