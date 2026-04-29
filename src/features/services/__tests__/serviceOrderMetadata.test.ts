import { describe, expect, it } from 'vitest';

import type {
  ServiceOrder,
  ServiceOrderAssignmentRecord,
  ServiceOrderPauseRecord,
  ServiceOrderRescheduleRecord,
  ServiceOrderTimelineEvent,
} from '@/core/models/serviceOrder';

describe('service order operational metadata model', () => {
  it('supports execution timestamps and current pause metadata on the service order', () => {
    const serviceOrder: ServiceOrder = {
      id: 'so-1',
      buildingId: 'building-1',
      title: 'Mantenimiento bomba',
      type: 'maintenance',
      priority: 'high',
      status: 'paused',
      scheduledStartAt: '2026-04-29T13:00:00.000Z',
      scheduledEndAt: '2026-04-29T14:00:00.000Z',
      startedAt: '2026-04-29T13:05:00.000Z',
      pausedAt: '2026-04-29T13:25:00.000Z',
      pauseReason: 'Esperando acceso al cuarto técnico',
    };

    expect(serviceOrder.startedAt).toBe('2026-04-29T13:05:00.000Z');
    expect(serviceOrder.pausedAt).toBe('2026-04-29T13:25:00.000Z');
    expect(serviceOrder.pauseReason).toBe('Esperando acceso al cuarto técnico');
  });

  it('supports timeline-friendly pause, reassignment, and reschedule trails', () => {
    const pauseRecord: ServiceOrderPauseRecord = {
      pausedAt: '2026-04-29T13:25:00.000Z',
      reason: 'Esperando acceso al cuarto técnico',
      actorRole: 'technician',
      actorId: 'tech-1',
      resumedAt: '2026-04-29T13:40:00.000Z',
      note: 'Portería habilitó el ingreso',
    };

    const assignmentRecord: ServiceOrderAssignmentRecord = {
      changedAt: '2026-04-29T12:30:00.000Z',
      previousTechnicianId: 'tech-1',
      nextTechnicianId: 'tech-2',
      reason: 'Redistribución de carga por urgencia',
      actorRole: 'company',
      actorId: 'dispatcher-1',
    };

    const rescheduleRecord: ServiceOrderRescheduleRecord = {
      changedAt: '2026-04-29T12:00:00.000Z',
      previousStartAt: '2026-04-29T13:00:00.000Z',
      previousEndAt: '2026-04-29T14:00:00.000Z',
      nextStartAt: '2026-04-29T15:00:00.000Z',
      nextEndAt: '2026-04-29T16:00:00.000Z',
      reason: 'Cliente solicitó cambio de franja',
      actorRole: 'company',
    };

    const serviceOrder: ServiceOrder = {
      id: 'so-2',
      buildingId: 'building-1',
      title: 'Lavado de tanque',
      type: 'washing',
      priority: 'medium',
      status: 'scheduled',
      scheduledStartAt: '2026-04-29T15:00:00.000Z',
      scheduledEndAt: '2026-04-29T16:00:00.000Z',
      reassignmentReason: assignmentRecord.reason,
      rescheduleReason: rescheduleRecord.reason,
      pauseHistory: [pauseRecord],
      assignmentHistory: [assignmentRecord],
      rescheduleHistory: [rescheduleRecord],
    };

    expect(serviceOrder.pauseHistory?.[0]?.reason).toBe('Esperando acceso al cuarto técnico');
    expect(serviceOrder.assignmentHistory?.[0]?.nextTechnicianId).toBe('tech-2');
    expect(serviceOrder.rescheduleHistory?.[0]?.nextStartAt).toBe('2026-04-29T15:00:00.000Z');
  });

  it('supports optional reason metadata directly on timeline events for auditing', () => {
    const event: ServiceOrderTimelineEvent = {
      id: 'evt-1',
      type: 'rescheduled',
      createdAt: '2026-04-29T12:00:00.000Z',
      actorRole: 'company',
      summary: 'Servicio reprogramado para una nueva franja',
      metadata: {
        reason: 'Cliente solicitó cambio de franja',
        previousScheduledStartAt: '2026-04-29T13:00:00.000Z',
        nextScheduledStartAt: '2026-04-29T15:00:00.000Z',
      },
    };

    expect(event.metadata?.reason).toBe('Cliente solicitó cambio de franja');
    expect(event.metadata?.previousScheduledStartAt).toBe('2026-04-29T13:00:00.000Z');
  });

  it('supports cancellation reasons on the service order and cancelled timeline events', () => {
    const cancelledEvent: ServiceOrderTimelineEvent = {
      id: 'evt-2',
      type: 'cancelled',
      createdAt: '2026-04-29T12:45:00.000Z',
      actorRole: 'company',
      summary: 'Servicio cancelado por acceso restringido',
      metadata: {
        reason: 'Acceso restringido por administración',
        note: 'Reagendar cuando el edificio habilite el ingreso',
      },
    };

    const serviceOrder: ServiceOrder = {
      id: 'so-3',
      buildingId: 'building-1',
      title: 'Inspección cuarto de bombas',
      type: 'inspection',
      priority: 'medium',
      status: 'cancelled',
      scheduledStartAt: '2026-04-29T13:00:00.000Z',
      scheduledEndAt: '2026-04-29T14:00:00.000Z',
      cancelReason: 'Acceso restringido por administración',
      cancelNote: 'Reagendar cuando el edificio habilite el ingreso',
      timeline: [cancelledEvent],
    };

    expect(serviceOrder.cancelReason).toBe('Acceso restringido por administración');
    expect(serviceOrder.cancelNote).toBe('Reagendar cuando el edificio habilite el ingreso');

    const timelineEvent = serviceOrder.timeline?.[0];
    expect(timelineEvent?.type).toBe('cancelled');

    if (timelineEvent?.type !== 'cancelled') {
      throw new Error('Expected cancelled timeline event');
    }

    expect(timelineEvent.metadata.reason).toBe('Acceso restringido por administración');
  });
});
