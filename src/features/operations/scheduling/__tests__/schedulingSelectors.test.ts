import { describe, expect, it } from 'vitest';

import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import {
  buildSchedulingPageData,
  getDefaultSelectedSchedulingEventId,
  type SchedulingPageFilters,
} from '@/features/operations/scheduling/useSchedulingPageData';
import type { OperationalServiceOrder } from '@/features/services/useOperationalServiceOrders';

const filters: SchedulingPageFilters = {
  technicianId: '',
  buildingId: '',
  status: '',
  type: '',
  priority: '',
  from: '',
  to: '',
};

const buildings: Building[] = [
  {
    id: 'building-1',
    name: 'Torre Norte',
    group: 'Residencial',
    type: 'EDIFICIO',
    delegateName: 'Carlos Pérez',
    delegatePhone: '3000000000',
    nit: '900000001',
    email: 'torre@example.com',
    billingEmail: 'facturacion@example.com',
    porterPhone: '3000000001',
    managementCompanyId: 'company-1',
    addressText: 'Calle 1',
    location: { lat: 4.6, lng: -74.08 },
    googlePlaceId: 'place-1',
    active: true,
    createdAt: '2026-04-01T10:00:00.000Z',
  },
];

const technicians: Employee[] = [
  {
    id: 'tech-1',
    fullName: 'Laura Gómez',
    email: 'laura@example.com',
    phone: '3000000000',
    role: 'technician',
    active: true,
  },
];

function buildOrder(overrides: Partial<OperationalServiceOrder>): OperationalServiceOrder {
  return {
    id: 'service-1',
    customerId: null,
    buildingId: 'building-1',
    contractId: null,
    title: 'Mantenimiento bomba',
    description: 'Chequeo preventivo',
    type: 'maintenance',
    priority: 'medium',
    status: 'scheduled',
    assignedTechnicianId: 'tech-1',
    scheduledStartAt: '2026-05-02T09:00:00.000Z',
    scheduledEndAt: '2026-05-02T10:00:00.000Z',
    startedAt: null,
    pausedAt: null,
    pauseReason: null,
    reassignmentReason: null,
    rescheduleReason: null,
    recurrence: null,
    seriesId: null,
    seriesAnchorStartAt: null,
    seriesOccurrenceIndex: null,
    seriesScope: null,
    checklist: undefined,
    issues: [],
    attachments: [],
    completionPhotos: [],
    report: undefined,
    communication: undefined,
    quoteVersions: [],
    review: undefined,
    timeline: [],
    pauseHistory: [],
    assignmentHistory: [],
    rescheduleHistory: [],
    cancelReason: null,
    cancelNote: null,
    completedAt: null,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
    ...overrides,
  } satisfies OperationalServiceOrder;
}

describe('scheduling selectors', () => {
  it('groups sidebar items by day and flags conflicts', () => {
    const data = buildSchedulingPageData({
      serviceOrders: [
        buildOrder({ id: 'service-1', title: 'Servicio A' }),
        buildOrder({
          id: 'service-2',
          title: 'Servicio B',
          scheduledStartAt: '2026-05-02T09:30:00.000Z',
          scheduledEndAt: '2026-05-02T11:00:00.000Z',
        }),
        buildOrder({
          id: 'service-3',
          title: 'Servicio C',
          assignedTechnicianId: null,
          status: 'unassigned',
          scheduledStartAt: '2026-05-03T08:00:00.000Z',
          scheduledEndAt: '2026-05-03T09:00:00.000Z',
        }),
      ],
      buildings,
      technicians,
      filters,
    });

    expect(data.calendarEvents).toHaveLength(3);
    expect(data.calendarEvents.find((event) => event.id === 'service-1')?.hasConflict).toBe(true);
    expect(data.calendarEvents.find((event) => event.id === 'service-2')?.hasConflict).toBe(true);
    expect(data.summary.conflicts).toBe(2);
    expect(data.sidebarGroups).toEqual([
      {
        date: '2026-05-02',
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'service-1' }),
          expect.objectContaining({ id: 'service-2' }),
        ]),
      },
      {
        date: '2026-05-03',
        items: [expect.objectContaining({ id: 'service-3', technicianName: 'Sin técnico' })],
      },
    ]);
  });

  it('chooses the current selected event and falls back safely', () => {
    const events = buildSchedulingPageData({
      serviceOrders: [
        buildOrder({ id: 'service-1' }),
        buildOrder({
          id: 'service-2',
          scheduledStartAt: '2026-05-02T11:00:00.000Z',
          scheduledEndAt: '2026-05-02T12:00:00.000Z',
        }),
      ],
      buildings,
      technicians,
      filters,
    }).calendarEvents;

    expect(getDefaultSelectedSchedulingEventId(events, null)).toBe('service-1');
    expect(getDefaultSelectedSchedulingEventId(events, 'service-2')).toBe('service-2');
    expect(getDefaultSelectedSchedulingEventId(events, 'missing')).toBe('service-1');
    expect(getDefaultSelectedSchedulingEventId([], 'missing')).toBeNull();
  });
});
