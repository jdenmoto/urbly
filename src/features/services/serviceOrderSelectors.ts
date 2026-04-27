import type { Building } from '@/core/models/building';
import type { OperationalServiceOrder } from './useOperationalServiceOrders';

export type ServiceOrderFilters = {
  buildingId: string;
  from: string;
  to: string;
  status: string;
};

export type ServiceOrderSummary = {
  scheduled: number;
  inProgress: number;
  completed: number;
  urgent: number;
};

export function getSelectedServiceBuilding(buildings: Building[], buildingId: string) {
  return buildings.find((building) => building.id === buildingId) ?? null;
}

export function buildServiceOrderSummary(serviceOrders: OperationalServiceOrder[]): ServiceOrderSummary {
  return serviceOrders.reduce<ServiceOrderSummary>(
    (summary, serviceOrder) => {
      if (serviceOrder.status === 'scheduled' || serviceOrder.status === 'confirmed') {
        summary.scheduled += 1;
      }
      if (serviceOrder.status === 'in_progress') {
        summary.inProgress += 1;
      }
      if (serviceOrder.status === 'completed') {
        summary.completed += 1;
      }
      if (serviceOrder.priority === 'urgent') {
        summary.urgent += 1;
      }
      return summary;
    },
    { scheduled: 0, inProgress: 0, completed: 0, urgent: 0 }
  );
}

export function filterServiceOrders(serviceOrders: OperationalServiceOrder[], filters: ServiceOrderFilters) {
  return serviceOrders.filter((serviceOrder) => {
    if (filters.buildingId && serviceOrder.buildingId !== filters.buildingId) return false;
    if (filters.status && serviceOrder.status !== filters.status) return false;
    if (filters.from && new Date(serviceOrder.scheduledStartAt) < new Date(`${filters.from}T00:00:00`)) return false;
    if (filters.to && new Date(serviceOrder.scheduledEndAt) > new Date(`${filters.to}T23:59:59`)) return false;
    return true;
  });
}

export function getRecentServiceOrders(serviceOrders: OperationalServiceOrder[], limit = 12) {
  return [...serviceOrders]
    .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime())
    .slice(0, limit);
}
