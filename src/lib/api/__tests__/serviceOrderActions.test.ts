import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createDoc, updateDocById, deleteDocById } = vi.hoisted(() => ({
  createDoc: vi.fn(),
  updateDocById: vi.fn(),
  deleteDocById: vi.fn(),
}));

vi.mock('@/lib/api/firestore', () => ({
  createDoc,
  updateDocById,
  deleteDocById,
  listDocs: vi.fn(),
  filters: vi.fn(),
}));

import type { ServiceOrder } from '@/core/models/serviceOrder';
import {
  assignTechnician,
  completeServiceOrder,
  confirmServiceOrder,
  createDraftServiceOrder,
  markServiceInProgress,
  pauseServiceOrder,
  reportServiceIssue,
  rescheduleServiceOrder,
  resumeServiceOrder,
  scheduleServiceOrder,
  updateSeriesScope,
} from '@/lib/api/serviceOrders';

function buildServiceOrder(overrides: Partial<ServiceOrder> = {}): ServiceOrder {
  return {
    id: 'so-1',
    buildingId: 'building-1',
    title: 'Mantenimiento bomba',
    type: 'maintenance',
    priority: 'high',
    status: 'scheduled',
    scheduledStartAt: '2026-05-01T13:00:00.000Z',
    scheduledEndAt: '2026-05-01T14:00:00.000Z',
    assignedTechnicianId: 'tech-1',
    timeline: [],
    pauseHistory: [],
    assignmentHistory: [],
    rescheduleHistory: [],
    issues: [],
    ...overrides,
  };
}

describe('service order semantic actions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T10:00:00.000Z'));
    createDoc.mockReset();
    updateDocById.mockReset();
    deleteDocById.mockReset();
  });

  it('creates draft service orders with semantic defaults', async () => {
    await createDraftServiceOrder({
      buildingId: 'building-1',
      title: 'Visita técnica',
      description: 'Diagnóstico inicial',
      type: 'inspection',
      scheduledStartAt: '2026-05-02T09:00:00.000Z',
      scheduledEndAt: '2026-05-02T10:00:00.000Z',
    });

    expect(createDoc).toHaveBeenCalledWith(
      'service_orders',
      expect.objectContaining({
        buildingId: 'building-1',
        status: 'draft',
        assignedTechnicianId: null,
        seriesId: null,
        timeline: [
          expect.objectContaining({
            type: 'created',
            actorRole: 'company',
            summary: 'Service order creada en borrador',
          }),
        ],
      }),
    );
  });

  it('schedules a service order using explicit business semantics', async () => {
    const serviceOrder = buildServiceOrder({ status: 'draft', assignedTechnicianId: null });

    await scheduleServiceOrder({
      serviceOrder,
      scheduledStartAt: '2026-05-03T15:00:00.000Z',
      scheduledEndAt: '2026-05-03T16:30:00.000Z',
      assignedTechnicianId: 'tech-9',
      actorId: 'scheduler-1',
    });

    expect(updateDocById).toHaveBeenCalledWith(
      'service_orders',
      'so-1',
      expect.objectContaining({
        status: 'scheduled',
        assignedTechnicianId: 'tech-9',
        scheduledStartAt: '2026-05-03T15:00:00.000Z',
        scheduledEndAt: '2026-05-03T16:30:00.000Z',
        timeline: expect.arrayContaining([
          expect.objectContaining({
            type: 'scheduled',
            actorId: 'scheduler-1',
          }),
        ]),
      }),
    );
  });

  it('captures reassignment reasons in assignment history and timeline', async () => {
    const serviceOrder = buildServiceOrder({ timeline: [], assignmentHistory: [] });

    await assignTechnician({
      serviceOrder,
      technicianId: 'tech-2',
      reason: 'Cobertura por urgencia',
      note: 'Reasignado por prioridad del edificio',
      actorId: 'scheduler-2',
    });

    expect(updateDocById).toHaveBeenCalledWith(
      'service_orders',
      'so-1',
      expect.objectContaining({
        assignedTechnicianId: 'tech-2',
        reassignmentReason: 'Cobertura por urgencia',
        assignmentHistory: [
          expect.objectContaining({
            previousTechnicianId: 'tech-1',
            nextTechnicianId: 'tech-2',
            reason: 'Cobertura por urgencia',
          }),
        ],
        timeline: [
          expect.objectContaining({
            type: 'reassigned',
            metadata: expect.objectContaining({
              reason: 'Cobertura por urgencia',
              previousTechnicianId: 'tech-1',
              nextTechnicianId: 'tech-2',
            }),
          }),
        ],
      }),
    );
  });

  it('records reschedules with reason and resulting status', async () => {
    const serviceOrder = buildServiceOrder({ status: 'requires_reschedule', assignedTechnicianId: null, timeline: [], rescheduleHistory: [] });

    await rescheduleServiceOrder({
      serviceOrder,
      scheduledStartAt: '2026-05-04T08:00:00.000Z',
      scheduledEndAt: '2026-05-04T09:00:00.000Z',
      assignedTechnicianId: null,
      reason: 'Portería solo habilita ingreso en la mañana',
      actorId: 'operator-1',
    });

    expect(updateDocById).toHaveBeenCalledWith(
      'service_orders',
      'so-1',
      expect.objectContaining({
        status: 'unassigned',
        rescheduleReason: 'Portería solo habilita ingreso en la mañana',
        rescheduleHistory: [
          expect.objectContaining({
            previousStartAt: '2026-05-01T13:00:00.000Z',
            nextStartAt: '2026-05-04T08:00:00.000Z',
          }),
        ],
        timeline: [
          expect.objectContaining({
            type: 'rescheduled',
            metadata: expect.objectContaining({
              reason: 'Portería solo habilita ingreso en la mañana',
            }),
          }),
        ],
      }),
    );
  });

  it('starts, pauses and resumes execution with audit fields', async () => {
    const scheduledOrder = buildServiceOrder({ status: 'scheduled', timeline: [] });
    await markServiceInProgress({ serviceOrder: scheduledOrder, actorId: 'tech-1' });

    expect(updateDocById).toHaveBeenNthCalledWith(
      1,
      'service_orders',
      'so-1',
      expect.objectContaining({
        status: 'in_progress',
        startedAt: '2026-05-01T10:00:00.000Z',
        timeline: [expect.objectContaining({ type: 'started', actorId: 'tech-1' })],
      }),
    );

    const inProgressOrder = buildServiceOrder({ status: 'in_progress', startedAt: '2026-05-01T10:00:00.000Z', timeline: [], pauseHistory: [] });
    await pauseServiceOrder({ serviceOrder: inProgressOrder, reason: 'Esperando llave', actorId: 'tech-1' });

    expect(updateDocById).toHaveBeenNthCalledWith(
      2,
      'service_orders',
      'so-1',
      expect.objectContaining({
        status: 'paused',
        pausedAt: '2026-05-01T10:00:00.000Z',
        pauseReason: 'Esperando llave',
        pauseHistory: [expect.objectContaining({ reason: 'Esperando llave' })],
      }),
    );

    const pausedOrder = buildServiceOrder({
      status: 'paused',
      pausedAt: '2026-05-01T10:00:00.000Z',
      pauseReason: 'Esperando llave',
      timeline: [],
      pauseHistory: [{ pausedAt: '2026-05-01T10:00:00.000Z', reason: 'Esperando llave' }],
    });
    await resumeServiceOrder({ serviceOrder: pausedOrder, actorId: 'tech-1' });

    expect(updateDocById).toHaveBeenNthCalledWith(
      3,
      'service_orders',
      'so-1',
      expect.objectContaining({
        status: 'in_progress',
        pausedAt: null,
        pauseReason: null,
        pauseHistory: [expect.objectContaining({ resumedAt: '2026-05-01T10:00:00.000Z' })],
        timeline: [expect.objectContaining({ type: 'resumed' })],
      }),
    );
  });

  it('confirms scheduled orders before execution', async () => {
    const serviceOrder = buildServiceOrder({ status: 'scheduled', timeline: [] });

    await confirmServiceOrder({
      serviceOrder,
      actorId: 'scheduler-1',
      note: 'Cliente confirmó la ventana operativa',
    });

    expect(updateDocById).toHaveBeenCalledWith(
      'service_orders',
      'so-1',
      expect.objectContaining({
        status: 'confirmed',
        timeline: [
          expect.objectContaining({ type: 'confirmed', actorId: 'scheduler-1' }),
          expect.objectContaining({ type: 'note' }),
        ],
      }),
    );
  });

  it('reports issues with explicit operational outcome', async () => {
    const serviceOrder = buildServiceOrder({ status: 'in_progress', timeline: [], issues: [] });

    await reportServiceIssue({
      serviceOrder,
      outcome: 'pending_review',
      issue: {
        id: 'issue-1',
        type: 'damage',
        category: 'critical',
        description: 'Se detecta fuga en la bomba',
        photos: ['photo-1'],
      },
      actorId: 'tech-1',
      note: 'Se requiere validación interna',
    });

    expect(updateDocById).toHaveBeenCalledWith(
      'service_orders',
      'so-1',
      expect.objectContaining({
        status: 'pending_review',
        issues: [expect.objectContaining({ id: 'issue-1' })],
        timeline: [
          expect.objectContaining({ type: 'issue_added' }),
          expect.objectContaining({ type: 'pending_review' }),
        ],
      }),
    );
  });

  it('completes orders, preserves cancellation helper, and updates series scope', async () => {
    const serviceOrder = buildServiceOrder({ status: 'in_progress', timeline: [] });

    await completeServiceOrder({ serviceOrder, actorId: 'tech-1', note: 'Checklist completo' });
    expect(updateDocById).toHaveBeenNthCalledWith(
      1,
      'service_orders',
      'so-1',
      expect.objectContaining({
        status: 'completed',
        completedAt: '2026-05-01T10:00:00.000Z',
        timeline: [expect.objectContaining({ type: 'completed' })],
      }),
    );

    await updateSeriesScope({
      serviceOrderId: 'so-1',
      scope: 'future',
      seriesId: 'series-1',
      recurrence: 'weekly',
      actorId: 'scheduler-1',
    });

    expect(updateDocById).toHaveBeenNthCalledWith(
      2,
      'service_orders',
      'so-1',
      expect.objectContaining({
        seriesId: 'series-1',
        recurrence: 'weekly',
        seriesScope: 'future',
      }),
    );
  });
});
