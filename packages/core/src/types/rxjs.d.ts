declare module 'rxjs' {
  export * from 'rxjs/index';
  export function firstValueFrom<T>(source: any): Promise<T>;
  export function lastValueFrom<T>(source: any): Promise<T>;
}

