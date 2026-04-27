import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { CancelIcon, TrashIcon, CheckIcon, EditIcon } from '@/components/ActionIcons';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import type { SchedulingItem } from './schedulingItem';

export default function useSchedulingListColumns({
  t,
  buildings,
  employees,
  canEdit,
  statusLabels,
  startEdit,
  openCancel,
  setDeleteTarget,
  goToCloseout
}: {
  t: (key: string) => string;
  buildings: Building[];
  employees: Employee[];
  canEdit: boolean;
  statusLabels: Record<SchedulingItem['status'], string>;
  startEdit: (item: SchedulingItem) => void;
  openCancel: (item: SchedulingItem) => void;
  setDeleteTarget: (item: SchedulingItem) => void;
  goToCloseout: (item: SchedulingItem) => void;
}) {
  return useMemo<ColumnDef<SchedulingItem>[]>(() => {
    const base: ColumnDef<SchedulingItem>[] = [
      { header: t('scheduling.titleLabel'), accessorKey: 'title', enableSorting: true },
      {
        header: t('scheduling.building'),
        enableSorting: true,
        accessorFn: (row) => buildings.find((b) => b.id === row.buildingId)?.name ?? t('common.noData')
      },
      {
        header: t('scheduling.employee'),
        enableSorting: true,
        accessorFn: (row) =>
          row.employeeId
            ? employees.find((employee) => employee.id === row.employeeId)?.fullName ?? t('common.noData')
            : t('common.unassigned')
      },
      { header: t('scheduling.startAt'), accessorKey: 'startAt', enableSorting: true },
      {
        header: t('scheduling.status'),
        accessorKey: 'status',
        enableSorting: true,
        cell: ({ row }) => statusLabels[row.original.status] ?? row.original.status
      }
    ];

    if (!canEdit) return base;

    return [
      ...base,
      {
        header: t('common.actions'),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center justify-center rounded-md border border-fog-200 p-1 text-ink-700 hover:border-ink-900"
              onClick={() => startEdit(row.original)}
              title={t('common.edit')}
              aria-label={t('common.edit')}
            >
              <EditIcon className="h-4 w-4" aria-hidden />
            </button>
            {row.original.status !== 'completado' && row.original.status !== 'cancelado' ? (
              <button
                className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-emerald-600 hover:bg-emerald-50"
                onClick={() => goToCloseout(row.original)}
                title={t('scheduling.complete')}
                aria-label={t('scheduling.complete')}
              >
                <CheckIcon className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
            {row.original.status !== 'cancelado' ? (
              <button
                className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-amber-600 hover:bg-amber-50"
                onClick={() => openCancel(row.original)}
                title={t('scheduling.cancel')}
                aria-label={t('scheduling.cancel')}
              >
                <CancelIcon className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
            <button
              className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-rose-600 hover:bg-rose-50"
              onClick={() => setDeleteTarget(row.original)}
              title={t('common.delete')}
              aria-label={t('common.delete')}
            >
              <TrashIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )
      }
    ];
  }, [buildings, employees, t, canEdit, statusLabels, startEdit, openCancel, setDeleteTarget, goToCloseout]);
}
