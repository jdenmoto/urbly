import type { Employee } from '@/core/models/employee';
import type { SchedulingItem } from './schedulingItem';

export type AssignmentSuggestion = {
  employeeId: string;
  score: number;
  reason: string;
};

export function buildAssignmentSuggestions(args: {
  employees: Employee[];
  schedulingItems: SchedulingItem[];
  startAt?: string;
  endAt?: string;
  currentEmployeeId?: string | null;
}) {
  const { employees, schedulingItems, startAt, endAt, currentEmployeeId } = args;
  if (!startAt || !endAt) return [] as AssignmentSuggestion[];
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();

  return employees
    .map((employee) => {
      const overlapping = schedulingItems.filter((item) => {
        if (!item.employeeId || item.employeeId !== employee.id) return false;
        const itemStart = new Date(item.startAt).getTime();
        const itemEnd = new Date(item.endAt).getTime();
        return start < itemEnd && end > itemStart;
      }).length;
      const dailyLoad = schedulingItems.filter((item) => item.employeeId === employee.id).length;
      let score = 100 - overlapping * 60 - dailyLoad * 5;
      if (currentEmployeeId && employee.id === currentEmployeeId) score += 5;
      return {
        employeeId: employee.id,
        score,
        reason: overlapping ? `Tiene ${overlapping} conflicto(s) en ese rango` : `Carga actual: ${dailyLoad} servicio(s)`
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
