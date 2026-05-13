import type { AccountRole } from '@/core/models/account';
import type { AppUserRole } from '@/core/models/appUser';
import { canCloseService } from '@/lib/permissions/accountPermissions';

export const SERVICE_ORDER_PERMISSION_ACTIONS = [
  'create',
  'schedule',
  'assign',
  'confirm',
  'reschedule',
  'override_conflict',
  'start',
  'pause',
  'resume',
  'report_issue',
  'close',
  'cancel',
] as const;

export type ServiceOrderPermissionAction = (typeof SERVICE_ORDER_PERMISSION_ACTIONS)[number];
export type ServiceOrderPermissionRole = AccountRole | AppUserRole;

const FULL_SERVICE_ORDER_PERMISSION_ACTIONS = SERVICE_ORDER_PERMISSION_ACTIONS;
const SCHEDULER_SERVICE_ORDER_PERMISSION_ACTIONS = [
  'create',
  'schedule',
  'assign',
  'confirm',
  'reschedule',
] as const satisfies readonly ServiceOrderPermissionAction[];
const EXECUTION_SERVICE_ORDER_PERMISSION_ACTIONS = [
  'start',
  'pause',
  'resume',
  'report_issue',
  'close',
] as const satisfies readonly ServiceOrderPermissionAction[];
const REQUEST_ONLY_SERVICE_ORDER_PERMISSION_ACTIONS = ['create'] as const satisfies readonly ServiceOrderPermissionAction[];

const INTERNAL_ROLES = new Set<ServiceOrderPermissionRole>([
  'owner',
  'admin',
  'editor',
  'supervisor',
  'scheduler',
  'operator',
  'auditoria',
  'view',
]);
const TECHNICIAN_ROLES = new Set<ServiceOrderPermissionRole>(['technician', 'emergency_scheduler']);
const REQUEST_ONLY_ROLES = new Set<ServiceOrderPermissionRole>(['building_admin', 'client']);

const ACTIONS_BY_ROLE: Partial<Record<AccountRole, readonly ServiceOrderPermissionAction[]>> = {
  owner: FULL_SERVICE_ORDER_PERMISSION_ACTIONS,
  admin: FULL_SERVICE_ORDER_PERMISSION_ACTIONS,
  editor: FULL_SERVICE_ORDER_PERMISSION_ACTIONS,
  supervisor: FULL_SERVICE_ORDER_PERMISSION_ACTIONS,
  scheduler: SCHEDULER_SERVICE_ORDER_PERMISSION_ACTIONS,
  operator: EXECUTION_SERVICE_ORDER_PERMISSION_ACTIONS,
  technician: EXECUTION_SERVICE_ORDER_PERMISSION_ACTIONS,
  auditoria: [],
  view: [],
  building_admin: REQUEST_ONLY_SERVICE_ORDER_PERMISSION_ACTIONS,
  client: REQUEST_ONLY_SERVICE_ORDER_PERMISSION_ACTIONS,
};

function normalizeServiceOrderRole(role: ServiceOrderPermissionRole): AccountRole | null {
  if (role === 'emergency_scheduler') {
    return 'technician';
  }

  return role as AccountRole;
}

export function isInternalServiceOrderRole(role: ServiceOrderPermissionRole) {
  return INTERNAL_ROLES.has(role);
}

export function isTechnicianServiceOrderRole(role: ServiceOrderPermissionRole) {
  return TECHNICIAN_ROLES.has(role);
}

export function isRequestOnlyServiceOrderRole(role: ServiceOrderPermissionRole) {
  return REQUEST_ONLY_ROLES.has(role);
}

export function getAllowedServiceOrderPermissionActions(role: ServiceOrderPermissionRole): ServiceOrderPermissionAction[] {
  const accountRole = normalizeServiceOrderRole(role);

  return [...(accountRole ? ACTIONS_BY_ROLE[accountRole] ?? [] : [])];
}

export function hasServiceOrderPermission(role: ServiceOrderPermissionRole, action: ServiceOrderPermissionAction) {
  const accountRole = normalizeServiceOrderRole(role);

  return accountRole ? ACTIONS_BY_ROLE[accountRole]?.includes(action) ?? false : false;
}

export function canCreateServiceOrder(role: ServiceOrderPermissionRole) {
  return hasServiceOrderPermission(role, 'create');
}

export function canScheduleServiceOrder(role: ServiceOrderPermissionRole) {
  return hasServiceOrderPermission(role, 'schedule');
}

export function canAssignServiceOrder(role: ServiceOrderPermissionRole) {
  return hasServiceOrderPermission(role, 'assign');
}

export function canConfirmServiceOrder(role: ServiceOrderPermissionRole) {
  return hasServiceOrderPermission(role, 'confirm');
}

export function canRescheduleServiceOrder(role: ServiceOrderPermissionRole) {
  return hasServiceOrderPermission(role, 'reschedule');
}

export function canOverrideServiceOrderConflict(role: ServiceOrderPermissionRole) {
  return hasServiceOrderPermission(role, 'override_conflict');
}

export function canStartServiceOrder(role: ServiceOrderPermissionRole) {
  return hasServiceOrderPermission(role, 'start');
}

export function canPauseServiceOrder(role: ServiceOrderPermissionRole) {
  return hasServiceOrderPermission(role, 'pause');
}

export function canResumeServiceOrder(role: ServiceOrderPermissionRole) {
  return hasServiceOrderPermission(role, 'resume');
}

export function canReportServiceOrderIssue(role: ServiceOrderPermissionRole) {
  return hasServiceOrderPermission(role, 'report_issue');
}

export function canCloseServiceOrder(role: ServiceOrderPermissionRole) {
  const accountRole = normalizeServiceOrderRole(role);

  return accountRole ? canCloseService({ role: accountRole, active: true, permissions: [] }) : false;
}

export function canCancelServiceOrder(role: ServiceOrderPermissionRole) {
  return hasServiceOrderPermission(role, 'cancel');
}
