import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/app/Auth';
import { useList } from '@/lib/api/queries';
import type { InternalNotification } from '@/core/models/internalNotification';
import { markInternalNotificationRead } from '@/lib/internalNotifications';
import { useNavGroups } from '@/app/nav';

const roleBadgeKey: Record<string, string> = {
  owner: 'roles.company',
  admin: 'roles.company',
  editor: 'roles.company',
  view: 'roles.company',
  supervisor: 'roles.supervisor',
  scheduler: 'roles.operations',
  operator: 'roles.operations',
  auditoria: 'roles.audit',
  technician: 'roles.technician',
  emergency_scheduler: 'roles.technician',
  building_admin: 'roles.client',
  client: 'roles.client'
};

export default function TopBar() {
  const { t } = useI18n();
  const location = useLocation();
  const { role, permissions, user } = useAuth();
  const [openNotifications, setOpenNotifications] = useState(false);
  const notificationsDesktopRef = useRef<HTMLDivElement | null>(null);
  const notificationsMobileRef = useRef<HTMLDivElement | null>(null);
  const notificationsDesktopPanelRef = useRef<HTMLDivElement | null>(null);
  const notificationsMobilePanelRef = useRef<HTMLDivElement | null>(null);
  const { data: notifications = [] } = useList<InternalNotification>('internalNotifications', 'internal_notifications');
  const navGroups = useNavGroups(role, permissions);
  const currentItem = navGroups.flatMap((group) => group.items).find((item) => item.to === location.pathname);
  const scopedNotifications = useMemo(() => notifications.filter((item) => !item.userId || item.userId === user?.uid).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [notifications, user?.uid]);
  const unreadCount = scopedNotifications.filter((item) => !item.read).length;
  const currentGroup = navGroups.find((group) => group.items.some((item) => item.to === location.pathname));

  useEffect(() => {
    if (!openNotifications) return;

    const activePanel = notificationsDesktopPanelRef.current ?? notificationsMobilePanelRef.current;
    const firstFocusable = activePanel?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const inDesktop = notificationsDesktopRef.current?.contains(target) ?? false;
      const inMobile = notificationsMobileRef.current?.contains(target) ?? false;
      if (!inDesktop && !inMobile) {
        setOpenNotifications(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenNotifications(false);
      }
    }

    function onTabCycle(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const panel = notificationsDesktopPanelRef.current ?? notificationsMobilePanelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    document.addEventListener('keydown', onTabCycle);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
      document.removeEventListener('keydown', onTabCycle);
    };
  }, [openNotifications]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f7f9fc]/92 px-4 py-4 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{currentGroup?.label ?? t('common.panel.title')}</p>
            <span className="hidden rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 md:inline-flex">
              {t('shell.workspace.badge')}
            </span>
          </div>
          <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{currentItem?.label ?? t('common.panel.title')}</p>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{currentGroup?.description ?? t('common.panel.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            {roleBadgeKey[role] ? t(roleBadgeKey[role]) : t('common.tagline')}
          </div>
          <div ref={notificationsMobileRef} className="relative">
            <button
              type="button"
              aria-expanded={openNotifications}
              aria-haspopup="dialog"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
              onClick={() => setOpenNotifications((v) => !v)}
            >
              {t('notifications.empty.title')} {unreadCount ? `(${unreadCount})` : ''}
            </button>
            {openNotifications ? (
              <div ref={notificationsMobilePanelRef} tabIndex={-1} className="absolute right-0 z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl" role="dialog" aria-label={t('notifications.title')}>
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('notifications.title')}</p>
                  <Link className="text-xs font-semibold text-slate-700 hover:text-slate-900" to="/notifications" onClick={() => setOpenNotifications(false)}>
                    {t('common.view')}
                  </Link>
                </div>
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {scopedNotifications.length ? scopedNotifications.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="block w-full rounded-xl border border-slate-100 px-3 py-3 text-left hover:bg-slate-50"
                      onClick={() => void markInternalNotificationRead(item.id)}
                    >
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                    </button>
                  )) : <p className="text-sm text-slate-500">{t('notifications.empty.none')}</p>}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            {roleBadgeKey[role] ? t(roleBadgeKey[role]) : t('common.tagline')}
          </div>
          <button
            type="button"
            aria-disabled
            disabled
            title={t('common.not.available')}
            className="cursor-not-allowed rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm"
          >
            {t('shell.global.search.placeholder')}
          </button>
          <div ref={notificationsDesktopRef} className="relative">
            <button
              type="button"
              aria-expanded={openNotifications}
              aria-haspopup="dialog"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
              onClick={() => setOpenNotifications((v) => !v)}
            >
              {t('notifications.empty.title')} {unreadCount ? `(${unreadCount})` : ''}
            </button>
            {openNotifications ? (
              <div ref={notificationsDesktopPanelRef} tabIndex={-1} className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl" role="dialog" aria-label={t('notifications.title')}>
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('notifications.title')}</p>
                  <Link className="text-xs font-semibold text-slate-700 hover:text-slate-900" to="/notifications" onClick={() => setOpenNotifications(false)}>
                    {t('common.view')}
                  </Link>
                </div>
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {scopedNotifications.length ? scopedNotifications.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="block w-full rounded-xl border border-slate-100 px-3 py-3 text-left hover:bg-slate-50"
                      onClick={() => void markInternalNotificationRead(item.id)}
                    >
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                    </button>
                  )) : <p className="text-sm text-slate-500">{t('notifications.empty.none')}</p>}
                </div>
              </div>
            ) : null}
          </div>
          <div className="rounded-full border border-slate-900 bg-slate-950 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            {user?.email ?? (roleBadgeKey[role] ? t(roleBadgeKey[role]) : t('common.panel.title'))}
          </div>
        </div>
      </div>
    </header>
  );
}
