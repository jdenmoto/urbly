import type { ServiceOrder } from '@/core/models/serviceOrder';
import type { AiSuggestion } from '@/core/models/aiSuggestion';
import { buildCustomerMessage, buildFollowUp, buildServiceSummary } from './serviceOrderAi';

export function buildServiceSuggestions(serviceOrder: ServiceOrder, t: (key: string, params?: Record<string, string | number | undefined>) => string): AiSuggestion[] {
  const generatedAt = new Date().toISOString();
  const inputSummary = `${serviceOrder.title} | ${serviceOrder.status} | issues:${serviceOrder.issues?.length ?? 0}`;

  return [
    {
      id: `${serviceOrder.id}-summary`,
      type: 'summary',
      content: buildServiceSummary(serviceOrder, t),
      trace: { generatedAt, module: 'services', roleScope: 'operator', inputSummary }
    },
    {
      id: `${serviceOrder.id}-customer-message`,
      type: 'customer_message',
      content: buildCustomerMessage(serviceOrder, t),
      trace: { generatedAt, module: 'services', roleScope: 'operator', inputSummary }
    },
    {
      id: `${serviceOrder.id}-follow-up`,
      type: 'follow_up',
      content: buildFollowUp(serviceOrder, t),
      trace: { generatedAt, module: 'services', roleScope: 'operator', inputSummary }
    }
  ];
}
