import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { ManagementCompany } from '@/core/models/managementCompany';
import type {
  ServiceOrder,
  ServiceOrderActorRole,
  ServiceOrderAssignmentRecord,
  ServiceOrderDataSource,
  ServiceOrderIssue,
  ServiceOrderPauseRecord,
  ServiceOrderPriority,
  ServiceOrderRescheduleRecord,
  ServiceOrderStatus,
  ServiceOrderTimelineEvent,
  ServiceOrderTimelineEventMetadataByType,
  ServiceOrderTimelineEventType,
} from '@/core/models/serviceOrder';
import {
  createServiceOrderStatus,
  resolveServiceOrderTransition,
  type ServiceOrderIssueOutcome,
} from '@/features/services/serviceOrderTransitions';
import { createDoc, deleteDocById, filters, listDocs, updateDocById } from './firestore';

export type ServiceOrderRelations = {
  building?: Building | null;
  contract?: Contract | null;
  management?: ManagementCompany | null;
};

export type ServiceOrderResolution = {
  items: ServiceOrder[];
  source: ServiceOrderDataSource;
};

export type ServiceOrderMutationValues = {
  buildingId: string;
  title: string;
  description?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: ServiceOrderStatus;
  recurrence?: string | null;
  type: string;
  assignedTechnicianId?: string | null;
  seriesId?: string | null;
};

export type CreateDraftServiceOrderInput = Omit<ServiceOrderMutationValues, 'status'>;

export type ScheduleServiceOrderInput = {
  serviceOrder: ServiceOrder;
  scheduledStartAt: string;
  scheduledEndAt: string;
  assignedTechnicianId?: string | null;
  actorId?: string;
  note?: string;
};

export type AssignTechnicianInput = {
  serviceOrder: ServiceOrder;
  technicianId: string | null;
  reason: string;
  note?: string;
  actorId?: string;
};

export type RescheduleServiceOrderInput = {
  serviceOrder: ServiceOrder;
  scheduledStartAt: string;
  scheduledEndAt: string;
  assignedTechnicianId?: string | null;
  reason: string;
  note?: string;
  actorId?: string;
};

export type MarkServiceInProgressInput = {
  serviceOrder: ServiceOrder;
  actorId?: string;
};

export type PauseServiceOrderInput = {
  serviceOrder: ServiceOrder;
  reason: string;
  note?: string;
  actorId?: string;
};

export type ResumeServiceOrderInput = {
  serviceOrder: ServiceOrder;
  note?: string;
  actorId?: string;
};

export type ReportServiceIssueInput = {
  serviceOrder: ServiceOrder;
  outcome: ServiceOrderIssueOutcome;
  issue: ServiceOrderIssue;
  note?: string;
  actorId?: string;
};

export type CompleteServiceOrderInput = {
  serviceOrder: ServiceOrder;
  note?: string;
  actorId?: string;
};

export type CancelServiceOrderInput = {
  serviceOrder: ServiceOrder;
  reason: string;
  note?: string;
  actorId?: string;
};

export type UpdateSeriesScopeInput = {
  serviceOrderId: string;
  scope: 'this' | 'future';
  seriesId?: string | null;
  recurrence?: string | null;
  actorId?: string;
};

export type SchedulingServiceOrderStatus = 'programado' | 'confirmado' | 'completado' | 'cancelado';

function mapSchedulingStatus(status: SchedulingServiceOrderStatus): ServiceOrderStatus {
  switch (status) {
    case 'programado':
      return 'scheduled';
    case 'confirmado':
      return 'confirmed';
    case 'completado':
      return 'completed';
    case 'cancelado':
      return 'cancelled';
    default:
      return 'draft';
  }
}

export function mapSchedulingStatusToServiceOrderStatus(status: SchedulingServiceOrderStatus): ServiceOrderStatus {
  return mapSchedulingStatus(status);
}

function mapPriority(type: string): ServiceOrderPriority {
  const normalized = type.toLowerCase();
  if (normalized.includes('emergen')) return 'urgent';
  if (normalized.includes('correct')) return 'high';
  if (normalized.includes('inspe')) return 'medium';
  return 'medium';
}

function nowIso() {
  return new Date().toISOString();
}

function buildTimelineEvent<TType extends ServiceOrderTimelineEventType>(input: {
  type: TType;
  actorRole: ServiceOrderActorRole;
  actorId?: string;
  summary: string;
  metadata?: ServiceOrderTimelineEventMetadataByType[TType];
  createdAt?: string;
}): ServiceOrderTimelineEvent {
  const base = {
    id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    type: input.type,
    createdAt: input.createdAt ?? nowIso(),
    actorRole: input.actorRole,
    actorId: input.actorId,
    summary: input.summary,
  };

  if (input.metadata === undefined) {
    return base as ServiceOrderTimelineEvent;
  }

  return {
    ...base,
    metadata: input.metadata,
  } as ServiceOrderTimelineEvent;
}

function appendTimelineEvents(serviceOrder: ServiceOrder, events: ServiceOrderTimelineEvent[]) {
  return [...(serviceOrder.timeline ?? []), ...events];
}

function buildUpdatedAt() {
  return { updatedAt: nowIso() };
}

function buildAssignmentRecord(input: {
  previousTechnicianId?: string | null;
  nextTechnicianId?: string | null;
  reason: string;
  actorId?: string;
  note?: string;
}): ServiceOrderAssignmentRecord {
  return {
    changedAt: nowIso(),
    previousTechnicianId: input.previousTechnicianId ?? null,
    nextTechnicianId: input.nextTechnicianId ?? null,
    reason: input.reason,
    actorRole: 'company',
    actorId: input.actorId,
    note: input.note,
  };
}

function buildRescheduleRecord(input: {
  serviceOrder: ServiceOrder;
  scheduledStartAt: string;
  scheduledEndAt: string;
  reason: string;
  actorId?: string;
  note?: string;
}): ServiceOrderRescheduleRecord {
  return {
    changedAt: nowIso(),
    previousStartAt: input.serviceOrder.scheduledStartAt,
    previousEndAt: input.serviceOrder.scheduledEndAt,
    nextStartAt: input.scheduledStartAt,
    nextEndAt: input.scheduledEndAt,
    reason: input.reason,
    actorRole: 'company',
    actorId: input.actorId,
    note: input.note,
  };
}

function buildPauseRecord(input: { reason: string; actorId?: string; note?: string }): ServiceOrderPauseRecord {
  return {
    pausedAt: nowIso(),
    reason: input.reason,
    actorRole: 'technician',
    actorId: input.actorId,
    note: input.note,
  };
}

function resolveSchedulingStatus(assignedTechnicianId?: string | null) {
  return createServiceOrderStatus({ assignedTechnicianId: assignedTechnicianId ?? null, isDraft: false });
}

function resolveRequiredTransition(
  currentStatus: ServiceOrderStatus,
  action: 'assign' | 'start' | 'pause' | 'resume' | 'reschedule' | 'complete' | 'cancel',
  context?: { assignedTechnicianId?: string | null; issueOutcome?: ServiceOrderIssueOutcome },
) {
  return resolveServiceOrderTransition(currentStatus, action, context) ?? (action === 'assign' ? 'scheduled' : null);
}

export function enrichServiceOrder(serviceOrder: ServiceOrder, relations: ServiceOrderRelations = {}): ServiceOrder {
  const building = relations.building ?? null;
  const contract = relations.contract ?? null;
  const management = relations.management ?? null;

  return {
    ...serviceOrder,
    dataSource: serviceOrder.dataSource ?? 'service_order',
    customerId: serviceOrder.customerId ?? management?.id ?? building?.managementCompanyId ?? null,
    contractId: serviceOrder.contractId ?? contract?.id ?? building?.contractId ?? null,
    priority: serviceOrder.priority ?? mapPriority(serviceOrder.type),
    communication:
      serviceOrder.communication ??
      (management
        ? {
            internalSummary: `Cliente asociado: ${management.name}`
          }
        : undefined)
  };
}

export function indexById<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

export function hydrateServiceOrders(
  serviceOrders: ServiceOrder[],
  buildings: Building[],
  contracts: Contract[],
  managements: ManagementCompany[]
) {
  const buildingsById = indexById(buildings);
  const contractsById = indexById(contracts);
  const managementsById = indexById(managements);

  return serviceOrders.map((serviceOrder) => {
    const building = buildingsById.get(serviceOrder.buildingId) ?? null;
    const contract = serviceOrder.contractId
      ? contractsById.get(serviceOrder.contractId) ?? null
      : building?.contractId
        ? contractsById.get(building.contractId) ?? null
        : null;
    const management = serviceOrder.customerId
      ? managementsById.get(serviceOrder.customerId) ?? null
      : building?.managementCompanyId
        ? managementsById.get(building.managementCompanyId) ?? null
        : null;

    return enrichServiceOrder(serviceOrder, {
      building,
      contract,
      management
    });
  });
}

export function resolveServiceOrders(args: {
  serviceOrders: ServiceOrder[];
  buildings: Building[];
  contracts: Contract[];
  managements: ManagementCompany[];
}): ServiceOrderResolution {
  const { serviceOrders, buildings, contracts, managements } = args;
  return {
    items: hydrateServiceOrders(serviceOrders, buildings, contracts, managements),
    source: 'service_order'
  };
}

export async function loadResolvedServiceOrders() {
  const [serviceOrders, buildings, contracts, managements] = await Promise.all([
    listDocs<ServiceOrder>('service_orders').catch(() => []),
    listDocs<Building>('buildings'),
    listDocs<Contract>('contracts'),
    listDocs<ManagementCompany>('management_companies')
  ]);

  return resolveServiceOrders({
    serviceOrders,
    buildings,
    contracts,
    managements
  });
}

export async function loadResolvedTenantServiceOrders(args: {
  administrationId: string | null;
}) {
  const { administrationId } = args;

  const [serviceOrders, buildings, contracts, managements] = await Promise.all([
    listDocs<ServiceOrder>('service_orders').catch(() => []),
    administrationId
      ? listDocs<Building>('buildings', [filters().where('managementCompanyId', '==', administrationId)])
      : listDocs<Building>('buildings'),
    administrationId
      ? listDocs<Contract>('contracts', [filters().where('administrationId', '==', administrationId)])
      : listDocs<Contract>('contracts'),
    administrationId
      ? listDocs<ManagementCompany>('management_companies', [filters().where('__name__', '==', administrationId)]).catch(() => [])
      : listDocs<ManagementCompany>('management_companies')
  ]);

  const buildingIds = new Set(buildings.map((item) => item.id));
  const allowedServiceOrders = administrationId
    ? serviceOrders.filter((item) => buildingIds.has(item.buildingId) || item.customerId === administrationId)
    : serviceOrders;

  return resolveServiceOrders({
    serviceOrders: allowedServiceOrders,
    buildings,
    contracts,
    managements
  });
}

export function buildServiceOrderPayload(values: ServiceOrderMutationValues) {
  return {
    dataSource: 'service_order' as const,
    buildingId: values.buildingId,
    title: values.title,
    description: values.description ?? '',
    scheduledStartAt: values.scheduledStartAt,
    scheduledEndAt: values.scheduledEndAt,
    status: values.status,
    recurrence: values.recurrence ?? null,
    type: values.type,
    assignedTechnicianId: values.assignedTechnicianId ?? null,
    priority: mapPriority(values.type),
    seriesId: values.seriesId ?? null,
    updatedAt: nowIso()
  };
}

export async function createDraftServiceOrder(values: CreateDraftServiceOrderInput) {
  const createdAt = nowIso();
  const payload = {
    ...buildServiceOrderPayload({ ...values, status: 'draft' }),
    assignedTechnicianId: null,
    timeline: [
      buildTimelineEvent({
        type: 'created',
        actorRole: 'company',
        summary: 'Service order creada en borrador',
        createdAt,
      }),
    ],
  };

  return createDoc('service_orders', payload);
}

export async function scheduleServiceOrder(input: ScheduleServiceOrderInput) {
  const status = resolveSchedulingStatus(input.assignedTechnicianId ?? input.serviceOrder.assignedTechnicianId ?? null);
  const timeline = appendTimelineEvents(input.serviceOrder, [
    buildTimelineEvent({
      type: 'scheduled',
      actorRole: 'company',
      actorId: input.actorId,
      summary: 'Servicio programado en agenda operativa',
    }),
  ]);

  await updateDocById('service_orders', input.serviceOrder.id, {
    assignedTechnicianId: input.assignedTechnicianId ?? input.serviceOrder.assignedTechnicianId ?? null,
    scheduledStartAt: input.scheduledStartAt,
    scheduledEndAt: input.scheduledEndAt,
    status,
    timeline,
    ...buildUpdatedAt(),
  });
}

export async function assignTechnician(input: AssignTechnicianInput) {
  const nextStatus = resolveRequiredTransition(input.serviceOrder.status, 'assign');
  if (!nextStatus) throw new Error(`Cannot assign technician from status ${input.serviceOrder.status}`);

  const eventType = input.serviceOrder.assignedTechnicianId ? 'reassigned' : 'assigned';
  const record = buildAssignmentRecord({
    previousTechnicianId: input.serviceOrder.assignedTechnicianId ?? null,
    nextTechnicianId: input.technicianId,
    reason: input.reason,
    actorId: input.actorId,
    note: input.note,
  });

  const timeline = appendTimelineEvents(input.serviceOrder, [
    buildTimelineEvent({
      type: eventType,
      actorRole: 'company',
      actorId: input.actorId,
      summary: eventType === 'reassigned' ? 'Servicio reasignado' : 'Técnico asignado al servicio',
      metadata: {
        reason: input.reason,
        previousTechnicianId: input.serviceOrder.assignedTechnicianId ?? null,
        nextTechnicianId: input.technicianId,
        note: input.note,
      },
    }),
  ]);

  await updateDocById('service_orders', input.serviceOrder.id, {
    assignedTechnicianId: input.technicianId,
    status: nextStatus,
    reassignmentReason: input.reason,
    assignmentHistory: [...(input.serviceOrder.assignmentHistory ?? []), record],
    timeline,
    ...buildUpdatedAt(),
  });
}

export async function rescheduleServiceOrder(input: RescheduleServiceOrderInput) {
  const nextStatus = resolveRequiredTransition(input.serviceOrder.status, 'reschedule', {
    assignedTechnicianId: input.assignedTechnicianId ?? input.serviceOrder.assignedTechnicianId ?? null,
  });
  if (!nextStatus) throw new Error(`Cannot reschedule service order from status ${input.serviceOrder.status}`);

  const record = buildRescheduleRecord({
    serviceOrder: input.serviceOrder,
    scheduledStartAt: input.scheduledStartAt,
    scheduledEndAt: input.scheduledEndAt,
    reason: input.reason,
    actorId: input.actorId,
    note: input.note,
  });

  const timeline = appendTimelineEvents(input.serviceOrder, [
    buildTimelineEvent({
      type: 'rescheduled',
      actorRole: 'company',
      actorId: input.actorId,
      summary: 'Servicio reprogramado',
      metadata: {
        reason: input.reason,
        note: input.note,
        previousScheduledStartAt: input.serviceOrder.scheduledStartAt,
        previousScheduledEndAt: input.serviceOrder.scheduledEndAt,
        nextScheduledStartAt: input.scheduledStartAt,
        nextScheduledEndAt: input.scheduledEndAt,
      },
    }),
  ]);

  await updateDocById('service_orders', input.serviceOrder.id, {
    assignedTechnicianId: input.assignedTechnicianId ?? input.serviceOrder.assignedTechnicianId ?? null,
    scheduledStartAt: input.scheduledStartAt,
    scheduledEndAt: input.scheduledEndAt,
    status: nextStatus,
    rescheduleReason: input.reason,
    rescheduleHistory: [...(input.serviceOrder.rescheduleHistory ?? []), record],
    timeline,
    ...buildUpdatedAt(),
  });
}

export async function markServiceInProgress(input: MarkServiceInProgressInput) {
  const nextStatus = resolveRequiredTransition(input.serviceOrder.status, 'start');
  if (!nextStatus) throw new Error(`Cannot start service order from status ${input.serviceOrder.status}`);

  const startedAt = nowIso();
  const timeline = appendTimelineEvents(input.serviceOrder, [
    buildTimelineEvent({
      type: 'started',
      actorRole: 'technician',
      actorId: input.actorId,
      summary: 'Servicio iniciado en campo',
      createdAt: startedAt,
    }),
  ]);

  await updateDocById('service_orders', input.serviceOrder.id, {
    status: nextStatus,
    startedAt,
    timeline,
    ...buildUpdatedAt(),
  });
}

export async function pauseServiceOrder(input: PauseServiceOrderInput) {
  const nextStatus = resolveRequiredTransition(input.serviceOrder.status, 'pause');
  if (!nextStatus) throw new Error(`Cannot pause service order from status ${input.serviceOrder.status}`);

  const pauseRecord = buildPauseRecord({
    reason: input.reason,
    actorId: input.actorId,
    note: input.note,
  });
  const timeline = appendTimelineEvents(input.serviceOrder, [
    buildTimelineEvent({
      type: 'paused',
      actorRole: 'technician',
      actorId: input.actorId,
      summary: 'Servicio pausado por técnico',
      metadata: {
        reason: input.reason,
        pausedAt: pauseRecord.pausedAt,
        note: input.note,
      },
      createdAt: pauseRecord.pausedAt,
    }),
  ]);

  await updateDocById('service_orders', input.serviceOrder.id, {
    status: nextStatus,
    pausedAt: pauseRecord.pausedAt,
    pauseReason: input.reason,
    pauseHistory: [...(input.serviceOrder.pauseHistory ?? []), pauseRecord],
    timeline,
    ...buildUpdatedAt(),
  });
}

export async function resumeServiceOrder(input: ResumeServiceOrderInput) {
  const nextStatus = resolveRequiredTransition(input.serviceOrder.status, 'resume');
  if (!nextStatus) throw new Error(`Cannot resume service order from status ${input.serviceOrder.status}`);

  const resumedAt = nowIso();
  const pauseHistory = [...(input.serviceOrder.pauseHistory ?? [])];
  const lastPauseIndex = pauseHistory.length - 1;
  if (lastPauseIndex >= 0) {
    pauseHistory[lastPauseIndex] = {
      ...pauseHistory[lastPauseIndex],
      resumedAt,
      note: input.note ?? pauseHistory[lastPauseIndex]?.note,
    };
  }

  const timeline = appendTimelineEvents(input.serviceOrder, [
    buildTimelineEvent({
      type: 'resumed',
      actorRole: 'technician',
      actorId: input.actorId,
      summary: 'Servicio reanudado por técnico',
      metadata: {
        resumedAt,
        note: input.note,
      },
      createdAt: resumedAt,
    }),
  ]);

  await updateDocById('service_orders', input.serviceOrder.id, {
    status: nextStatus,
    pausedAt: null,
    pauseReason: null,
    pauseHistory,
    timeline,
    ...buildUpdatedAt(),
  });
}

export async function reportServiceIssue(input: ReportServiceIssueInput) {
  const nextStatus = resolveServiceOrderTransition(input.serviceOrder.status, 'report_issue', {
    issueOutcome: input.outcome,
  });
  if (!nextStatus) throw new Error(`Cannot report issue from status ${input.serviceOrder.status}`);

  const issueCreatedAt = input.issue.createdAt ?? nowIso();
  const issue = {
    ...input.issue,
    createdAt: issueCreatedAt,
  };

  const timeline = appendTimelineEvents(input.serviceOrder, [
    buildTimelineEvent({
      type: 'issue_added',
      actorRole: 'technician',
      actorId: input.actorId,
      summary: 'Técnico reportó una novedad',
      metadata: {
        note: input.note,
      },
      createdAt: issueCreatedAt,
    }),
    buildTimelineEvent({
      type: input.outcome,
      actorRole: 'technician',
      actorId: input.actorId,
      summary: input.outcome === 'pending_review' ? 'Servicio escalado a revisión interna' : 'Servicio marcado para reprogramación',
      metadata: input.outcome === 'requires_reschedule'
        ? {
            reason: input.issue.description || input.issue.type,
            note: input.note,
          }
        : {
            note: input.note,
          },
      createdAt: issueCreatedAt,
    }),
  ]);

  await updateDocById('service_orders', input.serviceOrder.id, {
    status: nextStatus,
    issues: [...(input.serviceOrder.issues ?? []), issue],
    timeline,
    ...buildUpdatedAt(),
  });
}

export async function completeServiceOrder(input: CompleteServiceOrderInput) {
  const nextStatus = resolveRequiredTransition(input.serviceOrder.status, 'complete');
  if (!nextStatus) throw new Error(`Cannot complete service order from status ${input.serviceOrder.status}`);

  const completedAt = nowIso();
  const timeline = appendTimelineEvents(input.serviceOrder, [
    buildTimelineEvent({
      type: 'completed',
      actorRole: 'technician',
      actorId: input.actorId,
      summary: 'Servicio completado',
      metadata: {
        note: input.note,
      },
      createdAt: completedAt,
    }),
  ]);

  await updateDocById('service_orders', input.serviceOrder.id, {
    status: nextStatus,
    completedAt,
    timeline,
    ...buildUpdatedAt(),
  });
}

export async function cancelServiceOrder(serviceOrderId: string, values: { reason?: string; note?: string }): Promise<void>;
export async function cancelServiceOrder(input: CancelServiceOrderInput): Promise<void>;
export async function cancelServiceOrder(
  serviceOrderOrId: string | CancelServiceOrderInput,
  values?: { reason?: string; note?: string },
) {
  if (typeof serviceOrderOrId === 'string') {
    await updateDocById('service_orders', serviceOrderOrId, {
      status: 'cancelled',
      cancelReason: values?.reason || null,
      cancelNote: values?.note?.trim() || null,
      updatedAt: nowIso()
    });
    return;
  }

  const { serviceOrder, reason, note, actorId } = serviceOrderOrId;
  const nextStatus = resolveRequiredTransition(serviceOrder.status, 'cancel');
  if (!nextStatus) throw new Error(`Cannot cancel service order from status ${serviceOrder.status}`);

  const cancelledAt = nowIso();
  const timeline = appendTimelineEvents(serviceOrder, [
    buildTimelineEvent({
      type: 'cancelled',
      actorRole: 'company',
      actorId,
      summary: 'Servicio cancelado operativamente',
      metadata: {
        reason,
        note,
      },
      createdAt: cancelledAt,
    }),
  ]);

  await updateDocById('service_orders', serviceOrder.id, {
    status: nextStatus,
    cancelReason: reason,
    cancelNote: note?.trim() || null,
    timeline,
    ...buildUpdatedAt(),
  });
}

export async function updateSeriesScope(input: UpdateSeriesScopeInput) {
  await updateDocById('service_orders', input.serviceOrderId, {
    seriesId: input.seriesId ?? null,
    recurrence: input.recurrence ?? null,
    seriesScope: input.scope,
    seriesUpdatedBy: input.actorId ?? null,
    ...buildUpdatedAt(),
  });
}

export async function saveServiceOrder(args: {
  values: ServiceOrderMutationValues;
  editingId: string | null;
  serviceOrders: ServiceOrder[];
}) {
  const { values, editingId, serviceOrders } = args;
  const payload = buildServiceOrderPayload(values);

  if (editingId) {
    const current = serviceOrders.find((item) => item.id === editingId) ?? null;
    if (current?.seriesId) {
      const related = serviceOrders.filter(
        (item) => item.seriesId === current.seriesId && item.id !== editingId
      );
      await Promise.all(related.map((item) => deleteDocById('service_orders', item.id)));
    }
    await updateDocById('service_orders', editingId, { ...payload, seriesId: null });
    return 'updated' as const;
  }

  await createDoc('service_orders', payload);
  return 'created' as const;
}

export async function deleteServiceOrder(serviceOrderId: string) {
  await deleteDocById('service_orders', serviceOrderId);
}

export async function moveServiceOrderOnCalendar(args: {
  serviceOrderId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
}) {
  await updateDocById('service_orders', args.serviceOrderId, {
    scheduledStartAt: args.scheduledStartAt,
    scheduledEndAt: args.scheduledEndAt,
    updatedAt: nowIso()
  });
}
