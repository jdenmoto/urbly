import type { AccountPermission } from './account';

export type InternalAppUserRole = 'owner' | 'admin' | 'editor' | 'view' | 'building_admin' | 'technician' | 'emergency_scheduler' | 'supervisor' | 'scheduler' | 'operator' | 'auditoria';
export type ExternalAppUserRole = 'client';
export type AppUserRole = InternalAppUserRole | ExternalAppUserRole;

export type AppUserPermission = AccountPermission;

export type AppUser = {
  id: string;
  email: string;
  role: AppUserRole;
  active: boolean;
  administrationId?: string | null;
  permissions?: AppUserPermission[];
  activeAccountId?: string | null;
  accountIds?: string[];
  tenantId?: string | null;
  createdAt?: string;
};
