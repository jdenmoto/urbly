import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
const BuildingsMap = lazy(() => import('@/components/BuildingsMap'));
import { useList } from '@/lib/api/queries';
import type { ManagementCompany } from '@/core/models/managementCompany';
import type { Building } from '@/core/models/building';
import type { AppUser } from '@/core/models/appUser';
import type { ServiceOrder } from '@/core/models/serviceOrder';
import { useAuth } from '@/app/Auth';
import { loadGoogleMaps } from '@/lib/googleMaps';
import { useI18n } from '@/lib/i18n';
import type { ColumnDef } from '@tanstack/react-table';
import {
  formatServiceDateTime,
  getServiceOrderPriorityPill,
  getServiceOrderStatusLabel,
  getServiceOrderTypeLabel,
  serviceOrderPriorityTone
} from '@/features/services/serviceOrderPresentation';
import { useOperationalServiceOrders } from '@/features/services/useOperationalServiceOrders';

function getLastPortalUpdate(order: ServiceOrder) {
  const latestTimelineEvent = order.timeline?.length ? order.timeline[order.timeline.length - 1] : null;
  return latestTimelineEvent?.createdAt ?? order.completedAt ?? order.updatedAt ?? order.scheduledStartAt;
}

export default function BuildingAdminPage() {
  const { t } = useI18n();
  const location = useLocation();
  const { user } = useAuth();
  const { data: users = [] } = useList<AppUser>('users', 'users');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: serviceOrders = [] } = useOperationalServiceOrders();
  const [mapsReady, setMapsReady] = useState(false);

  const currentUser = useMemo(() => users.find((item) => item.id === user?.uid), [users, user?.uid]);
  const administrationId = currentUser?.administrationId ?? null;

  const administration = useMemo(
    () => managements.find((company) => company.id === administrationId) ?? null,
    [managements, administrationId]
  );

  const scopedBuildings = useMemo(
    () =>
      buildings.filter(
        (building) => building.managementCompanyId === administrationId && Boolean(building.contractId)
      ),
    [buildings, administrationId]
  );

  const scopedServiceOrders = useMemo(() => {
    const buildingIds = new Set(scopedBuildings.map((building) => building.id));
    return serviceOrders.filter((serviceOrder) => buildingIds.has(serviceOrder.buildingId));
  }, [serviceOrders, scopedBuildings]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      loadGoogleMaps(apiKey)
        .then(() => setMapsReady(true))
        .catch(() => setMapsReady(false));
    }
  }, []);

  const buildingColumns = useMemo<ColumnDef<Building>[]>(
    () => [
      { header: t('buildings.name'), accessorKey: 'name', enableSorting: true },
      { header: t('buildings.address'), accessorKey: 'addressText', enableSorting: true },
      {
        header: t('buildings.status'),
        accessorKey: 'active',
        enableSorting: true,
        cell: ({ row }) => (row.original.active === false ? t('buildings.disabled') : t('buildings.active'))
      }
    ],
    [t]
  );

  const serviceOrderColumns = useMemo<ColumnDef<(typeof scopedServiceOrders)[number]>[]>(
    () => [
      { header: t('scheduling.titleLabel'), accessorKey: 'title', enableSorting: false },
      {
        header: t('services.typeLabel'),
        enableSorting: false,
        cell: ({ row }) => getServiceOrderTypeLabel(t, row.original.type)
      },
      {
        header: t('scheduling.building'),
        enableSorting: false,
        accessorFn: (row) => scopedBuildings.find((b) => b.id === row.buildingId)?.name ?? t('common.noData')
      },
      {
        header: t('scheduling.startAt'),
        enableSorting: false,
        cell: ({ row }) => formatServiceDateTime(row.original.scheduledStartAt)
      },
      {
        header: t('scheduling.endAt'),
        enableSorting: false,
        cell: ({ row }) => formatServiceDateTime(row.original.scheduledEndAt)
      },
      {
        header: t('scheduling.status'),
        enableSorting: false,
        cell: ({ row }) => getServiceOrderStatusLabel(t, row.original.status)
      }
    ],
    [t, scopedBuildings]
  );

  const portalMode = location.pathname.endsWith('/reports') ? 'reports' : location.pathname.endsWith('/services') ? 'services' : 'overview';
  const activeServices = scopedServiceOrders.filter((item) => item.status !== 'completed' && item.status !== 'cancelled');
  const completedServices = scopedServiceOrders.filter((item) => item.status === 'completed');
  const visibleOrders = useMemo(() => {
    if (portalMode === 'reports') {
      return [...completedServices]
        .sort((a, b) => new Date(getLastPortalUpdate(b)).getTime() - new Date(getLastPortalUpdate(a)).getTime())
        .slice(0, 8);
    }

    if (portalMode === 'services') {
      return [...activeServices]
        .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime())
        .slice(0, 8);
    }

    return [...scopedServiceOrders]
      .sort((a, b) => new Date(getLastPortalUpdate(b)).getTime() - new Date(getLastPortalUpdate(a)).getTime())
      .slice(0, 8);
  }, [activeServices, completedServices, portalMode, scopedServiceOrders]);

  const reportsReadyCount = completedServices.filter((item) => item.completionPhotos.length > 0 || item.report?.observations).length;
  const visibleEvidenceCount = completedServices.reduce((total, item) => total + item.completionPhotos.length, 0);
  const upcomingServicesCount = activeServices.filter((item) => new Date(item.scheduledStartAt) >= new Date()).length;

  const portalStats =
    portalMode === 'reports'
      ? [
          { label: 'Órdenes cerradas', value: completedServices.length, hint: 'Histórico visible' },
          { label: 'Informes listos', value: reportsReadyCount, hint: 'Con evidencia o cierre' },
          { label: 'Evidencia visible', value: visibleEvidenceCount, hint: 'Fotos publicadas' }
        ]
      : portalMode === 'services'
        ? [
            { label: 'Servicios activos', value: activeServices.length, hint: 'Seguimiento en curso' },
            { label: 'Próximos servicios', value: upcomingServicesCount, hint: 'Pendientes de ejecutar' },
            { label: 'Edificios cubiertos', value: scopedBuildings.length, hint: 'Cobertura actual' }
          ]
        : [
            { label: 'Edificios visibles', value: scopedBuildings.length, hint: 'Cobertura actual' },
            { label: 'Servicios activos', value: activeServices.length, hint: 'Operación en curso' },
            { label: 'Servicios completados', value: completedServices.length, hint: 'Base de reportes' }
          ];

  if (!administrationId) {
    return (
      <Card>
        <p className="text-sm text-ink-600">{t('portal.missingAccess')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={portalMode === 'reports' ? 'Reportes y cierres' : portalMode === 'services' ? 'Servicios en curso' : t('portal.title')}
        subtitle={portalMode === 'reports' ? 'Entregables visibles y cierre reciente por servicio.' : portalMode === 'services' ? 'Seguimiento operativo básico para cliente y administración.' : t('portal.subtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" to="/portal">
              Resumen
            </Link>
            <Link className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" to="/portal/services">
              Operación
            </Link>
            <Link className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" to="/portal/reports">
              Reportes
            </Link>
          </div>
        }
      />
      {administration ? (
        <Card>
          <div className="space-y-2 text-sm text-ink-700">
            <p className="text-base font-semibold text-ink-900">{administration.name}</p>
            <p>
              <span className="font-semibold text-ink-900">{t('management.email')}:</span> {administration.email}
            </p>
            <p>
              <span className="font-semibold text-ink-900">{t('management.contactPhone')}:</span>{' '}
              {administration.contactPhone}
            </p>
            <p>
              <span className="font-semibold text-ink-900">{t('management.address')}:</span>{' '}
              {administration.address}
            </p>
          </div>
        </Card>
      ) : null}
      <section className="grid gap-4 md:grid-cols-3">
        {portalStats.map((item) => (
          <Card key={item.label}>
            <div className="space-y-1 p-1">
              <p className="text-sm text-ink-600">{item.label}</p>
              <p className="text-2xl font-semibold text-ink-900">{item.value}</p>
              <p className="text-xs text-ink-500">{item.hint}</p>
            </div>
          </Card>
        ))}
      </section>
      {portalMode !== 'reports' ? (
        <div className="space-y-4">
          <Suspense fallback={<div className="rounded-3xl border border-fog-200 bg-white p-6 text-sm text-ink-600">{t('common.loading')}</div>}>
            <BuildingsMap buildings={scopedBuildings} ready={mapsReady} />
          </Suspense>
          <DataTable
            columns={buildingColumns}
            data={scopedBuildings}
            emptyState={<EmptyState title={t('portal.buildingsEmpty')} description={t('portal.buildingsEmptyHint')} />}
          />
        </div>
      ) : null}
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">{portalMode === 'reports' ? 'Entregables visibles' : portalMode === 'services' ? 'Servicios priorizados' : 'Órdenes visibles'}</h2>
          <p className="text-sm leading-6 text-ink-600">
            {portalMode === 'reports'
              ? 'Cada tarjeta muestra el cierre visible, evidencia y última actualización relevante.'
              : portalMode === 'services'
                ? 'Seguimiento mínimo para entender qué está ocurriendo y qué requiere atención primero.'
                : 'Resumen operativo corto para revisar estado, sedes y trazabilidad sin entrar al backoffice.'}
          </p>
        </div>
        {visibleOrders.length ? (
          <div className="space-y-3">
            {visibleOrders.map((order) => {
              const building = scopedBuildings.find((item) => item.id === order.buildingId);
              const latestTimelineEvent = order.timeline?.length ? order.timeline[order.timeline.length - 1] : null;
              return (
                <div key={order.id} className="rounded-3xl border border-fog-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${serviceOrderPriorityTone[order.priority]}`}>
                          {getServiceOrderPriorityPill(t, order.priority, 'clientPortal.priorityPill')}
                        </span>
                        <span className="rounded-full bg-fog-100 px-3 py-1 text-xs font-semibold text-ink-700">
                          {getServiceOrderStatusLabel(t, order.status)}
                        </span>
                      </div>
                      <p className="mt-3 text-lg font-semibold text-ink-900">{order.title}</p>
                      <p className="text-sm text-ink-600">{building?.name ?? t('common.noData')}</p>
                      <p className="text-sm text-ink-500">{formatServiceDateTime(order.scheduledStartAt)}</p>
                      <p className="mt-2 text-sm text-ink-600">
                        {latestTimelineEvent?.summary ?? (portalMode === 'reports' ? 'Entrega visible para consulta rápida.' : 'Seguimiento operativo base disponible.')}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm text-ink-600 sm:grid-cols-2 lg:w-[21rem]">
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">Tipo</p>
                        <p className="mt-1 font-semibold text-ink-900">{getServiceOrderTypeLabel(t, order.type)}</p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">Última actualización</p>
                        <p className="mt-1 font-semibold text-ink-900">{formatServiceDateTime(getLastPortalUpdate(order))}</p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">Evidencia</p>
                        <p className="mt-1 font-semibold text-ink-900">{order.completionPhotos.length} fotos</p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">Novedades</p>
                        <p className="mt-1 font-semibold text-ink-900">{order.issues.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title={t('services.emptyTitle')} description={t('services.emptyDescription')} />
        )}
      </Card>
      {portalMode === 'overview' ? (
        <DataTable
          columns={serviceOrderColumns}
          data={scopedServiceOrders}
          emptyState={<EmptyState title={t('services.emptyTitle')} description={t('services.emptyDescription')} />}
        />
      ) : null}
    </div>
  );
}
