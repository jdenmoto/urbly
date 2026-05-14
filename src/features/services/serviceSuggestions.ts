import type { ServiceOrder } from '@/core/models/serviceOrder';
import { createAiSuggestion, type AiSuggestion } from '@/core/models/aiSuggestion';
import { buildCustomerMessage, buildFollowUp, buildServiceSummary } from './serviceOrderAi';

export function buildServiceSuggestions(serviceOrder: ServiceOrder, t: (key: string, params?: Record<string, string | number | undefined>) => string): AiSuggestion[] {
  const generatedAt = new Date().toISOString();
  const inputSummary = `${serviceOrder.title} | ${serviceOrder.status} | issues:${serviceOrder.issues?.length ?? 0}`;

  return [
    createAiSuggestion({
      id: `${serviceOrder.id}-summary`,
      kind: 'technical_summary',
      title: 'Resumen técnico',
      content: buildServiceSummary(serviceOrder, t),
      trace: { generatedAt, module: 'services', roleScope: 'operator', inputSummary }
    }),
    createAiSuggestion({
      id: `${serviceOrder.id}-customer-message`,
      kind: 'customer_message',
      title: 'Mensaje al cliente',
      content: buildCustomerMessage(serviceOrder, t),
      trace: { generatedAt, module: 'services', roleScope: 'operator', inputSummary }
    }),
    createAiSuggestion({
      id: `${serviceOrder.id}-follow-up`,
      kind: 'follow_up',
      title: 'Follow-up sugerido',
      content: buildFollowUp(serviceOrder, t),
      trace: { generatedAt, module: 'services', roleScope: 'operator', inputSummary }
    })
  ];
}
