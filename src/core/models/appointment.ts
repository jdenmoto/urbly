export type AppointmentStatus = 'programado' | 'confirmado' | 'completado' | 'cancelado';

export type Appointment = {
  id: string;
  buildingId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  recurrence?: string;
  createdAt?: string;
};
