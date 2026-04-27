import { addDays, addMonths, isAfter } from 'date-fns';
import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { ServiceOrder } from '@/core/models/serviceOrder';
import { createDoc, deleteDocById } from '@/lib/api/firestore';
import { buildServiceOrderPayload, mapAppointmentStatusToServiceOrderStatus, saveServiceOrder } from '@/lib/api/serviceOrders';
import { formatLocalIso, toLocalIso } from './schedulingUtils';
import { validateSchedulingRules } from './schedulingRules';
import { buildSchedulingItemsForValidation } from './schedulingSelectors';
import type { SchedulingItem } from './schedulingItem';

export type SchedulingFormValues = {
  buildingId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  status: string;
  recurrence?: string;
  type: string;
  employeeId?: string;
};

export function buildAppointmentPayload(values: SchedulingFormValues) {
  return {
    buildingId: values.buildingId,
    title: values.title,
    description: values.description ?? '',
    startAt: toLocalIso(values.startAt),
    endAt: toLocalIso(values.endAt),
    status: values.status,
    recurrence: values.recurrence || null,
    type: values.type,
    employeeId: values.employeeId || null,
    seriesId: null as string | null
  };
}

function toAppointmentStatus(status: string) {
  return status === 'programado' || status === 'confirmado' || status === 'completado' || status === 'cancelado'
    ? status
    : 'programado';
}

export async function regenerateSeries(args: {
  values: SchedulingFormValues;
  current: SchedulingItem | null;
  serviceOrders?: ServiceOrder[];
  buildings: Building[];
  contracts: Contract[];
  alignToContractStart: (baseStart: Date, contractStart: Date, step: string) => Date;
  nextWorkingDate: (date: Date) => Date;
  setError: (field: 'endAt', error: { message: string }) => void;
  toast: (message: string, tone?: 'success' | 'error') => void;
  t: (key: string) => string;
  isRestrictedDate: (value?: string) => boolean;
}) {
  const { values, current, serviceOrders = [], buildings, contracts, alignToContractStart, nextWorkingDate, setError, toast, t, isRestrictedDate } = args;
  const seriesId = current?.seriesId ?? (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
  const relatedOrders = serviceOrders.filter((item) => item.seriesId === seriesId);
  if (relatedOrders.length) {
    await Promise.all(relatedOrders.map((item) => deleteDocById('service_orders', item.id)));
  } else if (current?.source === 'service_order') {
    await deleteDocById('service_orders', current.id);
  } else if (current?.source === 'appointment_fallback') {
    await deleteDocById('appointments', current.sourceId);
  }

  const building = buildings.find((item) => item.id === values.buildingId);
  const contract = building?.contractId ? contracts.find((item) => item.id === building.contractId) : null;
  if (!contract?.startAt || !contract?.endAt) {
    toast(t('scheduling.contractRequired'), 'error');
    return;
  }

  const contractStart = new Date(contract.startAt);
  const contractEnd = new Date(contract.endAt);
  const baseStart = new Date(toLocalIso(values.startAt));
  const baseEnd = new Date(toLocalIso(values.endAt));
  const durationMs = baseEnd.getTime() - baseStart.getTime();
  if (Number.isNaN(contractStart.getTime()) || Number.isNaN(contractEnd.getTime())) {
    toast(t('scheduling.contractRequired'), 'error');
    return;
  }
  if (isAfter(baseStart, contractEnd)) {
    toast(t('scheduling.contractOutOfRange'), 'error');
    return;
  }
  if (durationMs <= 0) {
    setError('endAt', { message: t('errors.invalidDateRange') });
    return;
  }

  const step = values.recurrence ?? '';
  let cursor = alignToContractStart(baseStart, contractStart, step);
  const nextDate = (date: Date) => {
    switch (step) {
      case 'semanal':
        return addDays(date, 7);
      case 'quincenal':
        return addDays(date, 15);
      case 'mensual':
        return addMonths(date, 1);
      case 'bimensual':
        return addMonths(date, 2);
      case 'semestral':
        return addMonths(date, 6);
      default:
        return addMonths(date, 1);
    }
  };

  const tasks: Promise<unknown>[] = [];
  while (!isAfter(cursor, contractEnd)) {
    const scheduledStart = nextWorkingDate(cursor);
    if (!isAfter(scheduledStart, contractEnd)) {
      const end = new Date(scheduledStart.getTime() + durationMs);
      const schedulingItems = buildSchedulingItemsForValidation({
        serviceOrders
      });
      const violation = validateSchedulingRules({
        schedulingItems,
        buildingId: values.buildingId,
        employeeId: values.employeeId || null,
        startIso: formatLocalIso(scheduledStart),
        endIso: formatLocalIso(end),
        type: values.type,
        isRestrictedDate
      });
      if (violation) {
        cursor = nextDate(cursor);
        continue;
      }
      tasks.push(
        createDoc('service_orders', {
          ...buildServiceOrderPayload({
            buildingId: values.buildingId,
            title: values.title,
            description: values.description,
            scheduledStartAt: formatLocalIso(scheduledStart),
            scheduledEndAt: formatLocalIso(end),
            status: mapAppointmentStatusToServiceOrderStatus(toAppointmentStatus(values.status)),
            recurrence: values.recurrence || null,
            type: values.type,
            assignedTechnicianId: values.employeeId || null,
            seriesId
          })
        })
      );
    }
    cursor = nextDate(cursor);
  }
  await Promise.all(tasks);
}

export async function saveAppointment(args: {
  values: SchedulingFormValues;
  editingId: string | null;
  serviceOrders?: ServiceOrder[];
}) {
  const { values, editingId, serviceOrders = [] } = args;
  return saveServiceOrder({
    values: {
      buildingId: values.buildingId,
      title: values.title,
      description: values.description,
      scheduledStartAt: toLocalIso(values.startAt),
      scheduledEndAt: toLocalIso(values.endAt),
      status: mapAppointmentStatusToServiceOrderStatus(toAppointmentStatus(values.status)),
      recurrence: values.recurrence || null,
      type: values.type,
      assignedTechnicianId: values.employeeId || null,
      seriesId: null
    },
    editingId,
    serviceOrders
  });
}

export async function createRecurringSeries(args: {
  values: SchedulingFormValues;
  buildings: Building[];
  contracts: Contract[];
  alignToContractStart: (baseStart: Date, contractStart: Date, step: string) => Date;
  nextWorkingDate: (date: Date) => Date;
  setError: (field: 'endAt', error: { message: string }) => void;
  toast: (message: string, tone?: 'success' | 'error') => void;
  t: (key: string) => string;
  serviceOrders?: ServiceOrder[];
  isRestrictedDate: (value?: string) => boolean;
}) {
  await regenerateSeries({
    ...args,
    current: null,
  });
}
