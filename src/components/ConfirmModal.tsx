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
    <Modal open={open} title={title} onClose={onClose} layer="confirm">
      <div className="space-y-6">
        {description ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700 shadow-sm">
            {description}
          </div>
        ) : null}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onConfirm}>{t('common.confirm')}</Button>
        </div>
      </div>
    </Modal>
  );
}
