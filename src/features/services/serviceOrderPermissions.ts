import type { AppUserRole } from '@/core/models/appUser';

export const SERVICE_ORDER_PERMISSION_ACTIONS = [
  'create',
  'schedule',
  'assign',
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

const INTERNAL_SERVICE_ORDER_PERMISSION_ACTIONS = SERVICE_ORDER_PERMISSION_ACTIONS;
const TECHNICIAN_SERVICE_ORDER_PERMISSION_ACTIONS = [
  'start',
  'pause',
  'resume',
  'report_issue',
  'close',
] as const satisfies readonly ServiceOrderPermissionAction[];
const REQUEST_ONLY_SERVICE_ORDER_PERMISSION_ACTIONS = ['create'] as const satisfies readonly ServiceOrderPermissionAction[];

const INTERNAL_ROLES = new Set<AppUserRole>(['admin', 'editor', 'view', 'supervisor', 'scheduler', 'operator', 'auditoria']);
const TECHNICIAN_ROLES = new Set<AppUserRole>(['emergency_scheduler']);
const REQUEST_ONLY_ROLES = new Set<AppUserRole>(['building_admin', 'client']);

const ACTIONS_BY_ROLE: Record<AppUserRole, readonly ServiceOrderPermissionAction[]> = {
  admin: INTERNAL_SERVICE_ORDER_PERMISSION_ACTIONS,
  editor: INTERNAL_SERVICE_ORDER_PERMISSION_ACTIONS,
  view: INTERNAL_SERVICE_ORDER_PERMISSION_ACTIONS,
  supervisor: INTERNAL_SERVICE_ORDER_PERMISSION_ACTIONS,
  scheduler: INTERNAL_SERVICE_ORDER_PERMISSION_ACTIONS,
  operator: INTERNAL_SERVICE_ORDER_PERMISSION_ACTIONS,
  auditoria: INTERNAL_SERVICE_ORDER_PERMISSION_ACTIONS,
  emergency_scheduler: TECHNICIAN_SERVICE_ORDER_PERMISSION_ACTIONS,
  building_admin: REQUEST_ONLY_SERVICE_ORDER_PERMISSION_ACTIONS,
  client: REQUEST_ONLY_SERVICE_ORDER_PERMISSION_ACTIONS,
};

export function isInternalServiceOrderRole(role: AppUserRole) {
  return INTERNAL_ROLES.has(role);
}

export function isTechnicianServiceOrderRole(role: AppUserRole) {
  return TECHNICIAN_ROLES.has(role);
}

export function isRequestOnlyServiceOrderRole(role: AppUserRole) {
  return REQUEST_ONLY_ROLES.has(role);
}

export function getAllowedServiceOrderPermissionActions(role: AppUserRole): ServiceOrderPermissionAction[] {
  return [...(ACTIONS_BY_ROLE[role] ?? [])];
}

export function hasServiceOrderPermission(role: AppUserRole, action: ServiceOrderPermissionAction) {
  return ACTIONS_BY_ROLE[role]?.includes(action) ?? false;
}

export function canCreateServiceOrder(role: AppUserRole) {
  return hasServiceOrderPermission(role, 'create');
}

export function canScheduleServiceOrder(role: AppUserRole) {
  return hasServiceOrderPermission(role, 'schedule');
}

export function canAssignServiceOrder(role: AppUserRole) {
  return hasServiceOrderPermission(role, 'assign');
}

export function canRescheduleServiceOrder(role: AppUserRole) {
  return hasServiceOrderPermission(role, 'reschedule');
}

export function canOverrideServiceOrderConflict(role: AppUserRole) {
  return hasServiceOrderPermission(role, 'override_conflict');
}

export function canStartServiceOrder(role: AppUserRole) {
  return hasServiceOrderPermission(role, 'start');
}

export function canPauseServiceOrder(role: AppUserRole) {
  return hasServiceOrderPermission(role, 'pause');
}

export function canResumeServiceOrder(role: AppUserRole) {
  return hasServiceOrderPermission(role, 'resume');
}

export function canReportServiceOrderIssue(role: AppUserRole) {
  return hasServiceOrderPermission(role, 'report_issue');
}

export function canCloseServiceOrder(role: AppUserRole) {
  return hasServiceOrderPermission(role, 'close');
}

export function canCancelServiceOrder(role: AppUserRole) {
  return hasServiceOrderPermission(role, 'cancel');
}
