import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import Input from '@/components/Input';
import { useList } from '@/lib/api/queries';
import type { Appointment } from '@/core/models/appointment';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import type { ManagementCompany } from '@/core/models/managementCompany';
import { format, isAfter, isBefore, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useI18n } from '@/lib/i18n';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie
} from 'recharts';
import { useMemo, useState } from 'react';

export default function DashboardPage() {
  const { t } = useI18n();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const { data: appointments = [] } = useList<Appointment>('appointments', 'appointments');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const today = startOfDay(new Date());
  const rangeStart = dateRange.from ? startOfDay(new Date(`${dateRange.from}T00:00:00`)) : null;
  const rangeEnd = dateRange.to ? endOfDay(new Date(`${dateRange.to}T00:00:00`)) : null;
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const start = new Date(item.startAt);
      if (rangeStart && start < rangeStart) return false;
      if (rangeEnd && start > rangeEnd) return false;
      return true;
    });
  }, [appointments, rangeStart, rangeEnd]);
  const nextWeek = addDays(today, 7);
  const appointmentsToday = filteredAppointments.filter((item) => {
    const start = new Date(item.startAt);
    return start >= today && start < addDays(today, 1);
  });
  const appointmentsNext7 = filteredAppointments.filter((item) => {
    const start = new Date(item.startAt);
    return isAfter(start, today) && isBefore(start, nextWeek);
  });
  const activeEmployees = employees.filter((employee) => employee.active);

  const byBuilding = filteredAppointments.reduce<Record<string, number>>((acc, item) => {
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

  const daily = filteredAppointments.reduce<Record<string, number>>((acc, item) => {
    const key = format(new Date(item.startAt), 'MMM d', { locale: es });
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const completedCount = filteredAppointments.filter((item) => item.status === 'completado').length;
  const confirmedCount = filteredAppointments.filter((item) => item.status === 'confirmado').length;
  const canceledCount = filteredAppointments.filter((item) => item.status === 'cancelado').length;
  const scheduledCount = filteredAppointments.filter((item) => item.status === 'programado').length;

  const statusData = [
    { name: t('scheduling.completed'), valor: completedCount },
    { name: t('scheduling.statusConfirmed'), valor: confirmedCount },
    { name: t('scheduling.scheduled'), valor: scheduledCount },
    { name: t('scheduling.statusCanceled'), valor: canceledCount }
  ];

  const byType = filteredAppointments.reduce<Record<string, number>>((acc, item) => {
    const key = item.type || 'otro';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(byType).map(([key, value]) => ({
    name: t(`scheduling.types.${key}`),
    valor: value
  }));

  const byEmployee = filteredAppointments.reduce<Record<string, number>>((acc, item) => {
    if (!item.employeeId) return acc;
    acc[item.employeeId] = (acc[item.employeeId] ?? 0) + 1;
    return acc;
  }, {});
  const topEmployees = Object.entries(byEmployee)
    .map(([employeeId, count]) => ({
      name: employees.find((employee) => employee.id === employeeId)?.fullName ?? t('common.unnamed'),
      valor: count
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const byCanceledBuilding = filteredAppointments.reduce<Record<string, number>>((acc, item) => {
    if (item.status !== 'cancelado') return acc;
    acc[item.buildingId] = (acc[item.buildingId] ?? 0) + 1;
    return acc;
  }, {});
  const topCanceledBuildings = Object.entries(byCanceledBuilding)
    .map(([buildingId, count]) => ({
      name: buildings.find((building) => building.id === buildingId)?.name ?? t('common.unnamed'),
      valor: count
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const rangeEndDate = rangeEnd ?? endOfDay(today);
  const lastSevenDays = Array.from({ length: 7 }, (_, idx) => {
    const date = subDays(rangeEndDate, 6 - idx);
    return format(date, 'MMM d', { locale: es });
  });

  const weeklyCompliance = lastSevenDays.map((label) => {
    const dayAppointments = filteredAppointments.filter(
      (item) => format(new Date(item.startAt), 'MMM d', { locale: es }) === label
    );
    const completed = dayAppointments.filter((item) => item.status === 'completado').length;
    const canceled = dayAppointments.filter((item) => item.status === 'cancelado').length;
    const rescheduled = dayAppointments.filter((item) => item.cancelReason === 'reprogramado').length;
    return {
      name: label,
      total: dayAppointments.length,
      completados: completed,
      cancelados: canceled,
      reprogramados: rescheduled
    };
  });

  const lastTenDays = Array.from({ length: 10 }, (_, idx) => {
    const date = subDays(rangeEndDate, 9 - idx);
    return format(date, 'MMM d', { locale: es });
  });
  const trendData = lastTenDays.map((label) => {
    const dayAppointments = filteredAppointments.filter(
      (item) => format(new Date(item.startAt), 'MMM d', { locale: es }) === label
    );
    return {
      name: label,
      total: dayAppointments.length,
      completados: dayAppointments.filter((item) => item.status === 'completado').length
    };
  });

  const totalAppointments = filteredAppointments.length;
  const completionRate = totalAppointments
    ? Math.round((completedCount / totalAppointments) * 100)
    : 0;
  const completionChart = [
    { name: t('dashboard.completed'), value: completionRate },
    { name: t('dashboard.pending'), value: 100 - completionRate }
  ];

  const durationByType = Object.entries(
    filteredAppointments.reduce<Record<string, { total: number; count: number }>>((acc, item) => {
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
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[160px]">
              <Input
                label={t('dashboard.from')}
                type="date"
                value={dateRange.from}
                onChange={(event) => setDateRange((prev) => ({ ...prev, from: event.target.value }))}
              />
            </div>
            <div className="w-[160px]">
              <Input
                label={t('dashboard.to')}
                type="date"
                value={dateRange.to}
                onChange={(event) => setDateRange((prev) => ({ ...prev, to: event.target.value }))}
              />
            </div>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('dashboard.buildings')} value={buildings.length} hint={t('dashboard.activeBuildingsHint')} />
        <StatCard label={t('dashboard.managements')} value={managements.length} hint={t('dashboard.registeredHint')} />
        <StatCard label={t('dashboard.employees')} value={activeEmployees.length} hint={t('dashboard.activeHint')} />
        <StatCard label={t('dashboard.appointmentsToday')} value={appointmentsToday.length} hint={t('dashboard.upcomingHint')} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.trendTitle')}</h3>
            <p className="text-xs text-ink-500">{t('dashboard.trendHint')}</p>
          </div>
          <div className="mt-4 h-64 rounded-2xl bg-gradient-to-b from-fog-100 to-white p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Bar dataKey="total" barSize={18} fill="#60A5FA" radius={[8, 8, 0, 0]} />
                <Line type="monotone" dataKey="completados" stroke="#10B981" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="flex flex-col">
          <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.completionTitle')}</h3>
          <div className="mt-4 flex flex-1 items-center justify-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionChart}
                    dataKey="value"
                    innerRadius={64}
                    outerRadius={90}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#E2E8F0" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
                    cursor={{ fill: '#F1F5F9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-2 text-center">
            <p className="text-3xl font-semibold text-ink-900">{completionRate}%</p>
            <p className="text-xs text-ink-500">{t('dashboard.completedRate')}</p>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.byType')}</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={typeData} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="typeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Area type="monotone" dataKey="valor" stroke="#0EA5E9" fill="url(#typeFill)" strokeWidth={2} />
              </AreaChart>
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
                <Bar dataKey="completados" stackId="a" fill="#10B981" />
                <Bar dataKey="reprogramados" stackId="a" fill="#F59E0B" />
                <Bar dataKey="cancelados" stackId="a" fill="#F43F5E" />
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
