import { describe, expect, it } from 'vitest';

import {
  SERVICE_ORDER_STATUSES,
  SERVICE_ORDER_TIMELINE_EVENT_TYPES,
  type ServiceOrderTimelineEvent,
} from '@/core/models/serviceOrder';
import { getServiceOrderStatusLabel, type TranslateFn } from '@/features/services/serviceOrderPresentation';

const translations: Record<string, string> = {
  'services.status.draft': 'Borrador',
  'services.status.unassigned': 'Sin asignar',
  'services.status.scheduled': 'Programado',
  'services.status.confirmed': 'Confirmado',
  'services.status.in.progress': 'En progreso',
  'services.status.paused': 'Pausado',
  'services.status.pending.review': 'Pendiente de revisión',
  'services.status.requires.reschedule': 'Requiere reprogramación',
  'services.status.completed': 'Completado',
  'services.status.cancelled': 'Cancelado',
};

const t: TranslateFn = (key) => translations[key] ?? key;

describe('service order operational state model', () => {
  it('includes the approved operational scheduling statuses', () => {
    expect(SERVICE_ORDER_STATUSES).toEqual(
      expect.arrayContaining(['unassigned', 'paused', 'pending_review', 'requires_reschedule']),
    );
  });

  it('maps the new operational statuses to first-class labels', () => {
    expect(getServiceOrderStatusLabel(t, 'unassigned')).toBe('Sin asignar');
    expect(getServiceOrderStatusLabel(t, 'paused')).toBe('Pausado');
    expect(getServiceOrderStatusLabel(t, 'pending_review')).toBe('Pendiente de revisión');
    expect(getServiceOrderStatusLabel(t, 'requires_reschedule')).toBe('Requiere reprogramación');
  });

  it('defines timeline event types for the approved execution and scheduling flows', () => {
    expect(SERVICE_ORDER_TIMELINE_EVENT_TYPES).toEqual(
      expect.arrayContaining([
        'started',
        'paused',
        'resumed',
        'pending_review',
        'requires_reschedule',
        'reassigned',
        'rescheduled',
      ]),
    );
  });

  it('accepts timeline events for the new operational flow milestones', () => {
    const event: ServiceOrderTimelineEvent = {
      id: 'evt-1',
      type: 'requires_reschedule',
      createdAt: '2026-04-28T21:00:00.000Z',
      actorRole: 'technician',
      summary: 'No fue posible completar el servicio y requiere reprogramación.',
    };

    expect(event.type).toBe('requires_reschedule');
  });
});
