import { useMemo, useState } from 'react';
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
import type { ColumnDef } from '@tanstack/react-table';
import { useI18n } from '@/lib/i18n';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { buildRestrictedDates, filterAppointments, formatDateTime, formatLocalIso, isRestrictedDate as isRestrictedDateValue } from './schedulingUtils';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/app/Auth';
import { CancelIcon, TrashIcon, CheckIcon, EditIcon } from '@/components/ActionIcons';
import { db } from '@/lib/firebase/client';
import { addDays, addMonths, isAfter } from 'date-fns';
import { type CancelValues } from './schedulingMutations';
import { type SchedulingFormValues } from './schedulingSeries';
import { type SchedulingItem } from './schedulingItem';
import { buildCanonicalSchedulingItems } from './schedulingSelectors';
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
import useSchedulingFilters from './useSchedulingFilters';
import useSchedulingFormFlow from './useSchedulingFormFlow';
import useSchedulingSeriesFlow from './useSchedulingSeriesFlow';
import useSchedulingSubmitFlow from './useSchedulingSubmitFlow';
import usePhotoViewer from './usePhotoViewer';
import { buildAssignmentSuggestions } from './assignmentSuggestions';
import { buildSchedulingStatusLabels, checklistValueLabel, resolveSchedulingIssueLabel } from './schedulingPresentation';

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
  const [selected, setSelected] = useState<SchedulingItem | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

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

  const {
    filters,
    setFilters,
    filtersOpen,
    setFiltersOpen,
    filterBuildingSearch,
    setFilterBuildingSearch,
    filterDropdownOpen,
    setFilterDropdownOpen,
    selectedFilterBuilding
  } = useSchedulingFilters({
    searchParams,
    activeBuildings
  });

  const {
    editingId,
    setEditingId,
    modalOpen,
    setModalOpen,
    buildingSearch,
    setBuildingSearch,
    buildingDropdownOpen,
    setBuildingDropdownOpen,
    wizardStep,
    setWizardStep,
    wizardSteps,
    startCreate,
    startCreateAt,
    startEdit,
    nextWizardStep,
    prevWizardStep
  } = useSchedulingFormFlow({
    t,
    filters,
    activeBuildings,
    buildings,
    selectedType,
    reset,
    setValue,
    trigger,
    setSelected
  });

  const filtered = useMemo(() => filterAppointments(schedulingItems, filters), [schedulingItems, filters]);

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

  const statusLabels = useMemo(() => buildSchedulingStatusLabels(t), [t]);

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
        cell: ({ row }) => statusLabels[row.original.status] ?? row.original.status
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
  }, [buildings, employees, t, canEdit, statusLabels]);

  const invalidateScheduling = () => queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });

  const {
    seriesConfirmOpen,
    requestSeriesConfirmation,
    closeSeriesConfirmation,
    confirmSeriesRegeneration
  } = useSchedulingSeriesFlow({
    editingId,
    schedulingItems,
    serviceOrders,
    buildings,
    contracts,
    alignToContractStart,
    nextWorkingDate,
    setError,
    toast,
    t,
    isRestrictedDate,
    invalidateScheduling,
    reset,
    setEditingId,
    setModalOpen,
    setWizardStep
  });

  const { onSubmit } = useSchedulingSubmitFlow({
    canCreate,
    role,
    canScheduleEmergency,
    schedulingItems,
    editingId,
    serviceOrders,
    buildings,
    contracts,
    alignToContractStart,
    nextWorkingDate,
    isRestrictedDate,
    setError,
    toast,
    t,
    invalidateScheduling,
    reset,
    setEditingId,
    setModalOpen,
    setWizardStep,
    requestSeriesConfirmation
  });

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

  const statusLabel = (status: SchedulingItem['status']) => statusLabels[status] ?? status;
  const resolveIssueLabel = (prefix: 'scheduling.issueTypes' | 'scheduling.issueCategories', value: string) =>
    resolveSchedulingIssueLabel(t, prefix, value);

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
        onCloseSeries={closeSeriesConfirmation}
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
