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
    <div className="space-y-6">
      <PageHeader title={t('technician.homeTitle')} subtitle={t('technician.homeSubtitle')} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t('technician.assignedServices')} value={assignedOrders.length} />
        <StatCard
          label={t('technician.pendingServices')}
          value={assignedOrders.filter((item) => item.status !== 'completed' && item.status !== 'cancelled').length}
        />
        <StatCard label={t('technician.issuesDetected')} value={assignedOrders.reduce((acc, item) => acc + (item.issues?.length ?? 0), 0)} />
      </div>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{t('technician.nextServiceTitle')}</h2>
          <p className="text-sm text-ink-600">{t('technician.nextServiceSubtitle')}</p>
        </div>

        {!employee ? (
          <EmptyState title={t('technician.nextServiceTitle')} description={t('technician.missingEmployee')} />
        ) : !nextOrder ? (
          <EmptyState title={t('technician.nextServiceTitle')} description={t('technician.empty')} />
        ) : (
          <div className="rounded-2xl border border-fog-200 p-4">
            <p className="text-base font-semibold text-ink-900">{nextOrder.title}</p>
            <p className="mt-1 text-sm text-ink-600">
              {buildings.find((item) => item.id === nextOrder.buildingId)?.name ?? t('common.noData')}
            </p>
            <p className="mt-2 text-xs text-ink-500">{new Date(nextOrder.scheduledStartAt).toLocaleString('es-CO')}</p>
            <div className="mt-3 grid gap-2 text-sm text-ink-600 md:grid-cols-3">
              <p><span className="font-semibold text-ink-900">{t('technician.statusLabel')}:</span> {nextOrder.status}</p>
              <p><span className="font-semibold text-ink-900">{t('technician.priorityLabel')}:</span> {nextOrder.priority}</p>
              <p><span className="font-semibold text-ink-900">{t('technician.issuesLabel')}:</span> {nextOrder.issues?.length ?? 0}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
