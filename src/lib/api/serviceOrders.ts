import type { Appointment, AppointmentIssue } from '@/core/models/appointment';
import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { ManagementCompany } from '@/core/models/managementCompany';
import type {
  ServiceOrder,
  ServiceOrderIssue,
  ServiceOrderPriority,
  ServiceOrderStatus,
  ServiceOrderTimelineEvent
} from '@/core/models/serviceOrder';
import { createDoc, deleteDocById, updateDocById } from './firestore';

export type AppointmentRelations = {
  building?: Building | null;
  contract?: Contract | null;
  management?: ManagementCompany | null;
};

export type ServiceOrderRelations = AppointmentRelations;

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

function mapStatus(status: Appointment['status']): ServiceOrderStatus {
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

function mapPriority(type: string): ServiceOrderPriority {
  const normalized = type.toLowerCase();
  if (normalized.includes('emergen')) return 'urgent';
  if (normalized.includes('correct')) return 'high';
  if (normalized.includes('inspe')) return 'medium';
  return 'medium';
}

function mapIssues(issues?: AppointmentIssue[]): ServiceOrderIssue[] {
  return (issues ?? []).map((issue) => ({
    id: issue.id,
    type: issue.type,
    category: issue.category,
    description: issue.description,
    photos: issue.photos,
    createdAt: issue.createdAt
  }));
}

export function buildAppointmentTimeline(appointment: Appointment): ServiceOrderTimelineEvent[] {
  const timeline: ServiceOrderTimelineEvent[] = [];

  if (appointment.createdAt) {
    timeline.push({
      id: `${appointment.id}-created`,
      type: 'created',
      createdAt: appointment.createdAt,
      actorRole: 'system',
      summary: 'Servicio creado'
    });
  }

  timeline.push({
    id: `${appointment.id}-scheduled`,
    type: 'scheduled',
    createdAt: appointment.startAt,
    actorRole: 'company',
    summary: 'Servicio agendado'
  });

  if (appointment.employeeId) {
    timeline.push({
      id: `${appointment.id}-assigned`,
      type: 'assigned',
      createdAt: appointment.startAt,
      actorRole: 'company',
      actorId: appointment.employeeId,
      summary: 'Tecnico asignado'
    });
  }

  if (appointment.completedAt) {
    timeline.push({
      id: `${appointment.id}-completed`,
      type: 'completed',
      createdAt: appointment.completedAt,
      actorRole: 'technician',
      summary: 'Servicio completado'
    });
  }

  if (appointment.status === 'cancelado') {
    timeline.push({
      id: `${appointment.id}-cancelled`,
      type: 'cancelled',
      createdAt: appointment.completedAt ?? appointment.endAt,
      actorRole: 'company',
      summary: appointment.cancelReason ? `Servicio cancelado: ${appointment.cancelReason}` : 'Servicio cancelado'
    });
  }

  return timeline.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function mapAppointmentToServiceOrder(
  appointment: Appointment,
  relations: AppointmentRelations = {}
): ServiceOrder {
  const building = relations.building ?? null;
  const contract = relations.contract ?? null;
  const management = relations.management ?? null;

  return {
    id: appointment.id,
    appointmentId: appointment.id,
    customerId: management?.id ?? building?.managementCompanyId ?? null,
    buildingId: appointment.buildingId,
    contractId: contract?.id ?? building?.contractId ?? null,
    title: appointment.title,
    description: appointment.description,
    type: appointment.type,
    priority: mapPriority(appointment.type),
    status: mapStatus(appointment.status),
    scheduledStartAt: appointment.startAt,
    scheduledEndAt: appointment.endAt,
    assignedTechnicianId: appointment.employeeId ?? null,
    issues: mapIssues(appointment.issues),
    attachments: appointment.completionPhotos ?? [],
    completionPhotos: appointment.completionPhotos ?? [],
    report: appointment.completionReport as ServiceOrder['report'],
    communication: {
      internalSummary: management ? `Cliente asociado: ${management.name}` : undefined
    },
    timeline: buildAppointmentTimeline(appointment),
    cancelReason: appointment.cancelReason ?? null,
    cancelNote: appointment.cancelNote ?? null,
    completedAt: appointment.completedAt ?? null,
    createdAt: appointment.createdAt,
    updatedAt: appointment.completedAt ?? appointment.createdAt
  };
}

export function enrichServiceOrder(serviceOrder: ServiceOrder, relations: ServiceOrderRelations = {}): ServiceOrder {
  const building = relations.building ?? null;
  const contract = relations.contract ?? null;
  const management = relations.management ?? null;

  return {
    ...serviceOrder,
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

export function buildServiceOrderPayload(values: ServiceOrderMutationValues) {
  return {
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
    updatedAt: new Date().toISOString()
  };
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
    if ((current as ServiceOrder & { seriesId?: string | null })?.seriesId) {
      const related = serviceOrders.filter(
        (item) => (item as ServiceOrder & { seriesId?: string | null }).seriesId === (current as ServiceOrder & { seriesId?: string | null }).seriesId && item.id !== editingId
      );
      await Promise.all(related.map((item) => deleteDocById('service_orders', item.id)));
    }
    await updateDocById('service_orders', editingId, { ...payload, seriesId: null });
    return 'updated' as const;
  }

  await createDoc('service_orders', payload);
  return 'created' as const;
}

export async function cancelServiceOrder(serviceOrderId: string, values: { reason?: string; note?: string }) {
  await updateDocById('service_orders', serviceOrderId, {
    status: 'cancelled',
    cancelReason: values.reason || null,
    cancelNote: values.note?.trim() || null,
    updatedAt: new Date().toISOString()
  });
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
    updatedAt: new Date().toISOString()
  });
}
