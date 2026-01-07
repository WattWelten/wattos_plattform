// Type declarations for @nestjs/jwt
// Workaround for TypeScript module resolution issues with pnpm
declare module '@nestjs/jwt' {
  export class JwtModule {
    static register(options: any): any;
    static registerAsync(options: any): any;
  }

  export class JwtService {
    sign(payload: any, options?: any): string;
    verify<T = any>(token: string, options?: any): T;
    decode(token: string, options?: any): any;
  }
}
