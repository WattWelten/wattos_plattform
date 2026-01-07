// Type declarations for @nestjs/throttler
// Workaround for TypeScript module resolution issues with pnpm
declare module '@nestjs/throttler' {
  import { DynamicModule } from '@nestjs/common';

  export class ThrottlerModule {
    static forRoot(options?: any): DynamicModule;
    static forRootAsync(options?: any): DynamicModule;
  }

  export class ThrottlerException extends Error {}
  export class ThrottlerGuard {}
  export function Throttle(limit?: number, ttl?: number): any;
}
