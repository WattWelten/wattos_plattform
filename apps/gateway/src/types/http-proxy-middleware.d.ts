// Type declarations for http-proxy-middleware
// Workaround for TypeScript module resolution issues with pnpm
declare module 'http-proxy-middleware' {
  import { type RequestHandler, type Request, type Response } from 'express';

  export interface Options {
    target?: string;
    changeOrigin?: boolean;
    pathRewrite?: Record<string, string> | ((path: string, req: Request) => string);
    onProxyReq?: (proxyReq: any, req: Request, res: Response) => void;
    onProxyRes?: (proxyRes: any, req: Request, res: Response) => void;
    onError?: (err: Error, req: Request, res: Response) => void;
    [key: string]: any;
  }

  export function createProxyMiddleware(
    context: string | string[] | Options,
    options?: Options
  ): RequestHandler;
}
