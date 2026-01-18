import type { ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';

export default function DataTable<T>({ columns, data, emptyState }: { columns: ColumnDef<T>[]; data: T[]; emptyState?: ReactNode }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  if (!data.length && emptyState) {
    return <div>{emptyState}</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-fog-200 bg-white shadow-soft">
      <table className="w-full text-left text-sm">
        <thead className="bg-fog-100 text-xs uppercase tracking-[0.16em] text-ink-500">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-3">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t border-fog-100">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-ink-700">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
