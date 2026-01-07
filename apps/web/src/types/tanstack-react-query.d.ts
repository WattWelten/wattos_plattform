// Type declarations for @tanstack/react-query
// Workaround for TypeScript module resolution issues with pnpm
declare module '@tanstack/react-query' {
  import { type ReactNode } from 'react';

  export interface QueryClientConfig {
    defaultOptions?: {
      queries?: {
        staleTime?: number;
        cacheTime?: number;
        retry?: number | boolean;
        refetchOnWindowFocus?: boolean;
      };
    };
  }

  export class QueryClient {
    constructor(config?: QueryClientConfig);
    invalidateQueries(options?: { queryKey?: any[] }): Promise<void>;
    setQueryData(queryKey: any[], data: any): void;
    getQueryData(queryKey: any[]): any;
  }

  export interface QueryClientProviderProps {
    client: QueryClient;
    children?: ReactNode;
  }

  export const QueryClientProvider: React.ComponentType<QueryClientProviderProps>;

  export interface UseQueryOptions<TData = unknown, TError = Error> {
    queryKey: any[];
    queryFn: () => Promise<TData>;
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    retry?: number | boolean;
    refetchOnWindowFocus?: boolean;
    refetchInterval?: number | false;
    [key: string]: any;
  }

  export interface UseQueryResult<TData = unknown, TError = Error> {
    data: TData | undefined;
    error: TError | null;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    refetch: () => Promise<any>;
  }

  export function useQuery<TData = unknown, TError = Error>(
    options: UseQueryOptions<TData, TError>
  ): UseQueryResult<TData, TError>;

  export function useQueryClient(): QueryClient;

  export interface UseMutationOptions<TData = unknown, TError = Error, TVariables = void> {
    mutationFn: (variables: TVariables) => Promise<TData>;
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: TError, variables: TVariables) => void;
  }

  export interface UseMutationResult<TData = unknown, TError = Error, TVariables = void> {
    mutate: (variables: TVariables) => void;
    mutateAsync: (variables: TVariables) => Promise<TData>;
    data: TData | undefined;
    error: TError | null;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
  }

  export function useMutation<TData = unknown, TError = Error, TVariables = void>(
    options: UseMutationOptions<TData, TError, TVariables>
  ): UseMutationResult<TData, TError, TVariables>;
}



