import { deleteDocById, updateDocById } from '@/lib/api/firestore';

export type CancelValues = {
  reason?: string;
  note?: string;
};

export async function cancelAppointment(appointmentId: string, values: CancelValues) {
  await updateDocById('appointments', appointmentId, {
    status: 'cancelado',
    cancelReason: values.reason || null,
    cancelNote: values.note?.trim() || null
  });
}

export async function deleteAppointment(appointmentId: string) {
  await deleteDocById('appointments', appointmentId);
}
