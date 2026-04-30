import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useMobileNavItems } from '@/app/nav';
import { useAuth } from '@/app/Auth';
import type { AppUserRole } from '@/core/models/appUser';
import { useI18n } from '@/lib/i18n';

type BottomNavProps = {
  show?: boolean;
};

export default function BottomNav({ show = true }: BottomNavProps) {
  const { role } = useAuth();
  const { t } = useI18n();
  const navItems = useMobileNavItems(role);

  if (!show) return null;

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 rounded-[24px] border border-white/60 bg-white/90 px-2 py-2 shadow-[0_12px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl"
      aria-label={t('nav.mobile.primary')}
    >
      <div className="grid grid-cols-5 items-center gap-1">
        {navItems
          .filter((item) => item.to)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to as string}
              className={({ isActive }) =>
                clsx(
                  'flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition',
                  isActive ? 'bg-white text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.08)]' : 'text-slate-500'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.shortLabel ?? item.label}</span>
            </NavLink>
          ))}
      </div>
    </nav>
  );
}
