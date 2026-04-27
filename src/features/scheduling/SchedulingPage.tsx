import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { doc, getDoc } from 'firebase/firestore';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Button from '@/components/Button';
import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { Employee } from '@/core/models/employee';
import {
  recurrenceOptions,
  issueTypeOptions,
  issueCategoryOptions
} from '@/core/appointments';
import { listServiceTypes } from '@/lib/serviceTypes';
import { useList, useTenantServiceOrders } from '@/lib/api/queries';
import { isValidDateRange } from '@/core/validators';
import type { ColumnDef } from '@tanstack/react-table';
import { useI18n } from '@/lib/i18n';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { buildRestrictedDates, filterAppointments, formatDateTime, formatLocalInput, formatLocalIso, isRestrictedDate as isRestrictedDateValue, isWithinBusinessHours, toLocalIso, translateAppointmentStatus } from './schedulingUtils';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/app/Auth';
import { CancelIcon, TrashIcon, CheckIcon, EditIcon } from '@/components/ActionIcons';
import { db } from '@/lib/firebase/client';
import { addDays, addMonths, isAfter } from 'date-fns';
import { type CancelValues } from './schedulingMutations';
import { createRecurringSeries, regenerateSeries, saveAppointment, type SchedulingFormValues } from './schedulingSeries';
import { type SchedulingItem } from './schedulingItem';
import { buildCanonicalSchedulingItems } from './schedulingSelectors';
import { validateSchedulingRules } from './schedulingRules';
import { schedulingLegacyDependencies } from './schedulingLegacyMap';
import SelectedSchedulingDetail from './SelectedSchedulingDetail';
import PhotoViewerModal from './PhotoViewerModal';
import CompleteServiceModal from './CompleteServiceModal';
import SchedulingFiltersCard from './SchedulingFiltersCard';
import SchedulingAgendaSurface from './SchedulingAgendaSurface';
import SchedulingFormModal from './SchedulingFormModal';
import CancelSchedulingModal from './CancelSchedulingModal';
import DeleteSchedulingConfirm from './DeleteSchedulingConfirm';
import SchedulingStatusOverlays from './SchedulingStatusOverlays';
import useSchedulingCompletion from './useSchedulingCompletion';
import useSchedulingAgenda from './useSchedulingAgenda';
import useSchedulingItemActions from './useSchedulingItemActions';
import usePhotoViewer from './usePhotoViewer';
import { buildAssignmentSuggestions } from './assignmentSuggestions';

export default function SchedulingPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, administrationId } = useAuth();
  const canEdit = role === 'admin' || role === 'editor' || role === 'supervisor' || role === 'scheduler';
  const canScheduleEmergency = role === 'admin' || role === 'editor' || role === 'emergency_scheduler';
  const canCreate = canEdit || role === 'emergency_scheduler';
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: contracts = [] } = useList<Contract>('contracts', 'contracts');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
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
  const [seriesConfirmOpen, setSeriesConfirmOpen] = useState(false);
  const [pendingSeriesValues, setPendingSeriesValues] = useState<FormValues | null>(null);

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

  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  const checklistValueLabel = (value?: string) => (value === 'ok' ? 'Bueno' : value === 'regular' ? 'Regular' : value === 'malo' ? 'Malo' : 'N/A');

  const {
    photoViewer,
    photoZoom,
    photoPan,
    photoDragging,
    openPhotoViewer,
    closePhotoViewer,
    zoomOut,
    zoomIn,
    handleMouseMove,
    stopDragging,
    handleMouseDown
  } = usePhotoViewer();

  const {
    completeTarget,
    setCompleteTarget,
    hasIssues,
    setHasIssues,
    issues,
    issueDraft,
    setIssueDraft,
    issueError,
    setIssueError,
    completeSubmitting,
    completionPhotos,
    setCompletionPhotos,
    completionReport,
    setCompletionReport,
    timeHourOptions,
    timeMinuteOptions,
    getTimeParts,
    setReportTimePart,
    group1Units,
    setGroup1Units,
    groupPanelsOpen,
    setGroupPanelsOpen,
    bombaPanelsOpen,
    setBombaPanelsOpen,
    completionChecklistGroups,
    completionChecklistGroup1,
    makeGroup1Key,
    makeGroup1RedKey,
    formatChecklistLabel,
    startComplete,
    addIssue,
    removeIssue,
    completeService
  } = useSchedulingCompletion({
    t,
    toast,
    invalidateScheduling: () => queryClient.invalidateQueries({ queryKey: ['serviceOrders'] }),
    selected,
    setSelected
  });

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
    serviceOrders
  }), [serviceOrders]);

  const filtered = useMemo(() => filterAppointments(schedulingItems, filters), [schedulingItems, filters]);

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

  const selectedFilterBuilding = useMemo(
    () => activeBuildings.find((building) => building.id === filters.buildingId) ?? null,
    [activeBuildings, filters.buildingId]
  );

  const selectedWizardBuilding = useMemo(
    () => activeBuildings.find((building) => building.id === watch('buildingId')) ?? null,
    [activeBuildings, watch]
  );

  const selectedServiceTypeLabel = useMemo(() => {
    const selectedType = watch('type');
    const serviceType = serviceTypes.find((option) => option.code === selectedType);
    if (!serviceType) return selectedType;
    const translated = t(`scheduling.types.${serviceType.code}`);
    return translated !== `scheduling.types.${serviceType.code}` ? translated : serviceType.name;
  }, [serviceTypes, t, watch]);

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
                onClick={() => navigate(`/services/${row.original.id}/closeout`)}
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
        await saveAppointment({ values: values as SchedulingFormValues, editingId, serviceOrders });
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
        await saveAppointment({ values: values as SchedulingFormValues, editingId: null, serviceOrders });
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
    const current = schedulingItems.find((item) => item.id === editingId) ?? null;
    try {
      await regenerateSeries({
        values: pendingSeriesValues as SchedulingFormValues,
        current,
        serviceOrders,
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
    const buildingId = filters.buildingId;
    const buildingName = activeBuildings.find((building) => building.id === buildingId)?.name ?? '';
    setWizardStep(1);
    setEditingId(null);
    reset({
      buildingId,
      title: '',
      description: '',
      startAt: '',
      endAt: '',
      status: 'programado',
      recurrence: '',
      type: '',
      employeeId: ''
    });
    setBuildingSearch(buildingName);
    setModalOpen(true);
  };

  const startCreateAt = (start: Date) => {
    const buildingId = filters.buildingId;
    const buildingName = activeBuildings.find((building) => building.id === buildingId)?.name ?? '';
    setWizardStep(1);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    setEditingId(null);
    reset({
      buildingId,
      title: '',
      description: '',
      startAt: formatLocalInput(start),
      endAt: formatLocalInput(end),
      status: 'programado',
      recurrence: '',
      type: '',
      employeeId: ''
    });
    setBuildingSearch(buildingName);
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
    const buildingId = searchParams.get('buildingId') ?? '';
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';
    setFilters((prev) => ({
      ...prev,
      buildingId: buildingId || prev.buildingId,
      from: from || prev.from,
      to: to || prev.to
    }));
    if (buildingId) {
      const matchedBuilding = activeBuildings.find((building) => building.id === buildingId);
      if (matchedBuilding) {
        setFilterBuildingSearch(matchedBuilding.name);
        setFiltersOpen(true);
      }
    }
  }, [searchParams, activeBuildings]);

  useEffect(() => {
    if (selectedType === 'emergencia') {
      setValue('recurrence', '');
    }
  }, [selectedType, setValue]);

  const invalidateScheduling = () => queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });

  const {
    cancelTarget,
    setCancelTarget,
    deleteTarget,
    setDeleteTarget,
    openCancel,
    onCancel,
    confirmDelete
  } = useSchedulingItemActions({
    t,
    toast,
    invalidateScheduling,
    resetCancel,
    editingId,
    setEditingId,
    setModalOpen,
    selected,
    setSelected
  });

  const statusLabel = (status: string) => translateAppointmentStatus(status, t);

  const resolveIssueLabel = (prefix: 'scheduling.issueTypes' | 'scheduling.issueCategories', value: string) => {
    const key = `${prefix}.${value}`;
    const label = t(key);
    return label === key ? value : label;
  };

  const wizardSteps = [
    { id: 1, title: editingId ? t('scheduling.wizardStepServiceContext') : t('scheduling.wizardStepCreateService') },
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

  const {
    pdfLoading,
    calendarEvents,
    handleCalendarDateClick,
    handleCalendarDatesSet,
    handleCalendarEventClick,
    handleCalendarMutation,
    handleGeneratePdf
  } = useSchedulingAgenda({
    filters,
    filtered,
    buildings,
    groupColors,
    restrictedDates,
    canCreate,
    canScheduleEmergency,
    canEdit,
    startCreateAt,
    schedulingItems,
    isRestrictedDate,
    toast,
    t,
    invalidateScheduling,
    setSelected
  });

  return (
    <div className="space-y-8">
      <SchedulingAgendaSurface
        viewMode={viewMode}
        setViewMode={setViewMode}
        pdfLoading={pdfLoading}
        canCreate={canCreate}
        canEdit={canEdit}
        hasBuildingFilter={Boolean(filters.buildingId)}
        onGeneratePdf={handleGeneratePdf}
        onCreate={startCreate}
        columns={columns}
        filtered={filtered}
        calendarEvents={calendarEvents}
        onDateClick={handleCalendarDateClick}
        onDatesSet={handleCalendarDatesSet}
        onEventClick={handleCalendarEventClick}
        onEventDrop={handleCalendarMutation}
        onEventResize={handleCalendarMutation}
      >
        <SchedulingFiltersCard
          selectedFilterBuilding={selectedFilterBuilding}
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          filterBuildingSearch={filterBuildingSearch}
          setFilterBuildingSearch={setFilterBuildingSearch}
          filterDropdownOpen={filterDropdownOpen}
          setFilterDropdownOpen={setFilterDropdownOpen}
          activeBuildings={activeBuildings}
          filters={filters}
          setFilters={setFilters}
        />
      </SchedulingAgendaSurface>
      {selected ? (
        <SelectedSchedulingDetail
          selected={selected}
          canEdit={canEdit}
          buildingName={buildings.find((b) => b.id === selected.buildingId)?.name ?? t('common.noData')}
          employeeName={selected.employeeId
            ? employees.find((employee) => employee.id === selected.employeeId)?.fullName ?? t('common.noData')
            : t('common.unassigned')}
          statusLabel={statusLabel}
          formatDateTime={formatDateTime}
          completionChecklistGroup1={completionChecklistGroup1}
          completionChecklistGroups={completionChecklistGroups}
          formatChecklistLabel={formatChecklistLabel}
          checklistValueLabel={checklistValueLabel}
          openPhotoViewer={openPhotoViewer}
          resolveIssueLabel={resolveIssueLabel}
          onClose={() => setSelected(null)}
          onEdit={() => startEdit(selected)}
          onComplete={() => navigate(`/services/${selected.id}/closeout`)}
          onCancel={() => openCancel(selected)}
          onDelete={() => setDeleteTarget(selected)}
        />
      ) : null}
      {photoViewer ? (
        <PhotoViewerModal
          photoViewer={photoViewer}
          photoZoom={photoZoom}
          photoPan={photoPan}
          photoDragging={photoDragging}
          onClose={closePhotoViewer}
          onZoomOut={zoomOut}
          onZoomIn={zoomIn}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onMouseDown={handleMouseDown}
        />
      ) : null}
      <SchedulingStatusOverlays
        pdfLoading={pdfLoading}
        seriesConfirmOpen={seriesConfirmOpen}
        onConfirmSeries={confirmSeriesRegeneration}
        onCloseSeries={() => {
          setSeriesConfirmOpen(false);
          setPendingSeriesValues(null);
        }}
        t={t}
      />
      <SchedulingFormModal
        open={modalOpen}
        canEdit={canEdit}
        editingId={editingId}
        onClose={() => setModalOpen(false)}
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
        wizardSteps={wizardSteps}
        wizardStep={wizardStep}
        prevWizardStep={prevWizardStep}
        nextWizardStep={() => void nextWizardStep()}
        isSubmitting={isSubmitting}
        t={t}
        buildings={buildings}
        filteredBuildings={filteredBuildings}
        buildingSearch={buildingSearch}
        buildingDropdownOpen={buildingDropdownOpen}
        setBuildingSearch={setBuildingSearch}
        setBuildingDropdownOpen={setBuildingDropdownOpen}
        setValue={setValue}
        register={register}
        errors={errors}
        serviceTypes={serviceTypes}
        selectedBuilding={selectedWizardBuilding}
        employees={employees}
        assignmentSuggestions={assignmentSuggestions}
        recurrenceOptions={recurrenceOptions}
        selectedType={selectedType}
        getValues={getValues}
        resolvedTypeLabel={selectedServiceTypeLabel}
      />
      <CancelSchedulingModal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        handleSubmit={handleCancelSubmit}
        onCancel={onCancel}
        cancelErrors={cancelErrors}
        cancelRegister={cancelRegister}
        cancelSubmitting={cancelSubmitting}
        t={t}
      />
      <DeleteSchedulingConfirm
        open={Boolean(deleteTarget)}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
        t={t}
      />
      <CompleteServiceModal
        open={Boolean(completeTarget)}
        onClose={() => setCompleteTarget(null)}
        completionReport={completionReport}
        getTimeParts={getTimeParts}
        setReportTimePart={setReportTimePart}
        groupPanelsOpen={groupPanelsOpen}
        setGroupPanelsOpen={setGroupPanelsOpen}
        group1Units={group1Units}
        setGroup1Units={setGroup1Units}
        bombaPanelsOpen={bombaPanelsOpen}
        setBombaPanelsOpen={setBombaPanelsOpen}
        completionChecklistGroup1={completionChecklistGroup1}
        completionChecklistGroups={completionChecklistGroups}
        formatChecklistLabel={formatChecklistLabel}
        setCompletionReport={setCompletionReport}
        makeGroup1Key={makeGroup1Key}
        makeGroup1RedKey={makeGroup1RedKey}
        timeHourOptions={timeHourOptions}
        timeMinuteOptions={timeMinuteOptions}
        completionPhotos={completionPhotos}
        setCompletionPhotos={setCompletionPhotos}
        hasIssues={hasIssues}
        setHasIssues={setHasIssues}
        issueError={issueError}
        setIssueError={setIssueError}
        issueDraft={issueDraft}
        setIssueDraft={setIssueDraft}
        dynamicIssueTypes={dynamicIssueTypes}
        dynamicIssueCategories={dynamicIssueCategories}
        resolveIssueLabel={resolveIssueLabel}
        addIssue={addIssue}
        issues={issues}
        removeIssue={removeIssue}
        completeSubmitting={completeSubmitting}
        completeService={completeService}
      />
    </div>
  );
}
