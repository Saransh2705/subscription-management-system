import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable typed routes for better type safety
  typedRoutes: false,
  
  // Turbopack is enabled via CLI flag (--turbopack)
  // No config needed here as it's in package.json scripts
  
  // Enable experimental features for Next.js 15
  experimental: {
    // Enable PPR (Partial Prerendering) for better performance
    ppr: false, // Set to true when ready
    
    // Enable React Compiler (when available)
    reactCompiler: false,
    
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
