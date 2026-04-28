import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { ManagementCompany } from '@/core/models/managementCompany';
import type {
  ServiceOrder,
  ServiceOrderDataSource,
  ServiceOrderPriority,
  ServiceOrderStatus
} from '@/core/models/serviceOrder';
import { createDoc, deleteDocById, filters, listDocs, updateDocById } from './firestore';

export type ServiceOrderRelations = {
  building?: Building | null;
  contract?: Contract | null;
  management?: ManagementCompany | null;
};

export type ServiceOrderResolution = {
  items: ServiceOrder[];
  source: ServiceOrderDataSource;
};

export type ServiceOrderMutationValues = {
  buildingId: string;
  title: string;
  description?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: ServiceOrderStatus;
  recurrence?: string | null;
  type: string;
  assignedTechnicianId?: string | null;
  seriesId?: string | null;
};

export type SchedulingServiceOrderStatus = 'programado' | 'confirmado' | 'completado' | 'cancelado';

function mapSchedulingStatus(status: SchedulingServiceOrderStatus): ServiceOrderStatus {
  switch (status) {
    case 'programado':
      return 'scheduled';
    case 'confirmado':
      return 'confirmed';
    case 'completado':
      return 'completed';
    case 'cancelado':
      return 'cancelled';
    default:
      return 'draft';
  }
}

export function mapSchedulingStatusToServiceOrderStatus(status: SchedulingServiceOrderStatus): ServiceOrderStatus {
  return mapSchedulingStatus(status);
}

function mapPriority(type: string): ServiceOrderPriority {
  const normalized = type.toLowerCase();
  if (normalized.includes('emergen')) return 'urgent';
  if (normalized.includes('correct')) return 'high';
  if (normalized.includes('inspe')) return 'medium';
  return 'medium';
}

export function enrichServiceOrder(serviceOrder: ServiceOrder, relations: ServiceOrderRelations = {}): ServiceOrder {
  const building = relations.building ?? null;
  const contract = relations.contract ?? null;
  const management = relations.management ?? null;

  return {
    ...serviceOrder,
    dataSource: serviceOrder.dataSource ?? 'service_order',
    customerId: serviceOrder.customerId ?? management?.id ?? building?.managementCompanyId ?? null,
    contractId: serviceOrder.contractId ?? contract?.id ?? building?.contractId ?? null,
    priority: serviceOrder.priority ?? mapPriority(serviceOrder.type),
    communication:
      serviceOrder.communication ??
      (management
        ? {
            internalSummary: `Cliente asociado: ${management.name}`
          }
        : undefined)
  };
}

export function indexById<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
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

export function resolveServiceOrders(args: {
  serviceOrders: ServiceOrder[];
  buildings: Building[];
  contracts: Contract[];
  managements: ManagementCompany[];
}): ServiceOrderResolution {
  const { serviceOrders, buildings, contracts, managements } = args;
  return {
    items: hydrateServiceOrders(serviceOrders, buildings, contracts, managements),
    source: 'service_order'
  };
}

export async function loadResolvedServiceOrders() {
  const [serviceOrders, buildings, contracts, managements] = await Promise.all([
    listDocs<ServiceOrder>('service_orders').catch(() => []),
    listDocs<Building>('buildings'),
    listDocs<Contract>('contracts'),
    listDocs<ManagementCompany>('management_companies')
  ]);

  return resolveServiceOrders({
    serviceOrders,
    buildings,
    contracts,
    managements
  });
}

export async function loadResolvedTenantServiceOrders(args: {
  administrationId: string | null;
}) {
  const { administrationId } = args;

  const [serviceOrders, buildings, contracts, managements] = await Promise.all([
    listDocs<ServiceOrder>('service_orders').catch(() => []),
    administrationId
      ? listDocs<Building>('buildings', [filters().where('managementCompanyId', '==', administrationId)])
      : listDocs<Building>('buildings'),
    administrationId
      ? listDocs<Contract>('contracts', [filters().where('administrationId', '==', administrationId)])
      : listDocs<Contract>('contracts'),
    administrationId
      ? listDocs<ManagementCompany>('management_companies', [filters().where('__name__', '==', administrationId)]).catch(() => [])
      : listDocs<ManagementCompany>('management_companies')
  ]);

  const buildingIds = new Set(buildings.map((item) => item.id));
  const allowedServiceOrders = administrationId
    ? serviceOrders.filter((item) => buildingIds.has(item.buildingId) || item.customerId === administrationId)
    : serviceOrders;

  return resolveServiceOrders({
    serviceOrders: allowedServiceOrders,
    buildings,
    contracts,
    managements
  });
}

export function buildServiceOrderPayload(values: ServiceOrderMutationValues) {
  return {
    dataSource: 'service_order' as const,
    buildingId: values.buildingId,
    title: values.title,
    description: values.description ?? '',
    scheduledStartAt: values.scheduledStartAt,
    scheduledEndAt: values.scheduledEndAt,
    status: values.status,
    recurrence: values.recurrence ?? null,
    type: values.type,
    assignedTechnicianId: values.assignedTechnicianId ?? null,
    priority: mapPriority(values.type),
    seriesId: values.seriesId ?? null,
    updatedAt: new Date().toISOString()
  };
}

export async function saveServiceOrder(args: {
  values: ServiceOrderMutationValues;
  editingId: string | null;
  serviceOrders: ServiceOrder[];
}) {
  const { values, editingId, serviceOrders } = args;
  const payload = buildServiceOrderPayload(values);

  if (editingId) {
    const current = serviceOrders.find((item) => item.id === editingId) ?? null;
    if (current?.seriesId) {
      const related = serviceOrders.filter(
        (item) => item.seriesId === current.seriesId && item.id !== editingId
      );
      await Promise.all(related.map((item) => deleteDocById('service_orders', item.id)));
    }
    await updateDocById('service_orders', editingId, { ...payload, seriesId: null });
    return 'updated' as const;
  }

  await createDoc('service_orders', payload);
  return 'created' as const;
}

export async function cancelServiceOrder(serviceOrderId: string, values: { reason?: string; note?: string }) {
  await updateDocById('service_orders', serviceOrderId, {
    status: 'cancelled',
    cancelReason: values.reason || null,
    cancelNote: values.note?.trim() || null,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteServiceOrder(serviceOrderId: string) {
  await deleteDocById('service_orders', serviceOrderId);
}

export async function moveServiceOrderOnCalendar(args: {
  serviceOrderId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
}) {
  await updateDocById('service_orders', args.serviceOrderId, {
    scheduledStartAt: args.scheduledStartAt,
    scheduledEndAt: args.scheduledEndAt,
    updatedAt: new Date().toISOString()
  });
}
