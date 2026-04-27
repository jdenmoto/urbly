import { useEffect, useMemo, useState } from 'react';
import { updateDocById } from '@/lib/api/firestore';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { Link, useSearchParams } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import Input from '@/components/Input';
import PageHeader from '@/components/PageHeader';
import Select from '@/components/Select';
import { GlassPanel, MetricCard, SectionHeader, StatusPill } from '@/components/premium';
import { useList } from '@/lib/api/queries';
import { useOperationalServiceOrders } from './useOperationalServiceOrders';
import { buildDailyProgressEvent, getServiceDailyProgress } from './serviceProgress';
import { useI18n } from '@/lib/i18n';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import {
  buildServiceOrderSummary,
  filterServiceOrders,
  getRecentServiceOrders,
  getSelectedServiceBuilding,
  type ServiceOrderFilters
} from './serviceOrderSelectors';
import {
  getServiceOrderPriorityPill,
  getServiceOrderStatusLabel,
  getServiceOrderTypeLabel,
  serviceOrderPriorityTone
} from './serviceOrderPresentation';

const statusTone: Record<string, string> = {
  draft: 'bg-fog-100 text-ink-700',
  scheduled: 'bg-sky-50 text-sky-700',
  confirmed: 'bg-indigo-50 text-indigo-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700'
};

export default function ServicesPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const { data: serviceOrders = [], isLoading } = useOperationalServiceOrders();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const [filters, setFilters] = useState<ServiceOrderFilters>({ buildingId: '', from: '', to: '', status: '' });
  const [progressTarget, setProgressTarget] = useState<(typeof serviceOrders)[number] | null>(null);
  const [progressDate, setProgressDate] = useState(new Date().toISOString().slice(0, 10));
  const [progressSummary, setProgressSummary] = useState('');
  const [progressPercent, setProgressPercent] = useState('');
  const [progressHours, setProgressHours] = useState('');

  useEffect(() => {
    const buildingId = searchParams.get('buildingId') ?? '';
    const status = searchParams.get('status') ?? '';
    setFilters((prev) => ({
      ...prev,
      buildingId: buildingId || prev.buildingId,
      status: status || prev.status
    }));
  }, [searchParams]);

  const selectedBuilding = useMemo(
    () => getSelectedServiceBuilding(buildings, filters.buildingId),
    [buildings, filters.buildingId]
  );

  const summary = useMemo(() => buildServiceOrderSummary(serviceOrders), [serviceOrders]);

  const filteredOrders = useMemo(() => filterServiceOrders(serviceOrders, filters), [filters, serviceOrders]);

  const recentOrders = useMemo(() => getRecentServiceOrders(filteredOrders), [filteredOrders]);

  const statusLabel = (value: string) => getServiceOrderStatusLabel(t, value as Parameters<typeof getServiceOrderStatusLabel>[1]);

  const saveDailyProgress = async () => {
    if (!progressTarget || !progressSummary.trim()) return;
    const nextTimeline = [...progressTarget.timeline, buildDailyProgressEvent({
      date: progressDate,
      summary: progressSummary,
      percentComplete: progressPercent ? Number(progressPercent) : null,
      hoursWorked: progressHours ? Number(progressHours) : null
    })];
    await updateDocById('service_orders', progressTarget.id, {
      status: progressTarget.status === 'scheduled' || progressTarget.status === 'confirmed' ? 'in_progress' : progressTarget.status,
      timeline: nextTimeline
    });
    setProgressTarget(null);
    setProgressSummary('');
    setProgressPercent('');
    setProgressHours('');
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t('services.title')} subtitle={t('services.subtitle')} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('services.statusScheduled')} value={summary.scheduled} hint={t('services.visibleCountHint')} />
        <MetricCard label={t('services.statusInProgress')} value={summary.inProgress} hint={t('services.agendaSubtitle')} />
        <MetricCard label={t('services.statusCompleted')} value={summary.completed} hint={t('services.viewDetail')} />
        <MetricCard label={t('services.urgentLabel')} value={summary.urgent} hint={t('services.viewCloseout')} />
      </section>

      <GlassPanel className="space-y-6">
        <SectionHeader
          eyebrow={t('services.v2Badge')}
          title={t('services.agendaTitle')}
          subtitle={selectedBuilding ? `Contexto actual: ${selectedBuilding.name}` : t('services.agendaSubtitle')}
          aside={<StatusPill tone="info">{`${recentOrders.length} ${t('services.visibleCountHint')}`}</StatusPill>}
        />

        {selectedBuilding ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <div className="space-y-1">
              <p className="font-semibold">Filtro operativo activo</p>
              <p>Estás viendo servicios del edificio {selectedBuilding.name}.</p>
              <p className="text-xs text-sky-700">
                {recentOrders.length
                  ? 'Siguiente paso sugerido: revisar el servicio más próximo o continuar su ejecución.'
                  : 'Siguiente paso sugerido: este edificio aún no muestra servicios visibles en el filtro actual.'}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-100"
              onClick={() => setFilters((prev) => ({ ...prev, buildingId: '' }))}
            >
              Limpiar filtro
            </button>
          </div>
        ) : null}

        <div className="grid gap-3 rounded-[24px] border border-white/70 bg-slate-50/80 p-4 md:grid-cols-2 xl:grid-cols-4">
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
                  className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[order.status] ?? statusTone.draft}`}>
                          {statusLabel(order.status)}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${serviceOrderPriorityTone[order.priority]}`}>
                          {getServiceOrderPriorityPill(t, order.priority)}
                        </span>
                        <StatusPill tone="info">{getServiceOrderTypeLabel(t, order.type)}</StatusPill>
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
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.technicianLabel')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{technician?.fullName ?? t('common.unassigned')}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.typeLabel')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{getServiceOrderTypeLabel(t, order.type)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.issuesLabel')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{order.issues.length}</p>
                        <p className="mt-1 text-xs text-ink-500">{getServiceDailyProgress(order).length} avances diarios</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                    <Link
                      className="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                      to={`/services/${order.id}`}
                    >
                      {t('services.viewDetail')}
                    </Link>
                    <button
                      className="inline-flex items-center rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                      onClick={() => setProgressTarget(order)}
                    >
                      Registrar avance diario
                    </button>
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
      </GlassPanel>
      <Modal open={Boolean(progressTarget)} title="Registrar avance diario" onClose={() => setProgressTarget(null)}>
        <div className="space-y-4">
          <Input type="date" value={progressDate} onChange={(event) => setProgressDate(event.target.value)} />
          <Input label="% completado" type="number" value={progressPercent} onChange={(event) => setProgressPercent(event.target.value)} />
          <Input label="Horas trabajadas" type="number" value={progressHours} onChange={(event) => setProgressHours(event.target.value)} />
          <Input label="Resumen del avance" value={progressSummary} onChange={(event) => setProgressSummary(event.target.value)} />
          <Button onClick={() => void saveDailyProgress()} className="w-full">Guardar avance</Button>
        </div>
      </Modal>
    </div>
  );
}
