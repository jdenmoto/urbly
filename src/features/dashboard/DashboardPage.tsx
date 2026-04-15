import { useMemo } from 'react';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import { useList, useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';

const priorityTone: Record<string, string> = {
  urgent: 'bg-rose-50 text-rose-700',
  high: 'bg-amber-50 text-amber-700',
  medium: 'bg-sky-50 text-sky-700',
  low: 'bg-emerald-50 text-emerald-700'
};

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
    <div className="space-y-8">
      <PageHeader title={t('dashboardV2.title')} subtitle={t('dashboardV2.subtitle')} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('dashboardV2.activeServices')} value={summary.active} />
        <StatCard label={t('dashboardV2.overdueServices')} value={summary.overdue} />
        <StatCard label={t('dashboardV2.urgentServices')} value={summary.urgent} />
        <StatCard label={t('dashboardV2.completedServices')} value={summary.completed} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr,1fr]">
        <Card className="space-y-6 p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {t('dashboardV2.prioritizedBadge')}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink-900">{t('dashboardV2.nextActions')}</h2>
                <p className="max-w-2xl text-sm leading-6 text-ink-600">{t('dashboardV2.nextActionsHint')}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-fog-200 bg-fog-50 px-4 py-3 text-sm text-ink-600">
              <p className="font-semibold text-ink-900">{nextOrders.length}</p>
              <p>{t('dashboardV2.prioritizedHint')}</p>
            </div>
          </div>

          {nextOrders.length ? (
            <div className="space-y-4">
              {nextOrders.map((order) => {
                const building = buildings.find((item) => item.id === order.buildingId);
                const technician = employees.find((item) => item.id === order.assignedTechnicianId);
                return (
                  <article
                    key={order.id}
                    className="rounded-3xl border border-fog-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-200"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone[order.priority] ?? priorityTone.medium}`}>
                            Prioridad {order.priority}
                          </span>
                          <span className="rounded-full bg-fog-100 px-3 py-1 text-xs font-semibold text-ink-700">
                            {order.status}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-ink-900">{order.title}</h3>
                          <p className="text-sm text-ink-600">{building?.name ?? t('common.noData')}</p>
                        </div>
                      </div>
                      <div className="text-sm text-ink-500">
                        {new Date(order.scheduledStartAt).toLocaleString('es-CO', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-ink-600 md:grid-cols-3">
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('dashboardV2.technician')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{technician?.fullName ?? t('common.unassigned')}</p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('dashboardV2.priority')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{order.priority}</p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('dashboardV2.issues')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{order.issues?.length ?? 0}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState title={t('dashboardV2.nextActions')} description={t('dashboardV2.empty')} />
          )}
        </Card>

        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{t('dashboardV2.pulseTitle')}</h2>
            <p className="text-sm text-ink-600">{t('dashboardV2.pulseSubtitle')}</p>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="text-xs uppercase tracking-wide text-rose-600">{t('dashboardV2.urgencyLabel')}</p>
              <p className="mt-1 text-2xl font-semibold text-rose-700">{summary.urgent}</p>
              <p className="mt-1 text-sm text-rose-700">{t('dashboardV2.urgencyHint')}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-600">{t('dashboardV2.riskLabel')}</p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">{summary.overdue}</p>
              <p className="mt-1 text-sm text-amber-700">{t('dashboardV2.riskHint')}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-600">{t('dashboardV2.deliveryLabel')}</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700">{summary.completed}</p>
              <p className="mt-1 text-sm text-emerald-700">{t('dashboardV2.deliveryHint')}</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
