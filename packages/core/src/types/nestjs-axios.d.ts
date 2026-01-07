declare module '@nestjs/axios' {
  import { DynamicModule, Module } from '@nestjs/common';

  export class HttpModule {
    static register(options?: any): DynamicModule;
    static registerAsync(options?: any): DynamicModule;
  }
}










