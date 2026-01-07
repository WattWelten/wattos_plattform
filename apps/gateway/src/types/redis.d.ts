// Type declarations for redis
// Workaround for TypeScript module resolution issues with pnpm
declare module 'redis' {
  export interface RedisClientType {
    connect(): Promise<void>;
    ping(): Promise<string>;
    quit(): Promise<void>;
    get(key: string): Promise<string | null>;
    setEx(key: string, seconds: number, value: string): Promise<void>;
    del(key: string | string[]): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    flushDb(): Promise<void>;
    mGet(keys: string[]): Promise<(string | null)[]>;
    multi(): any;
    sAdd(key: string, ...members: string[]): Promise<number>;
    expire(key: string, seconds: number): Promise<boolean>;
    on(event: string, callback: (err?: Error) => void): void;
    isOpen?: boolean;
  }

  export function createClient(options?: {
    url?: string;
    socket?: {
      host?: string;
      port?: number;
    };
  }): RedisClientType;
}
