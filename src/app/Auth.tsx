import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Navigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import type { AppUserPermission, AppUserRole } from '@/core/models/appUser';

type AuthState = {
  user: User | null;
  loading: boolean;
  role: AppUserRole;
  permissions: AppUserPermission[];
  administrationId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: AppUserRole[]) => boolean;
  hasPermission: (...requested: AppUserPermission[]) => boolean;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppUserRole>('view');
  const [permissions, setPermissions] = useState<AppUserPermission[]>([]);
  const [administrationId, setAdministrationId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setRole('view');
        setPermissions([]);
        setAdministrationId(null);
        setLoading(false);
        return;
      }
      nextUser
        .getIdTokenResult(true)
        .then((result) => {
          const claimRole = (result.claims.role as AppUserRole | undefined) || 'view';
          const claimPermissions = Array.isArray(result.claims.permissions)
            ? (result.claims.permissions as AppUserPermission[])
            : [];
          const claimAdministrationId = typeof result.claims.administrationId === 'string' ? result.claims.administrationId : null;
          setRole(claimRole);
          setPermissions(claimPermissions);
          setAdministrationId(claimAdministrationId);
        })
        .finally(() => setLoading(false));
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      role,
      permissions,
      administrationId,
      login: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      logout: async () => {
        await signOut(auth);
      },
      hasRole: (...roles: AppUserRole[]) => roles.includes(role),
      hasPermission: (...requested: AppUserPermission[]) => requested.every((item) => permissions.includes(item))
    }),
    [user, loading, role, permissions, administrationId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext not found');
  return ctx;
}

function AuthLoadingFallback() {
  const { t } = useI18n();
  return <div className="p-8 text-sm text-ink-600">{t('common.loadingSession')}</div>;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RoleGuard({
  allow,
  children
}: {
  allow: AppUserRole[];
  children: ReactNode;
}) {
  const { role, loading } = useAuth();
  const { t } = useI18n();
  if (loading) return <AuthLoadingFallback />;
  if (!allow.includes(role)) {
    return <div className="p-8 text-sm text-ink-600">{t('common.notAuthorized')}</div>;
  }
  return <>{children}</>;
}
