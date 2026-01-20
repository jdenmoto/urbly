import { CalendarDays, Building2, Users, Landmark, LayoutDashboard, ShieldUser } from './navIcons';
import { useI18n } from '@/lib/i18n';
import { useFeatureFlags } from '@/lib/featureFlags';

export function useNavItems(role: 'admin' | 'editor' | 'view' = 'view') {
  const { t } = useI18n();
  const { flags } = useFeatureFlags();

  const items = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, enabled: flags.dashboard },
    { to: '/buildings', label: t('nav.buildings'), icon: Building2, enabled: flags.buildings },
    { to: '/management', label: t('nav.management'), icon: Landmark, enabled: flags.management },
    { to: '/employees', label: t('nav.employees'), icon: Users, enabled: flags.employees },
    { to: '/scheduling', label: t('nav.scheduling'), icon: CalendarDays, enabled: flags.scheduling },
    { to: '/users', label: t('nav.users'), icon: ShieldUser, adminOnly: true, enabled: flags.users }
  ];

  return items.filter((item) => {
    const adminOnly = (item as { adminOnly?: boolean }).adminOnly;
    return item.enabled && (!adminOnly || role === 'admin');
  });
}
