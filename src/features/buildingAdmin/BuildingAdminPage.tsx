import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
const BuildingsMap = lazy(() => import('@/components/BuildingsMap'));
import { useList, useServiceOrders } from '@/lib/api/queries';
import type { ManagementCompany } from '@/core/models/managementCompany';
import type { Building } from '@/core/models/building';
import type { AppUser } from '@/core/models/appUser';
import { useAuth } from '@/app/Auth';
import { loadGoogleMaps } from '@/lib/googleMaps';
import { useI18n } from '@/lib/i18n';
import type { ColumnDef } from '@tanstack/react-table';
import {
  formatServiceDateTime,
  getServiceOrderStatusLabel,
  getServiceOrderTypeLabel
} from '@/features/services/serviceOrderPresentation';

export default function BuildingAdminPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: users = [] } = useList<AppUser>('users', 'users');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: serviceOrders = [] } = useServiceOrders();
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

  if (!administrationId) {
    return (
      <Card>
        <p className="text-sm text-ink-600">{t('portal.missingAccess')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('portal.title')} subtitle={t('portal.subtitle')} />
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
      <DataTable
        columns={serviceOrderColumns}
        data={scopedServiceOrders}
        emptyState={<EmptyState title={t('services.emptyTitle')} description={t('services.emptyDescription')} />}
      />
    </div>
  );
}
