export const ACCOUNT_ROLES = [
  'owner',
  'admin',
  'editor',
  'supervisor',
  'scheduler',
  'operator',
  'technician',
  'auditoria',
  'view',
  'client',
  'building_admin',
] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export type AccountPermission =
  | 'export_audit'
  | 'manage_templates'
  | 'manage_ai_policy'
  | 'regenerate_secure_tokens'
  | 'review_reports'
  | 'approve_quotations_internal';

export type Account = {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AccountMember = {
  id: string;
  uid: string;
  accountId: string;
  email: string;
  role: AccountRole;
  active: boolean;
  permissions?: AccountPermission[];
  createdAt?: string;
  updatedAt?: string;
};
