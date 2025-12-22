/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@wattweiser/ui', '@wattweiser/config', '@wattweiser/metrics'],
};

module.exports = nextConfig;


