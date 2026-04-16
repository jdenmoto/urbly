import { updateDocById } from '@/lib/api/firestore';
import { formatLocalIso, isWithinBusinessHours } from './schedulingUtils';

export async function moveAppointmentOnCalendar(args: {
  appointmentId: string;
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

  if (type !== 'emergencia') {
    const startIso = formatLocalIso(start);
    const endIso = formatLocalIso(end);
    if (!isWithinBusinessHours(startIso, endIso)) {
      toast(t('scheduling.businessHoursToast'), 'error');
      revert();
      return;
    }
  }

  if ((isRestrictedDate(formatLocalIso(start)) || isRestrictedDate(formatLocalIso(end))) && type !== 'emergencia') {
    toast(t('scheduling.dateBlocked'), 'error');
    revert();
    return;
  }

  await updateDocById('appointments', appointmentId, {
    startAt: formatLocalIso(start),
    endAt: formatLocalIso(end)
  });
  await invalidateAppointments();
  toast(t('scheduling.toastUpdated'), 'success');
}
