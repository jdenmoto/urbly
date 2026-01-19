import { useMemo, useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import { useI18n } from '@/lib/i18n';

export default function DataTable<T>({
  columns,
  data,
  emptyState,
  pageSize = 10
}: {
  columns: ColumnDef<T>[];
  data: T[];
  emptyState?: ReactNode;
  pageSize?: number;
}) {
  const { t } = useI18n();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
  const pageCount = Math.ceil(data.length / pagination.pageSize);
  const pageInfo = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize + 1;
    const end = Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.length);
    return { start, end };
  }, [pagination.pageIndex, pagination.pageSize, data.length]);

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false
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
      <div className="flex items-center justify-between border-t border-fog-200 px-4 py-3 text-xs text-ink-600">
        <span>
          {data.length ? `${pageInfo.start}-${pageInfo.end} / ${data.length}` : '0'}
        </span>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-fog-200 px-2 py-1 text-xs font-semibold text-ink-700 disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t('common.prev')}
          </button>
          <span>
            {pageCount ? pagination.pageIndex + 1 : 0} / {pageCount || 1}
          </span>
          <button
            className="rounded-md border border-fog-200 px-2 py-1 text-xs font-semibold text-ink-700 disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t('common.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
