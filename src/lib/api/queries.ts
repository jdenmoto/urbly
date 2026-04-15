import { useQuery } from '@tanstack/react-query';
import type { Appointment } from '@/core/models/appointment';
import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { ManagementCompany } from '@/core/models/managementCompany';
import { mapAppointmentToServiceOrder } from './serviceOrders';
import { listDocs } from './firestore';

function indexById<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

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

      const buildingsById = indexById(buildings);
      const contractsById = indexById(contracts);
      const managementsById = indexById(managements);

      return appointments.map((appointment) => {
        const building = buildingsById.get(appointment.buildingId) ?? null;
        const contract = building?.contractId ? contractsById.get(building.contractId) ?? null : null;
        const management = building?.managementCompanyId
          ? managementsById.get(building.managementCompanyId) ?? null
          : null;

        return mapAppointmentToServiceOrder(appointment, {
          building,
          contract,
          management
        });
      });
    }
  });
}
