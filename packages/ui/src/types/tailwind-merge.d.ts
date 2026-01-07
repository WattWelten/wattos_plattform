// Type declarations for tailwind-merge
// Workaround for TypeScript module resolution issues with pnpm
declare module 'tailwind-merge' {
  export function twMerge(...classes: (string | undefined | null | false)[]): string;
  export function cn(...classes: (string | undefined | null | false)[]): string;
}
