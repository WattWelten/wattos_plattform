declare module 'next/font/google' {
  export function Inter(options?: {
    subsets?: string[];
    weight?: string | string[];
    style?: string | string[];
    display?: string;
    variable?: string;
    fallback?: string[];
    adjustFontFallback?: boolean;
    preload?: boolean;
  }): {
    className: string;
    style: { fontFamily: string };
    variable: string;
  };
}










