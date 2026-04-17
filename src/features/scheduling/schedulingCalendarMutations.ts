import { moveServiceOrderOnCalendar } from '@/lib/api/serviceOrders';
import { formatLocalIso } from './schedulingUtils';
import { validateSchedulingRules } from './schedulingRules';

export async function moveSchedulingItemOnCalendar(args: {
  schedulingItemId: string;
  buildingId: string;
  employeeId?: string | null;
  schedulingItems: import('./schedulingItem').SchedulingItem[];
  start: Date;
  end: Date;
  type?: string;
  isRestrictedDate: (value?: string) => boolean;
  toast: (message: string, tone?: 'success' | 'error') => void;
  t: (key: string) => string;
  invalidateScheduling: () => Promise<unknown>;
  revert: () => void;
}) {
  const { schedulingItemId, start, end, type, isRestrictedDate, toast, t, invalidateScheduling, revert } = args;

  const startIso = formatLocalIso(start);
  const endIso = formatLocalIso(end);
  const violation = validateSchedulingRules({
    schedulingItems: args.schedulingItems,
    buildingId: args.buildingId,
    employeeId: args.employeeId ?? null,
    startIso,
    endIso,
    type,
    editingId: schedulingItemId,
    isRestrictedDate
  });
  if (violation) {
    toast(violation.message, 'error');
    revert();
    return;
  }

  await moveServiceOrderOnCalendar({
    serviceOrderId: schedulingItemId,
    scheduledStartAt: formatLocalIso(start),
    scheduledEndAt: formatLocalIso(end)
  });
  await invalidateScheduling();
  toast(t('scheduling.toastUpdated'), 'success');
}
