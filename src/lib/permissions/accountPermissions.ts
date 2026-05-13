import type { AccountMember, AccountPermission, AccountRole } from '@/core/models/account';

type AccountPermissionSubject = Pick<AccountMember, 'role' | 'active' | 'permissions'> | null | undefined;

const EVIDENCE_READ_ROLES = new Set<AccountRole>([
  'owner',
  'admin',
  'editor',
  'supervisor',
  'operator',
  'technician',
  'auditoria',
  'client',
  'building_admin',
]);

const SERVICE_CLOSE_ROLES = new Set<AccountRole>([
  'owner',
  'admin',
  'editor',
  'supervisor',
  'operator',
  'technician',
]);

const SERVICE_REOPEN_ROLES = new Set<AccountRole>(['owner', 'admin', 'editor', 'supervisor']);

function isActive(subject: AccountPermissionSubject): subject is NonNullable<AccountPermissionSubject> {
  return subject?.active === true;
}

export function hasAccountRole(subject: AccountPermissionSubject, role: AccountRole | readonly AccountRole[]) {
  if (!isActive(subject)) {
    return false;
  }

  return Array.isArray(role) ? role.includes(subject.role) : subject.role === role;
}

export function hasPermission(subject: AccountPermissionSubject, permission: AccountPermission) {
  if (!isActive(subject)) {
    return false;
  }

  return subject.permissions?.includes(permission) ?? false;
}

export function canReadEvidence(subject: AccountPermissionSubject) {
  return isActive(subject) && EVIDENCE_READ_ROLES.has(subject.role);
}

export function canCloseService(subject: AccountPermissionSubject) {
  return isActive(subject) && SERVICE_CLOSE_ROLES.has(subject.role);
}

export function canReopenService(subject: AccountPermissionSubject) {
  return isActive(subject) && SERVICE_REOPEN_ROLES.has(subject.role);
}
