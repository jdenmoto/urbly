import { describe, expect, it } from 'vitest';

import type { ServiceOrder } from '@/core/models/serviceOrder';
import {
  buildServiceCustomerMessageSuggestion,
  buildServiceMissingRequirementsSuggestion,
  buildServiceReportDraftSuggestion,
  buildServiceTechnicalSummarySuggestion,
} from '@/features/services/serviceSuggestions';

function t(key: string) {
  const labels: Record<string, string> = {
    'services.status.in_progress': 'En progreso',
    'services.type.maintenance': 'Mantenimiento',
    'services.priority.high': 'Alta',
  };

  return labels[key] ?? key;
}

const serviceOrder: ServiceOrder = {
  id: 'so-technical-summary',
  buildingId: 'building-1',
  title: 'Mantenimiento bomba principal',
  description: 'Ruido elevado en cuarto de bombas',
  type: 'maintenance',
  priority: 'high',
  status: 'in_progress',
  scheduledStartAt: '2026-05-13T13:00:00.000Z',
  scheduledEndAt: '2026-05-13T14:00:00.000Z',
  issues: [
    {
      id: 'issue-1',
      type: 'noise',
      category: 'pump-room',
      description: 'Vibración fuera de rango',
      photos: [],
    },
  ],
  timeline: [],
};

describe('service AI suggestions', () => {
  it('builds a suggestion-only technical summary for service detail', () => {
    const suggestion = buildServiceTechnicalSummarySuggestion(serviceOrder, t);

    expect(suggestion.kind).toBe('technical_summary');
    expect(suggestion.title).toBe('Resumen técnico sugerido');
    expect(suggestion.content).toContain('Mantenimiento bomba principal');
    expect(suggestion.content).toContain('Vibración fuera de rango');
    expect(suggestion.trace.module).toBe('services.detail');
    expect(suggestion.safety.mode).toBe('suggestion_only');
    expect(suggestion.safety.requiresHumanApproval).toBe(true);
    expect(suggestion.safety.forbiddenSystemActions).toEqual(['auto_save', 'auto_send', 'auto_mutate']);
  });

  it('builds a suggestion-only report draft for service closeout', () => {
    const suggestion = buildServiceReportDraftSuggestion(serviceOrder, t);

    expect(suggestion.kind).toBe('report_draft');
    expect(suggestion.title).toBe('Borrador de reporte sugerido');
    expect(suggestion.content).toContain('Servicio: Mantenimiento bomba principal');
    expect(suggestion.content).toContain('Novedades registradas: 1');
    expect(suggestion.trace.module).toBe('services.closeout');
    expect(suggestion.trace.templateId).toBe('service-report-draft-v1');
    expect(suggestion.safety.mode).toBe('suggestion_only');
    expect(suggestion.safety.requiresHumanApproval).toBe(true);
    expect(suggestion.safety.allowedUserActions).toEqual(['copy', 'insert_draft', 'dismiss', 'regenerate']);
    expect(suggestion.safety.forbiddenSystemActions).toEqual(['auto_save', 'auto_send', 'auto_mutate']);
  });

  it('builds a suggestion-only customer message for service closeout without send action', () => {
    const suggestion = buildServiceCustomerMessageSuggestion(serviceOrder, t);

    expect(suggestion.kind).toBe('customer_message');
    expect(suggestion.title).toBe('Mensaje cliente sugerido');
    expect(suggestion.content).toContain('Hola, te comparto actualización');
    expect(suggestion.content).toContain('Mantenimiento bomba principal');
    expect(suggestion.trace.module).toBe('services.closeout');
    expect(suggestion.trace.templateId).toBe('customer-message-closeout-v1');
    expect(suggestion.safety.mode).toBe('suggestion_only');
    expect(suggestion.safety.requiresHumanApproval).toBe(true);
    expect(suggestion.safety.allowedUserActions).toEqual(['copy', 'dismiss', 'regenerate']);
    expect(suggestion.safety.allowedUserActions).not.toContain('insert_draft');
    expect(suggestion.safety.forbiddenSystemActions).toEqual(['auto_save', 'auto_send', 'auto_mutate']);
  });

  it('builds a suggestion-only missing requirements check before closeout', () => {
    const suggestion = buildServiceMissingRequirementsSuggestion(
      {
        ...serviceOrder,
        report: undefined,
        completionPhotos: [],
      }
    );

    expect(suggestion.kind).toBe('missing_requirements');
    expect(suggestion.title).toBe('Faltantes antes de cerrar');
    expect(suggestion.content).toContain('Observaciones de cierre');
    expect(suggestion.content).toContain('Evidencia fotográfica final');
    expect(suggestion.content).toContain('Checklist técnico');
    expect(suggestion.trace.module).toBe('services.closeout');
    expect(suggestion.trace.templateId).toBe('missing-requirements-closeout-v1');
    expect(suggestion.safety.mode).toBe('suggestion_only');
    expect(suggestion.safety.requiresHumanApproval).toBe(true);
    expect(suggestion.safety.allowedUserActions).toEqual(['copy', 'dismiss', 'regenerate']);
    expect(suggestion.safety.forbiddenSystemActions).toEqual(['auto_save', 'auto_send', 'auto_mutate']);
  });
});
