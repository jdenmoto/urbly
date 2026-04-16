import { addDays, addMonths, isAfter } from 'date-fns';
import type { Appointment } from '@/core/models/appointment';
import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import { createDoc, deleteDocById, updateDocById } from '@/lib/api/firestore';
import { formatLocalIso, toLocalIso } from './schedulingUtils';

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

export async function regenerateSeries(args: {
  values: SchedulingFormValues;
  current: Appointment | null;
  appointments: Appointment[];
  buildings: Building[];
  contracts: Contract[];
  alignToContractStart: (baseStart: Date, contractStart: Date, step: string) => Date;
  nextWorkingDate: (date: Date) => Date;
  setError: (field: 'endAt', error: { message: string }) => void;
  toast: (message: string, tone?: 'success' | 'error') => void;
  t: (key: string) => string;
}) {
  const { values, current, appointments, buildings, contracts, alignToContractStart, nextWorkingDate, setError, toast, t } = args;
  const seriesId = current?.seriesId ?? (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
  const related = appointments.filter((item) => item.seriesId === seriesId);
  if (related.length) {
    await Promise.all(related.map((item) => deleteDocById('appointments', item.id)));
  } else if (current) {
    await deleteDocById('appointments', current.id);
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

  const payload = {
    ...buildAppointmentPayload(values),
    seriesId
  };
  const tasks: Promise<unknown>[] = [];
  while (!isAfter(cursor, contractEnd)) {
    const scheduledStart = nextWorkingDate(cursor);
    if (!isAfter(scheduledStart, contractEnd)) {
      const end = new Date(scheduledStart.getTime() + durationMs);
      tasks.push(
        createDoc('appointments', {
          ...payload,
          startAt: formatLocalIso(scheduledStart),
          endAt: formatLocalIso(end)
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
  appointments: Appointment[];
}) {
  const { values, editingId, appointments } = args;
  const payload = buildAppointmentPayload(values);

  if (editingId) {
    const current = appointments.find((item) => item.id === editingId) ?? null;
    if (current?.seriesId) {
      const related = appointments.filter((item) => item.seriesId === current.seriesId && item.id !== editingId);
      await Promise.all(related.map((item) => deleteDocById('appointments', item.id)));
    }
    await updateDocById('appointments', editingId, { ...payload, seriesId: null });
    return 'updated' as const;
  }

  await createDoc('appointments', payload);
  return 'created' as const;
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
}) {
  await regenerateSeries({
    ...args,
    current: null,
    appointments: []
  });
}
