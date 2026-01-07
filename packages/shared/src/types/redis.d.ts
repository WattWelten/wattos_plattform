// Type declarations for redis
// Workaround for TypeScript module resolution issues with pnpm
declare module 'redis' {
  export interface RedisClientType {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<string | null>;
    setEx(key: string, seconds: number, value: string): Promise<string | null>;
    del(key: string | string[]): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    flushDb(): Promise<string>;
    mGet(keys: string[]): Promise<(string | null)[]>;
    multi(): any;
    ping(): Promise<string>;
    quit(): Promise<void>;
    isOpen: boolean;
    on(event: string, callback: (err: Error) => void): void;
    connect(): Promise<void>;
  }
  export function createClient(options?: { url?: string }): RedisClientType;
}

