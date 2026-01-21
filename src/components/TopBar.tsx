import { useI18n } from '@/lib/i18n';

export default function TopBar() {
  const { t } = useI18n();
  return (
    <header className="flex items-center justify-between gap-4 border-b border-fog-200 bg-white/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">{t('common.panelTitle')}</p>
          <p className="text-xs text-ink-500">{t('common.panelSubtitle')}</p>
        </div>
      </div>
    </header>
  );
}
