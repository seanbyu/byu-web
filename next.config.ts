import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@salon-admin/api-core", "@salon-admin/supabase"],
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "lodash", "react-use"],
  },
};

export default nextConfig;
