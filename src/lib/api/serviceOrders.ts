import type { Appointment, AppointmentIssue } from '@/core/models/appointment';
import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { ManagementCompany } from '@/core/models/managementCompany';
import type {
  ServiceOrder,
  ServiceOrderDataSource,
  ServiceOrderIssue,
  ServiceOrderPriority,
  ServiceOrderStatus,
  ServiceOrderTimelineEvent
} from '@/core/models/serviceOrder';
import { createDoc, deleteDocById, filters, listDocs, updateDocById } from './firestore';

export type AppointmentRelations = {
  building?: Building | null;
  contract?: Contract | null;
  management?: ManagementCompany | null;
};

export type ServiceOrderRelations = AppointmentRelations;

export type ServiceOrderResolution = {
  items: ServiceOrder[];
  source: ServiceOrderDataSource;
  fallbackReason?: string;
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

function mapStatus(status: Appointment['status']): ServiceOrderStatus {
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

export function mapAppointmentStatusToServiceOrderStatus(status: Appointment['status']): ServiceOrderStatus {
  return mapStatus(status);
}

function mapPriority(type: string): ServiceOrderPriority {
  const normalized = type.toLowerCase();
  if (normalized.includes('emergen')) return 'urgent';
  if (normalized.includes('correct')) return 'high';
  if (normalized.includes('inspe')) return 'medium';
  return 'medium';
}

function mapIssues(issues?: AppointmentIssue[]): ServiceOrderIssue[] {
  return (issues ?? []).map((issue) => ({
    id: issue.id,
    type: issue.type,
    category: issue.category,
    description: issue.description,
    photos: issue.photos,
    createdAt: issue.createdAt
  }));
}

export function buildAppointmentTimeline(appointment: Appointment): ServiceOrderTimelineEvent[] {
  const timeline: ServiceOrderTimelineEvent[] = [];

  if (appointment.createdAt) {
    timeline.push({
      id: `${appointment.id}-created`,
      type: 'created',
      createdAt: appointment.createdAt,
      actorRole: 'system',
      summary: 'Servicio creado'
    });
  }

  timeline.push({
    id: `${appointment.id}-scheduled`,
    type: 'scheduled',
    createdAt: appointment.startAt,
    actorRole: 'company',
    summary: 'Servicio agendado'
  });

  if (appointment.employeeId) {
    timeline.push({
      id: `${appointment.id}-assigned`,
      type: 'assigned',
      createdAt: appointment.startAt,
      actorRole: 'company',
      actorId: appointment.employeeId,
      summary: 'Tecnico asignado'
    });
  }

  if (appointment.completedAt) {
    timeline.push({
      id: `${appointment.id}-completed`,
      type: 'completed',
      createdAt: appointment.completedAt,
      actorRole: 'technician',
      summary: 'Servicio completado'
    });
  }

  if (appointment.status === 'cancelado') {
    timeline.push({
      id: `${appointment.id}-cancelled`,
      type: 'cancelled',
      createdAt: appointment.completedAt ?? appointment.endAt,
      actorRole: 'company',
      summary: appointment.cancelReason ? `Servicio cancelado: ${appointment.cancelReason}` : 'Servicio cancelado'
    });
  }

  return timeline.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function mapAppointmentToServiceOrder(
  appointment: Appointment,
  relations: AppointmentRelations = {}
): ServiceOrder {
  const building = relations.building ?? null;
  const contract = relations.contract ?? null;
  const management = relations.management ?? null;

  return {
    id: appointment.id,
    appointmentId: appointment.id,
    dataSource: 'appointment_fallback',
    customerId: management?.id ?? building?.managementCompanyId ?? null,
    buildingId: appointment.buildingId,
    contractId: contract?.id ?? building?.contractId ?? null,
    title: appointment.title,
    description: appointment.description,
    type: appointment.type,
    priority: mapPriority(appointment.type),
    status: mapStatus(appointment.status),
    scheduledStartAt: appointment.startAt,
    scheduledEndAt: appointment.endAt,
    assignedTechnicianId: appointment.employeeId ?? null,
    recurrence: appointment.recurrence ?? null,
    seriesId: appointment.seriesId ?? null,
    issues: mapIssues(appointment.issues),
    attachments: appointment.completionPhotos ?? [],
    completionPhotos: appointment.completionPhotos ?? [],
    report: appointment.completionReport as ServiceOrder['report'],
    communication: {
      internalSummary: management ? `Cliente asociado: ${management.name}` : undefined
    },
    timeline: buildAppointmentTimeline(appointment),
    cancelReason: appointment.cancelReason ?? null,
    cancelNote: appointment.cancelNote ?? null,
    completedAt: appointment.completedAt ?? null,
    createdAt: appointment.createdAt,
    updatedAt: appointment.completedAt ?? appointment.createdAt
  };
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

export function resolveServiceOrders(args: {
  serviceOrders: ServiceOrder[];
  appointments: Appointment[];
  buildFromAppointments: () => ServiceOrder[];
  hydrateCanonical: () => ServiceOrder[];
}): ServiceOrderResolution {
  const { serviceOrders, appointments, buildFromAppointments, hydrateCanonical } = args;

  if (serviceOrders.length > 0) {
    return {
      items: hydrateCanonical(),
      source: 'service_order'
    };
  }

  return {
    items: buildFromAppointments(),
    source: 'appointment_fallback',
    fallbackReason: appointments.length > 0 ? 'service_orders vacío, se proyecta desde appointments legacy' : 'sin datos canónicos ni legacy'
  };
}

export async function loadResolvedServiceOrders() {
  const [serviceOrders, appointments, buildings, contracts, managements] = await Promise.all([
    listDocs<ServiceOrder>('service_orders').catch(() => []),
    listDocs<Appointment>('appointments').catch(() => []),
    listDocs<Building>('buildings'),
    listDocs<Contract>('contracts'),
    listDocs<ManagementCompany>('management_companies')
  ]);

  return resolveServiceOrdersFromSources({
    serviceOrders,
    appointments,
    buildings,
    contracts,
    managements
  });
}

export async function loadResolvedTenantServiceOrders(args: {
  administrationId: string | null;
}) {
  const { administrationId } = args;

  const [serviceOrders, appointments, buildings, contracts, managements] = await Promise.all([
    listDocs<ServiceOrder>('service_orders').catch(() => []),
    listDocs<Appointment>('appointments').catch(() => []),
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
  const allowedAppointments = administrationId
    ? appointments.filter((item) => buildingIds.has(item.buildingId))
    : appointments;
  const allowedServiceOrders = administrationId
    ? serviceOrders.filter((item) => buildingIds.has(item.buildingId) || item.customerId === administrationId)
    : serviceOrders;

  return resolveServiceOrdersFromSources({
    serviceOrders: allowedServiceOrders,
    appointments: allowedAppointments,
    buildings,
    contracts,
    managements
  });
}

export function resolveServiceOrdersFromSources(args: {
  serviceOrders: ServiceOrder[];
  appointments: Appointment[];
  buildings: Building[];
  contracts: Contract[];
  managements: ManagementCompany[];
}): ServiceOrderResolution {
  const { serviceOrders, appointments, buildings, contracts, managements } = args;

  return resolveServiceOrders({
    serviceOrders,
    appointments,
    hydrateCanonical: () => hydrateServiceOrders(serviceOrders, buildings, contracts, managements),
    buildFromAppointments: () => buildServiceOrders(appointments, buildings, contracts, managements)
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
