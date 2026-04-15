import { useI18n } from '@/lib/i18n';

export default function TopBar() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-white/65 px-4 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-tight text-slate-950">{t('common.panelTitle')}</p>
          <p className="text-xs text-slate-500">{t('common.panelSubtitle')}</p>
        </div>
        <div className="hidden rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs font-semibold text-slate-600 md:inline-flex">
          {t('common.tagline')}
        </div>
      </div>
    </header>
  );
}
