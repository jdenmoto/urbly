import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import Button from '@/components/Button';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useList } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import type { AuditEvent } from '@/core/models/audit';

function downloadCsv(rows: AuditEvent[]) {
  const header = ['fecha', 'entidad', 'entityId', 'accion', 'resumen', 'actorUid'];
  const body = rows.map((row) => [
    row.createdAt,
    row.entityType,
    row.entityId,
    row.action,
    (row.summary ?? '').replace(/\n/g, ' '),
    row.actor?.uid ?? ''
  ]);
  const csv = [header, ...body].map((line) => line.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'audit-events.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { t } = useI18n();
  const { data: auditEvents = [] } = useList<AuditEvent>('auditEvents', 'audit_events');

  const sortedAuditEvents = useMemo(
    () => [...auditEvents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [auditEvents]
  );

  const columns = useMemo<ColumnDef<AuditEvent>[]>(() => [
    { header: t('reports.audit.columns.date'), cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('es-CO') },
    { header: t('reports.audit.columns.entity'), cell: ({ row }) => row.original.entityType },
    { header: t('reports.audit.columns.action'), cell: ({ row }) => row.original.action },
    { header: t('reports.audit.columns.summary'), cell: ({ row }) => row.original.summary },
    { header: t('reports.audit.columns.actor'), cell: ({ row }) => row.original.actor?.uid ?? t('reports.audit.system') }
  ], [t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t('reports.title')} subtitle={t('reports.audit.subtitle')} />
      <div className="flex justify-end">
        <Button onClick={() => downloadCsv(sortedAuditEvents)} disabled={!sortedAuditEvents.length}>{t('reports.audit.export.csv')}</Button>
      </div>
      {sortedAuditEvents.length ? (
        <DataTable columns={columns} data={sortedAuditEvents} />
      ) : (
        <EmptyState title={t('reports.audit.title')} description={t('reports.audit.empty')} />
      )}
    </div>
  );
}
