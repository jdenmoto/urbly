import { useQuery } from '@tanstack/react-query';
import type { Appointment } from '@/core/models/appointment';
import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { ManagementCompany } from '@/core/models/managementCompany';
import { mapAppointmentToServiceOrder } from './serviceOrders';
import { listDocs } from './firestore';

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
      const [appointments, buildings, contracts, managements] = await Promise.all([
        listDocs<Appointment>('appointments'),
        listDocs<Building>('buildings'),
        listDocs<Contract>('contracts'),
        listDocs<ManagementCompany>('management_companies')
      ]);

      return appointments.map((appointment) =>
        mapAppointmentToServiceOrder(appointment, {
          buildings,
          contracts,
          managements
        })
      );
    }
  });
}
