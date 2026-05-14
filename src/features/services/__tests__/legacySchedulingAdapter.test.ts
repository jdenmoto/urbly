import { describe, expect, it } from 'vitest';

import type { ServiceOrder } from '@/core/models/serviceOrder';
import { mapServiceOrderToCloseoutItem } from '../legacySchedulingAdapter';

describe('legacy scheduling adapter for services', () => {
  it('maps a service order into the closeout item expected by the temporary legacy modal', () => {
    const serviceOrder: ServiceOrder = {
      id: 'so-legacy-1',
      buildingId: 'building-1',
      title: 'Mantenimiento de bombas',
      description: 'Cierre técnico desde services',
      type: 'maintenance',
      priority: 'high',
      status: 'in_progress',
      scheduledStartAt: '2026-05-13T14:00:00.000Z',
      scheduledEndAt: '2026-05-13T15:00:00.000Z',
      assignedTechnicianId: 'tech-1',
      completionPhotos: ['photo-1.jpg'],
      report: { observations: 'Operación normal' },
    };

    const closeoutItem = mapServiceOrderToCloseoutItem(serviceOrder);

    expect(closeoutItem).toMatchObject({
      id: 'so-legacy-1',
      source: 'service_order',
      sourceId: 'so-legacy-1',
      buildingId: 'building-1',
      title: 'Mantenimiento de bombas',
      status: 'confirmado',
      employeeId: 'tech-1',
      completionPhotos: ['photo-1.jpg'],
      completionReport: { observations: 'Operación normal' },
    });
  });
});
