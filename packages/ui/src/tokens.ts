/**
 * Design Tokens
 * Zentrale Design-Tokens für das Apple 2026 × WattWeiser Design System
 */

export const PRIMARY_COLOR = '#00D28F';
export const SECONDARY_COLOR = '#111827';

export const colors = {
  primary: {
    DEFAULT: PRIMARY_COLOR,
    50: '#E6FBF5',
    100: '#CCF7EB',
    200: '#99EFD7',
    300: '#66E7C3',
    400: '#33DFAF',
    500: PRIMARY_COLOR,
    600: '#00A872',
    700: '#007E56',
    800: '#005439',
    900: '#002A1D',
  },
  secondary: {
    DEFAULT: SECONDARY_COLOR,
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: SECONDARY_COLOR,
  },
} as const;

export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  full: '9999px',
} as const;

export const typography = {
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"SF Pro Display"',
      '"SF Pro Text"',
      'Inter',
      'system-ui',
      'sans-serif',
    ].join(', '),
    mono: [
      '"SF Mono"',
      'Monaco',
      '"Cascadia Code"',
      '"Roboto Mono"',
      'monospace',
    ].join(', '),
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
} as const;
