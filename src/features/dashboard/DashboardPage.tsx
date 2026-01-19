import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import { useList } from '@/lib/api/queries';
import type { Appointment } from '@/core/models/appointment';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import type { ManagementCompany } from '@/core/models/managementCompany';
import { format, isAfter, isBefore, startOfDay, addDays, subDays } from 'date-fns';
import { useI18n } from '@/lib/i18n';

export default function DashboardPage() {
  const { t } = useI18n();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const { data: appointments = [] } = useList<Appointment>('appointments', 'appointments');

  const today = startOfDay(new Date());
  const nextWeek = addDays(today, 7);
  const appointmentsToday = appointments.filter((item) => {
    const start = new Date(item.startAt);
    return start >= today && start < addDays(today, 1);
  });
  const appointmentsNext7 = appointments.filter((item) => {
    const start = new Date(item.startAt);
    return isAfter(start, today) && isBefore(start, nextWeek);
  });
  const activeEmployees = employees.filter((employee) => employee.active);

  const byBuilding = appointments.reduce<Record<string, number>>((acc, item) => {
    acc[item.buildingId] = (acc[item.buildingId] ?? 0) + 1;
    return acc;
  }, {});

  const topBuildings = Object.entries(byBuilding)
    .map(([buildingId, count]) => ({
      building: buildings.find((b) => b.id === buildingId)?.name ?? t('common.unnamed'),
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const daily = appointments.reduce<Record<string, number>>((acc, item) => {
    const key = format(new Date(item.startAt), 'MMM d');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const lastSevenDays = Array.from({ length: 7 }, (_, idx) => {
    const date = subDays(today, 6 - idx);
    return format(date, 'MMM d');
  });

  const completedByDay = lastSevenDays.map((label) => {
    return appointments.filter(
      (item) => format(new Date(item.startAt), 'MMM d') === label && item.status === 'completado'
    ).length;
  });

  const scheduledByDay = lastSevenDays.map((label) => {
    return appointments.filter(
      (item) => format(new Date(item.startAt), 'MMM d') === label && item.status !== 'completado'
    ).length;
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('dashboard.buildings')} value={buildings.length} hint={t('dashboard.activeBuildingsHint')} />
        <StatCard label={t('dashboard.managements')} value={managements.length} hint={t('dashboard.registeredHint')} />
        <StatCard label={t('dashboard.employees')} value={activeEmployees.length} hint={t('dashboard.activeHint')} />
        <StatCard label={t('dashboard.appointmentsToday')} value={appointmentsToday.length} hint={t('dashboard.upcomingHint')} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.byDay')}</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(daily).length ? (
              Object.entries(daily).map(([label, value]) => (
                <div key={label} className="flex flex-1 flex-col rounded-xl bg-fog-100 p-4">
                  <span className="text-xs text-ink-500">{label}</span>
                  <span className="text-2xl font-semibold text-ink-900">{value}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-600">{t('dashboard.dailyEmpty')}</p>
            )}
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.nextDays')}</h3>
          <div className="mt-4 space-y-3">
            {appointmentsNext7.length ? (
              appointmentsNext7.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-fog-100 bg-fog-50 p-3">
                  <p className="text-sm font-medium text-ink-900">{item.title}</p>
                  <p className="text-xs text-ink-500">{format(new Date(item.startAt), 'PPP p')}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-600">{t('dashboard.nextEmpty')}</p>
            )}
          </div>
        </Card>
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.chartTitle')}</h3>
          <div className="flex items-center gap-3 text-xs text-ink-600">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t('scheduling.completed')}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              {t('scheduling.scheduled')}
            </span>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-7">
          {lastSevenDays.map((label, index) => {
            const completed = completedByDay[index];
            const scheduled = scheduledByDay[index];
            const max = Math.max(completed, scheduled, 1);
            return (
              <div key={label} className="flex flex-col items-center gap-2 rounded-xl bg-fog-100 p-3">
                <div className="flex h-24 w-full items-end justify-center gap-2">
                  <div
                    className="w-3 rounded-full bg-emerald-500"
                    style={{ height: `${(completed / max) * 100}%` }}
                    title={`${t('scheduling.completed')}: ${completed}`}
                  />
                  <div
                    className="w-3 rounded-full bg-sky-500"
                    style={{ height: `${(scheduled / max) * 100}%` }}
                    title={`${t('scheduling.scheduled')}: ${scheduled}`}
                  />
                </div>
                <span className="text-xs text-ink-600">{label}</span>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.topBuildings')}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {topBuildings.length ? (
            topBuildings.map((item) => (
              <div key={item.building} className="rounded-xl border border-fog-100 bg-fog-50 p-4">
                <p className="text-sm font-medium text-ink-900">{item.building}</p>
                <p className="text-xs text-ink-500">
                  {item.count} {t('dashboard.activities')}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-600">{t('dashboard.topEmpty')}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
