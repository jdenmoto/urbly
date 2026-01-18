import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { navItems } from '@/app/nav';

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-fog-200 bg-white/90 px-3 py-2 backdrop-blur md:hidden">
      <div className="flex items-center justify-between">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium',
                isActive ? 'text-ink-900' : 'text-ink-500'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
