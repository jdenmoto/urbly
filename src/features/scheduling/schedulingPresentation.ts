import type { SchedulingItem } from './schedulingItem';

export type SchedulingIssueLabelPrefix = 'scheduling.issue.types' | 'scheduling.issueCategories';

export function checklistValueLabel(value?: string) {
  return value === 'ok' ? 'Bueno' : value === 'regular' ? 'Regular' : value === 'malo' ? 'Malo' : 'N/A';
}

export function resolveSchedulingIssueLabel(
  t: (key: string) => string,
  prefix: SchedulingIssueLabelPrefix,
  value: string
) {
  const key = `${prefix}.${value}`;
  const label = t(key);
  return label === key ? value : label;
}

export function buildSchedulingStatusLabels(t: (key: string) => string): Record<SchedulingItem['status'], string> {
  return {
    programado: t('scheduling.status.programmed'),
    confirmado: t('scheduling.status.confirmed'),
    completado: t('scheduling.status.completed'),
    cancelado: t('scheduling.status.canceled')
  };
}
