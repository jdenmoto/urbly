import { formatLocalIso, isWithinBusinessHours } from './schedulingUtils';
import type { SchedulingItem } from './schedulingItem';

export type SchedulingRuleCheckArgs = {
  schedulingItems: SchedulingItem[];
  buildingId: string;
  employeeId?: string | null;
  startIso: string;
  endIso: string;
  type?: string;
  editingId?: string | null;
  isRestrictedDate: (value?: string) => boolean;
};

export function hasSchedulingConflict(args: SchedulingRuleCheckArgs) {
  const { schedulingItems, buildingId, employeeId, startIso, endIso, editingId } = args;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  return schedulingItems.some((item) => {
    if (editingId && item.id === editingId) return false;
    const itemStart = new Date(item.startAt).getTime();
    const itemEnd = new Date(item.endAt).getTime();
    const overlaps = start < itemEnd && end > itemStart;
    if (!overlaps) return false;
    if (item.buildingId === buildingId) return true;
    if (employeeId && item.employeeId && item.employeeId === employeeId) return true;
    return false;
  });
}

export function validateSchedulingRules(args: SchedulingRuleCheckArgs) {
  const { startIso, endIso, type, isRestrictedDate } = args;

  if (type !== 'emergencia' && !isWithinBusinessHours(startIso, endIso)) {
    return { code: 'business_hours', message: 'El servicio debe quedar dentro del horario hábil.' };
  }

  if (type !== 'emergencia' && (isRestrictedDate(startIso) || isRestrictedDate(endIso))) {
    return { code: 'restricted_date', message: 'La fecha está bloqueada por calendario.' };
  }

  if (hasSchedulingConflict(args)) {
    return { code: 'conflict', message: 'Existe conflicto de agenda para el edificio o el técnico seleccionado.' };
  }

  if (type === 'emergencia') {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
    if (durationMinutes > 240) {
      return { code: 'emergency_duration', message: 'La emergencia no debe exceder 4 horas en un solo bloque.' };
    }
  }

  return null;
}
