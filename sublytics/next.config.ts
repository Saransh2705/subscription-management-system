import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // This is not needed in Next.js 13+ as it auto-detects src/app
  // But explicitly setting it can help with certain edge cases
};

export default nextConfig;
