import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import BuildingsMap from '@/components/BuildingsMap';
import { useList } from '@/lib/api/queries';
import type { ManagementCompany } from '@/core/models/managementCompany';
import type { Building } from '@/core/models/building';
import type { Appointment } from '@/core/models/appointment';
import type { AppUser } from '@/core/models/appUser';
import { useAuth } from '@/app/Auth';
import { loadGoogleMaps } from '@/lib/googleMaps';
import { useI18n } from '@/lib/i18n';
import type { ColumnDef } from '@tanstack/react-table';

export default function BuildingAdminPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: users = [] } = useList<AppUser>('users', 'users');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: appointments = [] } = useList<Appointment>('appointments', 'appointments');
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

  const scopedAppointments = useMemo(() => {
    const buildingIds = new Set(scopedBuildings.map((building) => building.id));
    return appointments.filter((appointment) => buildingIds.has(appointment.buildingId));
  }, [appointments, scopedBuildings]);

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

  const appointmentColumns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      { header: t('scheduling.titleLabel'), accessorKey: 'title', enableSorting: false },
      {
        header: t('scheduling.building'),
        enableSorting: false,
        accessorFn: (row) => scopedBuildings.find((b) => b.id === row.buildingId)?.name ?? t('common.noData')
      },
      { header: t('scheduling.startAt'), accessorKey: 'startAt', enableSorting: false },
      { header: t('scheduling.endAt'), accessorKey: 'endAt', enableSorting: false },
      { header: t('scheduling.status'), accessorKey: 'status', enableSorting: false }
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
        <BuildingsMap buildings={scopedBuildings} ready={mapsReady} />
        <DataTable
          columns={buildingColumns}
          data={scopedBuildings}
          emptyState={<EmptyState title={t('portal.buildingsEmpty')} description={t('portal.buildingsEmptyHint')} />}
        />
      </div>
      <DataTable
        columns={appointmentColumns}
        data={scopedAppointments}
        emptyState={<EmptyState title={t('portal.appointmentsEmpty')} description={t('portal.appointmentsEmptyHint')} />}
      />
    </div>
  );
}
