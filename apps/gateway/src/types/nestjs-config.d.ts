// Type declarations for @nestjs/config
// Workaround for TypeScript module resolution issues with pnpm
declare module '@nestjs/config' {
  import { type Type } from '@nestjs/common';

  export class ConfigService {
    get<T = any>(propertyPath: string, defaultValue?: T): T;
    getOrThrow<T = any>(propertyPath: string): T;
  }

  export class ConfigModule {
    static forRoot(options?: any): any;
    static forFeature(options?: any): any;
  }
}
