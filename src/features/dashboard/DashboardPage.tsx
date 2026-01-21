import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import { useList } from '@/lib/api/queries';
import type { Appointment } from '@/core/models/appointment';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import type { ManagementCompany } from '@/core/models/managementCompany';
import { format, isAfter, isBefore, startOfDay, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useI18n } from '@/lib/i18n';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
    const key = format(new Date(item.startAt), 'MMM d', { locale: es });
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const completedCount = appointments.filter((item) => item.status === 'completado').length;
  const confirmedCount = appointments.filter((item) => item.status === 'confirmado').length;
  const canceledCount = appointments.filter((item) => item.status === 'cancelado').length;
  const scheduledCount = appointments.filter((item) => item.status === 'programado').length;

  const statusData = [
    { name: t('scheduling.completed'), valor: completedCount },
    { name: t('scheduling.statusConfirmed'), valor: confirmedCount },
    { name: t('scheduling.scheduled'), valor: scheduledCount },
    { name: t('scheduling.statusCanceled'), valor: canceledCount }
  ];

  const byType = appointments.reduce<Record<string, number>>((acc, item) => {
    const key = item.type || 'otro';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(byType).map(([key, value]) => ({
    name: t(`scheduling.types.${key}`),
    valor: value
  }));

  const byEmployee = appointments.reduce<Record<string, number>>((acc, item) => {
    if (!item.employeeId) return acc;
    acc[item.employeeId] = (acc[item.employeeId] ?? 0) + 1;
    return acc;
  }, {});
  const topEmployees = Object.entries(byEmployee)
    .map(([employeeId, count]) => ({
      name: employees.find((employee) => employee.id === employeeId)?.fullName ?? t('common.unnamed'),
      valor: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const byCanceledBuilding = appointments.reduce<Record<string, number>>((acc, item) => {
    if (item.status !== 'cancelado') return acc;
    acc[item.buildingId] = (acc[item.buildingId] ?? 0) + 1;
    return acc;
  }, {});
  const topCanceledBuildings = Object.entries(byCanceledBuilding)
    .map(([buildingId, count]) => ({
      name: buildings.find((building) => building.id === buildingId)?.name ?? t('common.unnamed'),
      valor: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const lastSevenDays = Array.from({ length: 7 }, (_, idx) => {
    const date = subDays(today, 6 - idx);
    return format(date, 'MMM d', { locale: es });
  });

  const weeklyCompliance = lastSevenDays.map((label) => {
    const dayAppointments = appointments.filter(
      (item) => format(new Date(item.startAt), 'MMM d', { locale: es }) === label
    );
    const completed = dayAppointments.filter((item) => item.status === 'completado').length;
    const canceled = dayAppointments.filter((item) => item.status === 'cancelado').length;
    const rescheduled = dayAppointments.filter((item) => item.cancelReason === 'reprogramado').length;
    return {
      name: label,
      [t('scheduling.statusCompleted')]: completed,
      [t('scheduling.statusCanceled')]: canceled,
      [t('scheduling.cancelReasons.reprogramado')]: rescheduled
    };
  });

  const durationByType = Object.entries(
    appointments.reduce<Record<string, { total: number; count: number }>>((acc, item) => {
      if (!item.startAt || !item.endAt) return acc;
      const start = new Date(item.startAt);
      const end = new Date(item.endAt);
      const minutes = Math.max((end.getTime() - start.getTime()) / 60000, 0);
      const key = item.type || 'otro';
      const entry = acc[key] ?? { total: 0, count: 0 };
      entry.total += minutes;
      entry.count += 1;
      acc[key] = entry;
      return acc;
    }, {})
  ).map(([key, value]) => ({
    name: t(`scheduling.types.${key}`),
    valor: value.count ? Math.round(value.total / value.count) : 0
  }));

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
                  <p className="text-xs text-ink-500">
                    {format(new Date(item.startAt), 'PPP h:mm a', { locale: es })}
                  </p>
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
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {t('scheduling.statusConfirmed')}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              {t('scheduling.scheduled')}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              {t('scheduling.statusCanceled')}
            </span>
          </div>
        </div>
        <div className="mt-4 h-56 rounded-xl bg-fog-100 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
                cursor={{ fill: '#F1F5F9' }}
              />
              <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                {statusData.map((entry, index) => {
                  const colors = ['#10B981', '#F59E0B', '#38BDF8', '#F43F5E'];
                  return <Cell key={`cell-${entry.name}`} fill={colors[index % colors.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.byType')}</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Bar dataKey="valor" fill="#38BDF8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.weeklyCompliance')}</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyCompliance} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Bar dataKey={t('scheduling.statusCompleted')} stackId="a" fill="#10B981" />
                <Bar dataKey={t('scheduling.cancelReasons.reprogramado')} stackId="a" fill="#F59E0B" />
                <Bar dataKey={t('scheduling.statusCanceled')} stackId="a" fill="#F43F5E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.topEmployees')}</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topEmployees} layout="vertical" margin={{ top: 10, right: 16, left: 16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} width={120} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Bar dataKey="valor" fill="#6366F1" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.topCanceledBuildings')}</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCanceledBuildings} layout="vertical" margin={{ top: 10, right: 16, left: 16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} width={120} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Bar dataKey="valor" fill="#F43F5E" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.avgDuration')}</h3>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={durationByType} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
                cursor={{ fill: '#F1F5F9' }}
              />
              <Bar dataKey="valor" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
