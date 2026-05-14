import { describe, expect, it } from 'vitest';

import { buildPrintableServiceReportModel } from '@/features/services/serviceReport';
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

describe('buildPrintableServiceReportModel', () => {
  it('derives printable report fields and narrative from the canonical service report snapshot', () => {
    const serviceOrder = {
      id: 'so-print-001',
      accountId: 'account-1',
      administrationId: 'admin-1',
      customerId: 'customer-1',
      buildingId: 'building-1',
      buildingName: 'Torre Norte',
      customerName: 'Administración Norte',
      title: 'Mantenimiento bomba principal',
      description: 'Servicio preventivo mensual',
      type: 'preventive',
      priority: 'high' as const,
      status: 'completed' as const,
      scheduledStartAt: '2026-05-13T13:00:00.000Z',
      scheduledEndAt: '2026-05-13T14:30:00.000Z',
      assignedTechnicianId: 'tech-1',
      assignedTechnicianName: 'Ana Técnica',
      attachments: ['https://example.com/report.pdf'],
      completionPhotos: ['https://example.com/photo-1.jpg', 'https://example.com/photo-2.jpg'],
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
      createdAt: '2026-05-12T10:00:00.000Z',
      updatedAt: '2026-05-13T15:05:00.000Z',
    };

    const printable = buildPrintableServiceReportModel(serviceOrder, t);
    const canonicalSnapshot = buildServiceReportSnapshot(serviceOrder, { t });

    expect(printable.snapshot).toEqual(canonicalSnapshot);
    expect(printable.summary).toEqual({
      title: canonicalSnapshot.service.title,
      statusLabel: canonicalSnapshot.service.statusLabel,
      scheduledStartAt: canonicalSnapshot.schedule.scheduledStartAt,
      scheduledEndAt: canonicalSnapshot.schedule.scheduledEndAt,
      photoCount: canonicalSnapshot.photoCount,
      issueCount: canonicalSnapshot.issueCount,
      attachmentCount: canonicalSnapshot.attachmentCount,
    });
    expect(printable.photos).toEqual(canonicalSnapshot.evidence.photos);
    expect(printable.attachments).toEqual(canonicalSnapshot.evidence.attachments);
    expect(printable.reportText).toContain('Servicio: Mantenimiento bomba principal');
    expect(printable.reportText).toContain('Tipo: Preventivo');
    expect(printable.reportText).toContain('Estado: Completado');
    expect(printable.reportText).toContain('Observaciones: Operación estable después de limpieza.');
    expect(printable.reportText).toContain('Checklist: Pressure: OK, Noise: Regular');
    expect(printable.reportText).toContain('Detalle de novedades: Fuga/Cuarto de bombas');
  });
});
