import { describe, expect, it } from 'vitest';

import type { ServiceOrder } from '@/core/models/serviceOrder';
import { buildServiceTechnicalSummarySuggestion } from '@/features/services/serviceSuggestions';

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
});
