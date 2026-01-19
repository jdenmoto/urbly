import { CalendarDays, Building2, Users, Landmark, LayoutDashboard, ShieldUser } from './navIcons';
import { useI18n } from '@/lib/i18n';

export function useNavItems(role: 'admin' | 'editor' | 'view' = 'view') {
  const { t } = useI18n();

  const items = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/buildings', label: t('nav.buildings'), icon: Building2 },
    { to: '/management', label: t('nav.management'), icon: Landmark },
    { to: '/employees', label: t('nav.employees'), icon: Users },
    { to: '/scheduling', label: t('nav.scheduling'), icon: CalendarDays },
    { to: '/users', label: t('nav.users'), icon: ShieldUser, adminOnly: true }
  ];

  return items.filter((item) => !(item as { adminOnly?: boolean }).adminOnly || role === 'admin');
}
