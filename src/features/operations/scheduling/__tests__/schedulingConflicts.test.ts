import { describe, expect, it } from 'vitest';

import {
  detectSchedulingConflicts,
  hasSchedulingOverlap,
  type SchedulableServiceOrderLike,
} from '@/features/operations/scheduling/schedulingConflicts';

function buildOrder(overrides: Partial<SchedulableServiceOrderLike> = {}): SchedulableServiceOrderLike {
  return {
    id: 'so-1',
    title: 'Mantenimiento',
    assignedTechnicianId: 'tech-1',
    scheduledStartAt: '2026-05-06T13:00:00.000Z',
    scheduledEndAt: '2026-05-06T14:00:00.000Z',
    status: 'scheduled',
    ...overrides,
  };
}

describe('scheduling conflict helpers', () => {
  it('detects real overlaps for the same technician', () => {
    expect(
      hasSchedulingOverlap(
        {
          scheduledStartAt: '2026-05-06T13:00:00.000Z',
          scheduledEndAt: '2026-05-06T14:00:00.000Z',
        },
        {
          scheduledStartAt: '2026-05-06T13:30:00.000Z',
          scheduledEndAt: '2026-05-06T14:30:00.000Z',
        },
      ),
    ).toBe(true);

    expect(
      hasSchedulingOverlap(
        {
          scheduledStartAt: '2026-05-06T13:00:00.000Z',
          scheduledEndAt: '2026-05-06T14:00:00.000Z',
        },
        {
          scheduledStartAt: '2026-05-06T14:00:00.000Z',
          scheduledEndAt: '2026-05-06T15:00:00.000Z',
        },
      ),
    ).toBe(false);
  });

  it('returns block conflicts when override is not allowed', () => {
    const result = detectSchedulingConflicts({
      serviceOrders: [buildOrder()],
      technicianId: 'tech-1',
      scheduledStartAt: '2026-05-06T13:30:00.000Z',
      scheduledEndAt: '2026-05-06T14:30:00.000Z',
      overrideAllowed: false,
    });

    expect(result.hasConflicts).toBe(true);
    expect(result.uiState).toBe('block');
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]).toEqual(
      expect.objectContaining({
        id: 'so-1',
        overlapMinutes: 30,
      }),
    );
  });

  it('upgrades overlapping conflicts to override-needed when policy allows it', () => {
    const result = detectSchedulingConflicts({
      serviceOrders: [buildOrder()],
      technicianId: 'tech-1',
      scheduledStartAt: '2026-05-06T13:15:00.000Z',
      scheduledEndAt: '2026-05-06T14:15:00.000Z',
      overrideAllowed: true,
    });

    expect(result.hasConflicts).toBe(true);
    expect(result.uiState).toBe('override_needed');
    expect(result.conflicts[0]?.overlapMinutes).toBe(45);
  });

  it('returns warning for tight back-to-back load when buffer is violated', () => {
    const result = detectSchedulingConflicts({
      serviceOrders: [buildOrder()],
      technicianId: 'tech-1',
      scheduledStartAt: '2026-05-06T14:10:00.000Z',
      scheduledEndAt: '2026-05-06T15:10:00.000Z',
      minimumGapMinutes: 15,
    });

    expect(result.hasConflicts).toBe(false);
    expect(result.uiState).toBe('warning');
    expect(result.warnings).toEqual([
      expect.objectContaining({
        type: 'tight_turnaround',
        gapMinutes: 10,
      }),
    ]);
  });

  it('ignores the current service order, other technicians, and terminal statuses', () => {
    const result = detectSchedulingConflicts({
      serviceOrders: [
        buildOrder({ id: 'so-1' }),
        buildOrder({ id: 'so-2', assignedTechnicianId: 'tech-2' }),
        buildOrder({ id: 'so-3', status: 'completed' }),
        buildOrder({ id: 'so-4', status: 'cancelled' }),
      ],
      serviceOrderId: 'so-1',
      technicianId: 'tech-1',
      scheduledStartAt: '2026-05-06T13:30:00.000Z',
      scheduledEndAt: '2026-05-06T14:30:00.000Z',
    });

    expect(result.hasConflicts).toBe(false);
    expect(result.uiState).toBe('clear');
    expect(result.conflicts).toEqual([]);
  });
});
