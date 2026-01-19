import { CalendarDays, Building2, Users, Landmark, LayoutDashboard } from './navIcons';
import { useI18n } from '@/lib/i18n';

export function useNavItems() {
  const { t } = useI18n();

  return [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/buildings', label: t('nav.buildings'), icon: Building2 },
    { to: '/management', label: t('nav.management'), icon: Landmark },
    { to: '/employees', label: t('nav.employees'), icon: Users },
    { to: '/scheduling', label: t('nav.scheduling'), icon: CalendarDays }
  ];
}
