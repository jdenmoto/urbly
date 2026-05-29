import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/app/Auth';
import type { AppUser } from '@/core/models/appUser';
import type { Building } from '@/core/models/building';
import type { ManagementCompany } from '@/core/models/managementCompany';
import type { ServiceOrder } from '@/core/models/serviceOrder';
import { useList } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import { useOperationalServiceOrders } from '@/features/services/useOperationalServiceOrders';
import {
  formatServiceDateTime,
  getServiceOrderPriorityPill,
  getServiceOrderStatusLabel,
  serviceOrderPriorityTone
} from '@/features/services/serviceOrderPresentation';

function getLastVisibleUpdate(serviceOrder: ServiceOrder) {
  const latestTimelineEvent = serviceOrder.timeline?.length ? serviceOrder.timeline[serviceOrder.timeline.length - 1] : null;
  return latestTimelineEvent?.createdAt ?? serviceOrder.completedAt ?? serviceOrder.updatedAt ?? serviceOrder.scheduledStartAt;
}

function getTraceabilitySummary(serviceOrder: ServiceOrder, t: (key: string, params?: Record<string, string | number>) => string) {
  const latestTimelineEvent = serviceOrder.timeline?.length ? serviceOrder.timeline[serviceOrder.timeline.length - 1] : null;
  if (latestTimelineEvent?.summary) return latestTimelineEvent.summary;
  if (serviceOrder.status === 'completed') return t('client.portal.traceability.summary.completed');
  if (serviceOrder.status === 'in_progress') return t('client.portal.traceability.summary.inProgress');
  return t('client.portal.traceability.summary.default', {
    status: getServiceOrderStatusLabel(t, serviceOrder.status)
  });
}

export default function ClientSummaryPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: users = [] } = useList<AppUser>('users', 'users');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: serviceOrders = [] } = useOperationalServiceOrders();

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
    const urgent = scopedServiceOrders.filter(
      (item) => item.status !== 'completed' && item.status !== 'cancelled' && item.priority === 'urgent'
    ).length;
    const active = scopedServiceOrders.filter((item) => item.status !== 'completed' && item.status !== 'cancelled').length;
    const completed = scopedServiceOrders.filter((item) => item.status === 'completed').length;
    const reportsReady = scopedServiceOrders.filter(
      (item) => item.status === 'completed' || item.review?.status === 'approved' || item.completionPhotos.length > 0
    ).length;
    const upcoming = scopedServiceOrders
      .filter((item) => new Date(item.scheduledStartAt) >= new Date())
      .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime())
      .slice(0, 3);
    const recent = [...scopedServiceOrders]
      .sort((a, b) => new Date(getLastVisibleUpdate(b)).getTime() - new Date(getLastVisibleUpdate(a)).getTime())
      .slice(0, 5);

    return { urgent, active, completed, reportsReady, upcoming, recent };
  }, [scopedServiceOrders]);

  if (!administrationId) {
    return <EmptyState title={t('client.portal.summary.title')} description={t('client.portal.missing.access')} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('client.portal.summary.title')}
        subtitle={administration ? `${t('client.portal.summary.subtitle')} ${administration.name}` : t('client.portal.summary.subtitle')}
        actions={
          <>
            <Link className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" to="/portal/services">
              {t('client.portal.actions.view.services')}
            </Link>
            <Link className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" to="/portal/reports">
              {t('client.portal.actions.view.reports')}
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('client.portal.metrics.ready.reports.label')} value={summary.reportsReady} hint={t('client.portal.metrics.ready.reports.hint')} />
        <StatCard label={t('client.portal.services.urgent.label')} value={summary.urgent} hint={t('client.portal.services.urgent.hint')} />
        <StatCard label={t('client.portal.active.services')} value={summary.active} hint={t('client.portal.metrics.active.hint')} />
        <StatCard label={t('client.portal.buildings.count')} value={scopedBuildings.length} hint={t('client.portal.metrics.buildings.hint')} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        <StatCard label={t('client.portal.completed.services')} value={summary.completed} hint={t('client.portal.metrics.completed.hint')} />
        <StatCard label={t('client.portal.metrics.upcoming.label')} value={summary.upcoming.length} hint={t('client.portal.metrics.upcoming.hint')} />
      </section>

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {t('client.portal.client.view.badge')}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink-900">{t('client.portal.upcoming.card.title')}</h2>
              <p className="max-w-2xl text-sm leading-6 text-ink-600">{t('client.portal.upcoming.card.subtitle')}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-fog-200 bg-fog-50 px-4 py-3 text-sm text-ink-600">
            <p className="font-semibold text-ink-900">{summary.upcoming.length}</p>
            <p>{t('client.portal.visible.window.hint')}</p>
          </div>
        </div>

        {summary.upcoming.length ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {summary.upcoming.map((serviceOrder) => {
              const building = scopedBuildings.find((item) => item.id === serviceOrder.buildingId);
              return (
                <article key={serviceOrder.id} className="rounded-3xl border border-fog-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${serviceOrderPriorityTone[serviceOrder.priority]}`}>
                      {getServiceOrderPriorityPill(t, serviceOrder.priority, 'client.portal.priority.pill')}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <h3 className="text-lg font-semibold text-ink-900">{serviceOrder.title}</h3>
                    <p className="text-sm text-ink-600">{building?.name ?? t('common.no.data')}</p>
                    <p className="text-sm text-ink-500">{formatServiceDateTime(serviceOrder.scheduledStartAt)}</p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-fog-50 p-4 text-sm text-ink-600">
                      <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.fields.status')}</p>
                      <p className="mt-1 font-semibold text-ink-900">{getServiceOrderStatusLabel(t, serviceOrder.status)}</p>
                    </div>
                    <div className="rounded-2xl bg-fog-50 p-4 text-sm text-ink-600">
                      <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.fields.issues')}</p>
                      <p className="mt-1 font-semibold text-ink-900">{serviceOrder.issues.length}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title={t('client.portal.upcoming.title')} description={t('client.portal.empty')} />
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,1fr]">
        <Card className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-ink-900">{t('client.portal.traceability.title')}</h2>
              <p className="text-sm leading-6 text-ink-600">{t('client.portal.traceability.subtitle')}</p>
            </div>
            <Link className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" to="/portal/services">
              {t('client.portal.traceability.action')}
            </Link>
          </div>
          {summary.recent.length ? (
            <div className="space-y-3">
              {summary.recent.map((serviceOrder) => {
                const building = scopedBuildings.find((item) => item.id === serviceOrder.buildingId);
                const latestTimelineEvent = serviceOrder.timeline?.length
                  ? serviceOrder.timeline[serviceOrder.timeline.length - 1]
                  : null;
                return (
                  <div key={serviceOrder.id} className="rounded-3xl border border-fog-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${serviceOrderPriorityTone[serviceOrder.priority]}`}>
                            {getServiceOrderPriorityPill(t, serviceOrder.priority, 'client.portal.priority.pill')}
                          </span>
                          <span className="rounded-full bg-fog-100 px-3 py-1 text-xs font-semibold text-ink-700">
                            {getServiceOrderStatusLabel(t, serviceOrder.status)}
                          </span>
                        </div>
                        <p className="font-semibold text-ink-900">{serviceOrder.title}</p>
                        <p className="text-sm text-ink-600">{building?.name ?? t('common.no.data')}</p>
                        <p className="text-sm text-ink-500">{getTraceabilitySummary(serviceOrder, t)}</p>
                      </div>
                      <div className="grid gap-2 text-sm text-ink-600 sm:grid-cols-2 lg:w-[20rem]">
                        <div className="rounded-2xl bg-fog-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.traceability.last.update')}</p>
                          <p className="mt-1 text-xs text-ink-600">{t('client.portal.traceability.updated.at')}</p>
                          <p className="font-semibold text-ink-900">{formatServiceDateTime(getLastVisibleUpdate(serviceOrder))}</p>
                        </div>
                        <div className="rounded-2xl bg-fog-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.traceability.visible.report')}</p>
                          <p className="mt-1 font-semibold text-ink-900">{serviceOrder.status === 'completed' || serviceOrder.completionPhotos.length ? t('client.portal.traceability.report.ready') : t('client.portal.traceability.report.preparing')}</p>
                        </div>
                        <div className="rounded-2xl bg-fog-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.traceability.evidence')}</p>
                          <p className="mt-1 font-semibold text-ink-900">{t('client.portal.traceability.photos.count', { count: serviceOrder.completionPhotos.length })}</p>
                        </div>
                        <div className="rounded-2xl bg-fog-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.traceability.trace.label')}</p>
                          <p className="mt-1 font-semibold text-ink-900">{latestTimelineEvent ? t('client.portal.traceability.trace.updated') : t('client.portal.traceability.trace.base')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title={t('client.portal.traceability.title')} description={t('client.portal.empty')} />
          )}
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-ink-900">{t('client.portal.building.coverage.title')}</h2>
              <p className="text-sm leading-6 text-ink-600">{t('client.portal.building.coverage.subtitle')}</p>
            </div>
            <Link className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" to="/portal/reports">
              {t('client.portal.building.coverage.action')}
            </Link>
          </div>
          {scopedBuildings.length ? (
            <div className="space-y-3">
              {scopedBuildings.slice(0, 6).map((building) => {
                const buildingOrders = scopedServiceOrders.filter((item) => item.buildingId === building.id);
                const activeCount = buildingOrders.filter((item) => item.status !== 'completed' && item.status !== 'cancelled').length;
                const reportCount = buildingOrders.filter((item) => item.status === 'completed' || item.completionPhotos.length > 0).length;
                return (
                  <div key={building.id} className="rounded-3xl border border-fog-200 bg-white p-4 shadow-sm">
                    <p className="font-semibold text-ink-900">{building.name}</p>
                    <p className="text-sm text-ink-600">{building.addressText || t('client.portal.building.coverage.no.address')}</p>
                    <div className="mt-3 grid gap-2 text-sm text-ink-600 sm:grid-cols-2">
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.building.coverage.active.services')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{activeCount}</p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.building.coverage.visible.reports')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{reportCount}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title={t('client.portal.building.coverage.title')} description={t('client.portal.building.coverage.empty.hint')} />
          )}
        </Card>
      </div>
    </div>
  );
}
