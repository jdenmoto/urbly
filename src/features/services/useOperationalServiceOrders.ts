import { useAuth } from '@/app/Auth';
import { useTenantServiceOrders } from '@/lib/api/queries';

export function useOperationalServiceOrders() {
  const { administrationId, role } = useAuth();
  return useTenantServiceOrders(administrationId, role);
}
