import type { Dispatch, SetStateAction } from 'react';
import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { ServiceOrder } from '@/core/models/serviceOrder';
import type { UseFormReset, UseFormSetError } from 'react-hook-form';
import { isValidDateRange } from '@/core/validators';
import { createRecurringSeries, saveAppointment, type SchedulingFormValues } from './schedulingSeries';
import type { SchedulingItem } from './schedulingItem';
import { validateSchedulingRules } from './schedulingRules';
import { isWithinBusinessHours, toLocalIso } from './schedulingUtils';

export default function useSchedulingSubmitFlow({
  canCreate,
  role,
  canScheduleEmergency,
  schedulingItems,
  editingId,
  serviceOrders,
  buildings,
  contracts,
  alignToContractStart,
  nextWorkingDate,
  isRestrictedDate,
  setError,
  toast,
  t,
  invalidateScheduling,
  reset,
  setEditingId,
  setModalOpen,
  setWizardStep,
  requestSeriesConfirmation
}: {
  canCreate: boolean;
  role: string | null | undefined;
  canScheduleEmergency: boolean;
  schedulingItems: SchedulingItem[];
  editingId: string | null;
  serviceOrders: ServiceOrder[];
  buildings: Building[];
  contracts: Contract[];
  alignToContractStart: (baseStart: Date, contractStart: Date, recurrence?: string) => Date;
  nextWorkingDate: (date: Date) => Date;
  isRestrictedDate: (value?: string) => boolean;
  setError: UseFormSetError<SchedulingFormValues>;
  toast: (message: string, tone?: 'success' | 'error') => void;
  t: (key: string) => string;
  invalidateScheduling: () => Promise<unknown>;
  reset: UseFormReset<SchedulingFormValues>;
  setEditingId: Dispatch<SetStateAction<string | null>>;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setWizardStep: Dispatch<SetStateAction<1 | 2 | 3>>;
  requestSeriesConfirmation: (values: SchedulingFormValues) => void;
}) {
  const onSubmit = async (values: SchedulingFormValues) => {
    console.log('[Scheduling] submit values', values);
    if (!canCreate) {
      toast(t('common.actionError'), 'error');
      return;
    }
    if (role === 'emergency_scheduler' && values.type !== 'emergencia') {
      setError('type', { message: t('scheduling.emergencyOnly') });
      return;
    }

    const normalizedValues = values.type === 'emergencia'
      ? { ...values, recurrence: '' }
      : values;

    if (!isValidDateRange(normalizedValues.startAt, normalizedValues.endAt)) {
      setError('endAt', { message: t('errors.invalidDateRange') });
      return;
    }

    const startIso = toLocalIso(normalizedValues.startAt);
    const endIso = toLocalIso(normalizedValues.endAt);
    console.log('[Scheduling] normalized dates', { startIso, endIso });
    const isEmergency = normalizedValues.type === 'emergencia';

    if (!isEmergency && !isWithinBusinessHours(startIso, endIso)) {
      setError('startAt', { message: t('scheduling.businessHoursStart') });
      setError('endAt', { message: t('scheduling.businessHoursEnd') });
      return;
    }
    if ((isRestrictedDate(startIso) || isRestrictedDate(endIso)) && !isEmergency) {
      setError('startAt', { message: t('scheduling.dateBlocked') });
      return;
    }
    if ((isRestrictedDate(startIso) || isRestrictedDate(endIso)) && isEmergency && !canScheduleEmergency) {
      setError('type', { message: t('scheduling.emergencyPermission') });
      return;
    }

    try {
      const ruleViolation = validateSchedulingRules({
        schedulingItems,
        buildingId: normalizedValues.buildingId,
        employeeId: normalizedValues.employeeId || null,
        startIso,
        endIso,
        type: normalizedValues.type,
        editingId,
        isRestrictedDate
      });
      if (ruleViolation) {
        setError('startAt', { message: ruleViolation.message });
        return;
      }

      if (editingId && normalizedValues.recurrence) {
        requestSeriesConfirmation(normalizedValues);
        return;
      }
      if (editingId && !normalizedValues.recurrence) {
        await saveAppointment({ values: normalizedValues, editingId, serviceOrders });
      } else if (normalizedValues.recurrence) {
        await createRecurringSeries({
          values: normalizedValues,
          buildings,
          contracts,
          alignToContractStart,
          nextWorkingDate,
          setError,
          toast,
          t,
          isRestrictedDate
        });
      } else {
        await saveAppointment({ values: normalizedValues, editingId: null, serviceOrders });
      }

      await invalidateScheduling();
      reset();
      setEditingId(null);
      setModalOpen(false);
      setWizardStep(1);
      toast(editingId ? t('scheduling.toastUpdated') : t('scheduling.toastCreated'), 'success');
    } catch {
      toast(t('common.actionError'), 'error');
    }
  };

  return { onSubmit };
}
