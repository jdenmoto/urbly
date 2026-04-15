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

function buildTimeline(appointment: Appointment): ServiceOrderTimelineEvent[] {
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

export type ServiceOrderRelations = {
  buildings?: Building[];
  contracts?: Contract[];
  managements?: ManagementCompany[];
};

export function mapAppointmentToServiceOrder(
  appointment: Appointment,
  relations: ServiceOrderRelations = {}
): ServiceOrder {
  const building = relations.buildings?.find((item) => item.id === appointment.buildingId);
  const contract = relations.contracts?.find((item) => item.id === building?.contractId);
  const management = relations.managements?.find((item) => item.id === building?.managementCompanyId);

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
    timeline: buildTimeline(appointment),
    cancelReason: appointment.cancelReason ?? null,
    cancelNote: appointment.cancelNote ?? null,
    completedAt: appointment.completedAt ?? null,
    createdAt: appointment.createdAt,
    updatedAt: appointment.completedAt ?? appointment.createdAt
  };
}
