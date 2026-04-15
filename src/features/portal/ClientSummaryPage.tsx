import { useMemo } from 'react';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/app/Auth';
import type { AppUser } from '@/core/models/appUser';
import type { Building } from '@/core/models/building';
import type { ManagementCompany } from '@/core/models/managementCompany';
import { useList, useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import { formatServiceDateTime, getServiceOrderPriorityPill, getServiceOrderStatusLabel } from '@/features/services/serviceOrderPresentation';

const priorityTone: Record<string, string> = {
  urgent: 'bg-rose-50 text-rose-700',
  high: 'bg-amber-50 text-amber-700',
  medium: 'bg-sky-50 text-sky-700',
  low: 'bg-emerald-50 text-emerald-700'
};

export default function ClientSummaryPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: users = [] } = useList<AppUser>('users', 'users');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: serviceOrders = [] } = useServiceOrders();

  const currentUser = useMemo(() => users.find((item) => item.id === user?.uid), [users, user?.uid]);
  const administrationId = currentUser?.administrationId ?? null;
  const administration = useMemo(
    () => managements.find((company) => company.id === administrationId) ?? null,
    [managements, administrationId]
  );
  const scopedBuildings = useMemo(
    () => buildings.filter((building) => building.managementCompanyId === administrationId),
    [administrationId, buildings]
  );
  const scopedServiceOrders = useMemo(() => {
    const buildingIds = new Set(scopedBuildings.map((building) => building.id));
    return serviceOrders.filter((serviceOrder) => buildingIds.has(serviceOrder.buildingId));
  }, [scopedBuildings, serviceOrders]);

  const summary = useMemo(() => {
    const active = scopedServiceOrders.filter((item) => item.status !== 'completed' && item.status !== 'cancelled').length;
    const completed = scopedServiceOrders.filter((item) => item.status === 'completed').length;
    const upcoming = scopedServiceOrders
      .filter((item) => new Date(item.scheduledStartAt) >= new Date())
      .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime())
      .slice(0, 3);

    return { active, completed, upcoming };
  }, [scopedServiceOrders]);

  if (!administrationId) {
    return <EmptyState title={t('clientPortal.summaryTitle')} description={t('portal.missingAccess')} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('clientPortal.summaryTitle')}
        subtitle={administration ? `${t('clientPortal.summarySubtitle')} ${administration.name}` : t('clientPortal.summarySubtitle')}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label={t('clientPortal.activeServices')} value={summary.active} />
        <StatCard label={t('clientPortal.completedServices')} value={summary.completed} />
        <StatCard label={t('clientPortal.buildingsCount')} value={scopedBuildings.length} />
      </section>

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {t('clientPortal.clientViewBadge')}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink-900">{t('clientPortal.upcomingTitle')}</h2>
              <p className="max-w-2xl text-sm leading-6 text-ink-600">{t('clientPortal.upcomingSubtitle')}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-fog-200 bg-fog-50 px-4 py-3 text-sm text-ink-600">
            <p className="font-semibold text-ink-900">{summary.upcoming.length}</p>
            <p>{t('clientPortal.visibleWindowHint')}</p>
          </div>
        </div>

        {summary.upcoming.length ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {summary.upcoming.map((serviceOrder) => {
              const building = scopedBuildings.find((item) => item.id === serviceOrder.buildingId);
              return (
                <article key={serviceOrder.id} className="rounded-3xl border border-fog-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone[serviceOrder.priority] ?? priorityTone.medium}`}>
                      {getServiceOrderPriorityPill(t, serviceOrder.priority, 'clientPortal.priorityPill')}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <h3 className="text-lg font-semibold text-ink-900">{serviceOrder.title}</h3>
                    <p className="text-sm text-ink-600">{building?.name ?? t('common.noData')}</p>
                    <p className="text-sm text-ink-500">{formatServiceDateTime(serviceOrder.scheduledStartAt)}</p>
                  </div>
                  <div className="mt-4 rounded-2xl bg-fog-50 p-4 text-sm text-ink-600">
                    <p><span className="font-semibold text-ink-900">{t('services.statusLabel')}:</span> {getServiceOrderStatusLabel(t, serviceOrder.status)}</p>
                    <p className="mt-2"><span className="font-semibold text-ink-900">{t('services.issuesLabel')}:</span> {serviceOrder.issues?.length ?? 0}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title={t('clientPortal.upcomingTitle')} description={t('clientPortal.empty')} />
        )}
      </Card>
    </div>
  );
}
