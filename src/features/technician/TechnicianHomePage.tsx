import { useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import {
  formatServiceDateTime,
  getServiceOrderPriorityLabel,
  getServiceOrderPriorityPill,
  getServiceOrderStatusLabel,
  serviceOrderPriorityTone
} from '@/features/services/serviceOrderPresentation';

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

  const openOrders = assignedOrders.filter((item) => item.status !== 'completed' && item.status !== 'cancelled');
  const nextOrder = openOrders[0] ?? null;
  const todaysOrders = openOrders.slice(0, 5);

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
            <p className="font-semibold text-ink-900">{openOrders.length}</p>
            <p>Servicios abiertos para ejecutar hoy.</p>
          </div>
        </div>

        {!employee ? (
          <EmptyState title={t('technician.nextServiceTitle')} description={t('technician.missingEmployee')} />
        ) : !nextOrder ? (
          <EmptyState title={t('technician.nextServiceTitle')} description={t('technician.empty')} />
        ) : (
          <div className="rounded-3xl border border-fog-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${serviceOrderPriorityTone[nextOrder.priority]}`}>
                {getServiceOrderPriorityPill(t, nextOrder.priority, 'technician.priorityPill')}
              </span>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-lg font-semibold text-ink-900">{nextOrder.title}</p>
              <p className="text-sm text-ink-600">
                {buildings.find((item) => item.id === nextOrder.buildingId)?.name ?? t('common.noData')}
              </p>
              <p className="text-sm text-ink-500">{formatServiceDateTime(nextOrder.scheduledStartAt)}</p>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-ink-600 md:grid-cols-3">
              <div className="rounded-2xl bg-fog-50 p-4">
                <p className="text-xs uppercase tracking-wide text-ink-500">{t('technician.statusLabel')}</p>
                <p className="mt-1 font-semibold text-ink-900">{getServiceOrderStatusLabel(t, nextOrder.status)}</p>
              </div>
              <div className="rounded-2xl bg-fog-50 p-4">
                <p className="text-xs uppercase tracking-wide text-ink-500">{t('technician.priorityLabel')}</p>
                <p className="mt-1 font-semibold text-ink-900">{getServiceOrderPriorityLabel(t, nextOrder.priority)}</p>
              </div>
              <div className="rounded-2xl bg-fog-50 p-4">
                <p className="text-xs uppercase tracking-wide text-ink-500">{t('technician.issuesLabel')}</p>
                <p className="mt-1 font-semibold text-ink-900">{nextOrder.issues?.length ?? 0}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700" to={`/services/${nextOrder.id}`}>
                Abrir servicio
              </Link>
              <Link className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100" to={`/services/${nextOrder.id}/closeout`}>
                Cerrar o reportar
              </Link>
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">Cola de trabajo</h2>
          <p className="text-sm leading-6 text-ink-600">Vista mínima del día para saber qué sigue y entrar rápido a cada orden.</p>
        </div>
        {!employee ? (
          <EmptyState title="Cola de trabajo" description={t('technician.missingEmployee')} />
        ) : todaysOrders.length === 0 ? (
          <EmptyState title="Cola de trabajo" description={t('technician.empty')} />
        ) : (
          <div className="space-y-3">
            {todaysOrders.map((order) => (
              <div key={order.id} className="rounded-3xl border border-fog-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${serviceOrderPriorityTone[order.priority]}`}>
                        {getServiceOrderPriorityPill(t, order.priority, 'technician.priorityPill')}
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-ink-900">{order.title}</p>
                    <p className="text-sm text-ink-600">{buildings.find((item) => item.id === order.buildingId)?.name ?? t('common.noData')}</p>
                    <p className="text-sm text-ink-500">{formatServiceDateTime(order.scheduledStartAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" to={`/services/${order.id}`}>
                      Detalle
                    </Link>
                    <Link className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100" to={`/services/${order.id}/closeout`}>
                      Avance / cierre
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
