import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@salon-admin/api-core", "@salon-admin/supabase"],
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "lodash", "react-use"],
  },
};

export default withNextIntl(nextConfig);
