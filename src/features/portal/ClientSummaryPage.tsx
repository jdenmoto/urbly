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
  if (serviceOrder.status === 'completed') return 'Servicio completado y listo para revisar evidencia e informe.';
  if (serviceOrder.status === 'in_progress') return 'Servicio en curso con seguimiento activo.';
  return `Estado actual: ${getServiceOrderStatusLabel(t, serviceOrder.status)}.`;
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

    return { active, completed, reportsReady, upcoming, recent };
  }, [scopedServiceOrders]);

  if (!administrationId) {
    return <EmptyState title={t('clientPortal.summaryTitle')} description={t('portal.missingAccess')} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('clientPortal.summaryTitle')}
        subtitle={administration ? `${t('clientPortal.summarySubtitle')} ${administration.name}` : t('clientPortal.summarySubtitle')}
        actions={
          <>
            <Link className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" to="/portal/services">
              Ver servicios
            </Link>
            <Link className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" to="/portal/reports">
              Ver informes
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('clientPortal.activeServices')} value={summary.active} hint="Seguimiento en curso" />
        <StatCard label={t('clientPortal.completedServices')} value={summary.completed} hint="Histórico reciente" />
        <StatCard label={t('clientPortal.buildingsCount')} value={scopedBuildings.length} hint="Cobertura visible" />
        <StatCard label="Informes listos" value={summary.reportsReady} hint="Con evidencia o cierre visible" />
      </section>

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {t('clientPortal.clientViewBadge')}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink-900">Próximos servicios</h2>
              <p className="max-w-2xl text-sm leading-6 text-ink-600">Lo siguiente que deberías tener en el radar sin entrar al backoffice.</p>
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
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${serviceOrderPriorityTone[serviceOrder.priority]}`}>
                      {getServiceOrderPriorityPill(t, serviceOrder.priority, 'clientPortal.priorityPill')}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <h3 className="text-lg font-semibold text-ink-900">{serviceOrder.title}</h3>
                    <p className="text-sm text-ink-600">{building?.name ?? t('common.noData')}</p>
                    <p className="text-sm text-ink-500">{formatServiceDateTime(serviceOrder.scheduledStartAt)}</p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-fog-50 p-4 text-sm text-ink-600">
                      <p className="text-xs uppercase tracking-wide text-ink-500">Estado</p>
                      <p className="mt-1 font-semibold text-ink-900">{getServiceOrderStatusLabel(t, serviceOrder.status)}</p>
                    </div>
                    <div className="rounded-2xl bg-fog-50 p-4 text-sm text-ink-600">
                      <p className="text-xs uppercase tracking-wide text-ink-500">Novedades</p>
                      <p className="mt-1 font-semibold text-ink-900">{serviceOrder.issues.length}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title={t('clientPortal.upcomingTitle')} description={t('clientPortal.empty')} />
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,1fr]">
        <Card className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-ink-900">Trazabilidad reciente</h2>
              <p className="text-sm leading-6 text-ink-600">Últimos movimientos visibles para entender estado, evidencia y siguiente revisión.</p>
            </div>
            <Link className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" to="/portal/services">
              Ver operación
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
                            {getServiceOrderPriorityPill(t, serviceOrder.priority, 'clientPortal.priorityPill')}
                          </span>
                          <span className="rounded-full bg-fog-100 px-3 py-1 text-xs font-semibold text-ink-700">
                            {getServiceOrderStatusLabel(t, serviceOrder.status)}
                          </span>
                        </div>
                        <p className="font-semibold text-ink-900">{serviceOrder.title}</p>
                        <p className="text-sm text-ink-600">{building?.name ?? t('common.noData')}</p>
                        <p className="text-sm text-ink-500">{getTraceabilitySummary(serviceOrder, t)}</p>
                      </div>
                      <div className="grid gap-2 text-sm text-ink-600 sm:grid-cols-2 lg:w-[20rem]">
                        <div className="rounded-2xl bg-fog-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-ink-500">Última actualización</p>
                          <p className="mt-1 font-semibold text-ink-900">{formatServiceDateTime(getLastVisibleUpdate(serviceOrder))}</p>
                        </div>
                        <div className="rounded-2xl bg-fog-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-ink-500">Informe visible</p>
                          <p className="mt-1 font-semibold text-ink-900">{serviceOrder.status === 'completed' || serviceOrder.completionPhotos.length ? 'Disponible' : 'En preparación'}</p>
                        </div>
                        <div className="rounded-2xl bg-fog-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-ink-500">Evidencia</p>
                          <p className="mt-1 font-semibold text-ink-900">{serviceOrder.completionPhotos.length} fotos</p>
                        </div>
                        <div className="rounded-2xl bg-fog-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-ink-500">Traza</p>
                          <p className="mt-1 font-semibold text-ink-900">{latestTimelineEvent ? 'Actualizada' : 'Base mínima'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Trazabilidad reciente" description={t('clientPortal.empty')} />
          )}
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-ink-900">Cobertura por edificio</h2>
              <p className="text-sm leading-6 text-ink-600">Acceso rápido para ubicar sedes activas y las que ya tienen entregables visibles.</p>
            </div>
            <Link className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" to="/portal/reports">
              Ver reportes
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
                    <p className="text-sm text-ink-600">{building.addressText || 'Sin dirección registrada'}</p>
                    <div className="mt-3 grid gap-2 text-sm text-ink-600 sm:grid-cols-2">
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">Servicios activos</p>
                        <p className="mt-1 font-semibold text-ink-900">{activeCount}</p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">Informes visibles</p>
                        <p className="mt-1 font-semibold text-ink-900">{reportCount}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Cobertura por edificio" description={t('portal.buildingsEmptyHint')} />
          )}
        </Card>
      </div>
    </div>
  );
}
