import type { ServiceOrder } from '@/core/models/serviceOrder';

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

function humanizeFallback(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

const priorityLabelSuffix: Record<string, string> = {
  urgent: 'urgent',
  high: 'high',
  medium: 'medium',
  low: 'low'
};

const statusLabelSuffix: Record<ServiceOrder['status'], string> = {
  draft: 'draft',
  unassigned: 'unassigned',
  scheduled: 'scheduled',
  confirmed: 'confirmed',
  in_progress: 'in.progress',
  paused: 'paused',
  pending_review: 'pending.review',
  requires_reschedule: 'requires.reschedule',
  completed: 'completed',
  cancelled: 'cancelled'
};

export function getServiceOrderStatusLabel(
  t: TranslateFn,
  status: ServiceOrder['status'],
  keyPrefix = 'services.status'
) {
  return t(`${keyPrefix}.${statusLabelSuffix[status] ?? statusLabelSuffix.draft}`);
}

export function getServiceOrderPriorityLabel(
  t: TranslateFn,
  priority: ServiceOrder['priority'],
  keyPrefix = 'services.priority'
) {
  return t(`${keyPrefix}.${priorityLabelSuffix[priority] ?? priorityLabelSuffix.medium}`);
}

export function getServiceOrderPriorityPill(
  t: TranslateFn,
  priority: ServiceOrder['priority'],
  key = 'services.priority.pill',
  priorityLabelKeyPrefix = 'services.priority'
) {
  return t(key, { value: getServiceOrderPriorityLabel(t, priority, priorityLabelKeyPrefix) });
}

export function getServiceOrderTypeLabel(
  t: TranslateFn,
  type: string,
  keyPrefix = 'services.types'
) {
  return t(`${keyPrefix}.${type}`, { defaultValue: humanizeFallback(type) });
}

export function getIssueTypeLabel(
  t: TranslateFn,
  value: string,
  keyPrefix = 'services.issue.types'
) {
  return t(`${keyPrefix}.${value}`, { defaultValue: humanizeFallback(value) });
}

export function getIssueCategoryLabel(
  t: TranslateFn,
  value: string,
  keyPrefix = 'services.issue.categories'
) {
  return t(`${keyPrefix}.${value}`, { defaultValue: humanizeFallback(value) });
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
