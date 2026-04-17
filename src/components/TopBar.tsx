import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/app/Auth';
import { useList } from '@/lib/api/queries';
import type { InternalNotification } from '@/core/models/internalNotification';
import { markInternalNotificationRead } from '@/lib/internalNotifications';
import type { AppUserRole } from '@/core/models/appUser';
import { useNavGroups } from '@/app/nav';

export default function TopBar() {
  const { t } = useI18n();
  const location = useLocation();
  const { role, user } = useAuth();
  const [openNotifications, setOpenNotifications] = useState(false);
  const { data: notifications = [] } = useList<InternalNotification>('internalNotifications', 'internal_notifications');
  const navGroups = useNavGroups(role);
  const currentItem = navGroups.flatMap((group) => group.items).find((item) => item.to === location.pathname);
  const scopedNotifications = useMemo(() => notifications.filter((item) => !item.userId || item.userId === user?.uid).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [notifications, user?.uid]);
  const unreadCount = scopedNotifications.filter((item) => !item.read).length;
  const currentGroup = navGroups.find((group) => group.items.some((item) => item.to === location.pathname));

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f7f9fc]/92 px-4 py-4 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{currentGroup?.label ?? t('common.panelTitle')}</p>
            <span className="hidden rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 md:inline-flex">
              {t('shell.workspaceBadge')}
            </span>
          </div>
          <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{currentItem?.label ?? t('common.panelTitle')}</p>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{currentGroup?.description ?? t('common.panelSubtitle')}</p>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            {t('common.tagline')}
          </div>
          <button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            {t('shell.globalSearchPlaceholder')}
          </button>
          <div className="relative">
            <button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm" onClick={() => setOpenNotifications((v) => !v)}>
              Notificaciones {unreadCount ? `(${unreadCount})` : ''}
            </button>
            {openNotifications ? (
              <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="space-y-2">
                  {scopedNotifications.length ? scopedNotifications.slice(0, 8).map((item) => (
                    <button key={item.id} className="block w-full rounded-xl border border-slate-100 px-3 py-3 text-left hover:bg-slate-50" onClick={() => void markInternalNotificationRead(item.id)}>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                    </button>
                  )) : <p className="text-sm text-slate-500">Sin notificaciones.</p>}
                </div>
              </div>
            ) : null}
          </div>
          <div className="rounded-full border border-slate-900 bg-slate-950 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            {t('common.panelTitle')}
          </div>
        </div>
      </div>
    </header>
  );
}
