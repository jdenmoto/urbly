import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useNavGroups } from '@/app/nav';
import { useAuth } from '@/app/Auth';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from './ActionIcons';
import { useState } from 'react';

const roleLabelKey: Record<string, string> = {
  owner: 'roles.company',
  admin: 'roles.company',
  editor: 'roles.company',
  view: 'roles.company',
  supervisor: 'roles.operations',
  scheduler: 'roles.operations',
  operator: 'roles.operations',
  auditoria: 'roles.audit',
  technician: 'roles.technician',
  emergency_scheduler: 'roles.technician',
  building_admin: 'roles.client',
  client: 'roles.client'
};

export default function Sidebar({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  const { logout, role, permissions } = useAuth();
  const { t } = useI18n();
  const navGroups = useNavGroups(role, permissions);
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({
    calendar: false
  });

  return (
    <aside
      className={clsx(
        'flex h-full flex-col gap-6 border-r border-slate-200/70 bg-slate-950 px-4 py-6 text-slate-100 shadow-[16px_0_40px_rgba(15,23,42,0.08)]',
        collapsed ? 'w-20' : 'w-80'
      )}
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-white text-sm font-semibold text-slate-950">
            U
          </div>
          {!collapsed ? (
            <div>
              <p className="text-base font-semibold tracking-tight text-white">{t('common.app.name')}</p>
              <p className="text-xs text-slate-400">{roleLabelKey[role] ? t(roleLabelKey[role]) : t('common.tagline')}</p>
            </div>
          ) : null}
        </div>
        {onToggle ? (
          <button
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-200 transition hover:-translate-y-0.5"
            onClick={onToggle}
            aria-label={collapsed ? t('common.expand') : t('common.collapse')}
            title={collapsed ? t('common.expand') : t('common.collapse')}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t('shell.workspace.label')}</p>
        <p className="mt-2 text-sm font-semibold text-white">{t('shell.execution.mode.value')}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">{t('shell.sidebar.hint')}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-4">
        {navGroups.map((group, index) => {
          const groupKey = group.label || `group-${index}`;
          const isGroupOpen = sectionOpen[groupKey] ?? index === 0;
          return (
            <div key={group.label} className="space-y-2">
              {!collapsed ? (
                <button
                  type="button"
                  className="w-full rounded-2xl border border-transparent px-3 py-2 text-left transition hover:bg-slate-900"
                  onClick={() => setSectionOpen((prev) => ({ ...prev, [groupKey]: !isGroupOpen }))}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{group.label}</span>
                    {isGroupOpen ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
                  </div>
                  {group.description ? <p className="mt-1 text-xs leading-5 text-slate-400">{group.description}</p> : null}
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
                            'flex w-full items-center justify-between px-3 pt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500',
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
                              isActive ? 'border border-slate-800 bg-white text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.18)]' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
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
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <button
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-left text-xs font-semibold text-slate-100 transition hover:-translate-y-0.5"
            onClick={() => void logout()}
          >
            {t('common.logout')}
          </button>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-slate-300">
            {t('shell.current.view')}: {roleLabelKey[role] ? t(roleLabelKey[role]) : t('common.panel.title')}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
