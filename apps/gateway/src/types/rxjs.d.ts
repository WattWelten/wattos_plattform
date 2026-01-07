declare module 'rxjs' {
  export * from 'rxjs/index';
  export class Observable<T> {
    subscribe(observer?: any): any;
    pipe(...operators: any[]): Observable<any>;
  }
  export function of<T>(...values: T[]): Observable<T>;
}

declare module 'rxjs/operators' {
  export function tap<T>(next?: (value: T) => void): any;
  export function catchError<T>(selector: (error: any) => Observable<T>): any;
  export function map<T, R>(project: (value: T) => R): any;
}
