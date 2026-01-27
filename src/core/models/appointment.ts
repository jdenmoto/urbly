export type AppointmentStatus = 'programado' | 'confirmado' | 'completado' | 'cancelado';

export type AppointmentIssue = {
  id: string;
  type: string;
  category: string;
  description?: string;
  photos: string[];
  createdAt?: string;
};

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
  completedAt?: string | null;
  issues?: AppointmentIssue[];
  createdAt?: string;
};
