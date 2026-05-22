import { describe, expect, it } from 'vitest';

import { buildServiceReportSnapshot } from '@/features/services/serviceReportSnapshot';
import { buildServiceReportPdfModel } from '../../../../functions/src/serviceReportPdfModel';

function t(key: string, params?: Record<string, string | number>) {
  const labels: Record<string, string> = {
    'services.status.completed': 'Completado',
    'services.status.draft': 'Borrador',
    'services.priority.high': 'Alta',
    'services.priority.medium': 'Media',
    'services.types.preventive': 'Preventivo',
    'services.types.unknown': 'Desconocido',
    'services.issue.types.leak': 'Fuga',
    'services.issue.types.unknown': 'Novedad',
    'services.issue.categories.pump_room': 'Cuarto de bombas',
    'services.issue.categories.unknown': 'Sin categoría',
  };

  return labels[key] ?? String(params?.defaultValue ?? key);
}

describe('service report snapshot contract', () => {
  it('keeps the frontend snapshot and functions PDF snapshot structurally aligned', () => {
    const serviceOrder = {
      id: 'so-contract-001',
      accountId: 'account-1',
      administrationId: 'admin-1',
      customerId: 'customer-1',
      buildingId: 'building-1',
      buildingName: 'Torre Norte',
      customerName: 'Administración Norte',
      title: 'Mantenimiento bomba principal',
      description: ' Servicio preventivo mensual ',
      type: 'preventive',
      priority: 'high' as const,
      status: 'completed' as const,
      scheduledStartAt: '2026-05-13T13:00:00.000Z',
      scheduledEndAt: '2026-05-13T14:30:00.000Z',
      startedAt: '2026-05-13T13:05:00.000Z',
      completedAt: '2026-05-13T14:20:00.000Z',
      assignees: [
        { id: 'tech-1', name: 'Ana Técnica', role: 'lead_technician' },
        { id: 'tech-2', name: 'Luis Técnico', role: 'technician' },
      ],
      attachments: ['https://example.com/report.pdf'],
      completionPhotos: ['https://example.com/photo-1.jpg'],
      report: {
        entryHour: '08:00',
        exitHour: '09:30',
        observations: '  Operación estable después de limpieza.  ',
        checklist: {
          pressure: 'ok' as const,
          noise: 'regular' as const,
        },
        recommendations: ['Mantener ventilación del cuarto técnico.'],
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
      },
      review: {
        status: 'approved',
        feedback: 'Aprobado por supervisión',
        reviewedAt: '2026-05-13T15:00:00.000Z',
      },
      createdAt: '2026-05-12T10:00:00.000Z',
      updatedAt: '2026-05-13T15:05:00.000Z',
    };

    const frontendSnapshot = buildServiceReportSnapshot(serviceOrder, { t });
    const functionsSnapshot = buildServiceReportPdfModel(serviceOrder, { t }).snapshot;

    expect(functionsSnapshot).toEqual(frontendSnapshot);
    expect(Object.keys(functionsSnapshot).sort()).toEqual(Object.keys(frontendSnapshot).sort());
    expect(functionsSnapshot.results.checklist).toEqual(frontendSnapshot.results.checklist);
    expect(functionsSnapshot.issues).toEqual(frontendSnapshot.issues);
  });

  it('preserves fallback defaults for degraded service order data across runtime targets', () => {
    const degradedServiceOrder = {
      id: 'so-contract-degraded',
      buildingId: '',
      title: '   ',
      description: '   ',
      type: '',
      priority: '' as 'medium',
      status: '' as 'draft',
      scheduledStartAt: '',
      scheduledEndAt: '',
      issues: [
        {
          id: '',
          type: '',
          category: '',
          description: '   ',
          photos: ['https://example.com/issue-photo.jpg', 10],
          createdAt: '',
        },
      ],
      attachments: ['https://example.com/report.pdf', 10],
      completionPhotos: ['https://example.com/photo.jpg', null],
      report: {
        observations: '   ',
        checklist: {
          unknown_value: 'needs_review',
        },
        nextSteps: '  Validar información faltante. ',
      },
    };

    const frontendSnapshot = buildServiceReportSnapshot(degradedServiceOrder, { t });
    const functionsSnapshot = buildServiceReportPdfModel(degradedServiceOrder, { t }).snapshot;

    expect(functionsSnapshot).toEqual(frontendSnapshot);
    expect(frontendSnapshot.service).toMatchObject({
      title: 'Servicio',
      description: '',
      type: 'unknown',
      typeLabel: 'Desconocido',
      priority: 'medium',
      priorityLabel: 'Media',
      status: 'draft',
      statusLabel: 'Borrador',
    });
    expect(frontendSnapshot.issues).toEqual([
      {
        id: null,
        type: 'unknown',
        typeLabel: 'Novedad',
        category: 'unknown',
        categoryLabel: 'Sin categoría',
        description: '',
        photos: ['https://example.com/issue-photo.jpg'],
        createdAt: null,
      },
    ]);
    expect(frontendSnapshot.evidence).toMatchObject({
      photos: ['https://example.com/photo.jpg'],
      attachments: ['https://example.com/report.pdf'],
      issuePhotoCount: 1,
    });
    expect(frontendSnapshot.nextSteps).toEqual(['Validar información faltante.']);
  });
});
