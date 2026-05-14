import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Navigate, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import type { AppUserPermission, AppUserRole } from '@/core/models/appUser';

type AuthState = {
  user: User | null;
  loading: boolean;
  role: AppUserRole;
  permissions: AppUserPermission[];
  administrationId: string | null;
  isQaMode: boolean;
  qaRole: AppUserRole | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: AppUserRole[]) => boolean;
  hasPermission: (...requested: AppUserPermission[]) => boolean;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const qaRoleClaims: Record<AppUserRole, true> = {
  owner: true,
  admin: true,
  editor: true,
  view: true,
  scheduler: true,
  supervisor: true,
  operator: true,
  auditoria: true,
  technician: true,
  emergency_scheduler: true,
  building_admin: true,
  client: true
};

function isLocalQaEnabled() {
  return import.meta.env.DEV && typeof window !== 'undefined' && ['127.0.0.1', 'localhost'].includes(window.location.hostname);
}

function readQaRole(search: string): AppUserRole | null {
  if (!isLocalQaEnabled()) return null;
  const params = new URLSearchParams(search);
  const mode = params.get('qa');
  const role = params.get('role');
  if (mode === '1' && role && Object.prototype.hasOwnProperty.call(qaRoleClaims, role)) {
    return role as AppUserRole;
  }

  const pathMatch = typeof window !== 'undefined'
    ? window.location.pathname.match(/^\/__qa__\/([a-z_]+)$/)
    : null;
  const pathRole = pathMatch?.[1] ?? null;
  return pathRole && Object.prototype.hasOwnProperty.call(qaRoleClaims, pathRole)
    ? (pathRole as AppUserRole)
    : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const qaRole = readQaRole(location.search);
  const isQaMode = qaRole !== null;
  const qaHandledRef = useRef<AppUserRole | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppUserRole>('view');
  const [permissions, setPermissions] = useState<AppUserPermission[]>([]);
  const [administrationId, setAdministrationId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        if (isQaMode && qaHandledRef.current === qaRole) {
          setLoading(true);
          return;
        }
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
          if (isQaMode) {
            qaHandledRef.current = claimRole;
          }
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
  }, [isQaMode, qaRole]);

  const value = useMemo(
    () => ({
      user,
      loading,
      role,
      permissions,
      administrationId,
      isQaMode,
      qaRole,
      login: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      logout: async () => {
        if (isQaMode) return;
        await signOut(auth);
      },
      hasRole: (...roles: AppUserRole[]) => roles.includes(role),
      hasPermission: (...requested: AppUserPermission[]) => requested.every((item) => permissions.includes(item))
    }),
    [user, loading, role, permissions, administrationId, isQaMode, qaRole]
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
  return <div className="p-8 text-sm text-ink-600">{t('common.loading.session')}</div>;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isQaMode } = useAuth();
  if (loading) return <AuthLoadingFallback />;
  if (!user && !isQaMode) return <Navigate to="/login" replace />;
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
    return <div className="p-8 text-sm text-ink-600">{t('common.not.authorized')}</div>;
  }
  return <>{children}</>;
}
