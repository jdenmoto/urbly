import { useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/app/Auth';
import { useNavGroups } from '@/app/nav';

export default function TopBar() {
  const { t } = useI18n();
  const location = useLocation();
  const { role } = useAuth();
  const navGroups = useNavGroups(role);
  const currentItem = navGroups.flatMap((group) => group.items).find((item) => item.to === location.pathname);
  const currentGroup = navGroups.find((group) => group.items.some((item) => item.to === location.pathname));

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f7f9fc]/90 px-4 py-4 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{currentGroup?.label ?? t('common.panelTitle')}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{currentItem?.label ?? t('common.panelTitle')}</p>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{currentGroup?.description ?? t('common.panelSubtitle')}</p>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            {t('common.tagline')}
          </div>
          <div className="rounded-full border border-slate-900 bg-slate-950 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            {t('common.panelTitle')}
          </div>
        </div>
      </div>
    </header>
  );
}
