import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useNavGroups } from '@/app/nav';
import { useAuth } from '@/app/Auth';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from './ActionIcons';
import { useState } from 'react';

export default function Sidebar({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  const { logout, role } = useAuth();
  const { t } = useI18n();
  const navGroups = useNavGroups(role);
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({
    calendar: false,
    main: true,
    settings: false
  });

  return (
    <aside
      className={clsx(
        'flex h-full flex-col gap-6 border-r border-white/50 bg-white/60 px-4 py-6 backdrop-blur-xl',
        collapsed ? 'w-20' : 'w-72'
      )}
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-slate-950 text-sm font-semibold text-white">
            U
          </div>
          {!collapsed ? (
            <div>
              <p className="text-base font-semibold tracking-tight text-slate-950">{t('common.appName')}</p>
              <p className="text-xs text-slate-500">{t('common.tagline')}</p>
            </div>
          ) : null}
        </div>
        {onToggle ? (
          <button
            className="rounded-xl border border-white/70 bg-white/80 p-2 text-slate-700 transition hover:-translate-y-0.5"
            onClick={onToggle}
            aria-label={collapsed ? t('common.expand') : t('common.collapse')}
            title={collapsed ? t('common.expand') : t('common.collapse')}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      <nav className="flex flex-1 flex-col gap-4">
        {navGroups.map((group, index) => {
          const groupKey = index === 0 ? 'main' : 'settings';
          const isGroupOpen = sectionOpen[groupKey] ?? true;
          return (
            <div key={group.label} className="space-y-2">
              {!collapsed ? (
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
                  onClick={() => setSectionOpen((prev) => ({ ...prev, [groupKey]: !isGroupOpen }))}
                >
                  <span>{group.label}</span>
                  {isGroupOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              ) : null}
              <div className="space-y-1">
                {isGroupOpen
                  ? group.items.map((item) => {
                      const isCalendarItem = item.sectionId === 'calendar' && item.kind !== 'section';
                      if (isCalendarItem && sectionOpen.calendar === false) return null;
                      return item.kind === 'section' ? (
                        <button
                          key={`${group.label}-${item.label}`}
                          type="button"
                          className={clsx(
                            'flex w-full items-center justify-between px-3 pt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400',
                            collapsed ? 'hidden' : 'flex'
                          )}
                          onClick={() => item.sectionId ? setSectionOpen((prev) => ({ ...prev, [item.sectionId!]: !prev[item.sectionId!] })) : null}
                        >
                          <span>{item.label}</span>
                          {item.sectionId ? sectionOpen[item.sectionId] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" /> : null}
                        </button>
                      ) : item.to ? (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            clsx(
                              'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition',
                              isActive ? 'border border-white/70 bg-white/80 text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.08)]' : 'text-slate-600 hover:bg-white/65'
                            )
                          }
                        >
                          <item.icon className="h-5 w-5" />
                          {!collapsed ? item.label : null}
                        </NavLink>
                      ) : null;
                    })
                  : null}
              </div>
            </div>
          );
        })}
      </nav>
      {!collapsed ? (
        <div className="space-y-3">
          <button
            className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-left text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5"
            onClick={() => void logout()}
          >
            {t('common.logout')}
          </button>
          <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-xs text-slate-600">{t('common.planLabel')}</div>
        </div>
      ) : null}
    </aside>
  );
}
