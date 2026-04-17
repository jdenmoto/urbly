import type { Appointment } from '@/core/models/appointment';
import type { ServiceOrder } from '@/core/models/serviceOrder';
import { mapAppointmentToSchedulingItem, mapServiceOrderToSchedulingItem, type SchedulingItem } from './schedulingItem';

export function buildCanonicalSchedulingItems(args: {
  appointments: Appointment[];
  serviceOrders: ServiceOrder[];
}): SchedulingItem[] {
  const { appointments, serviceOrders } = args;
  if (serviceOrders.length > 0) {
    return serviceOrders.map(mapServiceOrderToSchedulingItem);
  }
  return appointments.map(mapAppointmentToSchedulingItem);
}

export function buildSchedulingItemsForValidation(args: {
  appointments: Appointment[];
  serviceOrders: ServiceOrder[];
}): SchedulingItem[] {
  return [
    ...args.appointments.map(mapAppointmentToSchedulingItem),
    ...args.serviceOrders.map(mapServiceOrderToSchedulingItem)
  ];
}
