import { CalendarDays, Building2, Users, Landmark, LayoutDashboard } from './navIcons';

export const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/buildings', label: 'Edificios', icon: Building2 },
  { to: '/management', label: 'Administraciones', icon: Landmark },
  { to: '/employees', label: 'Empleados', icon: Users },
  { to: '/scheduling', label: 'Agendamientos', icon: CalendarDays }
];
