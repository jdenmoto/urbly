import { describe, expect, it } from 'vitest';
import type { OperationalServiceOrder } from '@/features/services/useOperationalServiceOrders';
import { getTechnicianPrimaryOrder, isActiveTechnicianOrder, isOpenTechnicianOrder } from '../TechnicianHomePage';

function makeOrder(overrides: Partial<OperationalServiceOrder>): OperationalServiceOrder {
  return {
    id: overrides.id ?? 'service-1',
    buildingId: overrides.buildingId ?? 'building-1',
    title: overrides.title ?? 'Servicio programado',
    type: overrides.type ?? 'maintenance',
    priority: overrides.priority ?? 'medium',
    status: overrides.status ?? 'scheduled',
    scheduledStartAt: overrides.scheduledStartAt ?? '2026-05-13T15:00:00.000Z',
    scheduledEndAt: overrides.scheduledEndAt ?? '2026-05-13T16:00:00.000Z',
    assignedTechnicianId: overrides.assignedTechnicianId ?? 'employee-1',
    issues: overrides.issues ?? [],
    attachments: overrides.attachments ?? [],
    completionPhotos: overrides.completionPhotos ?? [],
    quoteVersions: overrides.quoteVersions ?? [],
    timeline: overrides.timeline ?? [],
  };
}

describe('TechnicianHomePage model', () => {
  it('detects open and active technician orders', () => {
    expect(isOpenTechnicianOrder({ status: 'scheduled' })).toBe(true);
    expect(isOpenTechnicianOrder({ status: 'cancelled' })).toBe(false);
    expect(isActiveTechnicianOrder({ status: 'in_progress' })).toBe(true);
    expect(isActiveTechnicianOrder({ status: 'paused' })).toBe(true);
    expect(isActiveTechnicianOrder({ status: 'scheduled' })).toBe(false);
  });

  it('prioritizes an active service over the next scheduled service', () => {
    const scheduled = makeOrder({ id: 'scheduled', status: 'scheduled', scheduledStartAt: '2026-05-13T10:00:00.000Z' });
    const active = makeOrder({ id: 'active', status: 'in_progress', scheduledStartAt: '2026-05-13T12:00:00.000Z' });

    expect(getTechnicianPrimaryOrder([scheduled, active])?.id).toBe('active');
  });

  it('falls back to the earliest open order and ignores closed services', () => {
    const completed = makeOrder({ id: 'completed', status: 'completed', scheduledStartAt: '2026-05-13T09:00:00.000Z' });
    const later = makeOrder({ id: 'later', status: 'scheduled', scheduledStartAt: '2026-05-13T12:00:00.000Z' });
    const earlier = makeOrder({ id: 'earlier', status: 'confirmed', scheduledStartAt: '2026-05-13T10:00:00.000Z' });

    expect(getTechnicianPrimaryOrder([completed, later, earlier])?.id).toBe('earlier');
  });
});
