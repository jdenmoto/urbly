export type AppointmentStatus = 'programado' | 'confirmado' | 'completado' | 'cancelado';

export type Appointment = {
  id: string;
  buildingId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  type: string;
  employeeId?: string | null;
  cancelReason?: string | null;
  cancelNote?: string | null;
  recurrence?: string;
  createdAt?: string;
};
