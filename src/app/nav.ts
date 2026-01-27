import { CalendarDays, Building2, Users, Landmark, LayoutDashboard, ShieldUser, Settings } from './navIcons';
import { useI18n } from '@/lib/i18n';
import { useFeatureFlags } from '@/lib/featureFlags';

export type NavItem = {
  to: string;
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  enabled: boolean;
  adminOnly?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export function useNavGroups(
  role: 'admin' | 'editor' | 'view' | 'building_admin' | 'emergency_scheduler' = 'view'
) {
  const { t } = useI18n();
  const { flags } = useFeatureFlags();

  if (role === 'building_admin') {
    return [{ label: t('nav.portalSection'), items: [{ to: '/portal', label: t('nav.portal'), icon: Building2, enabled: true }] }];
  }
  if (role === 'emergency_scheduler') {
    return [
      {
        label: t('nav.mainSection'),
        items: [
          { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, enabled: flags.dashboard },
          { to: '/scheduling', label: t('nav.scheduling'), icon: CalendarDays, enabled: flags.scheduling }
        ]
      }
    ];
  }

  const groups: NavGroup[] = [
    {
      label: t('nav.mainSection'),
      items: [
        { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, enabled: flags.dashboard },
        { to: '/buildings', label: t('nav.buildings'), icon: Building2, enabled: flags.buildings },
        { to: '/management', label: t('nav.management'), icon: Landmark, enabled: flags.management },
        { to: '/employees', label: t('nav.employees'), icon: Users, enabled: flags.employees },
        { to: '/scheduling', label: t('nav.scheduling'), icon: CalendarDays, enabled: flags.scheduling }
      ]
    },
    {
      label: t('nav.settingsSection'),
      items: [
        {
          to: '/settings/groups',
          label: t('nav.settingsGroups'),
          icon: Settings,
          adminOnly: true,
          enabled: flags.settings
        },
        {
          to: '/settings/issues',
          label: t('nav.settingsIssues'),
          icon: Settings,
          adminOnly: true,
          enabled: flags.settings
        },
        {
          to: '/settings/contracts',
          label: t('nav.settingsContracts'),
          icon: Settings,
          adminOnly: true,
          enabled: flags.settings
        },
        {
          to: '/settings/labs',
          label: t('nav.settingsLabs'),
          icon: Settings,
          adminOnly: true,
          enabled: flags.settings
        },
        {
          to: '/settings/calendar',
          label: t('nav.settingsCalendar'),
          icon: Settings,
          adminOnly: true,
          enabled: flags.settings
        },
        { to: '/users', label: t('nav.users'), icon: ShieldUser, adminOnly: true, enabled: flags.users }
      ]
    }
  ];

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const adminOnly = (item as { adminOnly?: boolean }).adminOnly;
        return item.enabled && (!adminOnly || role === 'admin');
      })
    }))
    .filter((group) => group.items.length > 0);
}

export function useNavItems(
  role: 'admin' | 'editor' | 'view' | 'building_admin' | 'emergency_scheduler' = 'view'
) {
  return useNavGroups(role).flatMap((group) => group.items);
}
