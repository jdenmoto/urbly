import { useState, type Dispatch, type SetStateAction } from 'react';
import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { ServiceOrder } from '@/core/models/serviceOrder';
import type { FieldPath, UseFormReset, UseFormSetError } from 'react-hook-form';
import { regenerateSeries, type SchedulingFormValues } from './schedulingSeries';
import type { SchedulingItem } from './schedulingItem';

type FormValues = SchedulingFormValues;

export default function useSchedulingSeriesFlow({
  editingId,
  schedulingItems,
  serviceOrders,
  buildings,
  contracts,
  alignToContractStart,
  nextWorkingDate,
  setError,
  toast,
  t,
  isRestrictedDate,
  invalidateScheduling,
  reset,
  setEditingId,
  setModalOpen,
  setWizardStep
}: {
  editingId: string | null;
  schedulingItems: SchedulingItem[];
  serviceOrders: ServiceOrder[];
  buildings: Building[];
  contracts: Contract[];
  alignToContractStart: (baseStart: Date, contractStart: Date, step?: string) => Date;
  nextWorkingDate: (date: Date) => Date;
  setError: UseFormSetError<FormValues>;
  toast: (message: string, tone?: 'success' | 'error') => void;
  t: (key: string) => string;
  isRestrictedDate: (value?: string) => boolean;
  invalidateScheduling: () => Promise<unknown>;
  reset: UseFormReset<FormValues>;
  setEditingId: Dispatch<SetStateAction<string | null>>;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setWizardStep: Dispatch<SetStateAction<1 | 2 | 3>>;
}) {
  const [seriesConfirmOpen, setSeriesConfirmOpen] = useState(false);
  const [pendingSeriesValues, setPendingSeriesValues] = useState<FormValues | null>(null);

  const requestSeriesConfirmation = (values: FormValues) => {
    setPendingSeriesValues(values);
    setSeriesConfirmOpen(true);
  };

  const closeSeriesConfirmation = () => {
    setSeriesConfirmOpen(false);
    setPendingSeriesValues(null);
  };

  const confirmSeriesRegeneration = async () => {
    if (!editingId || !pendingSeriesValues) {
      setSeriesConfirmOpen(false);
      return;
    }
    const current = schedulingItems.find((item) => item.id === editingId) ?? null;
    try {
      await regenerateSeries({
        values: pendingSeriesValues,
        current,
        serviceOrders,
        buildings,
        contracts,
        alignToContractStart,
        nextWorkingDate,
        setError: (field: FieldPath<FormValues>, error: { message: string }) => setError(field, error),
        toast,
        t,
        isRestrictedDate
      });
      await invalidateScheduling();
      reset();
      setEditingId(null);
      setModalOpen(false);
      setWizardStep(1);
      toast(t('scheduling.toastUpdated'), 'success');
    } catch {
      toast(t('common.actionError'), 'error');
    } finally {
      closeSeriesConfirmation();
    }
  };

  return {
    seriesConfirmOpen,
    requestSeriesConfirmation,
    closeSeriesConfirmation,
    confirmSeriesRegeneration
  };
}
