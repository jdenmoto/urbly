import { Building2, Users, Landmark, LayoutDashboard, ShieldUser, Settings, Briefcase, Sparkles, FileText } from './navIcons';
import { useI18n } from '@/lib/i18n';
import { useFeatureFlags } from '@/lib/featureFlags';

export type NavItem = {
  to?: string;
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  enabled: boolean;
  adminOnly?: boolean;
  kind?: 'link' | 'section';
  sectionId?: string;
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
    return [
      {
        label: t('nav.portalSection'),
        items: [
          { to: '/portal', label: t('nav.clientSummary'), icon: LayoutDashboard, enabled: flags.clientSummary },
          { to: '/portal/services', label: t('nav.portalServices'), icon: Briefcase, enabled: flags.scheduling },
          { to: '/portal/reports', label: t('nav.portalReports'), icon: FileText, enabled: flags.reports }
        ]
      }
    ];
  }
  if (role === 'emergency_scheduler') {
    return [
      {
        label: t('nav.mainSection'),
        items: [
          { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, enabled: flags.dashboard },
          { to: '/services', label: t('nav.services'), icon: Briefcase, enabled: flags.services }
        ]
      }
    ];
  }
  if (role === 'editor' || role === 'view' || role === 'admin') {
    const groups: NavGroup[] = [
      {
        label: t('nav.mainSection'),
        items: [
          { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, enabled: flags.dashboard },
          { to: '/services', label: t('nav.services'), icon: Briefcase, enabled: flags.services },
          { to: '/customers', label: t('nav.customers'), icon: Landmark, enabled: flags.customers },
          { to: '/assets', label: t('nav.assets'), icon: Building2, enabled: flags.assets },
          { to: '/reports', label: t('nav.reports'), icon: FileText, enabled: flags.reports },
          { to: '/ai', label: t('nav.aiWorkspace'), icon: Sparkles, enabled: flags.aiWorkspace },
          { to: '/management', label: t('nav.management'), icon: Landmark, enabled: flags.management },
          { to: '/employees', label: t('nav.employees'), icon: Users, enabled: flags.employees }
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
            to: '/users',
            label: t('nav.users'),
            icon: ShieldUser,
            adminOnly: true,
            enabled: flags.users
          },
          {
            label: t('nav.settingsCalendarSection'),
            icon: Settings,
            adminOnly: true,
            enabled: flags.settings,
            kind: 'section',
            sectionId: 'calendar'
          },
          {
            to: '/settings/calendar/holidays',
            label: t('nav.settingsCalendarHolidays'),
            icon: Settings,
            adminOnly: true,
            enabled: flags.settings,
            sectionId: 'calendar'
          },
          {
            to: '/settings/calendar/non-working',
            label: t('nav.settingsCalendarNonWorking'),
            icon: Settings,
            adminOnly: true,
            enabled: flags.settings,
            sectionId: 'calendar'
          }
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

  const groups: NavGroup[] = [
    {
      label: t('nav.mainSection'),
      items: [
        { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, enabled: flags.dashboard },
        { to: '/services', label: t('nav.services'), icon: Briefcase, enabled: flags.services },
        { to: '/buildings', label: t('nav.buildings'), icon: Building2, enabled: flags.buildings },
        { to: '/management', label: t('nav.management'), icon: Landmark, enabled: flags.management },
        { to: '/employees', label: t('nav.employees'), icon: Users, enabled: flags.employees }
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
        { to: '/users', 
          label: t('nav.users'), 
          icon: ShieldUser, 
          adminOnly: true,
          enabled: flags.users },
        {
          label: t('nav.settingsCalendarSection'),
          icon: Settings,
          adminOnly: true,
          enabled: flags.settings,
          kind: 'section',
          sectionId: 'calendar'
        },
        {
          to: '/settings/calendar/holidays',
          label: t('nav.settingsCalendarHolidays'),
          icon: Settings,
          adminOnly: true,
          enabled: flags.settings,
          sectionId: 'calendar'
        },
        {
          to: '/settings/calendar/non-working',
          label: t('nav.settingsCalendarNonWorking'),
          icon: Settings,
          adminOnly: true,
          enabled: flags.settings,
          sectionId: 'calendar'
        }
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
  return useNavGroups(role)
    .flatMap((group) => group.items)
    .filter((item) => item.kind !== 'section' && item.to);
}
