import type { ServiceOrder } from '@/core/models/serviceOrder';
import { mapServiceOrderToSchedulingItem, type SchedulingItem } from './schedulingItem';

export function buildCanonicalSchedulingItems(args: {
  serviceOrders: ServiceOrder[];
}): SchedulingItem[] {
  return args.serviceOrders.map(mapServiceOrderToSchedulingItem);
}

export function buildSchedulingItemsForValidation(args: {
  serviceOrders: ServiceOrder[];
}): SchedulingItem[] {
  return buildCanonicalSchedulingItems(args);
}
