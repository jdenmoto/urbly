import { useLocation } from 'react-router-dom';
import { useAuth } from '@/app/Auth';
import type { AppUserRole } from '@/core/models/appUser';
import { useNavGroups } from '@/app/nav';
import { useI18n } from '@/lib/i18n';

export default function ShellContextPanel() {
  const { role } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navGroups = useNavGroups(role);
  const currentGroup = navGroups.find((group) => group.items.some((item) => item.to === location.pathname));

  if (!currentGroup) return null;

  return (
    <aside className="hidden w-[320px] shrink-0 border-l border-slate-200/80 bg-[#f4f7fb] px-5 py-6 xl:block">
      <div className="sticky top-24 space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('shell.workspace.label')}</p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{currentGroup.label}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{currentGroup.description ?? t('common.panel.subtitle')}</p>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('shell.execution.mode.label')}</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{t('shell.execution.mode.value')}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('shell.usage.label')}</p>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
            <li>{t('shell.usage.point.one')}</li>
            <li>{t('shell.usage.point.two')}</li>
            <li>{t('shell.usage.point.three')}</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-slate-100 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t('shell.focus.label')}</p>
          <p className="mt-2 text-base font-semibold text-white">{t('shell.focus.title')}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{t('shell.focus.description')}</p>
        </div>
      </div>
    </aside>
  );
}
