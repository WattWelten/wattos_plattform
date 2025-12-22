'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Conversation } from '@/lib/api';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface ConversationsTableProps {
  data: Conversation[];
  onSelectConversation: (id: string) => void;
}

export function ConversationsTable({
  data,
  onSelectConversation,
}: ConversationsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'startedAt', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<Conversation>[] = [
    {
      accessorKey: 'sessionId',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-2 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          aria-label="Nach Session ID sortieren"
        >
          Session ID
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('sessionId')}</div>
      ),
    },
    {
      accessorKey: 'startedAt',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-2 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          aria-label="Nach Startzeit sortieren"
        >
          Gestartet
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('startedAt'));
        return (
          <time dateTime={date.toISOString()}>
            {date.toLocaleString('de-DE')}
          </time>
        );
      },
    },
    {
      accessorKey: 'messageCount',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-2 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          aria-label="Nach Nachrichtenanzahl sortieren"
        >
          Nachrichten
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ),
    },
    {
      accessorKey: 'score',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-2 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          aria-label="Nach Score sortieren"
        >
          Score
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ),
      cell: ({ row }) => {
        const score = row.getValue('score') as number | undefined;
        return score ? `${(score * 100).toFixed(1)}%` : '-';
      },
    },
    {
      id: 'actions',
      header: 'Aktionen',
      cell: ({ row }) => (
        <button
          onClick={() => onSelectConversation(row.original.id)}
          className="text-primary-500 hover:text-primary-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1"
          aria-label={`Gespräch ${row.original.sessionId} wiederholen`}
        >
          Replay
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="overflow-x-auto">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Nach Session ID filtern..."
          value={(table.getColumn('sessionId')?.getFilterValue() as string) || ''}
          onChange={(e) =>
            table.getColumn('sessionId')?.setFilterValue(e.target.value)
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Nach Session ID filtern"
        />
      </div>
      <table className="w-full" role="table" aria-label="Gesprächsliste">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-gray-200">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  className="text-left py-3 px-4 text-sm font-medium text-gray-700"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="py-3 px-4 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.getRowModel().rows.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          Keine Gespräche gefunden
        </div>
      )}
    </div>
  );
}


