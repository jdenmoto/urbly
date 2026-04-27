import type { ServiceOrder, ServiceOrderIssue, ServiceOrderReport } from '@/core/models/serviceOrder';

export type SchedulingStatus = 'programado' | 'confirmado' | 'completado' | 'cancelado';

export type SchedulingItem = {
  id: string;
  source: 'appointment_fallback' | 'service_order';
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
  issues?: ServiceOrderIssue[];
  completionPhotos?: string[];
  completionReport?: ServiceOrderReport;
  createdAt?: string;
};

export function mapServiceOrderToSchedulingItem(serviceOrder: ServiceOrder): SchedulingItem {
  return {
    id: serviceOrder.id,
    source: serviceOrder.dataSource === 'appointment_fallback' ? 'appointment_fallback' : 'service_order',
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
    recurrence: serviceOrder.recurrence ?? null,
    seriesId: serviceOrder.seriesId ?? null,
    cancelReason: serviceOrder.cancelReason ?? null,
    cancelNote: serviceOrder.cancelNote ?? null,
    completedAt: serviceOrder.completedAt ?? null,
    issues: serviceOrder.issues,
    completionPhotos: serviceOrder.completionPhotos ?? [],
    completionReport: serviceOrder.report,
    createdAt: serviceOrder.createdAt
  };
}
