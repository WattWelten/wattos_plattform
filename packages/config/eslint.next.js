/**
 * ESLint configuration for Next.js apps
 * Extend this config in Next.js app .eslintrc.js files
 */
module.exports = {
  extends: ['next/core-web-vitals', '../../packages/config/eslint.base.js'],
  rules: {
    // Next.js specific overrides
    '@next/next/no-img-element': 'warn', // Allow img tags if needed
    'react/no-unescaped-entities': 'off', // Allow quotes in text
  },
};

