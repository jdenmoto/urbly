import { beforeEach, describe, expect, it, vi } from 'vitest';

const { updateDocById } = vi.hoisted(() => ({
  updateDocById: vi.fn(),
}));

vi.mock('@/lib/api/firestore', () => ({
  createDoc: vi.fn(),
  updateDocById,
  deleteDocById: vi.fn(),
  listDocs: vi.fn(),
  filters: vi.fn(),
}));

import type { ServiceOrder } from '@/core/models/serviceOrder';
import {
  completeServiceOrderWithReport,
  reopenServiceOrder,
  validateServiceOrderCloseout,
} from '@/lib/api/serviceOrders';

function serviceOrder(overrides: Partial<ServiceOrder> = {}): ServiceOrder {
  return {
    id: 'so-closeout-1',
    buildingId: 'building-1',
    title: 'Mantenimiento bomba',
    type: 'maintenance',
    priority: 'high',
    status: 'in_progress',
    scheduledStartAt: '2026-05-01T13:00:00.000Z',
    scheduledEndAt: '2026-05-01T14:00:00.000Z',
    assignedTechnicianId: 'tech-1',
    timeline: [],
    issues: [],
    completionPhotos: [],
    ...overrides,
  };
}

const validReport = {
  entryHour: '08:00',
  exitHour: '09:30',
  observations: ' Operación estable después de mantenimiento. ',
  checklist: {
    pressure: 'ok' as const,
    noise: 'regular' as const,
  },
};

describe('canonical service order closeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T10:00:00.000Z'));
    updateDocById.mockReset();
  });

  it('rejects invalid closeouts before writing', async () => {
    expect(validateServiceOrderCloseout({
      serviceOrder: serviceOrder({ status: 'scheduled' }),
      report: validReport,
      completionPhotos: ['photo-1'],
    })).toEqual(['invalid_status']);

    expect(validateServiceOrderCloseout({
      serviceOrder: serviceOrder(),
      report: { ...validReport, checklist: {} },
      completionPhotos: ['photo-1'],
    })).toEqual(['missing_checklist']);

    expect(validateServiceOrderCloseout({
      serviceOrder: serviceOrder(),
      report: validReport,
      completionPhotos: [],
    })).toEqual(['missing_completion_photos']);

    expect(validateServiceOrderCloseout({
      serviceOrder: serviceOrder(),
      report: { ...validReport, observations: '   ' },
      completionPhotos: ['photo-1'],
    })).toEqual(['missing_observations']);

    await expect(completeServiceOrderWithReport({
      serviceOrder: serviceOrder(),
      report: { ...validReport, observations: '' },
      completionPhotos: ['photo-1'],
      actorId: 'tech-1',
    })).rejects.toThrow('missing_observations');
    expect(updateDocById).not.toHaveBeenCalled();
  });

  it('completes with report, evidence, timeline and audit-safe fields', async () => {
    await completeServiceOrderWithReport({
      serviceOrder: serviceOrder({
        timeline: [
          {
            id: 'started-1',
            type: 'started',
            createdAt: '2026-05-01T09:00:00.000Z',
            actorRole: 'technician',
            actorId: 'tech-1',
            summary: 'Servicio iniciado en campo',
          },
        ],
      }),
      report: validReport,
      completionPhotos: ['photo-1', 'photo-2'],
      issues: [
        {
          id: 'issue-1',
          type: 'leak',
          category: 'pump_room',
          description: ' Goteo menor corregido ',
          photos: ['issue-photo-1'],
        },
      ],
      actorId: 'tech-1',
      note: 'Cierre validado por técnico',
    });

    expect(updateDocById).toHaveBeenCalledWith(
      'service_orders',
      'so-closeout-1',
      expect.objectContaining({
        status: 'completed',
        completedAt: '2026-05-01T10:00:00.000Z',
        updatedAt: '2026-05-01T10:00:00.000Z',
        completionPhotos: ['photo-1', 'photo-2'],
        report: {
          ...validReport,
          observations: 'Operación estable después de mantenimiento.',
        },
        issues: [
          expect.objectContaining({
            id: 'issue-1',
            description: 'Goteo menor corregido',
            createdAt: '2026-05-01T10:00:00.000Z',
          }),
        ],
        timeline: [
          expect.objectContaining({ type: 'started' }),
          expect.objectContaining({
            type: 'completed',
            actorRole: 'technician',
            actorId: 'tech-1',
            summary: 'Servicio completado con reporte técnico',
            metadata: { note: 'Cierre validado por técnico' },
            createdAt: '2026-05-01T10:00:00.000Z',
          }),
        ],
      }),
    );
  });

  it('reopens completed orders only for privileged roles with timeline audit', async () => {
    await reopenServiceOrder({
      serviceOrder: serviceOrder({
        status: 'completed',
        completedAt: '2026-05-01T10:00:00.000Z',
        timeline: [],
      }),
      actorId: 'supervisor-1',
      actorRole: 'supervisor',
      reason: 'Falta validar una observación del cliente',
    });

    expect(updateDocById).toHaveBeenCalledWith(
      'service_orders',
      'so-closeout-1',
      expect.objectContaining({
        status: 'in_progress',
        completedAt: null,
        review: expect.objectContaining({
          status: 'changes_requested',
          feedback: 'Falta validar una observación del cliente',
        }),
        timeline: [
          expect.objectContaining({
            type: 'resumed',
            actorRole: 'company',
            actorId: 'supervisor-1',
            summary: 'Servicio reabierto para ajustes de cierre',
            metadata: {
              resumedAt: '2026-05-01T10:00:00.000Z',
              note: 'Falta validar una observación del cliente',
            },
          }),
        ],
      }),
    );

    await expect(reopenServiceOrder({
      serviceOrder: serviceOrder({ status: 'completed' }),
      actorId: 'tech-1',
      actorRole: 'technician',
      reason: 'Intento técnico',
    })).rejects.toThrow('unauthorized_reopen');
  });
});
