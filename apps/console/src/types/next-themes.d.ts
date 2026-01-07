// Type declarations for next-themes
// Workaround for TypeScript module resolution issues with pnpm
declare module 'next-themes' {
  import { type ReactNode } from 'react';

  export interface ThemeProviderProps {
    children: ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
  }

  export const ThemeProvider: React.ComponentType<ThemeProviderProps>;

  export interface UseThemeReturn {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    themes: string[];
    resolvedTheme: string | undefined;
  }

  export function useTheme(): UseThemeReturn;
}



