import { useMemo } from 'react';
import { useAuth } from '@/app/Auth';
import { useTenantServiceOrders } from '@/lib/api/queries';
import type { ServiceOrder } from '@/core/models/serviceOrder';

export type OperationalServiceOrder = Omit<
  ServiceOrder,
  'appointmentId' | 'dataSource' | 'issues' | 'attachments' | 'completionPhotos' | 'quoteVersions' | 'timeline'
> & {
  issues: NonNullable<ServiceOrder['issues']>;
  attachments: NonNullable<ServiceOrder['attachments']>;
  completionPhotos: NonNullable<ServiceOrder['completionPhotos']>;
  quoteVersions: NonNullable<ServiceOrder['quoteVersions']>;
  timeline: NonNullable<ServiceOrder['timeline']>;
};

function toOperationalServiceOrder(serviceOrder: ServiceOrder): OperationalServiceOrder {
  const { appointmentId: _appointmentId, dataSource: _dataSource, ...operational } = serviceOrder;
  return {
    ...operational,
    issues: serviceOrder.issues ?? [],
    attachments: serviceOrder.attachments ?? [],
    completionPhotos: serviceOrder.completionPhotos ?? [],
    quoteVersions: serviceOrder.quoteVersions ?? [],
    timeline: serviceOrder.timeline ?? []
  };
}

export function useOperationalServiceOrders() {
  const { administrationId, role } = useAuth();
  const query = useTenantServiceOrders(administrationId, role);

  const data = useMemo(
    () => (query.data ?? []).map(toOperationalServiceOrder),
    [query.data]
  );

  return {
    ...query,
    data
  };
}
