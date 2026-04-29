import { describe, expect, it } from 'vitest';

import {
  buildFastCreateServiceOrderDraft,
  fastCreateServiceOrderSchema,
} from '@/features/operations/scheduling/schedulingSchemas';

describe('schedulingSchemas', () => {
  it('requires the operational minimum fields', () => {
    const result = fastCreateServiceOrderSchema.safeParse({
      buildingId: '',
      type: '',
      scheduledStartAt: '',
      estimatedDurationMinutes: 0,
      assignedTechnicianId: '',
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected validation to fail');
    expect(result.error.flatten().fieldErrors.buildingId?.length).toBeGreaterThan(0);
    expect(result.error.flatten().fieldErrors.type?.length).toBeGreaterThan(0);
    expect(result.error.flatten().fieldErrors.scheduledStartAt?.length).toBeGreaterThan(0);
    expect(result.error.flatten().fieldErrors.estimatedDurationMinutes?.length).toBeGreaterThan(0);
  });

  it('computes scheduled status when a technician is provided', () => {
    const draft = buildFastCreateServiceOrderDraft({
      buildingId: 'building-1',
      type: 'maintenance',
      scheduledStartAt: '2026-05-02T09:00',
      estimatedDurationMinutes: 90,
      assignedTechnicianId: 'tech-1',
    });

    expect(draft.status).toBe('scheduled');
    expect(new Date(draft.scheduledEndAt).getTime() - new Date(draft.scheduledStartAt).getTime()).toBe(90 * 60 * 1000);
    expect(draft.title).toBe('Maintenance');
  });

  it('computes unassigned status when no technician is provided', () => {
    const draft = buildFastCreateServiceOrderDraft({
      buildingId: 'building-1',
      type: 'inspection',
      scheduledStartAt: '2026-05-02T09:00',
      estimatedDurationMinutes: 45,
      assignedTechnicianId: '',
    });

    expect(draft.status).toBe('unassigned');
    expect(draft.assignedTechnicianId).toBeNull();
    expect(new Date(draft.scheduledEndAt).getTime() - new Date(draft.scheduledStartAt).getTime()).toBe(45 * 60 * 1000);
  });
});
