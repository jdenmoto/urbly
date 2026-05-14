import { serviceIssueCategoryOptions, serviceIssueTypeOptions } from '@/core/serviceOrderOptions';

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
