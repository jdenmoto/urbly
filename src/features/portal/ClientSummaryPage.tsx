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
    <div className="space-y-6">
      <PageHeader
        title={t('clientPortal.summaryTitle')}
        subtitle={administration ? `${t('clientPortal.summarySubtitle')} ${administration.name}` : t('clientPortal.summarySubtitle')}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t('clientPortal.activeServices')} value={summary.active} />
        <StatCard label={t('clientPortal.completedServices')} value={summary.completed} />
        <StatCard label={t('clientPortal.buildingsCount')} value={scopedBuildings.length} />
      </div>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{t('clientPortal.upcomingTitle')}</h2>
          <p className="text-sm text-ink-600">{t('clientPortal.upcomingSubtitle')}</p>
        </div>

        {summary.upcoming.length ? (
          <div className="space-y-3">
            {summary.upcoming.map((serviceOrder) => {
              const building = scopedBuildings.find((item) => item.id === serviceOrder.buildingId);
              return (
                <div key={serviceOrder.id} className="rounded-xl border border-fog-200 p-4">
                  <p className="text-sm font-semibold text-ink-900">{serviceOrder.title}</p>
                  <p className="text-sm text-ink-600">{building?.name ?? t('common.noData')}</p>
                  <p className="text-xs text-ink-500">{new Date(serviceOrder.scheduledStartAt).toLocaleString('es-CO')}</p>
                </div>
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
