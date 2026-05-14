import type { Building } from '@/core/models/building';
import type { ServiceOrderStatus } from '@/core/models/serviceOrder';
import type { OperationalServiceOrder } from '@/features/services/useOperationalServiceOrders';

export const CLIENT_VISIBLE_SERVICE_STATUSES: ServiceOrderStatus[] = [
  'scheduled',
  'confirmed',
  'in_progress',
  'paused',
  'pending_review',
  'requires_reschedule',
  'completed'
];

const activeStatuses = new Set<ServiceOrderStatus>([
  'scheduled',
  'confirmed',
  'in_progress',
  'paused',
  'pending_review',
  'requires_reschedule'
]);

export type ClientServiceFilter = 'all' | 'active' | 'completed';

export function getClientScopedBuildings(buildings: Building[], administrationId: string | null) {
  if (!administrationId) return [];
  return buildings.filter((building) => building.managementCompanyId === administrationId);
}

export function getClientVisibleServiceOrders(
  serviceOrders: OperationalServiceOrder[],
  buildings: Building[],
  administrationId: string | null
) {
  if (!administrationId) return [];

  const buildingIds = new Set(buildings.map((building) => building.id));
  const visibleStatuses = new Set(CLIENT_VISIBLE_SERVICE_STATUSES);

  return serviceOrders.filter((serviceOrder) => {
    const belongsToVisibleBuilding = buildingIds.has(serviceOrder.buildingId);
    const belongsToClient = serviceOrder.customerId === administrationId;
    return (belongsToVisibleBuilding || belongsToClient) && visibleStatuses.has(serviceOrder.status);
  });
}

export function filterClientServiceOrders(serviceOrders: OperationalServiceOrder[], filter: ClientServiceFilter) {
  if (filter === 'active') return serviceOrders.filter((serviceOrder) => activeStatuses.has(serviceOrder.status));
  if (filter === 'completed') return serviceOrders.filter((serviceOrder) => serviceOrder.status === 'completed');
  return serviceOrders;
}

export function getClientServiceLastUpdate(serviceOrder: OperationalServiceOrder) {
  const latestTimelineEvent = serviceOrder.timeline.length ? serviceOrder.timeline[serviceOrder.timeline.length - 1] : null;
  return latestTimelineEvent?.createdAt ?? serviceOrder.completedAt ?? serviceOrder.updatedAt ?? serviceOrder.scheduledStartAt;
}

export function sortClientServicesByPriority(serviceOrders: OperationalServiceOrder[]) {
  const priorityRank: Record<OperationalServiceOrder['priority'], number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3
  };

  return [...serviceOrders].sort((a, b) => {
    const statusRankA = a.status === 'completed' ? 1 : 0;
    const statusRankB = b.status === 'completed' ? 1 : 0;
    if (statusRankA !== statusRankB) return statusRankA - statusRankB;

    const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime();
  });
}
