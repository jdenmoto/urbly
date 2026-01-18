export type ManagementCompany = {
  id: string;
  name: string;
  contactPhone: string;
  email: string;
  nit: string;
  address: string;
  createdAt?: string;
};

export type Building = {
  id: string;
  name: string;
  porterPhone: string;
  managementCompanyId: string;
  addressText: string;
  location: { lat: number; lng: number };
  googlePlaceId: string;
  createdAt?: string;
};

export type Employee = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  active: boolean;
  buildingId?: string;
};

export type AppointmentStatus = 'programado' | 'confirmado' | 'completado' | 'cancelado';

export type Appointment = {
  id: string;
  buildingId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  createdAt?: string;
};
