import { describe, expect, it } from 'vitest';

import { buildServiceReportSnapshot } from '@/features/services/serviceReportSnapshot';
import { buildServiceReportPdfModel } from '../functions/src/serviceReportPdfModel';

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

describe('service report PDF model', () => {
  it('deriva sus campos desde el contrato del snapshot canónico', () => {
    const serviceOrder = {
      id: 'so-pdf-001',
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
      assignedTechnicianId: 'tech-1',
      assignedTechnicianName: 'Ana Técnica',
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
      createdAt: '2026-05-12T10:00:00.000Z',
      updatedAt: '2026-05-13T15:05:00.000Z',
    };

    const snapshot = buildServiceReportSnapshot(serviceOrder, { t });
    const pdfModel = buildServiceReportPdfModel(serviceOrder, { t });

    expect(pdfModel.snapshot).toEqual(snapshot);
    expect(pdfModel.title).toBe(snapshot.service.title);
    expect(pdfModel.summaryRows).toEqual([
      ['Tipo', snapshot.service.typeLabel],
      ['Estado', snapshot.service.statusLabel],
      ['Prioridad', snapshot.service.priorityLabel],
      ['Inicio', snapshot.schedule.scheduledStartAt],
      ['Fin', snapshot.schedule.scheduledEndAt],
      ['Técnico', 'Ana Técnica'],
      ['Fotos', '1'],
      ['Adjuntos', '1'],
    ]);
    expect(pdfModel.description).toBe(snapshot.service.description);
    expect(pdfModel.operationalRows).toEqual([
      ['Hora entrada', snapshot.results.entryHour],
      ['Hora salida', snapshot.results.exitHour],
      ['Observaciones', snapshot.observations],
    ]);
    expect(pdfModel.checklist).toEqual(snapshot.results.checklist.map((item) => `${item.label}: ${item.valueLabel}`));
    expect(pdfModel.issues).toEqual(snapshot.issues.map((issue) => `${issue.typeLabel} / ${issue.categoryLabel}: ${issue.description}`));
    expect(pdfModel.nextSteps).toEqual(snapshot.nextSteps);
  });
});
