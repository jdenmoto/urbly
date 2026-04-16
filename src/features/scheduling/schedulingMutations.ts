import { cancelServiceOrder, deleteServiceOrder } from '@/lib/api/serviceOrders';

export type CancelValues = {
  reason?: string;
  note?: string;
};

export async function cancelAppointment(appointmentId: string, values: CancelValues) {
  await cancelServiceOrder(appointmentId, values);
}

export async function deleteAppointment(appointmentId: string) {
  await deleteServiceOrder(appointmentId);
}
