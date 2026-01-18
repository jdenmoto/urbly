import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { navItems } from '@/app/nav';
import { useAuth } from '@/app/Auth';

export default function Sidebar({ collapsed }: { collapsed?: boolean }) {
  const { logout } = useAuth();

  return (
    <aside
      className={clsx(
        'flex h-full flex-col gap-6 border-r border-fog-200 bg-white/80 px-4 py-6 backdrop-blur',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-white">U</div>
        {!collapsed ? (
          <div>
            <p className="text-base font-semibold text-ink-900">Urbly</p>
            <p className="text-xs text-ink-500">Smart building ops</p>
          </div>
        ) : null}
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => (
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
        ))}
      </nav>
      {!collapsed ? (
        <div className="space-y-3">
          <button
            className="w-full rounded-xl border border-fog-200 bg-white px-4 py-2 text-left text-xs font-semibold text-ink-700 hover:border-ink-900"
            onClick={() => void logout()}
          >
            Salir
          </button>
          <div className="rounded-xl bg-fog-100 px-4 py-3 text-xs text-ink-600">
            Plan MVP - Admin
          </div>
        </div>
      ) : null}
    </aside>
  );
}
