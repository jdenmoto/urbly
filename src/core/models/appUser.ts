export type InternalAppUserRole = 'admin' | 'editor' | 'view' | 'building_admin' | 'emergency_scheduler' | 'supervisor' | 'scheduler' | 'operator' | 'auditoria';
export type ExternalAppUserRole = 'client';
export type AppUserRole = InternalAppUserRole | ExternalAppUserRole;

export type AppUserPermission =
  | 'export_audit'
  | 'manage_templates'
  | 'manage_ai_policy'
  | 'regenerate_secure_tokens'
  | 'review_reports'
  | 'approve_quotations_internal';

export type AppUser = {
  id: string;
  email: string;
  role: AppUserRole;
  active: boolean;
  administrationId?: string | null;
  permissions?: AppUserPermission[];
  tenantId?: string | null;
  createdAt?: string;
};
