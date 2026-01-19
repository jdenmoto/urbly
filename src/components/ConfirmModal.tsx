import type { ReactNode } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useI18n } from '@/lib/i18n';

export default function ConfirmModal({
  open,
  title,
  description,
  onConfirm,
  onClose
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Modal open={open} title={title} onClose={onClose}>
      {description ? <p className="text-sm text-ink-700">{description}</p> : null}
      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={onConfirm}>{t('common.confirm')}</Button>
      </div>
    </Modal>
  );
}
