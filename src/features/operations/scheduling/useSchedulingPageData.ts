import { useMemo } from 'react';

import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import { useList } from '@/lib/api/queries';
import { detectSchedulingConflicts } from './schedulingConflicts';
import { useOperationalServiceOrders, type OperationalServiceOrder } from '@/features/services/useOperationalServiceOrders';

export type SchedulingPageFilters = {
  technicianId: string;
  buildingId: string;
  status: string;
  type: string;
  priority: string;
  from: string;
  to: string;
};

export type SchedulingCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: OperationalServiceOrder['status'];
  priority: OperationalServiceOrder['priority'];
  buildingId: string;
  buildingName: string;
  technicianId: string | null;
  technicianName: string;
  type: string;
  hasConflict: boolean;
};

export type SchedulingSidebarGroup = {
  date: string;
  items: SchedulingCalendarEvent[];
};

export type SchedulingPageData = {
  filteredOrders: OperationalServiceOrder[];
  calendarEvents: SchedulingCalendarEvent[];
  sidebarGroups: SchedulingSidebarGroup[];
  summary: {
    total: number;
    scheduled: number;
    unassigned: number;
    conflicts: number;
  };
};

function isWithinDateRange(serviceOrder: OperationalServiceOrder, filters: SchedulingPageFilters) {
  if (filters.from && new Date(serviceOrder.scheduledStartAt) < new Date(`${filters.from}T00:00:00`)) return false;
  if (filters.to && new Date(serviceOrder.scheduledEndAt) > new Date(`${filters.to}T23:59:59`)) return false;
  return true;
}

function matchesFilters(serviceOrder: OperationalServiceOrder, filters: SchedulingPageFilters) {
  if (filters.technicianId && serviceOrder.assignedTechnicianId !== filters.technicianId) return false;
  if (filters.buildingId && serviceOrder.buildingId !== filters.buildingId) return false;
  if (filters.status && serviceOrder.status !== filters.status) return false;
  if (filters.type && serviceOrder.type !== filters.type) return false;
  if (filters.priority && serviceOrder.priority !== filters.priority) return false;
  return isWithinDateRange(serviceOrder, filters);
}

export function buildSchedulingPageData(input: {
  serviceOrders: OperationalServiceOrder[];
  buildings: Building[];
  technicians: Employee[];
  filters: SchedulingPageFilters;
}): SchedulingPageData {
  const buildingsById = new Map(input.buildings.map((building) => [building.id, building]));
  const techniciansById = new Map(input.technicians.map((technician) => [technician.id, technician]));

  const filteredOrders = input.serviceOrders
    .filter((serviceOrder) => matchesFilters(serviceOrder, input.filters))
    .sort((left, right) => new Date(left.scheduledStartAt).getTime() - new Date(right.scheduledStartAt).getTime());

  const calendarEvents = filteredOrders.map<SchedulingCalendarEvent>((serviceOrder) => {
    const buildingName = buildingsById.get(serviceOrder.buildingId)?.name ?? 'Sin edificio';
    const technicianName = serviceOrder.assignedTechnicianId
      ? techniciansById.get(serviceOrder.assignedTechnicianId)?.fullName ?? 'Técnico no encontrado'
      : 'Sin técnico';

    const conflictResult = detectSchedulingConflicts({
      serviceOrders: filteredOrders,
      serviceOrderId: serviceOrder.id,
      technicianId: serviceOrder.assignedTechnicianId,
      scheduledStartAt: serviceOrder.scheduledStartAt,
      scheduledEndAt: serviceOrder.scheduledEndAt,
    });

    return {
      id: serviceOrder.id,
      title: serviceOrder.title,
      start: serviceOrder.scheduledStartAt,
      end: serviceOrder.scheduledEndAt,
      status: serviceOrder.status,
      priority: serviceOrder.priority,
      buildingId: serviceOrder.buildingId,
      buildingName,
      technicianId: serviceOrder.assignedTechnicianId ?? null,
      technicianName,
      type: serviceOrder.type,
      hasConflict: conflictResult.hasConflicts,
    };
  });

  const sidebarGroups = calendarEvents.reduce<SchedulingSidebarGroup[]>((groups, event) => {
    const date = event.start.slice(0, 10);
    const lastGroup = groups[groups.length - 1];
    if (!lastGroup || lastGroup.date !== date) {
      groups.push({ date, items: [event] });
      return groups;
    }

    lastGroup.items.push(event);
    return groups;
  }, []);

  return {
    filteredOrders,
    calendarEvents,
    sidebarGroups,
    summary: {
      total: filteredOrders.length,
      scheduled: filteredOrders.filter((item) => item.status === 'scheduled' || item.status === 'confirmed').length,
      unassigned: filteredOrders.filter((item) => item.status === 'unassigned').length,
      conflicts: calendarEvents.filter((item) => item.hasConflict).length,
    },
  };
}

export function useSchedulingPageData(filters: SchedulingPageFilters) {
  const serviceOrdersQuery = useOperationalServiceOrders();
  const buildingsQuery = useList<Building>('buildings', 'buildings');
  const techniciansQuery = useList<Employee>('employees', 'employees');

  const data = useMemo(
    () => buildSchedulingPageData({
      serviceOrders: serviceOrdersQuery.data ?? [],
      buildings: buildingsQuery.data ?? [],
      technicians: techniciansQuery.data ?? [],
      filters,
    }),
    [serviceOrdersQuery.data, buildingsQuery.data, techniciansQuery.data, filters],
  );

  return {
    serviceOrdersQuery,
    buildingsQuery,
    techniciansQuery,
    ...data,
    isLoading: serviceOrdersQuery.isLoading || buildingsQuery.isLoading || techniciansQuery.isLoading,
  };
}
