import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase-functions/v2/https', () => {
  class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return { HttpsError, onCall: (handler: unknown) => handler };
});

vi.mock('../../functions/src/admin', () => ({ db: {} }));

import { buildClientPortalServiceRequestPayload } from '../../functions/src/clientPortal';

describe('client portal requests', () => {
  it('builds an unassigned service request inside the validated token scope', () => {
    const payload = buildClientPortalServiceRequestPayload({
      scope: {
        accountId: 'account-1',
        buildingId: 'building-1',
        customerId: 'customer-1',
        managementCompanyId: 'management-1'
      },
      sourceServiceOrderId: 'source-service-1',
      title: 'Fuga en cuarto de bombas',
      description: 'Se detectó humedad constante junto al tablero.',
      priority: 'high',
      requestedForAt: '2026-05-20T14:30:00.000Z',
      now: '2026-05-13T20:00:00.000Z'
    });

    expect(payload).toMatchObject({
      accountId: 'account-1',
      buildingId: 'building-1',
      customerId: 'customer-1',
      managementCompanyId: 'management-1',
      sourceServiceOrderId: 'source-service-1',
      dataSource: 'service_order',
      title: 'Fuga en cuarto de bombas',
      description: 'Se detectó humedad constante junto al tablero.',
      type: 'client_request',
      priority: 'high',
      status: 'unassigned',
      assignedTechnicianId: null,
      scheduledStartAt: '2026-05-20T14:30:00.000Z',
      scheduledEndAt: '2026-05-20T15:30:00.000Z',
      requestedBy: 'client_portal',
      requestedAt: '2026-05-13T20:00:00.000Z',
      updatedAt: '2026-05-13T20:00:00.000Z'
    });
    expect(payload.timeline).toEqual([
      expect.objectContaining({
        type: 'created',
        actorRole: 'client',
        createdAt: '2026-05-13T20:00:00.000Z',
        summary: 'Solicitud creada desde portal cliente'
      })
    ]);
  });

  it('sanitizes client input and defaults invalid priority/date safely', () => {
    const payload = buildClientPortalServiceRequestPayload({
      scope: {
        accountId: 'account-1',
        buildingId: 'building-1',
        customerId: 'customer-1'
      },
      sourceServiceOrderId: 'source-service-1',
      title: '  ',
      description: '  detalle  ',
      priority: 'critical',
      requestedForAt: 'not-a-date',
      now: '2026-05-13T20:00:00.000Z'
    });

    expect(payload.title).toBe('Solicitud de servicio del cliente');
    expect(payload.description).toBe('detalle');
    expect(payload.priority).toBe('medium');
    expect(payload.scheduledStartAt).toBe('2026-05-13T20:00:00.000Z');
    expect(payload.scheduledEndAt).toBe('2026-05-13T21:00:00.000Z');
    expect(payload).not.toHaveProperty('managementCompanyId');
  });
});
