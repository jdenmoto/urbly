import { useMemo } from 'react';
import Button from '@/components/Button';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import type { ColumnDef } from '@tanstack/react-table';
import { useAuth } from '@/app/Auth';
import { useList } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import type { InternalNotification } from '@/core/models/internalNotification';
import { markInternalNotificationRead } from '@/lib/internalNotifications';

export default function NotificationsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: notifications = [] } = useList<InternalNotification>('internalNotifications', 'internal_notifications');

  const scoped = useMemo(
    () => notifications
      .filter((item) => !item.userId || item.userId === user?.uid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications, user?.uid]
  );

  const columns = useMemo<ColumnDef<InternalNotification>[]>(() => [
    { header: t('notifications.columns.date'), cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('es-CO') },
    { header: t('notifications.columns.title'), cell: ({ row }) => row.original.title },
    { header: t('notifications.columns.message'), cell: ({ row }) => row.original.message },
    { header: t('notifications.columns.status'), cell: ({ row }) => row.original.read ? t('notifications.status.read') : t('notifications.status.pending') },
    { header: t('notifications.columns.action'), cell: ({ row }) => row.original.read ? '—' : <Button onClick={() => void markInternalNotificationRead(row.original.id)}>{t('notifications.mark.read')}</Button> }
  ], [t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t('notifications.title')} subtitle={t('notifications.subtitle')} />
      {scoped.length ? <DataTable columns={columns} data={scoped} /> : <EmptyState title={t('notifications.empty.title')} description={t('notifications.empty.description')} />}
    </div>
  );
}
