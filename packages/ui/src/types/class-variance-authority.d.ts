// Type declarations for class-variance-authority
// Workaround for TypeScript module resolution issues with pnpm
declare module 'class-variance-authority' {
  export type VariantProps<T> = T extends (props: infer P) => any
    ? P extends { variant?: infer V; size?: infer S }
      ? { variant?: V; size?: S }
      : Record<string, any>
    : Record<string, any>;

  export function cva(
    base: string,
    config?: {
      variants?: Record<string, Record<string, string>>;
      defaultVariants?: Record<string, string>;
    }
  ): (props?: Record<string, string | undefined>) => string;
}
