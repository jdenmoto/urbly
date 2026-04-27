import { useMemo } from 'react';
import Button from '@/components/Button';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import type { ColumnDef } from '@tanstack/react-table';
import { useAuth } from '@/app/Auth';
import { useList } from '@/lib/api/queries';
import type { InternalNotification } from '@/core/models/internalNotification';
import { markInternalNotificationRead } from '@/lib/internalNotifications';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data: notifications = [] } = useList<InternalNotification>('internalNotifications', 'internal_notifications');

  const scoped = useMemo(
    () => notifications
      .filter((item) => !item.userId || item.userId === user?.uid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications, user?.uid]
  );

  const columns = useMemo<ColumnDef<InternalNotification>[]>(() => [
    { header: 'Fecha', cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('es-CO') },
    { header: 'Título', cell: ({ row }) => row.original.title },
    { header: 'Mensaje', cell: ({ row }) => row.original.message },
    { header: 'Estado', cell: ({ row }) => row.original.read ? 'Leída' : 'Pendiente' },
    { header: 'Acción', cell: ({ row }) => row.original.read ? '—' : <Button onClick={() => void markInternalNotificationRead(row.original.id)}>Marcar leída</Button> }
  ], []);

  return (
    <div className="space-y-6">
      <PageHeader title="Centro de notificaciones" subtitle="Alertas internas persistentes del sistema" />
      {scoped.length ? <DataTable columns={columns} data={scoped} /> : <EmptyState title="Notificaciones" description="No hay alertas registradas." />}
    </div>
  );
}
