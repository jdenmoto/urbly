import { useMemo } from 'react';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/app/Auth';
import type { AppUser } from '@/core/models/appUser';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import { useList, useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';

const priorityTone: Record<string, string> = {
  urgent: 'bg-rose-50 text-rose-700',
  high: 'bg-amber-50 text-amber-700',
  medium: 'bg-sky-50 text-sky-700',
  low: 'bg-emerald-50 text-emerald-700'
};

const priorityLabelKey: Record<string, string> = {
  urgent: 'services.priorityUrgent',
  high: 'services.priorityHigh',
  medium: 'services.priorityMedium',
  low: 'services.priorityLow'
};

const statusLabelKey: Record<string, string> = {
  draft: 'services.statusDraft',
  scheduled: 'services.statusScheduled',
  confirmed: 'services.statusConfirmed',
  in_progress: 'services.statusInProgress',
  completed: 'services.statusCompleted',
  cancelled: 'services.statusCancelled'
};

export default function TechnicianHomePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: users = [] } = useList<AppUser>('users', 'users');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: serviceOrders = [] } = useServiceOrders();

  const currentUser = useMemo(() => users.find((item) => item.id === user?.uid), [users, user?.uid]);
  const employee = useMemo(
    () => employees.find((item) => item.email.toLowerCase() === currentUser?.email?.toLowerCase()),
    [employees, currentUser?.email]
  );

  const assignedOrders = useMemo(() => {
    if (!employee) return [];
    return serviceOrders
      .filter((item) => item.assignedTechnicianId === employee.id)
      .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime());
  }, [employee, serviceOrders]);

  const nextOrder = assignedOrders.find((item) => item.status !== 'completed' && item.status !== 'cancelled') ?? null;

  return (
    <div className="space-y-8">
      <PageHeader title={t('technician.homeTitle')} subtitle={t('technician.homeSubtitle')} />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label={t('technician.assignedServices')} value={assignedOrders.length} />
        <StatCard
          label={t('technician.pendingServices')}
          value={assignedOrders.filter((item) => item.status !== 'completed' && item.status !== 'cancelled').length}
        />
        <StatCard label={t('technician.issuesDetected')} value={assignedOrders.reduce((acc, item) => acc + (item.issues?.length ?? 0), 0)} />
      </section>

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {t('technician.mobileBadge')}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink-900">{t('technician.nextServiceTitle')}</h2>
              <p className="max-w-2xl text-sm leading-6 text-ink-600">{t('technician.nextServiceSubtitle')}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-fog-200 bg-fog-50 px-4 py-3 text-sm text-ink-600">
            <p className="font-semibold text-ink-900">{assignedOrders.length}</p>
            <p>{t('technician.visibleServicesHint')}</p>
          </div>
        </div>

        {!employee ? (
          <EmptyState title={t('technician.nextServiceTitle')} description={t('technician.missingEmployee')} />
        ) : !nextOrder ? (
          <EmptyState title={t('technician.nextServiceTitle')} description={t('technician.empty')} />
        ) : (
          <div className="rounded-3xl border border-fog-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone[nextOrder.priority] ?? priorityTone.medium}`}>
                {t('technician.priorityPill', { value: t(priorityLabelKey[nextOrder.priority] ?? 'services.priorityMedium') })}
              </span>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-lg font-semibold text-ink-900">{nextOrder.title}</p>
              <p className="text-sm text-ink-600">
                {buildings.find((item) => item.id === nextOrder.buildingId)?.name ?? t('common.noData')}
              </p>
              <p className="text-sm text-ink-500">{new Date(nextOrder.scheduledStartAt).toLocaleString('es-CO')}</p>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-ink-600 md:grid-cols-3">
              <div className="rounded-2xl bg-fog-50 p-4">
                <p className="text-xs uppercase tracking-wide text-ink-500">{t('technician.statusLabel')}</p>
                <p className="mt-1 font-semibold text-ink-900">{t(statusLabelKey[nextOrder.status] ?? 'services.statusDraft')}</p>
              </div>
              <div className="rounded-2xl bg-fog-50 p-4">
                <p className="text-xs uppercase tracking-wide text-ink-500">{t('technician.priorityLabel')}</p>
                <p className="mt-1 font-semibold text-ink-900">{t(priorityLabelKey[nextOrder.priority] ?? 'services.priorityMedium')}</p>
              </div>
              <div className="rounded-2xl bg-fog-50 p-4">
                <p className="text-xs uppercase tracking-wide text-ink-500">{t('technician.issuesLabel')}</p>
                <p className="mt-1 font-semibold text-ink-900">{nextOrder.issues?.length ?? 0}</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
