import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import Input from '@/components/Input';
import PageHeader from '@/components/PageHeader';
import Select from '@/components/Select';
import StatCard from '@/components/StatCard';
import { useList, useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';

const statusTone: Record<string, string> = {
  draft: 'bg-fog-100 text-ink-700',
  scheduled: 'bg-sky-50 text-sky-700',
  confirmed: 'bg-indigo-50 text-indigo-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700'
};

const priorityTone: Record<string, string> = {
  urgent: 'bg-rose-50 text-rose-700',
  high: 'bg-amber-50 text-amber-700',
  medium: 'bg-sky-50 text-sky-700',
  low: 'bg-emerald-50 text-emerald-700'
};

export default function ServicesPage() {
  const { t } = useI18n();
  const { data: serviceOrders = [], isLoading } = useServiceOrders();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const [filters, setFilters] = useState({ buildingId: '', from: '', to: '', status: '' });

  const summary = useMemo(() => {
    const scheduled = serviceOrders.filter((item) => item.status === 'scheduled' || item.status === 'confirmed').length;
    const inProgress = serviceOrders.filter((item) => item.status === 'in_progress').length;
    const completed = serviceOrders.filter((item) => item.status === 'completed').length;
    const urgent = serviceOrders.filter((item) => item.priority === 'urgent').length;

    return { scheduled, inProgress, completed, urgent };
  }, [serviceOrders]);

  const filteredOrders = useMemo(() => {
    return serviceOrders.filter((order) => {
      if (filters.buildingId && order.buildingId !== filters.buildingId) return false;
      if (filters.status && order.status !== filters.status) return false;
      if (filters.from && new Date(order.scheduledStartAt) < new Date(`${filters.from}T00:00:00`)) return false;
      if (filters.to && new Date(order.scheduledEndAt) > new Date(`${filters.to}T23:59:59`)) return false;
      return true;
    });
  }, [filters, serviceOrders]);

  const recentOrders = useMemo(
    () =>
      [...filteredOrders]
        .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime())
        .slice(0, 12),
    [filteredOrders]
  );

  const statusLabel = (value: string) => {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      scheduled: 'Programado',
      confirmed: 'Confirmado',
      in_progress: 'En progreso',
      completed: 'Completado',
      cancelled: 'Cancelado'
    };

    return labels[value] ?? value;
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t('services.title')} subtitle={t('services.subtitle')} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Programados" value={summary.scheduled} />
        <StatCard label="En progreso" value={summary.inProgress} />
        <StatCard label="Completados" value={summary.completed} />
        <StatCard label="Urgentes" value={summary.urgent} />
      </section>

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {t('services.v2Badge')}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink-900">{t('services.agendaTitle')}</h2>
              <p className="max-w-2xl text-sm leading-6 text-ink-600">{t('services.agendaSubtitle')}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-fog-200 bg-fog-50 px-4 py-3 text-sm text-ink-600">
            <p className="font-semibold text-ink-900">{recentOrders.length}</p>
            <p>{t('services.visibleCountHint')}</p>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-fog-200 bg-fog-50 p-4 md:grid-cols-2 xl:grid-cols-4">
          <Select value={filters.buildingId} onChange={(event) => setFilters((prev) => ({ ...prev, buildingId: event.target.value }))}>
            <option value="">{t('common.all')}</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </Select>
          <Select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
            <option value="">{t('common.all')}</option>
            <option value="scheduled">{t('services.statusScheduled')}</option>
            <option value="confirmed">{t('services.statusConfirmed')}</option>
            <option value="in_progress">{t('services.statusInProgress')}</option>
            <option value="completed">{t('services.statusCompleted')}</option>
            <option value="cancelled">{t('services.statusCancelled')}</option>
          </Select>
          <Input type="date" value={filters.from} onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))} />
          <Input type="date" value={filters.to} onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))} />
        </div>

        {isLoading ? (
          <p className="text-sm text-ink-600">{t('common.loading')}</p>
        ) : recentOrders.length === 0 ? (
          <EmptyState title={t('services.title')} description={t('services.empty')} />
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order) => {
              const building = buildings.find((item) => item.id === order.buildingId);
              const technician = employees.find((item) => item.id === order.assignedTechnicianId);

              return (
                <article
                  key={order.id}
                  className="rounded-3xl border border-fog-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-200"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[order.status] ?? statusTone.draft}`}>
                          {statusLabel(order.status)}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone[order.priority] ?? priorityTone.medium}`}>
                          Prioridad {order.priority}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-ink-900">{order.title}</h3>
                        <p className="text-sm text-ink-600">{building?.name ?? t('common.noData')}</p>
                        <p className="text-sm text-ink-500">
                          {new Date(order.scheduledStartAt).toLocaleString('es-CO', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-ink-600 sm:grid-cols-3 xl:min-w-[360px]">
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.technicianLabel')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{technician?.fullName ?? t('common.unassigned')}</p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.typeLabel')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{order.type}</p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.issuesLabel')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{order.issues?.length ?? 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 border-t border-fog-100 pt-4">
                    <Link
                      className="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                      to={`/services/${order.id}`}
                    >
                      {t('services.viewDetail')}
                    </Link>
                    <Link
                      className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      to={`/services/${order.id}/closeout`}
                    >
                      {t('services.viewCloseout')}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
