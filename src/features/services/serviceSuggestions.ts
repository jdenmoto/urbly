import type { ServiceOrder } from '@/core/models/serviceOrder';
import { createAiSuggestion, type AiSuggestion } from '@/core/models/aiSuggestion';
import { buildCustomerMessage, buildFollowUp, buildServiceSummary } from './serviceOrderAi';

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

export function buildServiceSuggestions(serviceOrder: ServiceOrder, t: Translate): AiSuggestion[] {
  return [
    buildServiceTechnicalSummarySuggestion(serviceOrder, t),
    createAiSuggestion({
      id: `${serviceOrder.id}-customer-message`,
      kind: 'customer_message',
      title: 'Mensaje al cliente',
      content: buildCustomerMessage(serviceOrder, t),
      trace: buildServiceSuggestionTrace(serviceOrder, 'services')
    }),
    createAiSuggestion({
      id: `${serviceOrder.id}-follow-up`,
      kind: 'follow_up',
      title: 'Follow-up sugerido',
      content: buildFollowUp(serviceOrder, t),
      trace: buildServiceSuggestionTrace(serviceOrder, 'services')
    })
  ];
}
