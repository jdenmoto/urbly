import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/app/Auth';
import type { AppUser } from '@/core/models/appUser';
import type { Building } from '@/core/models/building';
import type { ManagementCompany } from '@/core/models/managementCompany';
import { useList } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import { useOperationalServiceOrders } from '@/features/services/useOperationalServiceOrders';
import type { TranslateFn } from '@/features/services/serviceOrderPresentation';
import {
  formatServiceDateTime,
  getServiceOrderPriorityPill,
  getServiceOrderStatusLabel,
  getServiceOrderTypeLabel,
  serviceOrderPriorityTone
} from '@/features/services/serviceOrderPresentation';
import {
  filterClientServiceOrders,
  getClientScopedBuildings,
  getClientServiceLastUpdate,
  getClientVisibleServiceOrders,
  sortClientServicesByPriority,
  type ClientServiceFilter
} from './clientServices';

const filterLabelKeys: Record<ClientServiceFilter, string> = {
  all: 'client.portal.services.filters.all',
  active: 'client.portal.services.filters.active',
  completed: 'client.portal.services.filters.completed'
};

function getVisibleTimelineSummary(
  serviceOrder: ReturnType<typeof useOperationalServiceOrders>['data'][number],
  t: TranslateFn
) {
  const latestTimelineEvent = serviceOrder.timeline.length
    ? serviceOrder.timeline[serviceOrder.timeline.length - 1]
    : null;
  if (latestTimelineEvent?.summary) return latestTimelineEvent.summary;
  if (serviceOrder.status === 'completed') return t('client.portal.services.timeline.completed');
  if (serviceOrder.status === 'in_progress') return t('client.portal.services.timeline.inProgress');
  return t('client.portal.services.timeline.default');
}

export default function ClientServicesPage() {
  const { t } = useI18n();
  const { user, administrationId: authAdministrationId } = useAuth();
  const { data: users = [] } = useList<AppUser>('users', 'users');
  const { data: managements = [] } = useList<ManagementCompany>(
    'managements',
    'management_companies'
  );
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: serviceOrders = [] } = useOperationalServiceOrders();
  const [filter, setFilter] = useState<ClientServiceFilter>('active');

  const currentUser = useMemo(
    () => users.find((item) => item.id === user?.uid),
    [users, user?.uid]
  );
  const administrationId = currentUser?.administrationId ?? authAdministrationId ?? null;
  const administration = useMemo(
    () => managements.find((company) => company.id === administrationId) ?? null,
    [administrationId, managements]
  );
  const scopedBuildings = useMemo(
    () => getClientScopedBuildings(buildings, administrationId),
    [administrationId, buildings]
  );
  const visibleServices = useMemo(
    () =>
      sortClientServicesByPriority(
        getClientVisibleServiceOrders(serviceOrders, scopedBuildings, administrationId)
      ),
    [administrationId, scopedBuildings, serviceOrders]
  );
  const filteredServices = useMemo(
    () => filterClientServiceOrders(visibleServices, filter),
    [filter, visibleServices]
  );

  const summary = useMemo(() => {
    const active = filterClientServiceOrders(visibleServices, 'active').length;
    const completed = filterClientServiceOrders(visibleServices, 'completed').length;
    const urgent = visibleServices.filter(
      (serviceOrder) => serviceOrder.priority === 'urgent' && serviceOrder.status !== 'completed'
    ).length;
    const evidence = visibleServices.reduce(
      (total, serviceOrder) => total + serviceOrder.completionPhotos.length,
      0
    );
    return { active, completed, urgent, evidence };
  }, [visibleServices]);

  if (!administrationId) {
    return (
      <EmptyState
        title={t('client.portal.services.title')}
        description={t('portal.missing.access')}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('client.portal.services.title')}
        subtitle={
          administration
            ? t('client.portal.services.subtitleScoped', { administration: administration.name })
            : t('client.portal.services.subtitle')
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              to="/portal"
            >
              {t('client.portal.nav.summary')}
            </Link>
            <Link
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              to="/portal/reports"
            >
              {t('client.portal.nav.reports')}
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('client.portal.active.services')}
          value={summary.active}
          hint={t('client.portal.services.active.hint')}
        />
        <StatCard
          label={t('client.portal.completed.services')}
          value={summary.completed}
          hint={t('client.portal.services.completed.hint')}
        />
        <StatCard
          label={t('client.portal.services.urgent.label')}
          value={summary.urgent}
          hint={t('client.portal.services.urgent.hint')}
        />
        <StatCard
          label={t('client.portal.services.evidence.label')}
          value={summary.evidence}
          hint={t('client.portal.services.evidence.hint')}
        />
      </section>

      <Card className="space-y-5 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {t('client.portal.client.view.badge')}
            </div>
            <h2 className="mt-3 text-xl font-semibold text-ink-900">
              {t('client.portal.services.visibleOperation.title')}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-ink-600">
              {t('client.portal.services.visibleOperation.description')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(filterLabelKeys) as ClientServiceFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === item
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t(filterLabelKeys[item])}
              </button>
            ))}
          </div>
        </div>

        {filteredServices.length ? (
          <div className="space-y-4">
            {filteredServices.map((serviceOrder) => {
              const building = scopedBuildings.find((item) => item.id === serviceOrder.buildingId);
              const latestUpdate = getClientServiceLastUpdate(serviceOrder);
              return (
                <article
                  key={serviceOrder.id}
                  className="rounded-3xl border border-fog-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${serviceOrderPriorityTone[serviceOrder.priority]}`}
                        >
                          {getServiceOrderPriorityPill(
                            t,
                            serviceOrder.priority,
                            'client.portal.priority.pill'
                          )}
                        </span>
                        <span className="rounded-full bg-fog-100 px-3 py-1 text-xs font-semibold text-ink-700">
                          {getServiceOrderStatusLabel(t, serviceOrder.status)}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-600 ring-1 ring-fog-200">
                          {getServiceOrderTypeLabel(t, serviceOrder.type)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-ink-900">{serviceOrder.title}</h3>
                        <p className="text-sm text-ink-600">
                          {building?.name ?? t('common.no.data')}
                        </p>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600">
                          {getVisibleTimelineSummary(serviceOrder, t)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm text-ink-600 sm:grid-cols-2 xl:w-[27rem]">
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">
                          {t('client.portal.services.scheduled.label')}
                        </p>
                        <p className="mt-1 font-semibold text-ink-900">
                          {formatServiceDateTime(serviceOrder.scheduledStartAt)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">
                          {t('client.portal.services.lastUpdate.label')}
                        </p>
                        <p className="mt-1 font-semibold text-ink-900">
                          {formatServiceDateTime(latestUpdate)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">
                          {t('services.issues.label')}
                        </p>
                        <p className="mt-1 font-semibold text-ink-900">
                          {serviceOrder.issues.length}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">
                          {t('client.portal.services.evidence.label')}
                        </p>
                        <p className="mt-1 font-semibold text-ink-900">
                          {t('client.portal.reports.photos.count', {
                            count: serviceOrder.completionPhotos.length
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={t('client.portal.services.empty.title')}
            description={t('client.portal.services.empty.description')}
          />
        )}
      </Card>
    </div>
  );
}
