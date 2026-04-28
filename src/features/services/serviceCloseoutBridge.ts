import { serviceIssueCategoryOptions, serviceIssueTypeOptions } from '@/core/serviceOrderOptions';
import type { ServiceOrder } from '@/core/models/serviceOrder';
import { resolveSchedulingIssueLabel } from '@/features/scheduling/schedulingPresentation';
import { mapServiceOrderToSchedulingItem } from '@/features/scheduling/schedulingItem';
import useSchedulingCompletion from '@/features/scheduling/useSchedulingCompletion';

export { serviceIssueTypeOptions, serviceIssueCategoryOptions };

export function resolveServiceIssueLabel(
  t: (key: string) => string,
  prefix: 'scheduling.issueTypes' | 'scheduling.issueCategories',
  value: string
) {
  return resolveSchedulingIssueLabel(t, prefix, value);
}

export function mapServiceOrderToCloseoutItem(serviceOrder: ServiceOrder) {
  return mapServiceOrderToSchedulingItem(serviceOrder);
}

export const useServiceCloseoutCompletion = useSchedulingCompletion;
