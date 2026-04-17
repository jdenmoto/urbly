import { moveServiceOrderOnCalendar } from '@/lib/api/serviceOrders';
import { formatLocalIso } from './schedulingUtils';
import { validateSchedulingRules } from './schedulingRules';

export async function moveAppointmentOnCalendar(args: {
  appointmentId: string;
  buildingId: string;
  employeeId?: string | null;
  schedulingItems: import('./schedulingItem').SchedulingItem[];
  start: Date;
  end: Date;
  type?: string;
  isRestrictedDate: (value?: string) => boolean;
  toast: (message: string, tone?: 'success' | 'error') => void;
  t: (key: string) => string;
  invalidateAppointments: () => Promise<unknown>;
  revert: () => void;
}) {
  const { appointmentId, start, end, type, isRestrictedDate, toast, t, invalidateAppointments, revert } = args;

  const startIso = formatLocalIso(start);
  const endIso = formatLocalIso(end);
  const violation = validateSchedulingRules({
    schedulingItems: args.schedulingItems,
    buildingId: args.buildingId,
    employeeId: args.employeeId ?? null,
    startIso,
    endIso,
    type,
    editingId: appointmentId,
    isRestrictedDate
  });
  if (violation) {
    toast(violation.message, 'error');
    revert();
    return;
  }

  await moveServiceOrderOnCalendar({
    serviceOrderId: appointmentId,
    scheduledStartAt: formatLocalIso(start),
    scheduledEndAt: formatLocalIso(end)
  });
  await invalidateAppointments();
  toast(t('scheduling.toastUpdated'), 'success');
}
