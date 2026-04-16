import type { ServiceOrder } from '@/core/models/serviceOrder';

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const priorityLabelKey: Record<string, string> = {
  urgent: 'services.priorityUrgent',
  high: 'services.priorityHigh',
  medium: 'services.priorityMedium',
  low: 'services.priorityLow'
};

const statusLabelKey: Record<string, string> = {
  draft: 'services.statusDraft',
  scheduled: 'services.statusScheduled',
  confirmed: 'services.statusConfirmed',
  in_progress: 'services.statusInProgress',
  completed: 'services.statusCompleted',
  cancelled: 'services.statusCancelled'
};

export function getServiceOrderStatusLabel(t: TranslateFn, status: ServiceOrder['status']) {
  return t(statusLabelKey[status] ?? 'services.statusDraft');
}

export function getServiceOrderPriorityLabel(t: TranslateFn, priority: ServiceOrder['priority']) {
  return t(priorityLabelKey[priority] ?? 'services.priorityMedium');
}

export function getServiceOrderPriorityPill(t: TranslateFn, priority: ServiceOrder['priority'], key = 'services.priorityPill') {
  return t(key, { value: getServiceOrderPriorityLabel(t, priority) });
}

export function getServiceOrderTypeLabel(t: TranslateFn, type: string) {
  return t(`scheduling.types.${type}`, { defaultValue: type });
}

export function getIssueTypeLabel(t: TranslateFn, value: string) {
  return t(`scheduling.issueTypes.${value}`, { defaultValue: value });
}

export function getIssueCategoryLabel(t: TranslateFn, value: string) {
  return t(`scheduling.issueCategories.${value}`, { defaultValue: value });
}

export const serviceOrderPriorityTone: Record<ServiceOrder['priority'], string> = {
  urgent: 'bg-rose-50 text-rose-700',
  high: 'bg-amber-50 text-amber-700',
  medium: 'bg-sky-50 text-sky-700',
  low: 'bg-emerald-50 text-emerald-700'
};

export function formatServiceDateTime(value: string) {
  return new Date(value).toLocaleString('es-CO');
}
