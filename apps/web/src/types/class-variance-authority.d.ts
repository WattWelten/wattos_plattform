// Type declarations for class-variance-authority
// Workaround for TypeScript module resolution issues with pnpm
declare module 'class-variance-authority' {
  import type { ClassValue } from 'clsx';

  export type VariantProps<T> = T extends (props?: infer P) => any
    ? P extends Record<string, any>
      ? {
          [K in keyof P]?: P[K] extends string | number | boolean | undefined
            ? P[K]
            : never;
        }
      : never
    : never;

  export function cva<
    Variants extends Record<string, Record<string, ClassValue>>,
    CompoundVariants extends Array<ClassValue & Variants>
  >(
    base?: ClassValue,
    options?: {
      variants?: Variants;
      compoundVariants?: CompoundVariants;
      defaultVariants?: Partial<Record<keyof Variants, keyof Variants[keyof Variants]>>;
    }
  ): (props?: Partial<Record<keyof Variants, keyof Variants[keyof Variants]>>) => string;
}


