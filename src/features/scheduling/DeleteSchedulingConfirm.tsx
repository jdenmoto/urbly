import ConfirmModal from '@/components/ConfirmModal';

export default function DeleteSchedulingConfirm({
  open,
  onConfirm,
  onClose,
  t
}: {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  return (
    <ConfirmModal
      open={open}
      title={t('scheduling.deleteTitle')}
      description={t('scheduling.deleteConfirm')}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
