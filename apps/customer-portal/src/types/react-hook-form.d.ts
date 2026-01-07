// Type declarations for react-hook-form
// Workaround for TypeScript module resolution issues with pnpm
declare module 'react-hook-form' {
  import { type ReactNode, type ComponentType } from 'react';

  export interface UseFormReturn<TFieldValues = any> {
    register: (name: any, options?: any) => any;
    handleSubmit: (onValid: (data: TFieldValues) => void, onInvalid?: (errors: any) => void) => (e?: any) => Promise<void>;
    formState: {
      errors: Record<string, any>;
      isSubmitting: boolean;
      isValid: boolean;
    };
    watch: (name?: any) => any;
    setValue: (name: any, value: any, options?: any) => void;
    getValues: (name?: any) => any;
    reset: (values?: TFieldValues) => void;
    control: any;
  }

  export function useForm<TFieldValues = any>(options?: any): UseFormReturn<TFieldValues>;

  export interface ControllerProps<TFieldValues = any> {
    name: any;
    control: any;
    render: (props: { field: any; fieldState: any; formState: any }) => ReactNode;
    rules?: any;
    defaultValue?: any;
  }

  export const Controller: ComponentType<ControllerProps>;
}

declare module '@hookform/resolvers/zod' {
  import { type ZodSchema } from 'zod';
  export function zodResolver<T extends ZodSchema>(schema: T): any;
}











