import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Navigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';

type AuthState = {
  user: User | null;
  loading: boolean;
  role: 'admin' | 'editor' | 'view' | 'building_admin' | 'emergency_scheduler';
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'editor' | 'view' | 'building_admin' | 'emergency_scheduler'>('view');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setRole('view');
        setLoading(false);
        return;
      }
      nextUser
        .getIdTokenResult(true)
        .then((result) => {
          const claimRole =
            (result.claims.role as 'admin' | 'editor' | 'view' | 'building_admin' | 'emergency_scheduler') || 'view';
          setRole(claimRole);
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
      login: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      logout: async () => {
        await signOut(auth);
      }
    }),
    [user, loading, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext not found');
  return ctx;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  if (loading) return <div className="p-8 text-sm text-ink-600">{t('common.loadingSession')}</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RoleGuard({
  allow,
  children
}: {
  allow: Array<'admin' | 'editor' | 'view' | 'building_admin' | 'emergency_scheduler'>;
  children: ReactNode;
}) {
  const { role, loading } = useAuth();
  const { t } = useI18n();
  if (loading) return <div className="p-8 text-sm text-ink-600">{t('common.loadingSession')}</div>;
  if (!allow.includes(role)) {
    return <div className="p-8 text-sm text-ink-600">{t('common.notAuthorized')}</div>;
  }
  return <>{children}</>;
}
