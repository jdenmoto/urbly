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
    <div className="overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    const indicatorMuted = !sorted;
                    return (
                      <th key={header.id} className="px-4 py-3 first:pl-5 last:pr-5">
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                            <span
                              className={`flex flex-col items-center leading-[10px] ${
                                indicatorMuted ? 'text-[10px] text-slate-300' : 'text-[10px] text-slate-600'
                              }`}
                            >
                              <span className={sorted === 'asc' ? 'text-slate-700' : ''}>▲</span>
                              <span className={sorted === 'desc' ? 'text-slate-700' : ''}>▼</span>
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
                <tr key={row.id} className="border-t border-slate-100 align-top">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-4 text-slate-700 first:pl-5 last:pr-5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {table.getRowModel().rows.map((row) => (
          <div key={row.id} className="bg-white px-4 py-4">
            <div className="space-y-3">
              {row.getVisibleCells().map((cell) => {
                const headerLabel = String(cell.column.columnDef.header ?? '');
                return (
                  <div key={cell.id} className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{headerLabel}</p>
                    <div className="mt-2 text-sm text-slate-700">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {data.length ? `${pageInfo.start}-${pageInfo.end} / ${data.length}` : '0'}
        </span>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t('common.prev')}
          </button>
          <span>
            {pageCount ? pagination.pageIndex + 1 : 0} / {pageCount || 1}
          </span>
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
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
