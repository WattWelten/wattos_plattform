import type { NextConfig } from 'next';
import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';

// Bundle Analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// next-intl Plugin
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Standalone output für Docker deployment
  output: 'standalone',

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Experimental features für bessere Performance
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'lucide-react',
      'recharts',
    ],
  },

  // TypeScript
  typescript: {
    // Type checking wird in CI/CD gemacht
    ignoreBuildErrors: false,
  },

  // Turbopack config (leer, da webpack verwendet wird)
  turbopack: {},

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Pfadauflösung für @/ Alias - verbesserte Konfiguration für pnpm
    const srcPath = path.resolve(process.cwd(), './src');

    config.resolve.alias = {
      ...config.resolve.alias,
      '@': srcPath,
    };

    // Verbesserte Modulauflösung für pnpm
    config.resolve.modules = [
      path.resolve(process.cwd(), './src'),
      path.resolve(process.cwd(), './node_modules'),
      path.resolve(process.cwd(), '../../node_modules'),
      'node_modules',
    ];

    // Erweiterte Dateierweiterungen für bessere Auflösung
    config.resolve.extensions = [
      ...(config.resolve.extensions || []),
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.json',
    ];

    return config;
  },

  // Headers für Security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(withBundleAnalyzer(nextConfig));









