import { useQuery } from '@tanstack/react-query';
import { listDocs } from './firestore';
import { loadResolvedServiceOrders, loadResolvedTenantServiceOrders } from './serviceOrders';

export function useList<T>(key: string, path: string) {
  return useQuery({
    queryKey: [key],
    queryFn: () => listDocs<T>(path)
  });
}

export function useServiceOrders() {
  return useQuery({
    queryKey: ['serviceOrders'],
    queryFn: async () => {
      return (await loadResolvedServiceOrders()).items;
    }
  });
}


export function useTenantServiceOrders(administrationId: string | null, role: string) {
  return useQuery({
    queryKey: ['serviceOrders', administrationId ?? 'all', role],
    queryFn: async () => {
      return (await loadResolvedTenantServiceOrders({ administrationId })).items;
    }
  });
}
