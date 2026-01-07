// Type declarations for @tanstack/react-table
// Workaround for TypeScript module resolution issues with pnpm
declare module '@tanstack/react-table' {
  import * as React from 'react';

  export interface ColumnDef<TData = any, TValue = any> {
    id?: string;
    accessorKey?: string;
    header?: string | ((props: any) => React.ReactNode);
    cell?: (props: any) => React.ReactNode;
    enableSorting?: boolean;
    enableFiltering?: boolean;
  }

  export interface TableOptions<TData = any> {
    data: TData[];
    columns: ColumnDef<TData>[];
    getCoreRowModel?: any;
    getSortedRowModel?: any;
    getFilteredRowModel?: any;
    enableSorting?: boolean;
    enableFiltering?: boolean;
    onSortingChange?: (updater: any) => void;
    [key: string]: any;
  }

  export interface TableInstance<TData = any> {
    getHeaderGroups: () => any[];
    getRowModel: () => { rows: Row<TData>[] };
    getCanPreviousPage: () => boolean;
    getCanNextPage: () => boolean;
    previousPage: () => void;
    nextPage: () => void;
    setPageIndex: (index: number) => void;
    getPageCount: () => number;
    getState: () => any;
    setGlobalFilter: (filter: string) => void;
    getColumn: (columnId: string) => Column<TData> | undefined;
    [key: string]: any;
  }

  export interface Row<TData = any> {
    id: string;
    original: TData;
    getValue: (columnId: string) => any;
    getAllCells: () => Cell<TData>[];
    getVisibleCells: () => Cell<TData>[];
  }

  export interface Cell<TData = any> {
    id: string;
    getValue: () => any;
    renderValue: () => any;
    column: Column<TData>;
  }

  export interface Column<TData = any> {
    id: string;
    columnDef: ColumnDef<TData>;
    setFilterValue: (value: any) => void;
    getFilterValue: () => any;
    [key: string]: any;
  }

  export type SortingState = Array<{ id: string; desc?: boolean }>;
  export type ColumnFiltersState = Array<{ id: string; value: any }>;

  export function useReactTable<TData = any>(options: TableOptions<TData>): TableInstance<TData>;
  export function flexRender(component: any, context: any): React.ReactNode;
  export function getCoreRowModel<TData = any>(): any;
  export function getSortedRowModel<TData = any>(): any;
  export function getFilteredRowModel<TData = any>(): any;
}


