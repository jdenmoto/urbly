import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { CheckIcon, CancelIcon } from '@/components/ActionIcons';
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
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { updateDocById } from '@/lib/api/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { cancelReasonOptions, issueCategoryOptions, issueTypeOptions } from '@/core/appointments';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase/client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function DashboardPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const { data: appointments = [] } = useList<Appointment>('appointments', 'appointments');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [now, setNow] = useState(() => new Date());
  const [pendingTarget, setPendingTarget] = useState<Appointment | null>(null);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNote, setCancelNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingCompleteOpen, setPendingCompleteOpen] = useState(false);
  const [pendingHasIssues, setPendingHasIssues] = useState<'yes' | 'no' | ''>('');
  const [pendingIssues, setPendingIssues] = useState<
    Array<{
      id: string;
      type: string;
      category: string;
      description: string;
      photos: File[];
    }>
  >([]);
  const [pendingIssueDraft, setPendingIssueDraft] = useState({
    id: '',
    type: '',
    category: '',
    description: '',
    photos: [] as File[]
  });
  const [pendingIssueError, setPendingIssueError] = useState<string | null>(null);
  const { data: issueSettings } = useQuery({
    queryKey: ['issueSettings'],
    queryFn: async () => {
      const snapshot = await getDoc(doc(db, 'settings', 'issues'));
      return snapshot.exists() ? (snapshot.data() as { types?: string[]; categories?: Record<string, string[]> }) : null;
    },
    staleTime: 60_000
  });

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

  const totalToDate = filteredAppointments.filter(
    (item) => new Date(item.startAt) <= now && item.status !== 'cancelado'
  ).length;
  const completionRate = totalToDate ? Math.round((completedCount / totalToDate) * 100) : 0;
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

  const pendingAppointments = useMemo(() => {
    const current = now;
    return filteredAppointments
      .filter((item) => {
        if (item.status === 'completado' || item.status === 'cancelado') return false;
        const start = new Date(item.startAt);
        return start < current;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [filteredAppointments, now]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const dynamicIssueTypes = useMemo(
    () => (issueSettings?.types?.length ? issueSettings.types : issueTypeOptions),
    [issueSettings]
  );
  const dynamicIssueCategories = useMemo(
    () => (issueSettings?.categories ? issueSettings.categories : issueCategoryOptions),
    [issueSettings]
  );

  const resolveIssueLabel = (prefix: 'scheduling.issueTypes' | 'scheduling.issueCategories', value: string) => {
    const key = `${prefix}.${value}`;
    const label = t(key);
    return label === key ? value : label;
  };

  const uploadIssuePhotos = async (appointmentId: string, issueId: string, photos: File[]) => {
    const uploads = await Promise.all(
      photos.map(async (file, index) => {
        const storageRef = ref(storage, `appointments/${appointmentId}/issues/${issueId}/${index}-${file.name}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      })
    );
    return uploads;
  };

  const addPendingIssue = () => {
    setPendingIssueError(null);
    if (!pendingIssueDraft.type || !pendingIssueDraft.category) {
      setPendingIssueError(t('scheduling.issueRequired'));
      return;
    }
    if (pendingIssueDraft.photos.length !== 2) {
      setPendingIssueError(t('scheduling.issuePhotosRequired'));
      return;
    }
    const id = pendingIssueDraft.id || (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
    setPendingIssues((prev) => [...prev, { ...pendingIssueDraft, id }]);
    setPendingIssueDraft({ id: '', type: '', category: '', description: '', photos: [] });
  };

  const removePendingIssue = (id: string) => {
    setPendingIssues((prev) => prev.filter((item) => item.id !== id));
  };

  const completePending = async () => {
    if (!pendingTarget) return;
    if (!pendingHasIssues) {
      setPendingIssueError(t('scheduling.issueDecisionRequired'));
      return;
    }
    if (pendingHasIssues === 'yes' && pendingIssues.length === 0) {
      setPendingIssueError(t('scheduling.issueAtLeastOne'));
      return;
    }
    setActionLoading(true);
    try {
      let payload: Record<string, unknown> = {
        status: 'completado',
        completedAt: new Date().toISOString()
      };
      if (pendingHasIssues === 'yes') {
        const resolvedIssues = await Promise.all(
          pendingIssues.map(async (issue) => {
            const photoUrls = await uploadIssuePhotos(pendingTarget.id, issue.id, issue.photos);
            return {
              id: issue.id,
              type: issue.type,
              category: issue.category,
              description: issue.description?.trim() || null,
              photos: photoUrls,
              createdAt: new Date().toISOString()
            };
          })
        );
        payload = { ...payload, issues: resolvedIssues };
      }
      await updateDocById('appointments', pendingTarget.id, payload);
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast(t('dashboard.pendingCompleted'), 'success');
      setPendingTarget(null);
      setCompleteConfirmOpen(false);
      setPendingCompleteOpen(false);
      setPendingHasIssues('');
      setPendingIssues([]);
      setPendingIssueDraft({ id: '', type: '', category: '', description: '', photos: [] });
      setPendingIssueError(null);
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelPending = async () => {
    if (!pendingTarget) return;
    if (!cancelReason && !cancelNote.trim()) {
      toast(t('dashboard.pendingCancelRequired'), 'error');
      return;
    }
    setActionLoading(true);
    try {
      await updateDocById('appointments', pendingTarget.id, {
        status: 'cancelado',
        cancelReason: cancelReason || null,
        cancelNote: cancelNote.trim() || null
      });
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast(t('dashboard.pendingCanceled'), 'success');
      setPendingTarget(null);
      setCancelOpen(false);
      setCancelReason('');
      setCancelNote('');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

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
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.pendingTitle')}</h3>
          <span className="text-xs text-ink-500">
            {t('dashboard.pendingCount', { count: pendingAppointments.length })}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {pendingAppointments.length ? (
            pendingAppointments.slice(0, 8).map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-fog-200 bg-fog-50 px-4 py-3 text-left text-sm text-ink-700 hover:border-ink-900"
                onClick={() => setPendingTarget(item)}
              >
                <div>
                  <p className="font-medium text-ink-900">{item.title}</p>
                  <p className="text-xs text-ink-500">
                    {buildings.find((b) => b.id === item.buildingId)?.name ?? t('common.unnamed')} ·{' '}
                    {format(new Date(item.startAt), 'PPP h:mm a', { locale: es })}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">
                  {t('dashboard.pendingLabel')}
                </span>
              </button>
            ))
          ) : (
            <p className="text-sm text-ink-600">{t('dashboard.pendingEmpty')}</p>
          )}
        </div>
      </Card>
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
      <Modal
        open={Boolean(pendingTarget)}
        title={t('dashboard.pendingActionsTitle')}
        onClose={() => setPendingTarget(null)}
      >
        {pendingTarget ? (
          <div className="space-y-4 text-sm text-ink-700">
            <div className="rounded-xl border border-fog-200 bg-fog-50 p-4">
              <p className="text-base font-semibold text-ink-900">{pendingTarget.title}</p>
              <p className="text-xs text-ink-500">
                {buildings.find((b) => b.id === pendingTarget.buildingId)?.name ?? t('common.unnamed')}
              </p>
              <p className="mt-2 text-sm text-ink-700">
                {format(new Date(pendingTarget.startAt), 'PPP h:mm a', { locale: es })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:border-emerald-400"
                onClick={() => {
                  setPendingIssueError(null);
                  setPendingCompleteOpen(true);
                }}
                disabled={actionLoading}
              >
                <CheckIcon className="h-3.5 w-3.5" />
                {t('scheduling.complete')}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-amber-200 px-2 py-1 text-xs text-amber-700 hover:border-amber-400"
                onClick={() => setCancelOpen(true)}
                disabled={actionLoading}
              >
                <CancelIcon className="h-3.5 w-3.5" />
                {t('scheduling.cancel')}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={pendingCompleteOpen}
        title={t('scheduling.completeTitle')}
        onClose={() => setPendingCompleteOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2 text-sm text-ink-700">
            <label className="font-medium text-ink-800">{t('scheduling.issueQuestion')}</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm ${
                  pendingHasIssues === 'yes' ? 'border-ink-900 text-ink-900' : 'border-fog-200 text-ink-600'
                }`}
                onClick={() => setPendingHasIssues('yes')}
              >
                {t('common.yes')}
              </button>
              <button
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm ${
                  pendingHasIssues === 'no' ? 'border-ink-900 text-ink-900' : 'border-fog-200 text-ink-600'
                }`}
                onClick={() => setPendingHasIssues('no')}
              >
                {t('common.no')}
              </button>
            </div>
          </div>
          {pendingHasIssues === 'yes' ? (
            <div className="space-y-4 rounded-xl border border-fog-200 bg-fog-50 p-4">
              <Select
                label={t('scheduling.issueType')}
                required
                value={pendingIssueDraft.type}
                onChange={(event) =>
                  setPendingIssueDraft((prev) => ({
                    ...prev,
                    type: event.target.value,
                    category: ''
                  }))
                }
              >
                <option value="">{t('common.select')}</option>
                {dynamicIssueTypes.map((option: string) => (
                  <option key={option} value={option}>
                    {resolveIssueLabel('scheduling.issueTypes', option)}
                  </option>
                ))}
              </Select>
              <Select
                label={t('scheduling.issueCategory')}
                required
                value={pendingIssueDraft.category}
                onChange={(event) =>
                  setPendingIssueDraft((prev) => ({
                    ...prev,
                    category: event.target.value
                  }))
                }
                disabled={!pendingIssueDraft.type}
              >
                <option value="">{t('common.select')}</option>
                {(pendingIssueDraft.type
                  ? (dynamicIssueCategories as Record<string, string[]>)[pendingIssueDraft.type] ?? []
                  : []
                ).map((option: string) => (
                  <option key={option} value={option}>
                    {resolveIssueLabel('scheduling.issueCategories', option)}
                  </option>
                ))}
              </Select>
              <Input
                label={t('scheduling.issueDescription')}
                value={pendingIssueDraft.description}
                onChange={(event) =>
                  setPendingIssueDraft((prev) => ({ ...prev, description: event.target.value }))
                }
                maxLength={300}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-800">
                  {t('scheduling.issuePhotos')}
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1].map((index) => (
                    <label
                      key={index}
                      className="flex h-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-fog-300 bg-white text-xs text-ink-500"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const selected = event.target.files?.[0];
                          if (selected) {
                            setPendingIssueDraft((prev) => {
                              const next = [...prev.photos];
                              next[index] = selected;
                              return { ...prev, photos: next };
                            });
                          }
                        }}
                      />
                      {pendingIssueDraft.photos[index] ? pendingIssueDraft.photos[index].name : '+'}
                    </label>
                  ))}
                </div>
              </div>
              {pendingIssueError ? <p className="text-xs text-rose-500">{pendingIssueError}</p> : null}
              <div className="flex items-center justify-between">
                <Button variant="secondary" onClick={addPendingIssue}>
                  {t('scheduling.addIssue')}
                </Button>
              </div>
              {pendingIssues.length ? (
                <div className="space-y-2">
                  {pendingIssues.map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between rounded-lg border border-fog-200 bg-white p-2 text-xs text-ink-700">
                      <div>
                        <p className="font-semibold text-ink-900">{resolveIssueLabel('scheduling.issueTypes', issue.type)}</p>
                        <p>{resolveIssueLabel('scheduling.issueCategories', issue.category)}</p>
                      </div>
                      <button
                        type="button"
                        className="text-rose-500"
                        onClick={() => removePendingIssue(issue.id)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {pendingIssueError ? <p className="text-xs text-rose-500">{pendingIssueError}</p> : null}
          <Button onClick={completePending} disabled={actionLoading}>
            {t('scheduling.complete')}
          </Button>
        </div>
      </Modal>
      <Modal open={cancelOpen} title={t('scheduling.cancelTitle')} onClose={() => setCancelOpen(false)}>
        <div className="space-y-4">
          <Select label={t('scheduling.cancelReason')} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
            <option value="">{t('common.select')}</option>
            {cancelReasonOptions.map((option) => (
              <option key={option} value={option}>
                {t(`scheduling.cancelReasons.${option}`)}
              </option>
            ))}
          </Select>
          <Input label={t('scheduling.cancelNote')} value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} />
          <Button onClick={cancelPending} disabled={actionLoading}>
            {t('scheduling.confirmCancel')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
