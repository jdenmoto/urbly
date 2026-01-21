import { useEffect, type ReactNode } from 'react';
import Button from './Button';
import { useI18n } from '@/lib/i18n';

export default function Modal({
  open,
  title,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  if (!open) return null;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex w-full max-w-lg max-h-[80vh] flex-col rounded-2xl bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
          </div>
          <Button variant="ghost" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
