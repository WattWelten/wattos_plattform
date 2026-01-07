import type { NextConfig } from 'next';

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

  // TypeScript & ESLint
  typescript: {
    // Type checking wird in CI/CD gemacht
    ignoreBuildErrors: false,
  },
  eslint: {
    // Linting wird in CI/CD gemacht
    ignoreDuringBuilds: false,
  },

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
    const path = require('path');
    const srcPath = path.resolve(__dirname, './src');

    config.resolve.alias = {
      ...config.resolve.alias,
      '@': srcPath,
    };

    // Verbesserte Modulauflösung für pnpm
    config.resolve.modules = [
      path.resolve(__dirname, './src'),
      path.resolve(__dirname, './node_modules'),
      path.resolve(__dirname, '../../node_modules'),
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

export default nextConfig;









