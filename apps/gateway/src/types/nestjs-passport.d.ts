// Type declarations for @nestjs/passport
// Workaround for TypeScript module resolution issues with pnpm
declare module '@nestjs/passport' {
  export class PassportModule {
    static register(strategy: any): any;
    static registerAsync(options: any): any;
  }

  export function AuthGuard(strategy?: string | string[]): any;

  export abstract class PassportStrategy<TStrategy = any, TValidate = any> {
    abstract validate(...args: any[]): TValidate | Promise<TValidate>;
  }

  export function PassportStrategy<TStrategy = any>(
    strategy: any,
    name?: string
  ): new (...args: any[]) => PassportStrategy<TStrategy>;
}
