declare module '@nestjs/config' {
  import { DynamicModule, Module } from '@nestjs/common';

  export class ConfigModule {
    static forRoot(options?: any): DynamicModule;
    static forFeature(options?: any): DynamicModule;
  }

  export class ConfigService {
    get<T = any>(propertyPath: string, defaultValue?: T): T;
    getOrThrow<T = any>(propertyPath: string): T;
  }
}










