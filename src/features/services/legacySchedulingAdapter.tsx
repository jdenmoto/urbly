import CreateServiceOrderDrawer from '@/features/operations/scheduling/CreateServiceOrderDrawer';
import CompleteServiceModal from '@/features/scheduling/CompleteServiceModal';
import useSchedulingCompletion from '@/features/scheduling/useSchedulingCompletion';
import type { ServiceOrder, ServiceOrderIssue, ServiceOrderReport } from '@/core/models/serviceOrder';

/**
 * Temporary quarantine for legacy scheduling pieces still reused by Services.
 *
 * `/services` is the visible operational flow. This adapter keeps the remaining
 * scheduling implementation details out of Services pages until the closeout
 * modal and quick-create drawer are replaced by native Services components.
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

export const useServiceCloseoutCompletion = useSchedulingCompletion;
