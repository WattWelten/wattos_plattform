// Type declarations for next/font/google
// Workaround for TypeScript module resolution issues with pnpm
declare module 'next/font/google' {
  import { type NextFont } from 'next/dist/compiled/@next/font';

  export interface FontOptions {
    subsets?: string[];
    weight?: string | string[];
    style?: string | string[];
    display?: string;
    variable?: string;
    preload?: boolean;
    fallback?: string[];
    adjustFontFallback?: boolean;
    declarations?: Array<{ prop: string; value: string }>;
  }

  export function Inter(options?: FontOptions): NextFont;
  export function Roboto(options?: FontOptions): NextFont;
  export function Open_Sans(options?: FontOptions): NextFont;
}



