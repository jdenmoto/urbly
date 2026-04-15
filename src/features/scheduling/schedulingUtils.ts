import type { Appointment } from '@/core/models/appointment';

export function filterAppointments(
  appointments: Appointment[],
  filters: { buildingId: string; from: string; to: string }
) {
  const filterFromDate = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
  const filterToDate = filters.to ? new Date(`${filters.to}T23:59:59`) : null;

  return appointments.filter((item) => {
    if (filters.buildingId && item.buildingId !== filters.buildingId) return false;
    const start = new Date(item.startAt);
    const end = new Date(item.endAt);
    if (filterFromDate && start < filterFromDate) return false;
    if (filterToDate && end > filterToDate) return false;
    return true;
  });
}

export function buildRestrictedDates(
  calendarSettings?: { holidays?: Array<{ date: string }>; nonWorkingDays?: Array<{ date: string }> } | null
) {
  const dates = new Set<string>();
  (calendarSettings?.holidays ?? []).forEach((item) => item.date && dates.add(item.date));
  (calendarSettings?.nonWorkingDays ?? []).forEach((item) => item.date && dates.add(item.date));
  return dates;
}

export function isRestrictedDate(restrictedDates: Set<string>, value?: string) {
  if (!value) return false;
  return restrictedDates.has(value.slice(0, 10));
}

export function formatLocalIso(value: Date) {
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:00`;
}

export function formatLocalInput(value: Date) {
  return formatLocalIso(value).slice(0, 16);
}

export function toLocalIso(value: string) {
  if (!value) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatLocalIso(date);
}

export function isWithinBusinessHours(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  if (start >= end) return false;
  const inWindow = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const total = hours * 60 + minutes;
    return total >= 8 * 60 && total <= 17 * 60;
  };
  return inWindow(start) && inWindow(end);
}

export function formatDateTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

export function translateAppointmentStatus(status: string, t: (key: string) => string) {
  const map: Record<string, string> = {
    programado: t('scheduling.statusProgrammed'),
    confirmado: t('scheduling.statusConfirmed'),
    completado: t('scheduling.statusCompleted'),
    cancelado: t('scheduling.statusCanceled')
  };
  return map[status] ?? status;
}
