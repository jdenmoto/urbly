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
        'flex h-full flex-col gap-6 border-r border-fog-200 bg-white/80 px-4 py-6 backdrop-blur',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-white">U</div>
          {!collapsed ? (
            <div>
            <p className="text-base font-semibold text-ink-900">{t('common.appName')}</p>
            <p className="text-xs text-ink-500">{t('common.tagline')}</p>
            </div>
          ) : null}
          </div>
          {onToggle ? (
            <button
              className="rounded-lg border border-fog-200 p-1 text-ink-700 hover:border-ink-900"
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
                className="flex w-full items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400"
                onClick={() =>
                  setSectionOpen((prev) => ({ ...prev, [groupKey]: !isGroupOpen }))
                }
              >
                <span>{group.label}</span>
                {isGroupOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            ) : null}
            <div className="space-y-1">
              {isGroupOpen
                ? group.items.map((item) => {
                const isCalendarItem = item.sectionId === 'calendar' && item.kind !== 'section';
                if (isCalendarItem && sectionOpen.calendar === false) {
                  return null;
                }
                return (
                item.kind === 'section' ? (
                  <button
                    key={`${group.label}-${item.label}`}
                    type="button"
                    className={clsx(
                      'flex w-full items-center justify-between px-3 pt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-400',
                      collapsed ? 'hidden' : 'flex'
                    )}
                    onClick={() =>
                      item.sectionId
                        ? setSectionOpen((prev) => ({ ...prev, [item.sectionId!]: !prev[item.sectionId!] }))
                        : null
                    }
                  >
                    <span>{item.label}</span>
                    {item.sectionId ? (
                      sectionOpen[item.sectionId] ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    ) : null}
                  </button>
                ) : (
                  item.to ? (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                        isActive ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-fog-100'
                      )
                    }
                  >
                      <item.icon className="h-5 w-5" />
                      {!collapsed ? item.label : null}
                    </NavLink>
                  ) : null
                )
                );
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
            className="w-full rounded-xl border border-fog-200 bg-white px-4 py-2 text-left text-xs font-semibold text-ink-700 hover:border-ink-900"
            onClick={() => void logout()}
          >
            {t('common.logout')}
          </button>
          <div className="rounded-xl bg-fog-100 px-4 py-3 text-xs text-ink-600">
            {t('common.planLabel')}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
