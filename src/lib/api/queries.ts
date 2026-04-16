import { useQuery } from '@tanstack/react-query';
import type { Appointment } from '@/core/models/appointment';
import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { ManagementCompany } from '@/core/models/managementCompany';
import type { ServiceOrder } from '@/core/models/serviceOrder';
import { enrichServiceOrder, mapAppointmentToServiceOrder } from './serviceOrders';
import { listDocs } from './firestore';

export function indexById<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

export function buildServiceOrders(
  appointments: Appointment[],
  buildings: Building[],
  contracts: Contract[],
  managements: ManagementCompany[]
) {
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

export function hydrateServiceOrders(
  serviceOrders: ServiceOrder[],
  buildings: Building[],
  contracts: Contract[],
  managements: ManagementCompany[]
) {
  const buildingsById = indexById(buildings);
  const contractsById = indexById(contracts);
  const managementsById = indexById(managements);

  return serviceOrders.map((serviceOrder) => {
    const building = buildingsById.get(serviceOrder.buildingId) ?? null;
    const contract = serviceOrder.contractId
      ? contractsById.get(serviceOrder.contractId) ?? null
      : building?.contractId
        ? contractsById.get(building.contractId) ?? null
        : null;
    const management = serviceOrder.customerId
      ? managementsById.get(serviceOrder.customerId) ?? null
      : building?.managementCompanyId
        ? managementsById.get(building.managementCompanyId) ?? null
        : null;

    return enrichServiceOrder(serviceOrder, {
      building,
      contract,
      management
    });
  });
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
      const [serviceOrders, appointments, buildings, contracts, managements] = await Promise.all([
        listDocs<ServiceOrder>('service_orders').catch(() => []),
        listDocs<Appointment>('appointments').catch(() => []),
        listDocs<Building>('buildings'),
        listDocs<Contract>('contracts'),
        listDocs<ManagementCompany>('management_companies')
      ]);

      if (serviceOrders.length > 0) {
        return hydrateServiceOrders(serviceOrders, buildings, contracts, managements);
      }

      return buildServiceOrders(appointments, buildings, contracts, managements);
    }
  });
}
