import type { ServiceOrder } from '@/core/models/serviceOrder';
import { createAiSuggestion, type AiSuggestion } from '@/core/models/aiSuggestion';
import { buildCustomerMessage, buildFollowUp, buildServiceSummary } from './serviceOrderAi';
import { buildServiceReportSnapshot, buildTechnicalReport } from './serviceReport';

type Translate = (key: string, params?: Record<string, string | number | undefined>) => string;

function buildServiceSuggestionTrace(serviceOrder: ServiceOrder, module: string) {
  return {
    generatedAt: new Date().toISOString(),
    module,
    roleScope: 'operator',
    inputSummary: `${serviceOrder.title} | ${serviceOrder.status} | issues:${serviceOrder.issues?.length ?? 0}`,
  };
}

export function buildServiceTechnicalSummarySuggestion(serviceOrder: ServiceOrder, t: Translate): AiSuggestion {
  return createAiSuggestion({
    id: `${serviceOrder.id}-technical-summary`,
    kind: 'technical_summary',
    title: 'Resumen técnico sugerido',
    content: buildServiceSummary(serviceOrder, t),
    trace: buildServiceSuggestionTrace(serviceOrder, 'services.detail'),
    safety: {
      allowedUserActions: ['copy', 'dismiss', 'regenerate'],
    },
  });
}

export function buildServiceReportDraftSuggestion(serviceOrder: ServiceOrder, t: Translate): AiSuggestion {
  return createAiSuggestion({
    id: `${serviceOrder.id}-report-draft`,
    kind: 'report_draft',
    title: 'Borrador de reporte sugerido',
    content: buildTechnicalReport(serviceOrder, t),
    trace: {
      ...buildServiceSuggestionTrace(serviceOrder, 'services.closeout'),
      policyId: 'suggestion-only-human-approval',
      templateId: 'service-report-draft-v1',
    },
    safety: {
      allowedUserActions: ['copy', 'insert_draft', 'dismiss', 'regenerate'],
    },
  });
}

export function buildServiceCustomerMessageSuggestion(serviceOrder: ServiceOrder, t: Translate): AiSuggestion {
  return createAiSuggestion({
    id: `${serviceOrder.id}-customer-message`,
    kind: 'customer_message',
    title: 'Mensaje cliente sugerido',
    content: buildCustomerMessage(serviceOrder, t),
    trace: {
      ...buildServiceSuggestionTrace(serviceOrder, 'services.closeout'),
      policyId: 'suggestion-only-human-approval',
      templateId: 'customer-message-closeout-v1',
    },
    safety: {
      allowedUserActions: ['copy', 'dismiss', 'regenerate'],
    },
  });
}

function buildMissingRequirementsContent(serviceOrder: ServiceOrder) {
  const snapshot = buildServiceReportSnapshot(serviceOrder);
  const missing: string[] = [];

  if (!snapshot.observations) missing.push('Observaciones de cierre');
  if (snapshot.photoCount < 1) missing.push('Evidencia fotográfica final');
  if (!snapshot.checklistValues.length) missing.push('Checklist técnico');

  if (!missing.length) {
    return [
      'No se detectan faltantes críticos antes del cierre.',
      'Revisa manualmente el contexto del servicio antes de confirmar: esta IA solo sugiere y no bloquea ni completa el cierre.',
    ].join('\n');
  }

  return [
    'Antes de cerrar, revisa estos faltantes sugeridos:',
    ...missing.map((item) => `- ${item}`),
    'Esta detección es informativa: no guarda, no envía y no muta el servicio automáticamente.',
  ].join('\n');
}

export function buildServiceMissingRequirementsSuggestion(serviceOrder: ServiceOrder): AiSuggestion {
  return createAiSuggestion({
    id: `${serviceOrder.id}-missing-requirements`,
    kind: 'missing_requirements',
    title: 'Faltantes antes de cerrar',
    content: buildMissingRequirementsContent(serviceOrder),
    trace: {
      ...buildServiceSuggestionTrace(serviceOrder, 'services.closeout'),
      policyId: 'suggestion-only-human-approval',
      templateId: 'missing-requirements-closeout-v1',
    },
    safety: {
      allowedUserActions: ['copy', 'dismiss', 'regenerate'],
    },
  });
}

export function buildServiceSuggestions(serviceOrder: ServiceOrder, t: Translate): AiSuggestion[] {
  return [
    buildServiceTechnicalSummarySuggestion(serviceOrder, t),
    buildServiceCustomerMessageSuggestion(serviceOrder, t),
    createAiSuggestion({
      id: `${serviceOrder.id}-follow-up`,
      kind: 'follow_up',
      title: 'Follow-up sugerido',
      content: buildFollowUp(serviceOrder, t),
      trace: buildServiceSuggestionTrace(serviceOrder, 'services')
    })
  ];
}
