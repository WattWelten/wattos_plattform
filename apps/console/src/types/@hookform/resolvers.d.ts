declare module '@hookform/resolvers/zod' {
  import { z } from 'zod';
  import { Resolver } from 'react-hook-form';

  export function zodResolver<T extends z.ZodType<any, any, any>>(
    schema: T,
    schemaOptions?: {
      errorMap?: z.ZodErrorMap;
      async?: boolean;
    }
  ): Resolver<z.infer<T>>;
}










