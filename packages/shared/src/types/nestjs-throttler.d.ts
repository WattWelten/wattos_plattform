// Type declarations for @nestjs/throttler
// Workaround for TypeScript module resolution issues with pnpm
declare module '@nestjs/throttler' {
  export class ThrottlerModule {
    static forRoot(options?: any): any;
    static forRootAsync(options?: any): any;
  }
  export class ThrottlerGuard {
    constructor(options?: any, storageService?: any, throttlerService?: any);
  }
  export class ThrottlerException extends Error {}
}

