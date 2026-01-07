// Type declarations for tailwind-merge
// Workaround for TypeScript module resolution issues with pnpm
declare module 'tailwind-merge' {
  export function twMerge(...classLists: (string | undefined | null | false)[]): string;
}












