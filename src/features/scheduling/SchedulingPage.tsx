import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import esLocale from '@fullcalendar/core/locales/es';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Button from '@/components/Button';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import useBreakpoint from '@/components/useBreakpoint';
import Modal from '@/components/Modal';
import type { Appointment } from '@/core/models/appointment';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import { recurrenceOptions, appointmentTypeOptions, cancelReasonOptions } from '@/core/appointments';
import { createDoc, updateDocById, deleteDocById } from '@/lib/api/firestore';
import { useList } from '@/lib/api/queries';
import { isValidDateRange } from '@/core/validators';
import type { ColumnDef } from '@tanstack/react-table';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/app/Auth';
import ConfirmModal from '@/components/ConfirmModal';
import { CancelIcon, TrashIcon } from '@/components/ActionIcons';

export default function SchedulingPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { role } = useAuth();
  const canEdit = role !== 'view';
  const { isMobile } = useBreakpoint();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const { data: appointments = [] } = useList<Appointment>('appointments', 'appointments');
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ buildingId: '', date: '', from: '', to: '' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [buildingSearch, setBuildingSearch] = useState('');
  const [filterBuildingSearch, setFilterBuildingSearch] = useState('');
  const [buildingDropdownOpen, setBuildingDropdownOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);

  const schema = z.object({
    buildingId: z.string().min(1, t('scheduling.buildingRequired')),
    title: z.string().min(2, t('common.required')),
    description: z.string().optional(),
    startAt: z.string().min(1, t('common.required')),
    endAt: z.string().min(1, t('common.required')),
    status: z.string().min(1, t('common.required')),
    recurrence: z.string().optional(),
    type: z.string().min(1, t('common.required')),
    employeeId: z.string().optional()
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const cancelSchema = z
    .object({
      reason: z.string().optional(),
      note: z.string().optional()
    })
    .superRefine((values, ctx) => {
      const hasReason = Boolean(values.reason);
      const hasNote = Boolean(values.note && values.note.trim().length >= 3);
      if (!hasReason && !hasNote) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reason'],
          message: t('common.required')
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['note'],
          message: t('common.required')
        });
      }
      if (values.note && values.note.trim().length > 0 && values.note.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['note'],
          message: t('common.required')
        });
      }
    });
  type CancelValues = z.infer<typeof cancelSchema>;
  const {
    register: cancelRegister,
    handleSubmit: handleCancelSubmit,
    formState: { errors: cancelErrors, isSubmitting: cancelSubmitting },
    reset: resetCancel
  } = useForm<CancelValues>({ resolver: zodResolver(cancelSchema) });

  const filtered = appointments.filter((item) => {
    if (filters.buildingId && item.buildingId !== filters.buildingId) return false;
    if (filters.date && item.startAt.slice(0, 10) !== filters.date) return false;
    if (filters.from && item.startAt < filters.from) return false;
    if (filters.to && item.endAt > filters.to) return false;
    return true;
  });

  const activeBuildings = useMemo(
    () => buildings.filter((building) => building.active !== false),
    [buildings]
  );
  const filteredBuildings = useMemo(
    () => activeBuildings.filter((building) => building.name.toLowerCase().includes(buildingSearch.trim().toLowerCase())),
    [activeBuildings, buildingSearch]
  );

  const columns = useMemo<ColumnDef<Appointment>[]>(() => {
    const base: ColumnDef<Appointment>[] = [
      { header: t('scheduling.titleLabel'), accessorKey: 'title', enableSorting: false },
      {
        header: t('scheduling.building'),
        enableSorting: false,
        accessorFn: (row) => buildings.find((b) => b.id === row.buildingId)?.name ?? t('common.noData')
      },
      {
        header: t('scheduling.employee'),
        enableSorting: false,
        accessorFn: (row) =>
          row.employeeId
            ? employees.find((employee) => employee.id === row.employeeId)?.fullName ?? t('common.noData')
            : t('common.unassigned')
      },
      { header: t('scheduling.startAt'), accessorKey: 'startAt', enableSorting: false },
      {
        header: t('scheduling.status'),
        accessorKey: 'status',
        enableSorting: true,
        cell: ({ row }) => {
          const map: Record<string, string> = {
            programado: t('scheduling.statusProgrammed'),
            confirmado: t('scheduling.statusConfirmed'),
            completado: t('scheduling.statusCompleted'),
            cancelado: t('scheduling.statusCanceled')
          };
          return map[row.original.status] ?? row.original.status;
        }
      }
    ];
    if (!canEdit) return base;
    return [
      ...base,
      {
        header: t('common.actions'),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.status !== 'cancelado' ? (
              <button
                className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-amber-600 hover:bg-amber-50"
                onClick={() => openCancel(row.original)}
                title={t('scheduling.cancel')}
                aria-label={t('scheduling.cancel')}
              >
                <CancelIcon className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
            <button
              className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-rose-600 hover:bg-rose-50"
              onClick={() => setDeleteTarget(row.original)}
              title={t('common.delete')}
              aria-label={t('common.delete')}
            >
              <TrashIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )
      }
    ];
  }, [buildings, employees, t, canEdit]);

  const onSubmit = async (values: FormValues) => {
    if (!canEdit) {
      toast(t('common.actionError'), 'error');
      return;
    }
    if (!isValidDateRange(values.startAt, values.endAt)) {
      setError('endAt', { message: t('errors.invalidDateRange') });
      return;
    }
    const payload = {
      buildingId: values.buildingId,
      title: values.title,
      description: values.description ?? '',
      startAt: values.startAt,
      endAt: values.endAt,
      status: values.status,
      recurrence: values.recurrence || null,
      type: values.type,
      employeeId: values.employeeId || null
    };
    try {
      if (editingId) {
        await updateDocById('appointments', editingId, payload);
      } else {
        await createDoc('appointments', payload);
      }
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      reset();
      setEditingId(null);
      setModalOpen(false);
      toast(editingId ? t('scheduling.toastUpdated') : t('scheduling.toastCreated'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    }
  };

  const startCreate = () => {
    setEditingId(null);
    reset({
      buildingId: '',
      title: '',
      description: '',
      startAt: '',
      endAt: '',
      status: 'programado',
      recurrence: '',
      type: '',
      employeeId: ''
    });
    setBuildingSearch('');
    setModalOpen(true);
  };

  const startEdit = (appointment: Appointment) => {
    setEditingId(appointment.id);
    setValue('buildingId', appointment.buildingId);
    setValue('title', appointment.title);
    setValue('description', appointment.description ?? '');
    setValue('startAt', appointment.startAt.slice(0, 16));
    setValue('endAt', appointment.endAt.slice(0, 16));
    setValue('status', appointment.status);
    setValue('recurrence', appointment.recurrence ?? '');
    setValue('type', appointment.type ?? '');
    setValue('employeeId', appointment.employeeId ?? '');
    const buildingName = buildings.find((building) => building.id === appointment.buildingId)?.name ?? '';
    setBuildingSearch(buildingName);
    setSelected(null);
    setModalOpen(true);
  };

  const openCancel = (appointment: Appointment) => {
    setCancelTarget(appointment);
    resetCancel({ reason: '', note: '' });
  };

  const onCancel = async (values: CancelValues) => {
    if (!cancelTarget) return;
    try {
      await updateDocById('appointments', cancelTarget.id, {
        status: 'cancelado',
        cancelReason: values.reason || null,
        cancelNote: values.note?.trim() || null
      });
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast(t('scheduling.toastCanceled'), 'success');
      setCancelTarget(null);
    } catch (error) {
      toast(t('common.actionError'), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocById('appointments', deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast(t('scheduling.toastDeleted'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      programado: t('scheduling.statusProgrammed'),
      confirmado: t('scheduling.statusConfirmed'),
      completado: t('scheduling.statusCompleted'),
      cancelado: t('scheduling.statusCanceled')
    };
    return map[status] ?? status;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('scheduling.title')}
        subtitle={t('scheduling.subtitle')}
        actions={
          <div className="flex items-end gap-2">
            <Select
              label={t('scheduling.viewLabel')}
              value={viewMode}
              onChange={(event) => setViewMode(event.target.value as 'calendar' | 'list')}
              className="min-w-[160px]"
            >
              <option value="calendar">{t('scheduling.viewCalendar')}</option>
              <option value="list">{t('scheduling.viewList')}</option>
            </Select>
            {canEdit ? <Button onClick={startCreate}>{t('common.add')}</Button> : null}
          </div>
        }
      />
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-800">{t('scheduling.filtersTitle')}</h3>
            <button
              className="text-xs font-semibold text-ink-600"
              onClick={() => setFiltersOpen((prev) => !prev)}
            >
              {filtersOpen ? t('common.hideFilters') : t('common.showFilters')}
            </button>
          </div>
          {filtersOpen ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Select
                label={t('scheduling.building')}
                value={filters.buildingId}
                onChange={(event) => setFilters((prev) => ({ ...prev, buildingId: event.target.value }))}
              >
                <option value="">{t('common.all')}</option>
                {activeBuildings
                  .filter((building) =>
                    building.name.toLowerCase().includes(filterBuildingSearch.toLowerCase())
                  )
                  .map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </Select>
              <Input
                label={t('scheduling.searchBuilding')}
                value={filterBuildingSearch}
                onChange={(event) => setFilterBuildingSearch(event.target.value)}
              />
              <Input
                label={t('scheduling.exactDate')}
                type="date"
                value={filters.date}
                onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value }))}
              />
              <Input
                label={t('scheduling.from')}
                type="date"
                value={filters.from}
                onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
              />
              <Input
                label={t('scheduling.to')}
                type="date"
                value={filters.to}
                onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
              />
            </div>
          ) : null}
        </Card>
        {viewMode === 'calendar' ? (
          <Card>
            <h3 className="text-sm font-semibold text-ink-800">{t('scheduling.calendar')}</h3>
            <div className="mt-4">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin]}
                locale={esLocale}
                initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
                height="auto"
                editable={canEdit}
                selectable
                eventOverlap
                slotEventOverlap
                allDayText={t('scheduling.allDay')}
                slotLabelFormat={{ hour: 'numeric', minute: '2-digit', hour12: true }}
                eventTimeFormat={{ hour: 'numeric', minute: '2-digit', hour12: true }}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'timeGridDay,timeGridWeek,dayGridMonth,multiMonthQuarter,multiMonthSemester,multiMonthYear'
                }}
                buttonText={{
                  today: t('common.today'),
                  timeGridDay: t('scheduling.views.day'),
                  timeGridWeek: t('scheduling.views.week'),
                  dayGridMonth: t('scheduling.views.month'),
                  multiMonthQuarter: t('scheduling.views.quarter'),
                  multiMonthSemester: t('scheduling.views.semester'),
                  multiMonthYear: t('scheduling.views.year')
                }}
                views={{
                  multiMonthQuarter: {
                    type: 'multiMonth',
                    duration: { months: 3 },
                    titleFormat: { month: 'short', year: 'numeric' }
                  },
                  multiMonthSemester: {
                    type: 'multiMonth',
                    duration: { months: 6 },
                    titleFormat: { month: 'short', year: 'numeric' }
                  },
                  multiMonthYear: {
                    type: 'multiMonth',
                    duration: { months: 12 },
                    titleFormat: { month: 'short', year: 'numeric' }
                  }
                }}
                events={filtered.map((item) => ({
                  id: item.id,
                  title: item.title,
                  start: item.startAt,
                  end: item.endAt
                }))}
                eventClick={(info) => {
                  const appointment = appointments.find((item) => item.id === info.event.id);
                  if (appointment) setSelected(appointment);
                }}
                eventDrop={(info) => {
                  if (!canEdit) return;
                  if (!info.event.start || !info.event.end) return;
                  void updateDocById('appointments', info.event.id, {
                    startAt: info.event.start.toISOString(),
                    endAt: info.event.end.toISOString()
                  })
                    .then(() => queryClient.invalidateQueries({ queryKey: ['appointments'] }))
                    .then(() => toast(t('scheduling.toastUpdated'), 'success'))
                    .catch(() => toast(t('common.actionError'), 'error'));
                }}
                eventResize={(info) => {
                  if (!canEdit) return;
                  if (!info.event.start || !info.event.end) return;
                  void updateDocById('appointments', info.event.id, {
                    startAt: info.event.start.toISOString(),
                    endAt: info.event.end.toISOString()
                  })
                    .then(() => queryClient.invalidateQueries({ queryKey: ['appointments'] }))
                    .then(() => toast(t('scheduling.toastUpdated'), 'success'))
                    .catch(() => toast(t('common.actionError'), 'error'));
                }}
              />
            </div>
          </Card>
        ) : null}
        {viewMode === 'list' ? (
          <DataTable
            columns={columns}
            data={filtered}
            emptyState={<EmptyState title={t('scheduling.emptyTitle')} description={t('scheduling.emptySubtitle')} />}
          />
        ) : null}
      </div>
      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-ink-900">{selected.title}</h3>
                <p className="text-sm text-ink-600">{t('scheduling.detailTitle')}</p>
              </div>
              <button className="text-sm text-ink-500" onClick={() => setSelected(null)}>
                {t('common.close')}
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-ink-700">
              <p>
                <span className="font-semibold text-ink-900">{t('scheduling.buildingLabel')}:</span>{' '}
                {buildings.find((b) => b.id === selected.buildingId)?.name ?? t('common.noData')}
              </p>
              <p>
                <span className="font-semibold text-ink-900">{t('scheduling.employee')}:</span>{' '}
                {selected.employeeId
                  ? employees.find((employee) => employee.id === selected.employeeId)?.fullName ?? t('common.noData')
                  : t('common.unassigned')}
              </p>
              <p><span className="font-semibold text-ink-900">{t('scheduling.startAt')}:</span> {selected.startAt}</p>
              <p><span className="font-semibold text-ink-900">{t('scheduling.endAt')}:</span> {selected.endAt}</p>
              <p><span className="font-semibold text-ink-900">{t('scheduling.statusLabel')}:</span> {statusLabel(selected.status)}</p>
              <p>
                <span className="font-semibold text-ink-900">{t('scheduling.type')}:</span>{' '}
                {selected.type ? t(`scheduling.types.${selected.type}`) : t('common.noData')}
              </p>
              <p>
                <span className="font-semibold text-ink-900">{t('scheduling.recurrenceLabel')}:</span>{' '}
                {selected.recurrence ? t(`scheduling.recurrenceOptions.${selected.recurrence}`) : t('scheduling.noRecurrence')}
              </p>
              {selected.status === 'cancelado' ? (
                <>
                  <p>
                    <span className="font-semibold text-ink-900">{t('scheduling.cancelReason')}:</span>{' '}
                    {selected.cancelReason ? t(`scheduling.cancelReasons.${selected.cancelReason}`) : t('common.noData')}
                  </p>
                  <p>
                    <span className="font-semibold text-ink-900">{t('scheduling.cancelNote')}:</span>{' '}
                    {selected.cancelNote || t('common.noData')}
                  </p>
                </>
              ) : null}
              {selected.description ? (
                <p><span className="font-semibold text-ink-900">{t('scheduling.descriptionLabel')}:</span> {selected.description}</p>
              ) : null}
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelected(null)}>{t('common.close')}</Button>
              {canEdit ? <Button onClick={() => startEdit(selected)}>{t('common.edit')}</Button> : null}
              {canEdit && selected.status !== 'cancelado' ? (
                <Button variant="secondary" onClick={() => openCancel(selected)}>{t('scheduling.cancel')}</Button>
              ) : null}
              {canEdit ? (
                <Button variant="secondary" onClick={() => setDeleteTarget(selected)}>{t('common.delete')}</Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {canEdit ? (
        <Modal
          open={modalOpen}
          title={editingId ? t('scheduling.update') : t('scheduling.create')}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1 text-sm text-ink-700">
              <label className="font-medium text-ink-800">
                {t('scheduling.building')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  value={buildingSearch}
                  onChange={(event) => {
                    const value = event.target.value;
                    setBuildingSearch(value);
                    setBuildingDropdownOpen(true);
                    const match = buildings.find(
                      (building) => building.name.toLowerCase() === value.trim().toLowerCase()
                    );
                    setValue('buildingId', match ? match.id : '', { shouldValidate: true });
                  }}
                  onFocus={() => setBuildingDropdownOpen(true)}
                  onBlur={() => {
                    setTimeout(() => setBuildingDropdownOpen(false), 100);
                  }}
                  placeholder={t('scheduling.searchBuilding')}
                  className={[
                    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-900',
                    errors.buildingId ? 'border-red-400 focus:border-red-500' : 'border-fog-200'
                  ].join(' ')}
                />
                {buildingDropdownOpen ? (
                  <div className="absolute z-20 mt-2 w-full rounded-lg border border-fog-200 bg-white shadow-soft">
                    <div className="max-h-[220px] overflow-y-auto py-1">
                      {filteredBuildings.map((building) => (
                          <button
                            key={building.id}
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink-700 hover:bg-fog-100"
                            onClick={() => {
                              setBuildingSearch(building.name);
                              setValue('buildingId', building.id, { shouldValidate: true });
                              setBuildingDropdownOpen(false);
                            }}
                          >
                            {building.name}
                          </button>
                        ))}
                      {!filteredBuildings.length ? (
                        <div className="px-3 py-2 text-xs text-ink-500">{t('common.noResults')}</div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
              {errors.buildingId ? <span className="text-xs text-red-500">{errors.buildingId.message}</span> : null}
              <input type="hidden" {...register('buildingId')} />
            </div>
            <Input label={t('scheduling.titleLabel')} error={errors.title?.message} required {...register('title')} />
            <Input label={t('scheduling.description')} {...register('description')} />
            <Input
              label={t('scheduling.startAt')}
              type="datetime-local"
              error={errors.startAt?.message}
              required
              {...register('startAt')}
            />
            <Input
              label={t('scheduling.endAt')}
              type="datetime-local"
              error={errors.endAt?.message}
              required
              {...register('endAt')}
            />
            <Select label={t('scheduling.status')} error={errors.status?.message} required {...register('status')}>
              <option value="programado">{t('scheduling.statusProgrammed')}</option>
              <option value="confirmado">{t('scheduling.statusConfirmed')}</option>
              <option value="completado">{t('scheduling.statusCompleted')}</option>
            </Select>
            <Select label={t('scheduling.type')} error={errors.type?.message} required {...register('type')}>
              <option value="">{t('common.select')}</option>
              {appointmentTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {t(`scheduling.types.${option}`)}
                </option>
              ))}
            </Select>
            <Select label={t('scheduling.employee')} error={errors.employeeId?.message} {...register('employeeId')}>
              <option value="">{t('common.unassigned')}</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                </option>
              ))}
            </Select>
            <Select label={t('scheduling.recurrence')} error={errors.recurrence?.message} {...register('recurrence')}>
              <option value="">{t('scheduling.noRecurrence')}</option>
              {recurrenceOptions.map((option) => (
                <option key={option} value={option}>
                  {t(`scheduling.recurrenceOptions.${option}`)}
                </option>
              ))}
            </Select>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('scheduling.saving') : editingId ? t('scheduling.update') : t('scheduling.create')}
            </Button>
          </form>
        </Modal>
      ) : null}
      <Modal
        open={Boolean(cancelTarget)}
        title={t('scheduling.cancelTitle')}
        onClose={() => setCancelTarget(null)}
      >
        <form onSubmit={handleCancelSubmit(onCancel)} className="space-y-4" noValidate>
          <Select label={t('scheduling.cancelReason')} error={cancelErrors.reason?.message} {...cancelRegister('reason')}>
            <option value="">{t('common.select')}</option>
            {cancelReasonOptions.map((option) => (
              <option key={option} value={option}>
                {t(`scheduling.cancelReasons.${option}`)}
              </option>
            ))}
          </Select>
          <Input label={t('scheduling.cancelNote')} error={cancelErrors.note?.message} {...cancelRegister('note')} />
          <Button type="submit" className="w-full" disabled={cancelSubmitting}>
            {cancelSubmitting ? t('scheduling.cancelling') : t('scheduling.confirmCancel')}
          </Button>
        </form>
      </Modal>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={t('scheduling.deleteTitle')}
        description={t('scheduling.deleteConfirm')}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
