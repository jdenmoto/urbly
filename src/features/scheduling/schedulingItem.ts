import type { Appointment } from '@/core/models/appointment';
import type { ServiceOrder } from '@/core/models/serviceOrder';

export type SchedulingStatus = 'programado' | 'confirmado' | 'completado' | 'cancelado';

export type SchedulingItem = {
  id: string;
  source: 'appointment' | 'service_order';
  sourceId: string;
  buildingId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  status: SchedulingStatus;
  type: string;
  employeeId?: string | null;
  recurrence?: string | null;
  seriesId?: string | null;
  cancelReason?: string | null;
  cancelNote?: string | null;
  completedAt?: string | null;
  issues?: Appointment['issues'];
  completionPhotos?: string[];
  completionReport?: Record<string, unknown>;
  createdAt?: string;
};

export function mapServiceOrderToSchedulingItem(serviceOrder: ServiceOrder): SchedulingItem {
  return {
    id: serviceOrder.id,
    source: 'service_order',
    sourceId: serviceOrder.id,
    buildingId: serviceOrder.buildingId,
    title: serviceOrder.title,
    description: serviceOrder.description,
    startAt: serviceOrder.scheduledStartAt,
    endAt: serviceOrder.scheduledEndAt,
    status:
      serviceOrder.status === 'scheduled'
        ? 'programado'
        : serviceOrder.status === 'confirmed' || serviceOrder.status === 'in_progress'
          ? 'confirmado'
          : serviceOrder.status === 'completed'
            ? 'completado'
            : 'cancelado',
    type: serviceOrder.type,
    employeeId: serviceOrder.assignedTechnicianId ?? null,
    recurrence: (serviceOrder as ServiceOrder & { recurrence?: string | null }).recurrence ?? null,
    seriesId: (serviceOrder as ServiceOrder & { seriesId?: string | null }).seriesId ?? null,
    cancelReason: serviceOrder.cancelReason ?? null,
    cancelNote: serviceOrder.cancelNote ?? null,
    completedAt: serviceOrder.completedAt ?? null,
    issues: serviceOrder.issues,
    completionPhotos: serviceOrder.completionPhotos ?? [],
    completionReport: serviceOrder.report,
    createdAt: serviceOrder.createdAt
  };
}

export function mapAppointmentToSchedulingItem(appointment: Appointment): SchedulingItem {
  return {
    id: appointment.id,
    source: 'appointment',
    sourceId: appointment.id,
    buildingId: appointment.buildingId,
    title: appointment.title,
    description: appointment.description,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    status: appointment.status,
    type: appointment.type,
    employeeId: appointment.employeeId ?? null,
    recurrence: appointment.recurrence ?? null,
    seriesId: appointment.seriesId ?? null,
    cancelReason: appointment.cancelReason ?? null,
    cancelNote: appointment.cancelNote ?? null,
    completedAt: appointment.completedAt ?? null,
    issues: appointment.issues,
    completionPhotos: appointment.completionPhotos ?? [],
    completionReport: appointment.completionReport,
    createdAt: appointment.createdAt
  };
}
