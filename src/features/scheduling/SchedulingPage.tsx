import { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import esLocale from '@fullcalendar/core/locales/es';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
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
import type { Contract } from '@/core/models/contract';
import type { Employee } from '@/core/models/employee';
import {
  recurrenceOptions,
  appointmentTypeOptions,
  cancelReasonOptions,
  issueTypeOptions,
  issueCategoryOptions
} from '@/core/appointments';
import { createDoc, updateDocById, deleteDocById } from '@/lib/api/firestore';
import { generateAppointmentsPdf } from '@/lib/api/functions';
import { useList } from '@/lib/api/queries';
import { isValidDateRange } from '@/core/validators';
import type { ColumnDef } from '@tanstack/react-table';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/app/Auth';
import ConfirmModal from '@/components/ConfirmModal';
import { CancelIcon, TrashIcon, CheckIcon, EditIcon, DownloadIcon } from '@/components/ActionIcons';
import { storage, db } from '@/lib/firebase/client';
import { addDays, addMonths, isAfter } from 'date-fns';

export default function SchedulingPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'editor';
  const canScheduleEmergency = role === 'admin' || role === 'editor' || role === 'emergency_scheduler';
  const canCreate = canEdit || role === 'emergency_scheduler';
  const { isMobile } = useBreakpoint();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: contracts = [] } = useList<Contract>('contracts', 'contracts');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const { data: appointments = [] } = useList<Appointment>('appointments', 'appointments');
  const { data: issueSettings } = useQuery({
    queryKey: ['issueSettings'],
    queryFn: async () => {
      const snapshot = await getDoc(doc(db, 'settings', 'issues'));
      return snapshot.exists() ? (snapshot.data() as { types?: string[]; categories?: Record<string, string[]> }) : null;
    },
    staleTime: 60_000
  });
  const { data: groupSettings } = useQuery({
    queryKey: ['buildingGroups'],
    queryFn: async () => {
      const snapshot = await getDoc(doc(db, 'settings', 'building_groups'));
      return snapshot.exists()
        ? (snapshot.data() as { groups?: Array<{ id: string; name: string; color: string }> })
        : null;
    },
    staleTime: 60_000
  });
  const { data: calendarSettings } = useQuery({
    queryKey: ['calendarSettings'],
    queryFn: async () => {
      const snapshot = await getDoc(doc(db, 'settings', 'calendar'));
      return snapshot.exists()
        ? (snapshot.data() as { holidays?: Array<{ date: string }>; nonWorkingDays?: Array<{ date: string }> })
        : null;
    },
    staleTime: 60_000
  });
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ buildingId: '', from: '', to: '' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [buildingSearch, setBuildingSearch] = useState('');
  const [filterBuildingSearch, setFilterBuildingSearch] = useState('');
  const [buildingDropdownOpen, setBuildingDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [seriesConfirmOpen, setSeriesConfirmOpen] = useState(false);
  const [pendingSeriesValues, setPendingSeriesValues] = useState<FormValues | null>(null);
  const [calendarRange, setCalendarRange] = useState<{ start: string; end: string } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<Appointment | null>(null);
  const [hasIssues, setHasIssues] = useState<'yes' | 'no' | ''>('');
  const [issues, setIssues] = useState<
    Array<{
      id: string;
      type: string;
      category: string;
      description: string;
      photos: File[];
    }>
  >([]);
  const [issueDraft, setIssueDraft] = useState({
    id: '',
    type: '',
    category: '',
    description: '',
    photos: [] as File[]
  });
  const [issueError, setIssueError] = useState<string | null>(null);
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

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
    watch,
    setValue,
    setError
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedType = watch('type');

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

  const filterFromDate = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
  const filterToDate = filters.to ? new Date(`${filters.to}T23:59:59`) : null;
  const filtered = appointments.filter((item) => {
    if (filters.buildingId && item.buildingId !== filters.buildingId) return false;
    const start = new Date(item.startAt);
    const end = new Date(item.endAt);
    if (filterFromDate && start < filterFromDate) return false;
    if (filterToDate && end > filterToDate) return false;
    return true;
  });

  const restrictedDates = useMemo(() => {
    const dates = new Set<string>();
    (calendarSettings?.holidays ?? []).forEach((item) => item.date && dates.add(item.date));
    (calendarSettings?.nonWorkingDays ?? []).forEach((item) => item.date && dates.add(item.date));
    return dates;
  }, [calendarSettings]);

  const isRestrictedDate = (value?: string) => {
    if (!value) return false;
    const date = value.slice(0, 10);
    return restrictedDates.has(date);
  };
  const formatLocalIso = (value: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:00`;
  };
  const formatLocalInput = (value: Date) => formatLocalIso(value).slice(0, 16);
  const toLocalIso = (value: string) => {
    if (!value) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return formatLocalIso(date);
  };
  const isWithinBusinessHours = (startIso: string, endIso: string) => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    return startMinutes >= 8 * 60 && endMinutes <= 18 * 60;
  };
  const nextWorkingDate = (base: Date) => {
    let candidate = new Date(base);
    while (isRestrictedDate(formatLocalIso(candidate)) || candidate.getDay() === 0) {
      candidate = addDays(candidate, 1);
    }
    return candidate;
  };
  const alignToContractStart = (base: Date, contractStart: Date, recurrence?: string) => {
    let cursor = new Date(base);
    const step = (date: Date) => {
      switch (recurrence) {
        case 'semanal':
          return addDays(date, 7);
        case 'quincenal':
          return addDays(date, 15);
        case 'mensual':
          return addMonths(date, 1);
        case 'bimensual':
          return addMonths(date, 2);
        case 'semestral':
          return addMonths(date, 6);
        default:
          return addMonths(date, 1);
      }
    };
    while (isAfter(contractStart, cursor)) {
      cursor = step(cursor);
    }
    return cursor;
  };

  const activeBuildings = useMemo(
    () => buildings.filter((building) => building.active !== false),
    [buildings]
  );

  const dynamicIssueTypes = useMemo(
    () => (issueSettings?.types?.length ? issueSettings.types : issueTypeOptions),
    [issueSettings]
  );
  const dynamicIssueCategories = useMemo(
    () => (issueSettings?.categories ? issueSettings.categories : issueCategoryOptions),
    [issueSettings]
  );

  const groupColors = useMemo(() => {
    const map = new Map<string, string>();
    (groupSettings?.groups ?? []).forEach((group) => map.set(group.name, group.color));
    return map;
  }, [groupSettings]);
  const filteredBuildings = useMemo(
    () => activeBuildings.filter((building) => building.name.toLowerCase().includes(buildingSearch.trim().toLowerCase())),
    [activeBuildings, buildingSearch]
  );

  const columns = useMemo<ColumnDef<Appointment>[]>(() => {
    const base: ColumnDef<Appointment>[] = [
      { header: t('scheduling.titleLabel'), accessorKey: 'title', enableSorting: true },
      {
        header: t('scheduling.building'),
        enableSorting: true,
        accessorFn: (row) => buildings.find((b) => b.id === row.buildingId)?.name ?? t('common.noData')
      },
      {
        header: t('scheduling.employee'),
        enableSorting: true,
        accessorFn: (row) =>
          row.employeeId
            ? employees.find((employee) => employee.id === row.employeeId)?.fullName ?? t('common.noData')
            : t('common.unassigned')
      },
      { header: t('scheduling.startAt'), accessorKey: 'startAt', enableSorting: true },
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
            <button
              className="inline-flex items-center justify-center rounded-md border border-fog-200 p-1 text-ink-700 hover:border-ink-900"
              onClick={() => startEdit(row.original)}
              title={t('common.edit')}
              aria-label={t('common.edit')}
            >
              <EditIcon className="h-4 w-4" aria-hidden />
            </button>
            {row.original.status !== 'completado' && row.original.status !== 'cancelado' ? (
              <button
                className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-emerald-600 hover:bg-emerald-50"
                onClick={() => startComplete(row.original)}
                title={t('scheduling.complete')}
                aria-label={t('scheduling.complete')}
              >
                <CheckIcon className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
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

  const regenerateSeries = async (values: FormValues, current: Appointment | null) => {
    const seriesId = current?.seriesId ?? (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
    const related = appointments.filter((item) => item.seriesId === seriesId);
    if (related.length) {
      await Promise.all(related.map((item) => deleteDocById('appointments', item.id)));
    } else if (current) {
      await deleteDocById('appointments', current.id);
    }

    const building = buildings.find((item) => item.id === values.buildingId);
    const contract = building?.contractId
      ? contracts.find((item) => item.id === building.contractId)
      : null;
    if (!contract?.startAt || !contract?.endAt) {
      toast(t('scheduling.contractRequired'), 'error');
      return;
    }
    const contractStart = new Date(contract.startAt);
    const contractEnd = new Date(contract.endAt);
    const baseStart = new Date(toLocalIso(values.startAt));
    const baseEnd = new Date(toLocalIso(values.endAt));
    const durationMs = baseEnd.getTime() - baseStart.getTime();
    if (Number.isNaN(contractStart.getTime()) || Number.isNaN(contractEnd.getTime())) {
      toast(t('scheduling.contractRequired'), 'error');
      return;
    }
    if (isAfter(baseStart, contractEnd)) {
      toast(t('scheduling.contractOutOfRange'), 'error');
      return;
    }
    if (durationMs <= 0) {
      setError('endAt', { message: t('errors.invalidDateRange') });
      return;
    }
    const step = values.recurrence;
    let cursor = alignToContractStart(baseStart, contractStart, step);
    const nextDate = (date: Date) => {
      switch (step) {
        case 'semanal':
          return addDays(date, 7);
        case 'quincenal':
          return addDays(date, 15);
        case 'mensual':
          return addMonths(date, 1);
        case 'bimensual':
          return addMonths(date, 2);
        case 'semestral':
          return addMonths(date, 6);
        default:
          return addMonths(date, 1);
      }
    };

    const payload = {
      buildingId: values.buildingId,
      title: values.title,
      description: values.description ?? '',
      startAt: toLocalIso(values.startAt),
      endAt: toLocalIso(values.endAt),
      status: values.status,
      recurrence: values.recurrence || null,
      type: values.type,
      employeeId: values.employeeId || null,
      seriesId
    };
    const tasks: Promise<unknown>[] = [];
    while (!isAfter(cursor, contractEnd)) {
      const scheduledStart = nextWorkingDate(cursor);
      if (!isAfter(scheduledStart, contractEnd)) {
        const end = new Date(scheduledStart.getTime() + durationMs);
        tasks.push(
          createDoc('appointments', {
            ...payload,
            startAt: formatLocalIso(scheduledStart),
            endAt: formatLocalIso(end)
          })
        );
      }
      cursor = nextDate(cursor);
    }
    await Promise.all(tasks);
  };

  const onSubmit = async (values: FormValues) => {
    console.log('[Scheduling] submit values', values);
    if (!canCreate) {
      toast(t('common.actionError'), 'error');
      return;
    }
    if (role === 'emergency_scheduler' && values.type !== 'emergencia') {
      setError('type', { message: t('scheduling.emergencyOnly') });
      return;
    }
    if (values.type === 'emergencia') {
      values.recurrence = '';
    }
    if (!isValidDateRange(values.startAt, values.endAt)) {
      setError('endAt', { message: t('errors.invalidDateRange') });
      return;
    }
    const startIso = toLocalIso(values.startAt);
    const endIso = toLocalIso(values.endAt);
    console.log('[Scheduling] normalized dates', { startIso, endIso });
    const isEmergency = values.type === 'emergencia';
    if (!isEmergency && !isWithinBusinessHours(startIso, endIso)) {
      setError('startAt', { message: t('scheduling.businessHoursStart') });
      setError('endAt', { message: t('scheduling.businessHoursEnd') });
      return;
    }
    if ((isRestrictedDate(startIso) || isRestrictedDate(endIso)) && !isEmergency) {
      setError('startAt', { message: t('scheduling.dateBlocked') });
      return;
    }
    if ((isRestrictedDate(startIso) || isRestrictedDate(endIso)) && isEmergency && !canScheduleEmergency) {
      setError('type', { message: t('scheduling.emergencyPermission') });
      return;
    }
    const payload = {
      buildingId: values.buildingId,
      title: values.title,
      description: values.description ?? '',
      startAt: toLocalIso(values.startAt),
      endAt: toLocalIso(values.endAt),
      status: values.status,
      recurrence: values.recurrence || null,
      type: values.type,
      employeeId: values.employeeId || null,
      seriesId: null as string | null
    };
    console.log('[Scheduling] payload', payload);
    try {
      const current = editingId ? appointments.find((item) => item.id === editingId) : null;
      if (editingId && values.recurrence) {
        setPendingSeriesValues(values);
        setSeriesConfirmOpen(true);
        return;
      }
      if (editingId && !values.recurrence) {
        if (current?.seriesId) {
          const related = appointments.filter((item) => item.seriesId === current.seriesId && item.id !== editingId);
          await Promise.all(related.map((item) => deleteDocById('appointments', item.id)));
        }
        console.log('[Scheduling] updating appointment', editingId);
        await updateDocById('appointments', editingId, { ...payload, seriesId: null });
      } else if (values.recurrence) {
        console.log('[Scheduling] creating recurring series', values.recurrence);
        const building = buildings.find((item) => item.id === values.buildingId);
        const contract = building?.contractId
          ? contracts.find((item) => item.id === building.contractId)
          : null;
        if (!contract?.startAt || !contract?.endAt) {
          toast(t('scheduling.contractRequired'), 'error');
          return;
        }
        const contractStart = new Date(contract.startAt);
        const contractEnd = new Date(contract.endAt);
        const baseStart = new Date(toLocalIso(values.startAt));
        const baseEnd = new Date(toLocalIso(values.endAt));
        const durationMs = baseEnd.getTime() - baseStart.getTime();
        if (Number.isNaN(contractStart.getTime()) || Number.isNaN(contractEnd.getTime())) {
          toast(t('scheduling.contractRequired'), 'error');
          return;
        }
        if (isAfter(baseStart, contractEnd)) {
          toast(t('scheduling.contractOutOfRange'), 'error');
          return;
        }
        if (durationMs <= 0) {
          setError('endAt', { message: t('errors.invalidDateRange') });
          return;
        }
        const step = values.recurrence;
        let cursor = alignToContractStart(baseStart, contractStart, step);
        const nextDate = (date: Date) => {
          switch (step) {
            case 'semanal':
              return addDays(date, 7);
            case 'quincenal':
              return addDays(date, 15);
            case 'mensual':
              return addMonths(date, 1);
            case 'bimensual':
              return addMonths(date, 2);
            case 'semestral':
              return addMonths(date, 6);
            default:
              return addMonths(date, 1);
          }
        };

        const seriesId = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
        const tasks: Promise<unknown>[] = [];
        while (!isAfter(cursor, contractEnd)) {
          const scheduledStart = nextWorkingDate(cursor);
          if (!isAfter(scheduledStart, contractEnd)) {
            const end = new Date(scheduledStart.getTime() + durationMs);
            tasks.push(
              createDoc('appointments', {
                ...payload,
                seriesId,
                startAt: formatLocalIso(scheduledStart),
                endAt: formatLocalIso(end)
              })
            );
          }
          cursor = nextDate(cursor);
        }
        console.log('[Scheduling] series tasks', tasks.length);
        await Promise.all(tasks);
      } else {
        console.log('[Scheduling] creating appointment');
        const result = await createDoc('appointments', payload);
        console.log('[Scheduling] created appointment', result);
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

  const confirmSeriesRegeneration = async () => {
    if (!editingId || !pendingSeriesValues) {
      setSeriesConfirmOpen(false);
      return;
    }
    const current = appointments.find((item) => item.id === editingId) ?? null;
    try {
      await regenerateSeries(pendingSeriesValues, current);
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      reset();
      setEditingId(null);
      setModalOpen(false);
      toast(t('scheduling.toastUpdated'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setSeriesConfirmOpen(false);
      setPendingSeriesValues(null);
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

  const startCreateAt = (start: Date) => {
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    setEditingId(null);
    reset({
      buildingId: '',
      title: '',
      description: '',
      startAt: formatLocalInput(start),
      endAt: formatLocalInput(end),
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
    if (appointment.type === 'emergencia') {
      setValue('recurrence', '');
    }
    setValue('employeeId', appointment.employeeId ?? '');
    const buildingName = buildings.find((building) => building.id === appointment.buildingId)?.name ?? '';
    setBuildingSearch(buildingName);
    setSelected(null);
    setModalOpen(true);
  };

  useEffect(() => {
    if (selectedType === 'emergencia') {
      setValue('recurrence', '');
    }
  }, [selectedType, setValue]);

  const openCancel = (appointment: Appointment) => {
    setCancelTarget(appointment);
    resetCancel({ reason: '', note: '' });
  };

  const startComplete = (appointment: Appointment) => {
    setCompleteTarget(appointment);
    setHasIssues('');
    setIssues([]);
    setIssueDraft({ id: '', type: '', category: '', description: '', photos: [] });
    setIssueError(null);
  };

  const addIssue = () => {
    setIssueError(null);
    if (!issueDraft.type || !issueDraft.category) {
      setIssueError(t('scheduling.issueRequired'));
      return;
    }
    if (issueDraft.photos.length !== 2) {
      setIssueError(t('scheduling.issuePhotosRequired'));
      return;
    }
    const id = issueDraft.id || (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
    setIssues((prev) => [...prev, { ...issueDraft, id }]);
    setIssueDraft({ id: '', type: '', category: '', description: '', photos: [] });
  };

  const removeIssue = (id: string) => {
    setIssues((prev) => prev.filter((item) => item.id !== id));
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

  const completeService = async () => {
    if (!completeTarget) return;
    if (!hasIssues) {
      setIssueError(t('scheduling.issueDecisionRequired'));
      return;
    }
    if (hasIssues === 'yes' && issues.length === 0) {
      setIssueError(t('scheduling.issueAtLeastOne'));
      return;
    }
    setCompleteSubmitting(true);
    try {
      let payload: Record<string, unknown> = {
        status: 'completado',
        completedAt: new Date().toISOString()
      };
      if (hasIssues === 'yes') {
        const resolvedIssues = await Promise.all(
          issues.map(async (issue) => {
            const photoUrls = await uploadIssuePhotos(completeTarget.id, issue.id, issue.photos);
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
      await updateDocById('appointments', completeTarget.id, payload);
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast(t('scheduling.toastCompleted'), 'success');
      setCompleteTarget(null);
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setCompleteSubmitting(false);
    }
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
      if (editingId === deleteTarget.id) {
        setModalOpen(false);
        setEditingId(null);
      }
      if (selected?.id === deleteTarget.id) {
        setSelected(null);
      }
      toast(t('scheduling.toastDeleted'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const toLocalDate = (value?: string | null) => {
    if (!value) return null;
    const cleaned = value.replace(/Z$|[+-]\d{2}:\d{2}$/, '');
    const date = new Date(cleaned.includes('T') ? cleaned : cleaned.replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const formatDateTime = (value?: string | null) => {
    const date = toLocalDate(value);
    if (!date) return '';
    return date.toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
      hour12: true
    });
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

  const resolveIssueLabel = (prefix: 'scheduling.issueTypes' | 'scheduling.issueCategories', value: string) => {
    const key = `${prefix}.${value}`;
    const label = t(key);
    return label === key ? value : label;
  };

  const resolvePdfRange = () => {
    if (filters.from && filters.to) {
      const start = new Date(`${filters.from}T00:00:00`);
      const end = new Date(`${filters.to}T00:00:00`);
      end.setDate(end.getDate() + 1);
      return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
    }
    if (calendarRange) {
      return { rangeStart: calendarRange.start, rangeEnd: calendarRange.end };
    }
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
  };

  const handleGeneratePdf = async () => {
    if (!filters.buildingId) return;
    try {
      setPdfLoading(true);
      const { rangeStart, rangeEnd } = resolvePdfRange();
      const response = await generateAppointmentsPdf({
        buildingId: filters.buildingId,
        rangeStart,
        rangeEnd
      });
      const bytes = Uint8Array.from(atob(response.contentBase64), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.filename;
      link.click();
      URL.revokeObjectURL(url);
      toast(t('scheduling.pdfReady'), 'success');
    } catch (error) {
      toast(t('scheduling.pdfError'), 'error');
    } finally {
      setPdfLoading(false);
    }
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
            <Button
              variant="secondary"
              disabled={!filters.buildingId || pdfLoading}
              onClick={handleGeneratePdf}
              className="h-9 px-3 text-sm whitespace-nowrap flex items-center gap-2"
            >
              <DownloadIcon className="h-4 w-4" aria-hidden />
              <span>
              {pdfLoading ? t('scheduling.pdfGenerating') : t('scheduling.pdfGenerate')}
              </span>
            </Button>
            {canCreate ? <Button onClick={startCreate}>{t('common.add')}</Button> : null}
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
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1 space-y-1 text-sm text-ink-700">
                <label className="font-medium text-ink-800">{t('scheduling.building')}</label>
                <div className="relative">
                  <input
                    value={filterBuildingSearch}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFilterBuildingSearch(value);
                      const match = buildings.find(
                        (building) => building.name.toLowerCase() === value.trim().toLowerCase()
                      );
                      setFilters((prev) => ({ ...prev, buildingId: match ? match.id : '' }));
                    }}
                    onFocus={() => setFilterDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setFilterDropdownOpen(false), 100)}
                    placeholder={t('scheduling.searchBuilding')}
                    className="w-full rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-900"
                  />
                  {filterDropdownOpen ? (
                    <div className="absolute z-20 mt-2 w-full rounded-lg border border-fog-200 bg-white shadow-soft">
                      <div className="max-h-[220px] overflow-y-auto py-1">
                        {activeBuildings
                          .filter((building) =>
                            building.name.toLowerCase().includes(filterBuildingSearch.toLowerCase())
                          )
                          .map((building) => (
                            <button
                              key={building.id}
                              type="button"
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink-700 hover:bg-fog-100"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                setFilterBuildingSearch(building.name);
                                setFilters((prev) => ({ ...prev, buildingId: building.id }));
                                setFilterDropdownOpen(false);
                              }}
                            >
                              {building.name}
                            </button>
                          ))}
                        {!activeBuildings.length ? (
                          <div className="px-3 py-2 text-xs text-ink-500">{t('common.noResults')}</div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="w-[160px]">
                <Input
                  label={t('scheduling.from')}
                  type="date"
                  value={filters.from}
                  onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
                />
              </div>
              <div className="w-[160px]">
                <Input
                  label={t('scheduling.to')}
                  type="date"
                  value={filters.to}
                  onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
                />
              </div>
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
                timeZone="America/Bogota"
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
                dateClick={(info) => {
                  if (!canCreate) return;
                  const dateIso = info.date.toISOString();
                  if (isRestrictedDate(dateIso) && !canScheduleEmergency) {
                    toast(t('scheduling.dateBlocked'), 'error');
                    return;
                  }
                  startCreateAt(info.date);
                }}
                datesSet={(info) => {
                  setCalendarRange({ start: info.start.toISOString(), end: info.end.toISOString() });
                }}
                events={[
                  ...filtered.map((item) => {
                    const building = buildings.find((b) => b.id === item.buildingId);
                    const color = building?.group ? groupColors.get(building.group) : undefined;
                    return {
                      id: item.id,
                      title: item.title,
                      start: item.startAt,
                      end: item.endAt,
                      backgroundColor: color,
                      borderColor: color,
                      extendedProps: {
                        type: item.type
                      }
                    };
                  }),
                  ...Array.from(restrictedDates).map((date) => ({
                    id: `holiday-${date}`,
                    start: date,
                    allDay: true,
                    display: 'background',
                    backgroundColor: '#e5e7eb'
                  }))
                ]}
                eventClick={(info) => {
                  const appointment = appointments.find((item) => item.id === info.event.id);
                  if (appointment) {
                    setSelected(appointment);
                  }
                }}
                eventDrop={(info) => {
                  if (!canEdit) return;
                  if (!info.event.start || !info.event.end) return;
                  const type = (info.event.extendedProps as { type?: string }).type;
                  if (type !== 'emergencia') {
                    const startIso = formatLocalIso(info.event.start);
                    const endIso = formatLocalIso(info.event.end);
                    if (!isWithinBusinessHours(startIso, endIso)) {
                      toast(t('scheduling.businessHoursToast'), 'error');
                      info.revert();
                      return;
                    }
                  }
                  if (
                    (isRestrictedDate(formatLocalIso(info.event.start)) || isRestrictedDate(formatLocalIso(info.event.end))) &&
                    type !== 'emergencia'
                  ) {
                    toast(t('scheduling.dateBlocked'), 'error');
                    info.revert();
                    return;
                  }
                  void updateDocById('appointments', info.event.id, {
                    startAt: formatLocalIso(info.event.start),
                    endAt: formatLocalIso(info.event.end)
                  })
                    .then(() => queryClient.invalidateQueries({ queryKey: ['appointments'] }))
                    .then(() => toast(t('scheduling.toastUpdated'), 'success'))
                    .catch(() => toast(t('common.actionError'), 'error'));
                }}
                eventResize={(info) => {
                  if (!canEdit) return;
                  if (!info.event.start || !info.event.end) return;
                  const type = (info.event.extendedProps as { type?: string }).type;
                  if (type !== 'emergencia') {
                    const startIso = formatLocalIso(info.event.start);
                    const endIso = formatLocalIso(info.event.end);
                    if (!isWithinBusinessHours(startIso, endIso)) {
                      toast(t('scheduling.businessHoursToast'), 'error');
                      info.revert();
                      return;
                    }
                  }
                  if (
                    (isRestrictedDate(formatLocalIso(info.event.start)) || isRestrictedDate(formatLocalIso(info.event.end))) &&
                    type !== 'emergencia'
                  ) {
                    toast(t('scheduling.dateBlocked'), 'error');
                    info.revert();
                    return;
                  }
                  void updateDocById('appointments', info.event.id, {
                    startAt: formatLocalIso(info.event.start),
                    endAt: formatLocalIso(info.event.end)
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
              <button
                className="text-sm text-ink-500"
                onClick={() => {
                  setSelected(null);
                }}
              >
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
              <p>
                <span className="font-semibold text-ink-900">{t('scheduling.startAt')}:</span>{' '}
                {formatDateTime(selected.startAt)}
              </p>
              <p>
                <span className="font-semibold text-ink-900">{t('scheduling.endAt')}:</span>{' '}
                {formatDateTime(selected.endAt)}
              </p>
              <p><span className="font-semibold text-ink-900">{t('scheduling.statusLabel')}:</span> {statusLabel(selected.status)}</p>
              <p>
                <span className="font-semibold text-ink-900">{t('scheduling.type')}:</span>{' '}
                {selected.type ? t(`scheduling.types.${selected.type}`) : t('common.noData')}
              </p>
              <p>
                <span className="font-semibold text-ink-900">{t('scheduling.recurrenceLabel')}:</span>{' '}
                {selected.recurrence ? t(`scheduling.recurrenceOptions.${selected.recurrence}`) : t('scheduling.noRecurrence')}
              </p>
              {selected.issues?.length ? (
                <div className="space-y-2">
                  <p className="font-semibold text-ink-900">{t('scheduling.issuesTitle')}</p>
                  {selected.issues.map((issue) => (
                    <div key={issue.id} className="rounded-lg border border-fog-200 bg-fog-50 p-2 text-xs text-ink-700">
                      <p className="font-semibold text-ink-900">{resolveIssueLabel('scheduling.issueTypes', issue.type)}</p>
                      <p>{resolveIssueLabel('scheduling.issueCategories', issue.category)}</p>
                      {issue.description ? <p>{issue.description}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
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
              {canEdit ? (
                <button
                  className="inline-flex items-center gap-1 rounded-md border border-fog-200 px-2 py-1 text-xs text-ink-700 hover:border-ink-900"
                  onClick={() => startEdit(selected)}
                >
                  <EditIcon className="h-3.5 w-3.5" />
                  {t('common.edit')}
                </button>
              ) : null}
              {canEdit && selected.status !== 'completado' && selected.status !== 'cancelado' ? (
                <button
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:border-emerald-400"
                  onClick={() => startComplete(selected)}
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  {t('scheduling.complete')}
                </button>
              ) : null}
              {canEdit && selected.status !== 'cancelado' ? (
                <button
                  className="inline-flex items-center gap-1 rounded-md border border-amber-200 px-2 py-1 text-xs text-amber-700 hover:border-amber-400"
                  onClick={() => openCancel(selected)}
                >
                  <CancelIcon className="h-3.5 w-3.5" />
                  {t('scheduling.cancel')}
                </button>
              ) : null}
              {canEdit ? (
                <button
                  className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:border-rose-400"
                  onClick={() => setDeleteTarget(selected)}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  {t('common.delete')}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {pdfLoading ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-ink-700 shadow-soft">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-ink-800" />
            {t('scheduling.pdfGenerating')}
          </div>
        </div>
      ) : null}
      <ConfirmModal
        open={seriesConfirmOpen}
        title={t('scheduling.seriesConfirmTitle')}
        description={t('scheduling.seriesConfirmDescription')}
        onConfirm={confirmSeriesRegeneration}
        onClose={() => {
          setSeriesConfirmOpen(false);
          setPendingSeriesValues(null);
        }}
      />
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
                          onMouseDown={(event) => {
                            event.preventDefault();
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
            <Select
              label={t('scheduling.recurrence')}
              error={errors.recurrence?.message}
              disabled={selectedType === 'emergencia'}
              {...register('recurrence')}
            >
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
      <Modal
        open={Boolean(completeTarget)}
        title={t('scheduling.completeTitle')}
        onClose={() => setCompleteTarget(null)}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-ink-800">{t('scheduling.issueQuestion')}</p>
            <Button
              variant={hasIssues === 'yes' ? 'primary' : 'secondary'}
              onClick={() => {
                setIssueError(null);
                setHasIssues('yes');
              }}
              type="button"
            >
              {t('common.yes')}
            </Button>
            <Button
              variant={hasIssues === 'no' ? 'primary' : 'secondary'}
              onClick={() => {
                setIssueError(null);
                setHasIssues('no');
              }}
              type="button"
            >
              {t('common.no')}
            </Button>
          </div>
          {issueError && hasIssues !== 'yes' ? (
            <p className="text-xs text-red-500">{issueError}</p>
          ) : null}
          {hasIssues === 'yes' ? (
            <div className="space-y-4 rounded-xl border border-fog-200 bg-fog-50 p-4">
              <Select
                label={t('scheduling.issueType')}
                required
                value={issueDraft.type}
                onChange={(event) =>
                  setIssueDraft((prev) => ({
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
                value={issueDraft.category}
                onChange={(event) =>
                  setIssueDraft((prev) => ({
                    ...prev,
                    category: event.target.value
                  }))
                }
                disabled={!issueDraft.type}
              >
                <option value="">{t('common.select')}</option>
                {(issueDraft.type
                  ? (dynamicIssueCategories as Record<string, string[]>)[issueDraft.type] ?? []
                  : []
                ).map((option: string) => (
                  <option key={option} value={option}>
                    {resolveIssueLabel('scheduling.issueCategories', option)}
                  </option>
                ))}
              </Select>
              <Input
                label={t('scheduling.issueDescription')}
                value={issueDraft.description}
                onChange={(event) => setIssueDraft((prev) => ({ ...prev, description: event.target.value }))}
                maxLength={300}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-800">
                  {t('scheduling.issuePhotos')}
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1].map((index) => {
                    const file = issueDraft.photos[index];
                    return (
                      <label
                        key={index}
                        className="flex h-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-fog-300 bg-white text-ink-500 hover:border-ink-900"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const next = Array.from(issueDraft.photos);
                            const selected = event.target.files?.[0];
                            if (selected) {
                              next[index] = selected;
                              setIssueDraft((prev) => ({ ...prev, photos: next }));
                            }
                          }}
                        />
                        {file ? (
                          <div className="flex flex-col items-center gap-1 px-2 text-center text-xs text-ink-700">
                            <span className="text-lg">✓</span>
                            <span className="truncate">{file.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-xs">
                            <span className="text-lg">＋</span>
                            <span>{t('scheduling.addPhoto')}</span>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-ink-500">{t('scheduling.issuePhotosHint')}</p>
              </div>
              {issueError ? <p className="text-xs text-red-500">{issueError}</p> : null}
              <Button type="button" variant="secondary" onClick={addIssue}>
                {t('scheduling.addIssue')}
              </Button>
              {issues.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-ink-700">{t('scheduling.issueList')}</p>
                  {issues.map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between rounded-lg bg-white p-2 text-xs text-ink-700">
                      <div>
                        <p className="font-semibold">{t(`scheduling.issueTypes.${issue.type}`)}</p>
                        <p>{t(`scheduling.issueCategories.${issue.category}`)}</p>
                      </div>
                      <button
                        type="button"
                        className="text-rose-600"
                        onClick={() => removeIssue(issue.id)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <Button type="button" className="w-full" disabled={completeSubmitting} onClick={completeService}>
            {completeSubmitting ? t('scheduling.completing') : t('scheduling.complete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
