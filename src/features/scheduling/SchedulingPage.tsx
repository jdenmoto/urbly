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
import { updateDocById } from '@/lib/api/firestore';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
  cancelReasonOptions,
  issueTypeOptions,
  issueCategoryOptions
} from '@/core/appointments';
import { generateAppointmentsPdf } from '@/lib/api/functions';
import { listServiceTypes } from '@/lib/serviceTypes';
import { useList, useTenantServiceOrders } from '@/lib/api/queries';
import { isValidDateRange } from '@/core/validators';
import type { ColumnDef } from '@tanstack/react-table';
import { useI18n } from '@/lib/i18n';
import { buildRestrictedDates, filterAppointments, formatDateTime, formatLocalInput, formatLocalIso, isRestrictedDate as isRestrictedDateValue, isWithinBusinessHours, toLocalIso, translateAppointmentStatus } from './schedulingUtils';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/app/Auth';
import ConfirmModal from '@/components/ConfirmModal';
import { CancelIcon, TrashIcon, CheckIcon, EditIcon, DownloadIcon } from '@/components/ActionIcons';
import { db } from '@/lib/firebase/client';
import { addDays, addMonths, isAfter } from 'date-fns';
import {
  applyCompletionToSelected,
  buildCompletionPayload,
  buildNormalizedChecklist,
  hasMinTwoPhotos,
  validateCompletion
} from './schedulingCompletion';
import { cancelSchedulingItem, deleteSchedulingItem, type CancelValues } from './schedulingMutations';
import { createRecurringSeries, regenerateSeries, saveAppointment, type SchedulingFormValues } from './schedulingSeries';
import { moveSchedulingItemOnCalendar } from './schedulingCalendarMutations';
import { type SchedulingItem } from './schedulingItem';
import { buildCanonicalSchedulingItems } from './schedulingSelectors';
import { validateSchedulingRules } from './schedulingRules';
import { schedulingLegacyDependencies } from './schedulingLegacyMap';
import SchedulingWizardSummary from './SchedulingWizardSummary';
import { buildAssignmentSuggestions } from './assignmentSuggestions';

export default function SchedulingPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { role, administrationId } = useAuth();
  const canEdit = role === 'admin' || role === 'editor' || role === 'supervisor' || role === 'scheduler';
  const canScheduleEmergency = role === 'admin' || role === 'editor' || role === 'emergency_scheduler';
  const canCreate = canEdit || role === 'emergency_scheduler';
  const { isMobile } = useBreakpoint();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: contracts = [] } = useList<Contract>('contracts', 'contracts');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const { data: appointments = [] } = useList<Appointment>('appointments', 'appointments');
  const { data: serviceOrders = [] } = useTenantServiceOrders(administrationId, role);
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
  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['serviceTypes'],
    queryFn: listServiceTypes,
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
  const [selected, setSelected] = useState<SchedulingItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [buildingSearch, setBuildingSearch] = useState('');
  const [filterBuildingSearch, setFilterBuildingSearch] = useState('');
  const [buildingDropdownOpen, setBuildingDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<SchedulingItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchedulingItem | null>(null);
  const [seriesConfirmOpen, setSeriesConfirmOpen] = useState(false);
  const [pendingSeriesValues, setPendingSeriesValues] = useState<FormValues | null>(null);
  const [calendarRange, setCalendarRange] = useState<{ start: string; end: string } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<SchedulingItem | null>(null);
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
  const [completionPhotos, setCompletionPhotos] = useState<File[]>([]);
  const [completionReport, setCompletionReport] = useState({
    entryHour: '',
    exitHour: '',
    observations: '',
    checklist: {} as Record<string, 'ok' | 'regular' | 'malo' | 'na'>
  });

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
    setError,
    trigger,
    getValues
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedType = watch('type');

  const timeHourOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
  const timeMinuteOptions = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));
  const getTimeParts = (value: string) => {
    const [hour = '', minute = ''] = value.split(':');
    return { hour, minute };
  };
  const setReportTimePart = (field: 'entryHour' | 'exitHour', part: 'hour' | 'minute', nextValue: string) => {
    setCompletionReport((prev) => {
      const current = getTimeParts(prev[field]);
      const hour = part === 'hour' ? nextValue : current.hour;
      const minute = part === 'minute' ? nextValue : current.minute;
      return {
        ...prev,
        [field]: hour || minute ? `${hour}:${minute}` : ''
      };
    });
  };

  const [group1Units, setGroup1Units] = useState<number[]>([1]);
  const [groupPanelsOpen, setGroupPanelsOpen] = useState({
    grupo1: false,
    grupo2: false,
    grupo3: false
  });
  const [bombaPanelsOpen, setBombaPanelsOpen] = useState<Record<number, boolean>>({ 1: true });
  const [photoViewer, setPhotoViewer] = useState<{ src: string; title?: string } | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoPan, setPhotoPan] = useState({ x: 0, y: 0 });
  const [photoDragging, setPhotoDragging] = useState(false);
  const [photoDragStart, setPhotoDragStart] = useState({ x: 0, y: 0 });

  const openPhotoViewer = (src: string, title?: string) => {
    setPhotoViewer({ src, title });
    setPhotoZoom(1);
    setPhotoPan({ x: 0, y: 0 });
    setPhotoDragging(false);
  };
  const makeGroup1Key = (unit: number, item: string) => `bomba_${unit}__${item}`;
  const makeGroup1RedKey = (unit: number, item: string) => `${makeGroup1Key(unit, item)}__red_distribucion`;
  const formatChecklistLabel = (value: string) =>
    value
      .split('_')
      .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
      .join(' ');

  const completionChecklistGroups = {
    grupo2: [
      'bornera_control',
      'bornera_fuerza',
      'breaker_totalizador',
      'coraza_cableado_control',
      'coraza_cableado_motores',
      'tablero_control'
    ],
    grupo3: [
      'valvula_flotadora',
      'diametro',
      'alarma',
      'demarcacion_registros',
      'instalacion_hidraulica',
      'instruciones_manejo',
      'pintura'
    ]
  } as const;

  const completionChecklistItems = [
    'alternador_contactos_auxiliares',
    'anclaje_base_estructural',
    'cargador_automatico_aire',
    'contactor_consumo_motor',
    'guardamotor_calibracion',
    'lampara_senalizacion',
    'manometros',
    'membrana',
    'transductor',
    'diafragma',
    'organizacion_cableado_tanque',
    'presostatos',
    'regulador_nivel',
    'rele_bimetalico_calibracion',
    'rodamientos',
    'selector',
    'sello_mecanico',
    'tanque_hidroacumulador',
    'temporizador',
    'terminales_bornera_motor',
    'tornilleria_base_motor',
    'variador',
    'voltaje',
    ...completionChecklistGroups.grupo2,
    ...completionChecklistGroups.grupo3
  ];

  const completionChecklistGroup1 = completionChecklistItems.filter(
    (item) => !completionChecklistGroups.grupo2.includes(item as (typeof completionChecklistGroups.grupo2)[number]) && !completionChecklistGroups.grupo3.includes(item as (typeof completionChecklistGroups.grupo3)[number])
  );

  const checklistValueLabel = (value?: string) => (value === 'ok' ? 'Bueno' : value === 'regular' ? 'Regular' : value === 'malo' ? 'Malo' : 'N/A');

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
  type LocalCancelValues = CancelValues;
  const {
    register: cancelRegister,
    handleSubmit: handleCancelSubmit,
    formState: { errors: cancelErrors, isSubmitting: cancelSubmitting },
    reset: resetCancel
  } = useForm<LocalCancelValues>({ resolver: zodResolver(cancelSchema) });

  const schedulingItems = useMemo(() => buildCanonicalSchedulingItems({
    appointments,
    serviceOrders
  }), [appointments, serviceOrders]);

  const filtered = useMemo(() => filterAppointments(schedulingItems, filters), [schedulingItems, filters]);

  const legacyDependencySummary = useMemo(() => schedulingLegacyDependencies, []);

  const assignmentSuggestions = useMemo(() => buildAssignmentSuggestions({
    employees,
    schedulingItems,
    startAt: watch('startAt'),
    endAt: watch('endAt'),
    currentEmployeeId: watch('employeeId')
  }), [employees, schedulingItems, watch]);

  const restrictedDates = useMemo(() => buildRestrictedDates(calendarSettings), [calendarSettings]);

  const isRestrictedDate = (value?: string) => isRestrictedDateValue(restrictedDates, value);
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
    () => buildings.filter((building) => {
      if (building.active === false) return false;
      if (!administrationId) return true;
      return building.managementCompanyId === administrationId;
    }),
    [buildings, administrationId]
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

  const columns = useMemo<ColumnDef<SchedulingItem>[]>(() => {
    const base: ColumnDef<SchedulingItem>[] = [
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
    try {
      const ruleViolation = validateSchedulingRules({
        schedulingItems,
        buildingId: values.buildingId,
        employeeId: values.employeeId || null,
        startIso,
        endIso,
        type: values.type,
        editingId,
        isRestrictedDate
      });
      if (ruleViolation) {
        setError('startAt', { message: ruleViolation.message });
        return;
      }

      if (editingId && values.recurrence) {
        setPendingSeriesValues(values);
        setSeriesConfirmOpen(true);
        return;
      }
      if (editingId && !values.recurrence) {
        await saveAppointment({ values: values as SchedulingFormValues, editingId, appointments });
      } else if (values.recurrence) {
        await createRecurringSeries({
          values: values as SchedulingFormValues,
          buildings,
          contracts,
          alignToContractStart,
          nextWorkingDate,
          setError,
          toast,
          t,
          isRestrictedDate
        });
      } else {
        await saveAppointment({ values: values as SchedulingFormValues, editingId: null, appointments });
      }
      await invalidateScheduling();
      reset();
      setEditingId(null);
      setModalOpen(false);
      setWizardStep(1);
      toast(editingId ? t('scheduling.toastUpdated') : t('scheduling.toastCreated'), 'success');
    } catch {
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
      await regenerateSeries({
        values: pendingSeriesValues as SchedulingFormValues,
        current,
        appointments,
        buildings,
        contracts,
        alignToContractStart,
        nextWorkingDate,
        setError,
        toast,
        t,
        isRestrictedDate
      });
      await invalidateScheduling();
      reset();
      setEditingId(null);
      setModalOpen(false);
      setWizardStep(1);
      toast(t('scheduling.toastUpdated'), 'success');
    } catch {
      toast(t('common.actionError'), 'error');
    } finally {
      setSeriesConfirmOpen(false);
      setPendingSeriesValues(null);
    }
  };

  const startCreate = () => {
    setWizardStep(1);
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
    setWizardStep(1);
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

  const startEdit = (appointment: SchedulingItem) => {
    setWizardStep(1);
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

  const openCancel = (appointment: SchedulingItem) => {
    setCancelTarget(appointment);
    resetCancel({ reason: '', note: '' });
  };

  const startComplete = (appointment: SchedulingItem) => {
    setCompleteTarget(appointment);
    setHasIssues('');
    setIssues([]);
    setIssueDraft({ id: '', type: '', category: '', description: '', photos: [] });
    setIssueError(null);
    setCompletionPhotos([]);
    setCompletionReport({
      entryHour: '',
      exitHour: '',
      observations: '',
      checklist: {}
    });
    setGroup1Units([1]);
    setGroupPanelsOpen({ grupo1: false, grupo2: false, grupo3: false });
    setBombaPanelsOpen({ 1: true });
  };


  const addIssue = () => {
    setIssueError(null);
    if (!issueDraft.type || !issueDraft.category) {
      setIssueError(t('scheduling.issueRequired'));
      return;
    }
    if (!hasMinTwoPhotos(issueDraft.photos)) {
      setIssueError('Debes agregar mínimo 2 fotos en la novedad.');
      return;
    }
    const id = issueDraft.id || (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
    setIssues((prev) => [...prev, { ...issueDraft, id }]);
    setIssueDraft({ id: '', type: '', category: '', description: '', photos: [] });
  };

  const removeIssue = (id: string) => {
    setIssues((prev) => prev.filter((item) => item.id !== id));
  };

  const completeService = async () => {
    if (!completeTarget) return;
    const completionError = validateCompletion({
      t,
      hasIssues,
      issues,
      completionPhotos,
      completionReport
    });
    if (completionError) {
      setIssueError(completionError);
      return;
    }

    const normalizedChecklist = buildNormalizedChecklist({
      completionReport,
      completionChecklistItems,
      completionChecklistGroup1,
      group1Units,
      makeGroup1Key,
      makeGroup1RedKey
    });
    setCompleteSubmitting(true);
    try {
      const payload = await buildCompletionPayload({
        appointmentId: completeTarget.id,
        hasIssues,
        issues,
        completionPhotos,
        completionReport,
        normalizedChecklist
      });
      await updateDocById(completeTarget.source === 'service_order' ? 'service_orders' : 'appointments', completeTarget.id, payload);
      await invalidateScheduling();
      toast(t('scheduling.toastCompleted'), 'success');
      if (selected?.id === completeTarget.id) {
        setSelected((prev) => {
          if (!prev || prev.id !== completeTarget.id) return prev;
          return {
            ...prev,
            status: 'completado',
            completedAt: payload.completedAt as string,
            issues: payload.issues as SchedulingItem['issues'],
            completionPhotos: payload.completionPhotos as SchedulingItem['completionPhotos'],
            completionReport: payload.completionReport as SchedulingItem['completionReport']
          };
        });
      }
      setCompleteTarget(null);
    } catch (error) {
      const firebaseMessage =
        typeof error === 'object' && error !== null && 'code' in error
          ? `Firebase Storage (${String((error as { code?: unknown }).code)})`
          : '';
      const detail = error instanceof Error ? error.message : '';
      const message = [firebaseMessage, detail].filter(Boolean).join(': ');
      toast(message || t('common.actionError'), 'error');
    } finally {
      setCompleteSubmitting(false);
    }
  };

  const onCancel = async (values: LocalCancelValues) => {
    if (!cancelTarget) return;
    try {
      await cancelSchedulingItem(cancelTarget.id, values);
      await invalidateScheduling();
      toast(t('scheduling.toastCanceled'), 'success');
      setCancelTarget(null);
    } catch {
      toast(t('common.actionError'), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSchedulingItem(deleteTarget.id);
      await invalidateScheduling();
      if (editingId === deleteTarget.id) {
        setModalOpen(false);
        setEditingId(null);
      }
      if (selected?.id === deleteTarget.id) {
        setSelected(null);
      }
      toast(t('scheduling.toastDeleted'), 'success');
    } catch {
      toast(t('common.actionError'), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const invalidateScheduling = () => queryClient.invalidateQueries({ queryKey: ['appointments'] });

  const statusLabel = (status: string) => translateAppointmentStatus(status, t);

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

  const wizardSteps = [
    { id: 1, title: editingId ? 'Servicio y contexto' : 'Crear servicio' },
    { id: 2, title: 'Agenda y asignación' },
    { id: 3, title: editingId ? 'Revisar reprogramación' : 'Revisar creación' }
  ] as const;

  const nextWizardStep = async () => {
    const fieldsByStep: Record<number, FormValues extends infer _ ? string[] : string[]> = {
      1: ['buildingId', 'title', 'description', 'type'],
      2: ['startAt', 'endAt', 'status', 'employeeId', 'recurrence'],
      3: []
    };
    const fields = fieldsByStep[wizardStep] ?? [];
    if (fields.length > 0) {
      const valid = await trigger(fields as (keyof FormValues)[]);
      if (!valid) return;
    }
    setWizardStep((prev) => (prev === 3 ? 3 : ((prev + 1) as 1 | 2 | 3)));
  };

  const prevWizardStep = () => setWizardStep((prev) => (prev === 1 ? 1 : ((prev - 1) as 1 | 2 | 3)));

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
    } catch {
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
                  const appointment = schedulingItems.find((item) => item.id === info.event.id);
                  if (appointment) {
                    setSelected(appointment);
                  }
                }}
                eventDrop={(info) => {
                  if (!canEdit) return;
                  if (!info.event.start || !info.event.end) return;
                  const appointment = schedulingItems.find((item) => item.id === info.event.id);
                  const type = (info.event.extendedProps as { type?: string }).type;
                  void moveSchedulingItemOnCalendar({
                    schedulingItemId: info.event.id,
                    start: info.event.start,
                    end: info.event.end,
                    type,
                    isRestrictedDate,
                    toast,
                    t,
                    invalidateScheduling,
                    revert: () => info.revert(),
                    buildingId: appointment?.buildingId ?? '',
                    employeeId: appointment?.employeeId ?? null,
                    schedulingItems
                  }).catch(() => toast(t('common.actionError'), 'error'));
                }}
                eventResize={(info) => {
                  if (!canEdit) return;
                  if (!info.event.start || !info.event.end) return;
                  const appointment = schedulingItems.find((item) => item.id === info.event.id);
                  const type = (info.event.extendedProps as { type?: string }).type;
                  void moveSchedulingItemOnCalendar({
                    schedulingItemId: info.event.id,
                    start: info.event.start,
                    end: info.event.end,
                    type,
                    isRestrictedDate,
                    toast,
                    t,
                    invalidateScheduling,
                    revert: () => info.revert(),
                    buildingId: appointment?.buildingId ?? '',
                    employeeId: appointment?.employeeId ?? null,
                    schedulingItems
                  }).catch(() => toast(t('common.actionError'), 'error'));
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
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
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
              <div className="rounded-xl border border-fog-200 bg-fog-50 p-3 text-sm text-ink-700">
                <p className="font-semibold text-ink-900">Mapa de dependencias legacy</p>
                <ul className="mt-2 space-y-1 text-xs text-ink-600">
                  {legacyDependencySummary.map((dependency) => (
                    <li key={dependency.key}>
                      <span className="font-semibold text-ink-900">{dependency.area}:</span> {dependency.detail}
                    </li>
                  ))}
                </ul>
              </div>
              <p>
                <span className="font-semibold text-ink-900">{t('scheduling.type')}:</span>{' '}
                {selected.type ? t(`scheduling.types.${selected.type}`) : t('common.noData')}
              </p>
              <p>
                <span className="font-semibold text-ink-900">{t('scheduling.recurrenceLabel')}:</span>{' '}
                {selected.recurrence ? t(`scheduling.recurrenceOptions.${selected.recurrence}`) : t('scheduling.noRecurrence')}
              </p>
              {selected.status === 'completado' ? (
                <div className="space-y-3 rounded-lg border border-fog-200 bg-fog-50 p-3">
                  <p className="font-semibold text-ink-900">{t('scheduling.serviceReport')}</p>
                  <p><span className="font-semibold text-ink-900">{t('scheduling.entryHourLabel')}:</span> {String(selected.completionReport?.entryHour || t('common.noData'))}</p>
                  <p><span className="font-semibold text-ink-900">{t('scheduling.exitHourLabel')}:</span> {String(selected.completionReport?.exitHour || t('common.noData'))}</p>
                  <p><span className="font-semibold text-ink-900">{t('scheduling.observationsLabel')}:</span> {String(selected.completionReport?.observations || t('common.noData'))}</p>

                  <div className="space-y-2">
                    <p className="font-semibold text-ink-900">{t('scheduling.checklistTitle')}</p>
                    {(() => {
                      const checklist = (selected.completionReport?.checklist as Record<string, string>) || {};
                      const bombaIds = Array.from(
                        new Set(
                          Object.keys(checklist)
                            .map((key) => key.match(/^bomba_(\d+)__/)?.[1])
                            .filter((id): id is string => Boolean(id))
                        )
                      ).sort((a, b) => Number(a) - Number(b));
                      const group2Entries = completionChecklistGroups.grupo2.map((item) => [item, checklist[item] || 'na'] as [string, string]);
                      const group3Entries = completionChecklistGroups.grupo3.map((item) => [item, checklist[item] || 'na'] as [string, string]);

                      return (
                        <div className="max-h-80 space-y-2 overflow-y-auto rounded border border-fog-200 bg-white p-2 text-xs">
                          <div className="space-y-2 rounded border border-fog-200 p-2">
                            <p className="font-semibold text-ink-900">{t('scheduling.group1Pumps')}</p>
                            {bombaIds.length ? (
                              bombaIds.map((bombaId, pumpIndex) => (
                                <div key={bombaId} className="rounded border border-fog-200 bg-fog-50 p-2 space-y-1">
                                  <p className="font-semibold text-ink-900">{t('scheduling.pumpLabel', { index: pumpIndex + 1 })}</p>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                      <thead>
                                        <tr className="text-ink-700">
                                          <th className="py-1 pr-2 font-semibold">{t('scheduling.itemLabel')}</th>
                                          <th className="py-1 pr-2 font-semibold">{t('scheduling.statusLabelShort')}</th>
                                          <th className="py-1 font-semibold">{t('scheduling.distributionNetworkLabel')}</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {completionChecklistGroup1.map((item) => {
                                          const itemKey = `bomba_${bombaId}__${item}`;
                                          const redKey = `${itemKey}__red_distribucion`;
                                          return (
                                            <tr key={itemKey} className="border-t border-fog-200">
                                              <td className="py-1 pr-2">{formatChecklistLabel(item)}</td>
                                              <td className="py-1 pr-2">{checklistValueLabel(checklist[itemKey])}</td>
                                              <td className="py-1">{checklistValueLabel(checklist[redKey])}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-ink-600">{t('common.noData')}</p>
                            )}
                          </div>

                          <div className="space-y-1 rounded border border-fog-200 p-2">
                            <p className="font-semibold text-ink-900">{t('scheduling.group2Label')}</p>
                            {group2Entries.map(([item, value]) => (
                              <p key={item}>
                                <span className="font-semibold text-ink-900">{formatChecklistLabel(item)}:</span> {checklistValueLabel(value)}
                              </p>
                            ))}
                          </div>

                          <div className="space-y-1 rounded border border-fog-200 p-2">
                            <p className="font-semibold text-ink-900">{t('scheduling.group3Label')}</p>
                            {group3Entries.map(([item, value]) => (
                              <p key={item}>
                                <span className="font-semibold text-ink-900">{formatChecklistLabel(item)}:</span> {checklistValueLabel(value)}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="space-y-1">
                    <p className="font-semibold text-ink-900">{t('scheduling.servicePhotosTitle')}</p>
                    {selected.completionPhotos?.length ? (
                      <div className="grid grid-cols-2 gap-2">
                        {selected.completionPhotos.map((photo, index) => (
                          <button
                            key={`${photo}-${index}`}
                            type="button"
                            onClick={() => openPhotoViewer(photo, `Foto servicio ${index + 1}`)}
                            className="block overflow-hidden rounded border border-fog-200 bg-white"
                          >
                            <img src={photo} alt={`Foto servicio ${index + 1}`} className="h-24 w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-ink-600">{t('common.noData')}</p>
                    )}
                  </div>
                </div>
              ) : null}
              {selected.issues?.length ? (
                <div className="space-y-2">
                  <p className="font-semibold text-ink-900">{t('scheduling.issuesTitle')}</p>
                  {selected.issues.map((issue) => (
                    <div key={issue.id} className="rounded-lg border border-fog-200 bg-fog-50 p-2 text-xs text-ink-700 space-y-1">
                      <p className="font-semibold text-ink-900">{resolveIssueLabel('scheduling.issueTypes', issue.type)}</p>
                      <p>{resolveIssueLabel('scheduling.issueCategories', issue.category)}</p>
                      {issue.description ? <p>{issue.description}</p> : null}
                      {issue.photos?.length ? (
                        <div className="grid grid-cols-2 gap-2">
                          {issue.photos.map((photo, index) => (
                            <button
                              key={`${issue.id}-${index}`}
                              type="button"
                              onClick={() => openPhotoViewer(photo, `Novedad ${index + 1}`)}
                              className="block overflow-hidden rounded border border-fog-200 bg-white"
                            >
                              <img src={photo} alt={`Novedad ${index + 1}`} className="h-20 w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : null}
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
            {selected.status === 'completado' ? null : (
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
                {canEdit && selected.status !== 'cancelado' ? (
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
            )}
          </div>
        </div>
      ) : null}
      {photoViewer ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4"
          onClick={() => {
            setPhotoViewer(null);
            setPhotoDragging(false);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-5xl rounded-xl border-2 border-white bg-ink-900/90 p-3 shadow-soft" onClick={(event) => event.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between text-white">
              <p className="text-sm font-semibold">{photoViewer.title || 'Foto'}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded border border-white/40 px-2 py-1 text-xs hover:bg-white/10"
                  onClick={() => {
                    setPhotoZoom((prev) => Math.max(0.5, Number((prev - 0.2).toFixed(2))));
                    setPhotoDragging(false);
                  }}
                >
                  -
                </button>
                <span className="min-w-12 text-center text-xs">{Math.round(photoZoom * 100)}%</span>
                <button
                  type="button"
                  className="rounded border border-white/40 px-2 py-1 text-xs hover:bg-white/10"
                  onClick={() => setPhotoZoom((prev) => Math.min(3, Number((prev + 0.2).toFixed(2))))}
                >
                  +
                </button>
                <button
                  type="button"
                  className="rounded border border-rose-500 bg-rose-600 px-2 py-1 text-sm font-bold text-white hover:bg-rose-500"
                  onClick={() => {
                    setPhotoViewer(null);
                    setPhotoDragging(false);
                  }}
                  aria-label={t('scheduling.closeViewer')}
                >
                  ✕
                </button>
              </div>
            </div>
            <div
              className={`max-h-[82vh] overflow-auto rounded-lg border border-white/30 bg-black/30 p-2 ${photoZoom > 1 ? (photoDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
              onMouseMove={(event) => {
                if (!photoDragging || photoZoom <= 1) return;
                setPhotoPan({ x: event.clientX - photoDragStart.x, y: event.clientY - photoDragStart.y });
              }}
              onMouseUp={() => setPhotoDragging(false)}
              onMouseLeave={() => setPhotoDragging(false)}
            >
              <img
                src={photoViewer.src}
                alt={photoViewer.title || 'Foto'}
                draggable={false}
                onMouseDown={(event) => {
                  if (photoZoom <= 1) return;
                  setPhotoDragging(true);
                  setPhotoDragStart({ x: event.clientX - photoPan.x, y: event.clientY - photoPan.y });
                }}
                className="mx-auto max-h-[78vh] w-auto select-none object-contain"
                style={{ transform: `translate(${photoPan.x}px, ${photoPan.y}px) scale(${photoZoom})`, transformOrigin: 'center center' }}
              />
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
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {wizardSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${wizardStep === step.id ? 'bg-slate-950 text-white' : wizardStep > step.id ? 'bg-emerald-100 text-emerald-700' : 'bg-fog-100 text-ink-600'}`}
                  >
                    {step.id}. {step.title}
                  </div>
                ))}
              </div>

              {wizardStep === 1 ? (
                <>
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
                  <Select label={t('scheduling.type')} error={errors.type?.message} required {...register('type')}>
                    <option value="">{t('common.select')}</option>
                    {serviceTypes.map((option) => (
                      <option key={option.id} value={option.code}>
                        {t(`scheduling.types.${option.code}`) !== `scheduling.types.${option.code}` ? t(`scheduling.types.${option.code}`) : option.name}
                      </option>
                    ))}
                  </Select>
                </>
              ) : null}

              {wizardStep === 2 ? (
                <>
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
                  <Select label={t('scheduling.employee')} error={errors.employeeId?.message} {...register('employeeId')}>
                    <option value="">{t('common.unassigned')}</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.fullName}
                      </option>
                    ))}
                  </Select>
                  {assignmentSuggestions.length ? (
                    <div className="rounded-xl border border-fog-200 bg-fog-50 p-3 text-sm text-ink-700">
                      <p className="font-semibold text-ink-900">Sugerencias de asignación</p>
                      <div className="mt-2 space-y-2">
                        {assignmentSuggestions.map((suggestion: { employeeId: string; score: number; reason: string }) => {
                          const employee = employees.find((item) => item.id === suggestion.employeeId);
                          return (
                            <button
                              key={suggestion.employeeId}
                              type="button"
                              className="block w-full rounded-lg border border-fog-200 bg-white px-3 py-2 text-left hover:bg-fog-100"
                              onClick={() => setValue('employeeId', suggestion.employeeId, { shouldValidate: true })}
                            >
                              <p className="font-medium text-ink-900">{employee?.fullName ?? suggestion.employeeId} · score {suggestion.score}</p>
                              <p className="text-xs text-ink-500">{suggestion.reason}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
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
                </>
              ) : null}

              {wizardStep === 3 ? (
                <SchedulingWizardSummary
                  buildingId={getValues('buildingId')}
                  title={getValues('title')}
                  type={getValues('type')}
                  startAt={getValues('startAt')}
                  endAt={getValues('endAt')}
                  employeeId={getValues('employeeId')}
                  recurrence={getValues('recurrence')}
                  editingId={editingId}
                  buildings={buildings}
                  employees={employees}
                />
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={prevWizardStep} disabled={wizardStep === 1} className="flex-1">Anterior</Button>
              {wizardStep < 3 ? (
                <Button type="button" onClick={() => void nextWizardStep()} className="flex-1">Siguiente</Button>
              ) : (
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? t('scheduling.saving') : editingId ? 'Guardar reprogramación' : 'Crear servicio'}
                </Button>
              )}
            </div>
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
          <div className="rounded-xl border border-fog-200 bg-fog-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-ink-900">{t('scheduling.serviceReport')}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-ink-800">{t('scheduling.entryHourLabel')} <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={getTimeParts(completionReport.entryHour).hour}
                    onChange={(event) => setReportTimePart('entryHour', 'hour', event.target.value)}
                  >
                    <option value="">{t('scheduling.hourPlaceholder')}</option>
                    {timeHourOptions.map((hour) => (
                      <option key={`entry-hour-${hour}`} value={hour}>{hour}</option>
                    ))}
                  </Select>
                  <Select
                    value={getTimeParts(completionReport.entryHour).minute}
                    onChange={(event) => setReportTimePart('entryHour', 'minute', event.target.value)}
                  >
                    <option value="">{t('scheduling.minutePlaceholder')}</option>
                    {timeMinuteOptions.map((minute) => (
                      <option key={`entry-minute-${minute}`} value={minute}>{minute}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-ink-800">{t('scheduling.exitHourLabel')} <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={getTimeParts(completionReport.exitHour).hour}
                    onChange={(event) => setReportTimePart('exitHour', 'hour', event.target.value)}
                  >
                    <option value="">{t('scheduling.hourPlaceholder')}</option>
                    {timeHourOptions.map((hour) => (
                      <option key={`exit-hour-${hour}`} value={hour}>{hour}</option>
                    ))}
                  </Select>
                  <Select
                    value={getTimeParts(completionReport.exitHour).minute}
                    onChange={(event) => setReportTimePart('exitHour', 'minute', event.target.value)}
                  >
                    <option value="">{t('scheduling.minutePlaceholder')}</option>
                    {timeMinuteOptions.map((minute) => (
                      <option key={`exit-minute-${minute}`} value={minute}>{minute}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
            <Input label={t('scheduling.observationsLabel')} required value={completionReport.observations} onChange={(event) => setCompletionReport((prev) => ({ ...prev, observations: event.target.value }))} />
            <div className="space-y-3">
              <p className="text-xs font-semibold text-ink-700">{t('scheduling.reviewDetailsTitle')}</p>

              <div className="rounded-lg border border-fog-200 bg-white p-2 space-y-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left text-xs font-semibold text-ink-800"
                  onClick={() => setGroupPanelsOpen((prev) => ({ ...prev, grupo1: !prev.grupo1 }))}
                >
                  <span>{t('scheduling.group1Pumps')}</span>
                  <span>{groupPanelsOpen.grupo1 ? '▾' : '▸'}</span>
                </button>
                {groupPanelsOpen.grupo1 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          const nextUnit = (group1Units.length ? group1Units[group1Units.length - 1] : 0) + 1;
                          setGroup1Units((prev) => [...prev, nextUnit]);
                          setBombaPanelsOpen((prev) => ({ ...prev, [nextUnit]: true }));
                        }}
                      >
                        {t('scheduling.addPump')}
                      </Button>
                    </div>
                    {group1Units.map((unit, index) => (
                      <div key={unit} className="space-y-2 rounded-lg border border-fog-200 bg-fog-50 p-2">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            className="flex items-center gap-2 text-xs font-semibold text-ink-700"
                            onClick={() =>
                              setBombaPanelsOpen((prev) => ({
                                ...prev,
                                [unit]: !(prev[unit] ?? true)
                              }))
                            }
                          >
                            <span>{bombaPanelsOpen[unit] ?? true ? '▾' : '▸'}</span>
                            <span>{t('scheduling.pumpLabel', { index: index + 1 })}</span>
                          </button>
                          {group1Units.length > 1 ? (
                            <button
                              type="button"
                              className="text-xs text-rose-600"
                              onClick={() => {
                                setGroup1Units((prev) => prev.filter((value) => value !== unit));
                                setBombaPanelsOpen((prev) => {
                                  const next = { ...prev };
                                  delete next[unit];
                                  return next;
                                });
                              }}
                            >
                              {t('common.delete')}
                            </button>
                          ) : null}
                        </div>
                        {(bombaPanelsOpen[unit] ?? true) ? (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {completionChecklistGroup1.map((item) => {
                            const key = makeGroup1Key(unit, item);
                            const redKey = makeGroup1RedKey(unit, item);
                            return (
                              <div key={key} className="rounded-lg border border-fog-200 bg-white p-2 space-y-2">
                                <p className="mb-1 text-xs text-ink-700">{formatChecklistLabel(item)} <span className="text-red-500">*</span></p>
                                <Select
                                  value={completionReport.checklist[key] ?? 'na'}
                                  onChange={(event) =>
                                    setCompletionReport((prev) => ({
                                      ...prev,
                                      checklist: {
                                        ...prev.checklist,
                                        [key]: event.target.value as 'ok' | 'regular' | 'malo' | 'na'
                                      }
                                    }))
                                  }
                                >
                                  <option value="ok">{t('scheduling.goodOption')}</option>
                                  <option value="regular">{t('scheduling.regularOption')}</option>
                                  <option value="malo">{t('scheduling.badOption')}</option>
                                  <option value="na">{t('scheduling.notApplicableOption')}</option>
                                </Select>
                                <div className="space-y-1">
                                  <p className="text-xs text-ink-700">{t('scheduling.distributionNetworkLabel')} <span className="text-red-500">*</span></p>
                                  <Select
                                    value={completionReport.checklist[redKey] ?? 'na'}
                                    onChange={(event) =>
                                      setCompletionReport((prev) => ({
                                        ...prev,
                                        checklist: {
                                          ...prev.checklist,
                                          [redKey]: event.target.value as 'ok' | 'regular' | 'malo' | 'na'
                                        }
                                      }))
                                    }
                                  >
                                    <option value="ok">{t('scheduling.goodFemaleOption')}</option>
                                    <option value="regular">{t('scheduling.regularOption')}</option>
                                    <option value="malo">{t('scheduling.badFemaleOption')}</option>
                                    <option value="na">{t('scheduling.notApplicableOption')}</option>
                                  </Select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {[
                { key: 'grupo2', title: t('scheduling.group2Label'), items: completionChecklistGroups.grupo2 },
                { key: 'grupo3', title: t('scheduling.group3Label'), items: completionChecklistGroups.grupo3 }
              ].map((group) => (
                <div key={group.title} className="rounded-lg border border-fog-200 bg-white p-2 space-y-2">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left text-xs font-semibold text-ink-800"
                    onClick={() =>
                      setGroupPanelsOpen((prev) => ({
                        ...prev,
                        [group.key]: !prev[group.key as 'grupo2' | 'grupo3']
                      }))
                    }
                  >
                    <span>{group.title}</span>
                    <span>{groupPanelsOpen[group.key as 'grupo2' | 'grupo3'] ? '▾' : '▸'}</span>
                  </button>
                  {groupPanelsOpen[group.key as 'grupo2' | 'grupo3'] ? (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {group.items.map((item) => (
                        <div key={item} className="rounded-lg border border-fog-200 bg-fog-50 p-2 space-y-2">
                          <p className="mb-1 text-xs text-ink-700">{formatChecklistLabel(item)} <span className="text-red-500">*</span></p>
                          <Select
                            value={completionReport.checklist[item] ?? 'na'}
                            onChange={(event) =>
                              setCompletionReport((prev) => ({
                                ...prev,
                                checklist: {
                                  ...prev.checklist,
                                  [item]: event.target.value as 'ok' | 'regular' | 'malo' | 'na'
                                }
                              }))
                            }
                          >
                            <option value="ok">{t('scheduling.goodOption')}</option>
                            <option value="regular">{t('scheduling.regularOption')}</option>
                            <option value="malo">{t('scheduling.badOption')}</option>
                            <option value="na">{t('scheduling.notApplicableOption')}</option>
                          </Select>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-800">{t('scheduling.servicePhotosTitle')} <span className="text-red-500">*</span> {t('scheduling.servicePhotosRequirement')}</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (!files.length) return;
                  setCompletionPhotos((prev) => [...prev, ...files]);
                  setIssueError(null);
                }}
                className="block w-full text-xs"
              />
              {completionPhotos.length ? (
                <div className="space-y-1">
                  {completionPhotos.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs">
                      <span className="truncate">{file.name}</span>
                      <button type="button" className="text-rose-600" onClick={() => setCompletionPhotos((prev) => prev.filter((_, i) => i !== index))}>
                        {t('common.delete')}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
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
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (!files.length) return;
                    setIssueDraft((prev) => ({ ...prev, photos: [...prev.photos, ...files] }));
                  }}
                  className="block w-full text-xs"
                />
                {issueDraft.photos.length ? (
                  <div className="space-y-1">
                    {issueDraft.photos.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs text-ink-700">
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          className="text-rose-600"
                          onClick={() =>
                            setIssueDraft((prev) => ({
                              ...prev,
                              photos: prev.photos.filter((_, i) => i !== index)
                            }))
                          }
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
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
