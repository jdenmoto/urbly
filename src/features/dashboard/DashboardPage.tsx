import { useMemo } from 'react';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import { useList, useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';

export default function DashboardPage() {
  const { t } = useI18n();
  const { data: serviceOrders = [] } = useServiceOrders();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');

  const summary = useMemo(() => {
    const now = new Date();
    return {
      active: serviceOrders.filter((item) => item.status === 'scheduled' || item.status === 'confirmed').length,
      urgent: serviceOrders.filter((item) => item.priority === 'urgent').length,
      overdue: serviceOrders.filter(
        (item) => item.status !== 'completed' && item.status !== 'cancelled' && new Date(item.scheduledStartAt) < now
      ).length,
      completed: serviceOrders.filter((item) => item.status === 'completed').length
    };
  }, [serviceOrders]);

  const nextOrders = useMemo(
    () =>
      serviceOrders
        .filter((item) => item.status !== 'completed' && item.status !== 'cancelled')
        .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime())
        .slice(0, 6),
    [serviceOrders]
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t('dashboardV2.title')} subtitle={t('dashboardV2.subtitle')} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('dashboardV2.activeServices')} value={summary.active} />
        <StatCard label={t('dashboardV2.overdueServices')} value={summary.overdue} />
        <StatCard label={t('dashboardV2.urgentServices')} value={summary.urgent} />
        <StatCard label={t('dashboardV2.completedServices')} value={summary.completed} />
      </div>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{t('dashboardV2.nextActions')}</h2>
          <p className="text-sm text-ink-600">{t('dashboardV2.nextActionsHint')}</p>
        </div>

        {nextOrders.length ? (
          <div className="space-y-3">
            {nextOrders.map((order) => {
              const building = buildings.find((item) => item.id === order.buildingId);
              const technician = employees.find((item) => item.id === order.assignedTechnicianId);
              return (
                <div key={order.id} className="rounded-xl border border-fog-200 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{order.title}</p>
                      <p className="text-sm text-ink-600">{building?.name ?? t('common.noData')}</p>
                    </div>
                    <p className="text-xs text-ink-500">{new Date(order.scheduledStartAt).toLocaleString('es-CO')}</p>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-ink-600 md:grid-cols-3">
                    <p><span className="font-semibold text-ink-900">{t('dashboardV2.technician')}:</span> {technician?.fullName ?? t('common.unassigned')}</p>
                    <p><span className="font-semibold text-ink-900">{t('dashboardV2.priority')}:</span> {order.priority}</p>
                    <p><span className="font-semibold text-ink-900">{t('dashboardV2.issues')}:</span> {order.issues?.length ?? 0}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title={t('dashboardV2.nextActions')} description={t('dashboardV2.empty')} />
        )}
      </Card>
    </div>
  );
}
