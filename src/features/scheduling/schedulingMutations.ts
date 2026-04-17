import { cancelServiceOrder, deleteServiceOrder } from '@/lib/api/serviceOrders';

export type CancelValues = {
  reason?: string;
  note?: string;
};

export async function cancelSchedulingItem(schedulingItemId: string, values: CancelValues) {
  await cancelServiceOrder(schedulingItemId, values);
}

export async function deleteSchedulingItem(schedulingItemId: string) {
  await deleteServiceOrder(schedulingItemId);
}
