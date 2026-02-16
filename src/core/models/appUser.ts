export type AppUserRole = 'admin' | 'editor' | 'view' | 'building_admin' | 'emergency_scheduler';

export type AppUser = {
  id: string;
  email: string;
  role: AppUserRole;
  active: boolean;
  administrationId?: string | null;
  createdAt?: string;
};
