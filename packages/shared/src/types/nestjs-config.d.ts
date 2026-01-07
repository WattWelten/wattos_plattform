// Type declarations for @nestjs/config
// Workaround for TypeScript module resolution issues with pnpm
declare module '@nestjs/config' {
  export class ConfigModule {
    static forRoot(options?: any): any;
    static forFeature(options?: any): any;
  }
  export class ConfigService {
    get<T = any>(propertyPath: string, defaultValue?: T): T;
    getOrThrow<T = any>(propertyPath: string): T;
  }
}













