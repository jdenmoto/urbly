import { useEffect, type ReactNode } from 'react';
import Button from './Button';
import { useI18n } from '@/lib/i18n';

export default function Modal({
  open,
  title,
  onClose,
  children,
  layer = 'base'
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  layer?: 'base' | 'confirm';
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm ${layer === 'confirm' ? 'z-[70]' : 'z-50'}`}
    >
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-white/15 bg-[#f8fafc] shadow-[0_32px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-6 py-5 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace modal</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
          </div>
          <Button variant="ghost" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
