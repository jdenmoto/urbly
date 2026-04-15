import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase/client';

export type FeatureFlags = {
  dashboard: boolean;
  buildings: boolean;
  management: boolean;
  employees: boolean;
  scheduling: boolean;
  users: boolean;
  settings: boolean;
  services: boolean;
  customers: boolean;
  assets: boolean;
  reports: boolean;
  aiWorkspace: boolean;
  technicianHome: boolean;
  clientSummary: boolean;
};

const defaultFlags: FeatureFlags = {
  dashboard: true,
  buildings: true,
  management: true,
  employees: true,
  scheduling: true,
  users: true,
  settings: true,
  services: true,
  customers: true,
  assets: true,
  reports: true,
  aiWorkspace: true,
  technicianHome: true,
  clientSummary: true
};

type FeatureFlagsContextValue = {
  flags: FeatureFlags;
  ready: boolean;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  flags: defaultFlags,
  ready: false
});

function normalizeFlags(payload: Record<string, unknown> | null | undefined): FeatureFlags {
  return {
    dashboard: typeof payload?.dashboard === 'boolean' ? payload.dashboard : defaultFlags.dashboard,
    buildings: typeof payload?.buildings === 'boolean' ? payload.buildings : defaultFlags.buildings,
    management: typeof payload?.management === 'boolean' ? payload.management : defaultFlags.management,
    employees: typeof payload?.employees === 'boolean' ? payload.employees : defaultFlags.employees,
    scheduling: typeof payload?.scheduling === 'boolean' ? payload.scheduling : defaultFlags.scheduling,
    users: typeof payload?.users === 'boolean' ? payload.users : defaultFlags.users,
    settings: typeof payload?.settings === 'boolean' ? payload.settings : defaultFlags.settings,
    services: typeof payload?.services === 'boolean' ? payload.services : defaultFlags.services,
    customers: typeof payload?.customers === 'boolean' ? payload.customers : defaultFlags.customers,
    assets: typeof payload?.assets === 'boolean' ? payload.assets : defaultFlags.assets,
    reports: typeof payload?.reports === 'boolean' ? payload.reports : defaultFlags.reports,
    aiWorkspace: typeof payload?.aiWorkspace === 'boolean' ? payload.aiWorkspace : defaultFlags.aiWorkspace,
    technicianHome:
      typeof payload?.technicianHome === 'boolean' ? payload.technicianHome : defaultFlags.technicianHome,
    clientSummary: typeof payload?.clientSummary === 'boolean' ? payload.clientSummary : defaultFlags.clientSummary
  };
}

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { data, isFetched } = useQuery({
    queryKey: ['featureFlags'],
    queryFn: async () => {
      const snapshot = await getDoc(doc(db, 'feature_flags', 'app'));
      return snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
    },
    staleTime: 60_000
  });

  const flags = useMemo(() => normalizeFlags(data), [data]);
  const value = useMemo(() => ({ flags, ready: isFetched }), [flags, isFetched]);

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
