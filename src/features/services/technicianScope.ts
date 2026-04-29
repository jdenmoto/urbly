import type { AppUser } from '@/core/models/appUser';
import type { Employee } from '@/core/models/employee';
import type { OperationalServiceOrder } from './useOperationalServiceOrders';

export type TechnicianScope = {
  currentUser: AppUser | null;
  currentEmployee: Employee | null;
  allowedIds: Set<string>;
};

export function resolveTechnicianScope(input: {
  users: AppUser[];
  employees: Employee[];
  authUserId?: string | null;
}): TechnicianScope {
  const currentUser = input.users.find((item) => item.id === input.authUserId) ?? null;
  const email = currentUser?.email?.toLowerCase();
  const currentEmployee = email
    ? input.employees.find((item) => item.email.toLowerCase() === email) ?? null
    : null;

  return {
    currentUser,
    currentEmployee,
    allowedIds: new Set([currentEmployee?.id, currentUser?.id, input.authUserId].filter(Boolean) as string[]),
  };
}

export function scopeServiceOrdersForTechnician(input: {
  serviceOrders: OperationalServiceOrder[];
  allowedIds: Set<string>;
}): OperationalServiceOrder[] {
  if (!input.allowedIds.size) return [];
  return input.serviceOrders.filter(
    (item) => Boolean(item.assignedTechnicianId) && input.allowedIds.has(String(item.assignedTechnicianId)),
  );
}
