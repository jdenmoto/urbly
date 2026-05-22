import { describe, expect, it } from 'vitest';

import { buildServiceReportSnapshot } from '@/features/services/serviceReportSnapshot';

function t(key: string, params?: Record<string, string | number>) {
  const labels: Record<string, string> = {
    'services.status.completed': 'Completado',
    'services.priority.high': 'Alta',
    'services.types.preventive': 'Preventivo',
    'services.issue.types.leak': 'Fuga',
    'services.issue.categories.pump_room': 'Cuarto de bombas',
  };

  return labels[key] ?? String(params?.defaultValue ?? key);
}

describe('buildServiceReportSnapshot', () => {
  it('builds a canonical deterministic report snapshot with service, context, results and evidence', () => {
    const snapshot = buildServiceReportSnapshot(
      {
        id: 'so-001',
        accountId: 'account-1',
        administrationId: 'admin-1',
        customerId: 'customer-1',
        buildingId: 'building-1',
        buildingName: 'Torre Norte',
        customerName: 'Administración Norte',
        title: 'Mantenimiento bomba principal',
        description: 'Servicio preventivo mensual',
        type: 'preventive',
        priority: 'high',
        status: 'completed',
        scheduledStartAt: '2026-05-13T13:00:00.000Z',
        scheduledEndAt: '2026-05-13T14:30:00.000Z',
        startedAt: '2026-05-13T13:05:00.000Z',
        completedAt: '2026-05-13T14:20:00.000Z',
        assignedTechnicianId: 'tech-1',
        assignedTechnicianName: 'Ana Técnica',
        attachments: ['https://example.com/report.pdf'],
        completionPhotos: ['https://example.com/photo-1.jpg', 'https://example.com/photo-2.jpg'],
        report: {
          entryHour: '08:00',
          exitHour: '09:30',
          observations: '  Operación estable después de limpieza.  ',
          checklist: {
            pressure: 'ok',
            noise: 'regular',
          },
        },
        issues: [
          {
            id: 'issue-1',
            type: 'leak',
            category: 'pump_room',
            description: 'Goteo menor corregido',
            photos: ['https://example.com/issue-photo.jpg'],
            createdAt: '2026-05-13T13:20:00.000Z',
          },
        ],
        communication: {
          followUpSuggestion: 'Revisar presión en la próxima visita.',
          customerMessage: 'Servicio terminado.',
        },
        review: {
          status: 'approved',
          feedback: 'Aprobado por supervisión',
          reviewedAt: '2026-05-13T15:00:00.000Z',
        },
        createdAt: '2026-05-12T10:00:00.000Z',
        updatedAt: '2026-05-13T15:05:00.000Z',
      },
      { t }
    );

    expect(snapshot.service).toEqual({
      id: 'so-001',
      title: 'Mantenimiento bomba principal',
      description: 'Servicio preventivo mensual',
      type: 'preventive',
      typeLabel: 'Preventivo',
      priority: 'high',
      priorityLabel: 'Alta',
      status: 'completed',
      statusLabel: 'Completado',
    });
    expect(snapshot.context).toEqual({
      accountId: 'account-1',
      administrationId: 'admin-1',
      customerId: 'customer-1',
      customerName: 'Administración Norte',
      buildingId: 'building-1',
      buildingName: 'Torre Norte',
    });
    expect(snapshot.schedule).toEqual({
      scheduledStartAt: '2026-05-13T13:00:00.000Z',
      scheduledEndAt: '2026-05-13T14:30:00.000Z',
      startedAt: '2026-05-13T13:05:00.000Z',
      completedAt: '2026-05-13T14:20:00.000Z',
    });
    expect(snapshot.assignees).toEqual([
      { id: 'tech-1', name: 'Ana Técnica', role: 'technician' },
    ]);
    expect(snapshot.results.checklist).toEqual([
      { key: 'pressure', label: 'Pressure', value: 'ok', valueLabel: 'OK' },
      { key: 'noise', label: 'Noise', value: 'regular', valueLabel: 'Regular' },
    ]);
    expect(snapshot.results.observations).toBe('Operación estable después de limpieza.');
    expect(snapshot.evidence).toMatchObject({
      photoCount: 2,
      attachmentCount: 1,
      issuePhotoCount: 1,
    });
    expect(snapshot.issues).toEqual([
      {
        id: 'issue-1',
        type: 'leak',
        typeLabel: 'Fuga',
        category: 'pump_room',
        categoryLabel: 'Cuarto de bombas',
        description: 'Goteo menor corregido',
        photos: ['https://example.com/issue-photo.jpg'],
        createdAt: '2026-05-13T13:20:00.000Z',
      },
    ]);
    expect(snapshot.nextSteps).toEqual(['Revisar presión en la próxima visita.']);
    expect(snapshot.timestamps).toEqual({
      createdAt: '2026-05-12T10:00:00.000Z',
      updatedAt: '2026-05-13T15:05:00.000Z',
      reviewedAt: '2026-05-13T15:00:00.000Z',
    });

    expect(snapshot.observations).toBe('Operación estable después de limpieza.');
    expect(snapshot.issueCount).toBe(1);
    expect(snapshot.attachmentCount).toBe(1);
    expect(snapshot.photoCount).toBe(2);
    expect(snapshot.checklistValues).toEqual(['ok', 'regular']);
  });

  it('normalizes missing optional report data without mutating the input', () => {
    const serviceOrder = {
      id: 'so-empty',
      buildingId: 'building-empty',
      title: 'Servicio sin cierre',
      type: 'corrective',
      priority: 'medium' as const,
      status: 'in_progress' as const,
      scheduledStartAt: '2026-05-13T13:00:00.000Z',
      scheduledEndAt: '2026-05-13T14:30:00.000Z',
      checklist: {
        general: 'malo' as const,
      },
      issues: null,
      attachments: null,
      completionPhotos: null,
      report: {
        observations: '   ',
        checklist: null,
      },
    };

    const before = JSON.stringify(serviceOrder);
    const snapshot = buildServiceReportSnapshot(serviceOrder);

    expect(JSON.stringify(serviceOrder)).toBe(before);
    expect(snapshot.context).toEqual({
      accountId: null,
      administrationId: null,
      customerId: null,
      customerName: null,
      buildingId: 'building-empty',
      buildingName: null,
    });
    expect(snapshot.results.observations).toBe('');
    expect(snapshot.results.checklist).toEqual([
      { key: 'general', label: 'General', value: 'malo', valueLabel: 'Malo' },
    ]);
    expect(snapshot.evidence).toEqual({
      photos: [],
      attachments: [],
      photoCount: 0,
      attachmentCount: 0,
      issuePhotoCount: 0,
    });
    expect(snapshot.issues).toEqual([]);
    expect(snapshot.nextSteps).toEqual([]);
    expect(snapshot.checklistValues).toEqual(['malo']);
  });
});
