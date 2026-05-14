import type { ServiceOrder } from '@/core/models/serviceOrder';

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

function humanizeFallback(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const priorityLabelKey: Record<string, string> = {
  urgent: 'services.priority.urgent',
  high: 'services.priority.high',
  medium: 'services.priority.medium',
  low: 'services.priority.low'
};

const statusLabelKey: Record<ServiceOrder['status'], string> = {
  draft: 'services.status.draft',
  unassigned: 'services.status.unassigned',
  scheduled: 'services.status.scheduled',
  confirmed: 'services.status.confirmed',
  in_progress: 'services.status.in.progress',
  paused: 'services.status.paused',
  pending_review: 'services.status.pending.review',
  requires_reschedule: 'services.status.requires.reschedule',
  completed: 'services.status.completed',
  cancelled: 'services.status.cancelled'
};

export function getServiceOrderStatusLabel(t: TranslateFn, status: ServiceOrder['status']) {
  return t(statusLabelKey[status] ?? 'services.status.draft');
}

export function getServiceOrderPriorityLabel(t: TranslateFn, priority: ServiceOrder['priority']) {
  return t(priorityLabelKey[priority] ?? 'services.priority.medium');
}

export function getServiceOrderPriorityPill(t: TranslateFn, priority: ServiceOrder['priority'], key = 'services.priority.pill') {
  return t(key, { value: getServiceOrderPriorityLabel(t, priority) });
}

export function getServiceOrderTypeLabel(t: TranslateFn, type: string) {
  return t(`services.types.${type}`, { defaultValue: humanizeFallback(type) });
}

export function getIssueTypeLabel(t: TranslateFn, value: string) {
  return t(`services.issue.types.${value}`, { defaultValue: humanizeFallback(value) });
}

export function getIssueCategoryLabel(t: TranslateFn, value: string) {
  return t(`services.issue.categories.${value}`, { defaultValue: humanizeFallback(value) });
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
