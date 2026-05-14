import { serviceIssueCategoryOptions, serviceIssueTypeOptions } from '@/core/serviceOrderOptions';
import type { ServiceOrder } from '@/core/models/serviceOrder';
import { mapServiceOrderToSchedulingItem } from '@/features/scheduling/schedulingItem';
import useSchedulingCompletion from '@/features/scheduling/useSchedulingCompletion';

export { serviceIssueTypeOptions, serviceIssueCategoryOptions };

export function resolveServiceIssueLabel(
  t: (key: string) => string,
  kind: 'type' | 'category',
  value: string
) {
  const key = kind === 'type' ? `services.issue.types.${value}` : `services.issue.categories.${value}`;
  const label = t(key);
  return label === key ? value : label;
}

export function mapServiceOrderToCloseoutItem(serviceOrder: ServiceOrder) {
  return mapServiceOrderToSchedulingItem(serviceOrder);
}

export const useServiceCloseoutCompletion = useSchedulingCompletion;
