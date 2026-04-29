import { describe, expect, it } from 'vitest';

import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import type { OperationalServiceOrder } from '@/features/services/useOperationalServiceOrders';
import {
  buildSchedulingPageData,
  type SchedulingPageFilters,
} from '@/features/operations/scheduling/useSchedulingPageData';

function buildBuilding(overrides: Partial<Building> = {}): Building {
  return {
    id: 'building-1',
    name: 'Torre Norte',
    group: 'A',
    type: 'EDIFICIO',
    delegateName: 'Ana',
    delegatePhone: '300',
    nit: '900',
    email: 'ana@example.com',
    billingEmail: 'billing@example.com',
    porterPhone: '301',
    managementCompanyId: 'management-1',
    addressText: 'Calle 1',
    location: { lat: 0, lng: 0 },
    googlePlaceId: 'place-1',
    ...overrides,
  };
}

function buildTechnician(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'tech-1',
    fullName: 'Laura Técnica',
    phone: '300',
    email: 'laura@example.com',
    role: 'technician',
    active: true,
    ...overrides,
  };
}

function buildOrder(overrides: Partial<OperationalServiceOrder> = {}): OperationalServiceOrder {
  return {
    id: 'so-1',
    buildingId: 'building-1',
    title: 'Mantenimiento de bomba',
    description: '',
    type: 'maintenance',
    priority: 'high',
    status: 'scheduled',
    scheduledStartAt: '2026-05-12T13:00:00.000Z',
    scheduledEndAt: '2026-05-12T14:00:00.000Z',
    assignedTechnicianId: 'tech-1',
    recurrence: null,
    seriesId: null,
    issues: [],
    attachments: [],
    completionPhotos: [],
    quoteVersions: [],
    timeline: [],
    ...overrides,
  } as OperationalServiceOrder;
}

const baseFilters: SchedulingPageFilters = {
  technicianId: '',
  buildingId: '',
  status: '',
  type: '',
  priority: '',
  from: '',
  to: '',
};

describe('useSchedulingPageData selectors', () => {
  it('builds calendar events and grouped sidebar items with building/technician context', () => {
    const result = buildSchedulingPageData({
      serviceOrders: [buildOrder()],
      buildings: [buildBuilding()],
      technicians: [buildTechnician()],
      filters: baseFilters,
    });

    expect(result.calendarEvents).toEqual([
      expect.objectContaining({
        id: 'so-1',
        title: 'Mantenimiento de bomba',
        buildingName: 'Torre Norte',
        technicianName: 'Laura Técnica',
      }),
    ]);

    expect(result.sidebarGroups).toEqual([
      expect.objectContaining({
        date: '2026-05-12',
        items: [expect.objectContaining({ id: 'so-1' })],
      }),
    ]);
  });

  it('filters by technician, building, status, type, priority and date range', () => {
    const result = buildSchedulingPageData({
      serviceOrders: [
        buildOrder(),
        buildOrder({
          id: 'so-2',
          buildingId: 'building-2',
          assignedTechnicianId: 'tech-2',
          status: 'unassigned',
          type: 'inspection',
          priority: 'medium',
          scheduledStartAt: '2026-05-13T09:00:00.000Z',
          scheduledEndAt: '2026-05-13T10:00:00.000Z',
        }),
      ],
      buildings: [buildBuilding(), buildBuilding({ id: 'building-2', name: 'Torre Sur' })],
      technicians: [buildTechnician(), buildTechnician({ id: 'tech-2', fullName: 'Carlos Técnico' })],
      filters: {
        technicianId: 'tech-2',
        buildingId: 'building-2',
        status: 'unassigned',
        type: 'inspection',
        priority: 'medium',
        from: '2026-05-13',
        to: '2026-05-13',
      },
    });

    expect(result.filteredOrders.map((item) => item.id)).toEqual(['so-2']);
  });

  it('marks conflicting events and exposes summary counters', () => {
    const result = buildSchedulingPageData({
      serviceOrders: [
        buildOrder(),
        buildOrder({
          id: 'so-2',
          title: 'Lavado de tanque',
          scheduledStartAt: '2026-05-12T13:30:00.000Z',
          scheduledEndAt: '2026-05-12T14:30:00.000Z',
        }),
      ],
      buildings: [buildBuilding()],
      technicians: [buildTechnician()],
      filters: baseFilters,
    });

    expect(result.summary).toEqual({
      total: 2,
      scheduled: 2,
      unassigned: 0,
      conflicts: 2,
    });
    expect(result.calendarEvents.every((event) => event.hasConflict)).toBe(true);
  });
});
