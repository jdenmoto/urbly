export type AppUserRole = 'admin' | 'editor' | 'view';

export type AppUser = {
  id: string;
  email: string;
  role: AppUserRole;
  active: boolean;
  createdAt?: string;
};
