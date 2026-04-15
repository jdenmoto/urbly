import { useMemo } from 'react';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { useList, useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';

export default function ServicesPage() {
  const { t } = useI18n();
  const { data: serviceOrders = [], isLoading } = useServiceOrders();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');

  const summary = useMemo(() => {
    const scheduled = serviceOrders.filter((item) => item.status === 'scheduled' || item.status === 'confirmed').length;
    const inProgress = serviceOrders.filter((item) => item.status === 'in_progress').length;
    const completed = serviceOrders.filter((item) => item.status === 'completed').length;
    const urgent = serviceOrders.filter((item) => item.priority === 'urgent').length;

    return { scheduled, inProgress, completed, urgent };
  }, [serviceOrders]);

  const recentOrders = useMemo(
    () =>
      [...serviceOrders]
        .sort((a, b) => new Date(b.scheduledStartAt).getTime() - new Date(a.scheduledStartAt).getTime())
        .slice(0, 6),
    [serviceOrders]
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
    <div className="space-y-6">
      <PageHeader title={t('services.title')} subtitle={t('services.subtitle')} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Programados" value={summary.scheduled} />
        <StatCard label="En progreso" value={summary.inProgress} />
        <StatCard label="Completados" value={summary.completed} />
        <StatCard label="Urgentes" value={summary.urgent} />
      </div>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Backlog operativo v2</h2>
          <p className="text-sm text-ink-600">
            Esta vista ya usa `serviceOrder` como capa de lectura sobre `appointments` mientras se migra el core.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-ink-600">{t('common.loading')}</p>
        ) : recentOrders.length === 0 ? (
          <EmptyState title={t('services.title')} description={t('services.empty')} />
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const building = buildings.find((item) => item.id === order.buildingId);
              const technician = employees.find((item) => item.id === order.assignedTechnicianId);

              return (
                <div key={order.id} className="rounded-2xl border border-fog-200 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-ink-900">{order.title}</p>
                      <p className="text-sm text-ink-600">{building?.name ?? t('common.noData')}</p>
                      <p className="text-xs text-ink-500">
                        {new Date(order.scheduledStartAt).toLocaleString('es-CO', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-fog-100 px-3 py-1 font-medium text-ink-700">
                        {statusLabel(order.status)}
                      </span>
                      <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700">
                        Prioridad: {order.priority}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-ink-600 md:grid-cols-3">
                    <p>
                      <span className="font-semibold text-ink-900">Tecnico:</span> {technician?.fullName ?? t('common.unassigned')}
                    </p>
                    <p>
                      <span className="font-semibold text-ink-900">Tipo:</span> {order.type}
                    </p>
                    <p>
                      <span className="font-semibold text-ink-900">Novedades:</span> {order.issues?.length ?? 0}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
