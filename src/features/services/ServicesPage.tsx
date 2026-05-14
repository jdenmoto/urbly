import { useEffect, useMemo, useState } from 'react';
import { updateDocById } from '@/lib/api/firestore';
import { assignTechnician, cancelServiceOrder, confirmServiceOrder } from '@/lib/api/serviceOrders';
import { listServiceTypes } from '@/lib/serviceTypes';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { CreateServiceOrderDrawer } from './legacySchedulingAdapter';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import Input from '@/components/Input';
import PageHeader from '@/components/PageHeader';
import Select from '@/components/Select';
import { GlassPanel, MetricCard, SectionHeader, StatusPill } from '@/components/premium';
import { useList } from '@/lib/api/queries';
import { useOperationalServiceOrders } from './useOperationalServiceOrders';
import { buildDailyProgressEvent, getServiceDailyProgress } from './serviceProgress';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/app/Auth';
import type { AppUser } from '@/core/models/appUser';
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
import TechnicianPrimaryMobileCta, { isTechnicianRole } from '@/features/technician/TechnicianPrimaryMobileCta';
import { resolveTechnicianScope, scopeServiceOrdersForTechnician } from './technicianScope';

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
  const { role, user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { data: serviceOrders = [], isLoading } = useOperationalServiceOrders();
  const { data: users = [] } = useList<AppUser>('users', 'users');
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const [filters, setFilters] = useState<ServiceOrderFilters>({ buildingId: '', from: '', to: '', status: '' });
  const [progressTarget, setProgressTarget] = useState<(typeof serviceOrders)[number] | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreatePrefill, setQuickCreatePrefill] = useState<{
    buildingId?: string;
    type?: string;
    assignedTechnicianId?: string;
  } | null>(null);
  const [progressDate, setProgressDate] = useState(new Date().toISOString().slice(0, 10));
  const [progressSummary, setProgressSummary] = useState('');
  const [progressPercent, setProgressPercent] = useState('');
  const [progressHours, setProgressHours] = useState('');
  const [assignTarget, setAssignTarget] = useState<(typeof serviceOrders)[number] | null>(null);
  const [assignTechnicianId, setAssignTechnicianId] = useState('');
  const [editTarget, setEditTarget] = useState<(typeof serviceOrders)[number] | null>(null);
  const [editType, setEditType] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editDurationMinutes, setEditDurationMinutes] = useState('60');
  const [serviceTypeOptions, setServiceTypeOptions] = useState<Array<{ code: string; name: string }>>([]);
  const [cancelTarget, setCancelTarget] = useState<(typeof serviceOrders)[number] | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const buildingId = searchParams.get('buildingId') ?? '';
    const status = searchParams.get('status') ?? '';
    setFilters((prev) => ({
      ...prev,
      buildingId: buildingId || prev.buildingId,
      status: status || prev.status
    }));
  }, [searchParams]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || !serviceOrders.length) return;
    const target = serviceOrders.find((item) => item.id === editId);
    if (!target) return;
    openEdit(target);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, serviceOrders]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const types = await listServiceTypes();
      if (!mounted) return;
      setServiceTypeOptions(types.map((item) => ({ code: item.code, name: item.name })));
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const technicianScope = useMemo(
    () => resolveTechnicianScope({ users, employees, authUserId: user?.uid }),
    [employees, user?.uid, users],
  );
  const { currentEmployee } = technicianScope;
  const isTechnicianView = isTechnicianRole(role);

  const scopedServiceOrders = useMemo(() => {
    if (!isTechnicianView) return serviceOrders;
    return scopeServiceOrdersForTechnician({
      serviceOrders,
      allowedIds: technicianScope.allowedIds,
    });
  }, [isTechnicianView, serviceOrders, technicianScope.allowedIds]);

  const selectedBuilding = useMemo(
    () => getSelectedServiceBuilding(buildings, filters.buildingId),
    [buildings, filters.buildingId]
  );

  const summary = useMemo(() => buildServiceOrderSummary(scopedServiceOrders), [scopedServiceOrders]);

  const filteredOrders = useMemo(() => filterServiceOrders(scopedServiceOrders, filters), [filters, scopedServiceOrders]);

  const recentOrders = useMemo(() => getRecentServiceOrders(filteredOrders), [filteredOrders]);
  const nextOpenOrder = useMemo(
    () => recentOrders.find((item) => item.status !== 'completed' && item.status !== 'cancelled') ?? recentOrders[0] ?? null,
    [recentOrders]
  );
  const nextOpenOrderBuilding = nextOpenOrder ? buildings.find((item) => item.id === nextOpenOrder.buildingId) : undefined;
  const currentSearch = searchParams.toString();
  const headerTitle = isTechnicianView ? t('services.technician.title') : t('services.title');
  const headerSubtitle = isTechnicianView ? t('services.technician.subtitle') : t('services.subtitle');
  const agendaTitle = isTechnicianView ? t('services.technician.agenda.title') : t('services.agenda.title');
  const agendaSubtitle = isTechnicianView ? t('services.technician.agenda.subtitle') : t('services.agenda.subtitle');
  const normalizedAgendaTitle = agendaTitle === headerTitle ? 'Agenda operativa' : agendaTitle;

  const statusLabel = (value: string) => getServiceOrderStatusLabel(t, value as Parameters<typeof getServiceOrderStatusLabel>[1]);
  const currentRoute = `${location.pathname}${currentSearch ? `?${currentSearch}` : ''}`;

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

  const submitAssignment = async () => {
    if (!assignTarget || !assignTechnicianId) return;
    await assignTechnician({
      serviceOrder: assignTarget,
      technicianId: assignTechnicianId,
      reason: 'Asignación operativa desde services',
      actorId: user?.uid,
    });
    setAssignTarget(null);
    setAssignTechnicianId('');
  };

  const submitConfirm = async (order: (typeof serviceOrders)[number]) => {
    await confirmServiceOrder({
      serviceOrder: order,
      actorId: user?.uid,
    });
  };

  const submitCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    await cancelServiceOrder({
      serviceOrder: cancelTarget,
      reason: cancelReason.trim(),
      actorId: user?.uid,
    });
    setCancelTarget(null);
    setCancelReason('');
  };

  const openEdit = (order: (typeof serviceOrders)[number]) => {
    setEditTarget(order);
    setEditType(order.type);
    setEditStart(new Date(order.scheduledStartAt).toISOString().slice(0, 16));
    const duration = Math.max(15, Math.round((new Date(order.scheduledEndAt).getTime() - new Date(order.scheduledStartAt).getTime()) / 60000));
    setEditDurationMinutes(String(duration));
  };

  const submitEdit = async () => {
    if (!editTarget || !editType || !editStart) return;
    const startIso = new Date(editStart).toISOString();
    const endIso = new Date(new Date(startIso).getTime() + Number(editDurationMinutes || 60) * 60000).toISOString();
    await updateDocById('service_orders', editTarget.id, {
      type: editType,
      title: editType,
      scheduledStartAt: startIso,
      scheduledEndAt: endIso,
      updatedAt: new Date().toISOString(),
    });
    setEditTarget(null);
  };

  return (
    <div className="space-y-8 pb-28 md:pb-0">
      <PageHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        actions={!isTechnicianView ? (
          <Button
            type="button"
            onClick={() => {
              setQuickCreatePrefill(selectedBuilding ? { buildingId: selectedBuilding.id } : null);
              setQuickCreateOpen(true);
            }}
          >
            Crear servicio rápido
          </Button>
        ) : null}
      />

      {isTechnicianView ? (
        <TechnicianPrimaryMobileCta
          className="fixed inset-x-4 bottom-24 z-30"
          serviceOrder={nextOpenOrder}
          buildingName={nextOpenOrderBuilding?.name}
          technicianName={currentEmployee?.fullName}
          dailyProgressCount={nextOpenOrder ? getServiceDailyProgress(nextOpenOrder).length : 0}
          issueCount={nextOpenOrder?.issues?.length ?? 0}
          fromPath={currentRoute}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('services.status.scheduled')} value={summary.scheduled} hint={t('services.visible.count.hint')} />
        <MetricCard label={t('services.status.in.progress')} value={summary.inProgress} hint={agendaSubtitle} />
        <MetricCard label={t('services.status.completed')} value={summary.completed} hint={t('services.view.detail')} />
        <MetricCard label={t('services.urgent.label')} value={summary.urgent} hint={t('services.view.closeout')} />
      </section>

      <GlassPanel className="space-y-6">
        <SectionHeader
          eyebrow={t('services.v2.badge')}
          title={normalizedAgendaTitle}
          subtitle={selectedBuilding ? `Contexto actual: ${selectedBuilding.name}` : agendaSubtitle}
          aside={<StatusPill tone="info">{`${recentOrders.length} ${t('services.visible.count.hint')}`}</StatusPill>}
        />

        {isTechnicianView && !currentEmployee ? (
          <EmptyState title={agendaTitle} description={t('technician.missing.employee')} />
        ) : isTechnicianView && nextOpenOrder ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Siguiente acción</p>
                <h3 className="mt-2 text-lg font-semibold text-emerald-950">{nextOpenOrder.title}</h3>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  Ve directo al detalle o entra al cierre técnico sin cargar módulos administrativos.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  to={{ pathname: `/services/${nextOpenOrder.id}`, search: currentSearch ? `?${currentSearch}` : '' }}
                  state={{
                    fromServices: true,
                    fromPath: currentRoute,
                    listContext: {
                      buildingName: buildings.find((item) => item.id === nextOpenOrder.buildingId)?.name ?? t('common.no.data'),
                      technicianName: currentEmployee?.fullName ?? t('common.unassigned'),
                      dailyProgressCount: getServiceDailyProgress(nextOpenOrder).length,
                      issueCount: nextOpenOrder.issues.length
                    }
                  }}
                >
                  Abrir detalle
                </Link>
                <Link
                  className="inline-flex items-center rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                  to={`/services/${nextOpenOrder.id}/closeout`}
                  state={{ fromPath: currentRoute }}
                >
                  Ir al cierre
                </Link>
              </div>
            </div>
          </div>
        ) : selectedBuilding ? (
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
            <option value="scheduled">{t('services.status.scheduled')}</option>
            <option value="confirmed">{t('services.status.confirmed')}</option>
            <option value="in_progress">{t('services.status.in.progress')}</option>
            <option value="completed">{t('services.status.completed')}</option>
            <option value="cancelled">{t('services.status.cancelled')}</option>
          </Select>
          <Input type="date" value={filters.from} onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))} />
          <Input type="date" value={filters.to} onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))} />
        </div>

        {isLoading ? (
          <p className="text-sm text-ink-600">{t('common.loading.default')}</p>
        ) : isTechnicianView && !currentEmployee ? null : recentOrders.length === 0 ? (
          <EmptyState title={headerTitle} description={isTechnicianView ? t('technician.empty') : t('services.empty.default')} />
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
                        <p className="text-sm text-ink-600">{building?.name ?? t('common.no.data')}</p>
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
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.technician.label')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{technician?.fullName ?? t('common.unassigned')}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.type.label')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{getServiceOrderTypeLabel(t, order.type)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.issues.label')}</p>
                        <p className="mt-1 font-semibold text-ink-900">{order.issues.length}</p>
                        <p className="mt-1 text-xs text-ink-500">{getServiceDailyProgress(order).length} avances diarios</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                    <Link
                      className="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                      to={{
                        pathname: `/services/${order.id}`,
                        search: currentSearch ? `?${currentSearch}` : ''
                      }}
                      state={{
                        fromServices: true,
                        fromPath: currentRoute,
                        listContext: {
                          buildingName: building?.name ?? t('common.no.data'),
                          technicianName: technician?.fullName ?? t('common.unassigned'),
                          dailyProgressCount: getServiceDailyProgress(order).length,
                          issueCount: order.issues.length
                        }
                      }}
                    >
                      {isTechnicianView ? 'Abrir detalle' : t('services.view.detail')}
                    </Link>
                    {!isTechnicianView ? (
                      <button
                        className="inline-flex items-center rounded-full border border-fog-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-fog-50"
                        onClick={() => openEdit(order)}
                      >
                        Editar servicio
                      </button>
                    ) : null}
                    {!isTechnicianView ? (
                      <button
                        className="inline-flex items-center rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                        onClick={() => {
                          setAssignTarget(order);
                          setAssignTechnicianId(order.assignedTechnicianId ?? '');
                        }}
                      >
                        {order.assignedTechnicianId ? 'Reasignar técnico' : 'Asignar técnico'}
                      </button>
                    ) : null}
                    {!isTechnicianView ? (
                      <button
                        className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                        onClick={() => void submitConfirm(order)}
                        disabled={order.status !== 'scheduled'}
                      >
                        Confirmar
                      </button>
                    ) : null}
                    {!isTechnicianView ? (
                      <button
                        className="inline-flex items-center rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                        onClick={() => {
                          setQuickCreatePrefill({
                            buildingId: order.buildingId,
                            type: order.type,
                            assignedTechnicianId: order.assignedTechnicianId ?? '',
                          });
                          setQuickCreateOpen(true);
                        }}
                      >
                        Duplicar en creación rápida
                      </button>
                    ) : null}
                    {!isTechnicianView ? (
                      <button
                        className="inline-flex items-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                        onClick={() => {
                          setCancelTarget(order);
                          setCancelReason(order.cancelReason ?? '');
                        }}
                        disabled={order.status === 'completed' || order.status === 'cancelled'}
                      >
                        Cancelar
                      </button>
                    ) : null}
                    <button
                      className="inline-flex items-center rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                      onClick={() => setProgressTarget(order)}
                    >
                      Registrar avance diario
                    </button>
                    <Link
                      className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      to={`/services/${order.id}/closeout`}
                      state={{ fromPath: currentRoute }}
                    >
                      {t('services.view.closeout')}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </GlassPanel>
      <CreateServiceOrderDrawer
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        buildings={buildings.map((building) => ({ id: building.id, name: building.name }))}
        technicians={employees.map((employee) => ({ id: employee.id, fullName: employee.fullName }))}
        prefill={quickCreatePrefill ?? undefined}
      />

      <Modal open={Boolean(assignTarget)} title="Asignar técnico" onClose={() => setAssignTarget(null)}>
        <div className="space-y-4">
          <Select value={assignTechnicianId} onChange={(event) => setAssignTechnicianId(event.target.value)}>
            <option value="">Selecciona técnico</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName}
              </option>
            ))}
          </Select>
          <Button onClick={() => void submitAssignment()} disabled={!assignTechnicianId}>
            Guardar asignación
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(editTarget)} title="Editar servicio" onClose={() => setEditTarget(null)}>
        <div className="space-y-4">
          <Select value={editType} onChange={(event) => setEditType(event.target.value)}>
            <option value="">Selecciona tipo</option>
            {serviceTypeOptions.map((type) => (
              <option key={type.code} value={type.code}>{type.name}</option>
            ))}
          </Select>
          <Input type="datetime-local" value={editStart} onChange={(event) => setEditStart(event.target.value)} />
          <Input type="number" min={15} step={15} value={editDurationMinutes} onChange={(event) => setEditDurationMinutes(event.target.value)} />
          <Button onClick={() => void submitEdit()} disabled={!editType || !editStart}>Guardar cambios</Button>
        </div>
      </Modal>

      <Modal open={Boolean(cancelTarget)} title="Cancelar servicio" onClose={() => setCancelTarget(null)}>
        <div className="space-y-4">
          <Input label="Motivo" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
          <Button onClick={() => void submitCancel()} disabled={!cancelReason.trim()}>
            Confirmar cancelación
          </Button>
        </div>
      </Modal>
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
