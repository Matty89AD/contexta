import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable after() for post-response background work (Epic 17)
    after: true,
  },
};

export default nextConfig;
