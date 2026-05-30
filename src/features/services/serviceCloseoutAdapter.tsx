import CreateServiceOrderDrawer from './CreateServiceOrderDrawer';
import type { ServiceOrder, ServiceOrderIssue, ServiceOrderReport } from '@/core/models/serviceOrder';
import CompleteServiceModal from './CompleteServiceModal';
import useServiceCloseoutCompletion from './useServiceCloseoutCompletion';

/**
 * Service closeout adapter for `/services` operational flow.
 */
export { CreateServiceOrderDrawer, CompleteServiceModal };

export type ServiceCloseoutStatus = 'programado' | 'confirmado' | 'completado' | 'cancelado';

export type ServiceCloseoutItem = {
  id: string;
  source: 'service_order';
  sourceId: string;
  buildingId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  status: ServiceCloseoutStatus;
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

export function mapServiceOrderToCloseoutItem(serviceOrder: ServiceOrder): ServiceCloseoutItem {
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

export { useServiceCloseoutCompletion };
