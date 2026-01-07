// Type declarations for socket.io-client
// Workaround for TypeScript module resolution issues with pnpm
declare module 'socket.io-client' {
  export interface Socket {
    on(event: string, callback: (...args: any[]) => void): Socket;
    emit(event: string, ...args: any[]): Socket;
    disconnect(): Socket;
    connect(): Socket;
    close(): Socket;
    id: string;
  }

  export interface SocketOptions {
    transports?: string[];
    reconnection?: boolean;
    reconnectionDelay?: number;
    reconnectionAttempts?: number;
    timeout?: number;
    forceNew?: boolean;
    [key: string]: any;
  }

  export function io(url?: string, options?: SocketOptions): Socket;
}



