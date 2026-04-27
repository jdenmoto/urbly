import { useState } from 'react';
import { cancelSchedulingItem, deleteSchedulingItem, type CancelValues } from './schedulingMutations';
import type { SchedulingItem } from './schedulingItem';

export default function useSchedulingItemActions({
  t,
  toast,
  invalidateScheduling,
  resetCancel,
  editingId,
  setEditingId,
  setModalOpen,
  selected,
  setSelected
}: {
  t: (key: string) => string;
  toast: (message: string, tone?: 'success' | 'error') => void;
  invalidateScheduling: () => Promise<unknown>;
  resetCancel: (values?: Partial<CancelValues>) => void;
  editingId: string | null;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selected: SchedulingItem | null;
  setSelected: React.Dispatch<React.SetStateAction<SchedulingItem | null>>;
}) {
  const [cancelTarget, setCancelTarget] = useState<SchedulingItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchedulingItem | null>(null);

  const openCancel = (appointment: SchedulingItem) => {
    setCancelTarget(appointment);
    resetCancel({ reason: '', note: '' });
  };

  const onCancel = async (values: CancelValues) => {
    if (!cancelTarget) return;
    try {
      await cancelSchedulingItem(cancelTarget.id, values);
      await invalidateScheduling();
      toast(t('scheduling.toastCanceled'), 'success');
      setCancelTarget(null);
    } catch {
      toast(t('common.actionError'), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSchedulingItem(deleteTarget.id);
      await invalidateScheduling();
      if (editingId === deleteTarget.id) {
        setModalOpen(false);
        setEditingId(null);
      }
      if (selected?.id === deleteTarget.id) {
        setSelected(null);
      }
      toast(t('scheduling.toastDeleted'), 'success');
    } catch {
      toast(t('common.actionError'), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return {
    cancelTarget,
    setCancelTarget,
    deleteTarget,
    setDeleteTarget,
    openCancel,
    onCancel,
    confirmDelete
  };
}
