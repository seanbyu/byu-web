const createNextIntlPlugin = require('next-intl/plugin');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  transpilePackages: ['@salon-admin/api-core', '@salon-admin/supabase'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'lodash', 'react-use'],
  },
};

module.exports = withBundleAnalyzer(withNextIntl(nextConfig));
