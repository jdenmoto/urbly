import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const pageCount = Math.ceil(data.length / pagination.pageSize);
  const pageInfo = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize + 1;
    const end = Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.length);
    return { start, end };
  }, [pagination.pageIndex, pagination.pageSize, data.length]);

  const table = useReactTable({
    data,
    columns,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: false,
    autoResetPageIndex: false
  });

  useEffect(() => {
    const maxPageIndex = Math.max(Math.ceil(data.length / pagination.pageSize) - 1, 0);
    if (pagination.pageIndex > maxPageIndex) {
      setPagination((prev) => ({ ...prev, pageIndex: maxPageIndex }));
    }
  }, [data.length, pagination.pageIndex, pagination.pageSize]);

  if (!data.length && emptyState) {
    return <div>{emptyState}</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-fog-200 bg-white shadow-soft">
      <table className="w-full text-left text-sm">
        <thead className="bg-fog-100 text-xs uppercase tracking-[0.16em] text-ink-500">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                const indicatorMuted = !sorted;
                return (
                  <th key={header.id} className="px-4 py-3">
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-ink-500"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        <span
                          className={`flex flex-col items-center leading-[10px] ${
                            indicatorMuted ? 'text-[10px] text-ink-300' : 'text-[10px] text-ink-600'
                          }`}
                        >
                          <span className={sorted === 'asc' ? 'text-ink-700' : ''}>▲</span>
                          <span className={sorted === 'desc' ? 'text-ink-700' : ''}>▼</span>
                        </span>
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
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
