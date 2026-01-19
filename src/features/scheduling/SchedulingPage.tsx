import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
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
import { recurrenceOptions } from '@/core/appointments';
import { createDoc, updateDocById } from '@/lib/api/firestore';
import { useList } from '@/lib/api/queries';
import { isValidDateRange } from '@/core/validators';
import type { ColumnDef } from '@tanstack/react-table';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/app/Auth';

export default function SchedulingPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { role } = useAuth();
  const canEdit = role !== 'view';
  const { isMobile } = useBreakpoint();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: appointments = [] } = useList<Appointment>('appointments', 'appointments');
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ buildingId: '', date: '', from: '', to: '' });
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const schema = z.object({
    buildingId: z.string().min(1, t('scheduling.buildingRequired')),
    title: z.string().min(2, t('common.required')),
    description: z.string().optional(),
    startAt: z.string().min(1, t('common.required')),
    endAt: z.string().min(1, t('common.required')),
    status: z.string().min(1, t('common.required')),
    recurrence: z.string().optional()
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

  const filtered = appointments.filter((item) => {
    if (filters.buildingId && item.buildingId !== filters.buildingId) return false;
    if (filters.date && item.startAt.slice(0, 10) !== filters.date) return false;
    if (filters.from && item.startAt < filters.from) return false;
    if (filters.to && item.endAt > filters.to) return false;
    return true;
  });

  const columns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      { header: t('scheduling.titleLabel'), accessorKey: 'title' },
      {
        header: t('scheduling.building'),
        accessorFn: (row) => buildings.find((b) => b.id === row.buildingId)?.name ?? t('common.noData')
      },
      { header: t('scheduling.startAt'), accessorKey: 'startAt' },
      {
        header: t('scheduling.status'),
        accessorFn: (row) => {
          const map: Record<string, string> = {
            programado: t('scheduling.statusProgrammed'),
            confirmado: t('scheduling.statusConfirmed'),
            completado: t('scheduling.statusCompleted'),
            cancelado: t('scheduling.statusCanceled')
          };
          return map[row.status] ?? row.status;
        }
      }
    ],
    [buildings, t]
  );

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
      recurrence: values.recurrence || null
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
      recurrence: ''
    });
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
    setSelected(null);
    setModalOpen(true);
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
          <>
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
          </>
        }
      />
      <div className="space-y-4">
        {viewMode === 'calendar' ? (
          <Card>
            <h3 className="text-sm font-semibold text-ink-800">{t('scheduling.calendar')}</h3>
            <div className="mt-4">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin]}
                initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
                height="auto"
                editable={canEdit}
                selectable
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'timeGridDay,dayGridMonth,multiMonthQuarter,multiMonthSemester,multiMonthYear'
                }}
                buttonText={{
                  today: t('common.today'),
                  timeGridDay: t('scheduling.views.day'),
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
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </Select>
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
              <p><span className="font-semibold text-ink-900">{t('scheduling.startAt')}:</span> {selected.startAt}</p>
              <p><span className="font-semibold text-ink-900">{t('scheduling.endAt')}:</span> {selected.endAt}</p>
              <p><span className="font-semibold text-ink-900">{t('scheduling.statusLabel')}:</span> {statusLabel(selected.status)}</p>
              <p>
                <span className="font-semibold text-ink-900">{t('scheduling.recurrenceLabel')}:</span>{' '}
                {selected.recurrence ? t(`scheduling.recurrenceOptions.${selected.recurrence}`) : t('scheduling.noRecurrence')}
              </p>
              {selected.description ? (
                <p><span className="font-semibold text-ink-900">{t('scheduling.descriptionLabel')}:</span> {selected.description}</p>
              ) : null}
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelected(null)}>{t('common.close')}</Button>
              {canEdit ? <Button onClick={() => startEdit(selected)}>{t('common.edit')}</Button> : null}
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Select label={t('scheduling.building')} error={errors.buildingId?.message} {...register('buildingId')}>
              <option value="">{t('common.select')}</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </Select>
            <Input label={t('scheduling.titleLabel')} error={errors.title?.message} {...register('title')} />
            <Input label={t('scheduling.description')} {...register('description')} />
            <Input
              label={t('scheduling.startAt')}
              type="datetime-local"
              error={errors.startAt?.message}
              {...register('startAt')}
            />
            <Input
              label={t('scheduling.endAt')}
              type="datetime-local"
              error={errors.endAt?.message}
              {...register('endAt')}
            />
            <Select label={t('scheduling.status')} error={errors.status?.message} {...register('status')}>
              <option value="programado">{t('scheduling.statusProgrammed')}</option>
              <option value="confirmado">{t('scheduling.statusConfirmed')}</option>
              <option value="completado">{t('scheduling.statusCompleted')}</option>
              <option value="cancelado">{t('scheduling.statusCanceled')}</option>
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
    </div>
  );
}
