import { Building2, Users, Landmark, LayoutDashboard, ShieldUser, Settings, Briefcase, Sparkles, FileText } from './navIcons';
import { useI18n } from '@/lib/i18n';
import { useFeatureFlags } from '@/lib/featureFlags';

export type NavItem = {
  to?: string;
  label: string;
  shortLabel?: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  enabled: boolean;
  adminOnly?: boolean;
  kind?: 'link' | 'section';
  sectionId?: string;
  mobile?: boolean;
  mobileOrder?: number;
};

export type NavGroup = {
  label: string;
  description?: string;
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
        description: t('nav.portalSectionDescription'),
        items: [
          { to: '/portal', label: t('nav.clientSummary'), shortLabel: t('nav.shortDashboard'), icon: LayoutDashboard, enabled: flags.clientSummary, mobile: true, mobileOrder: 1 },
          { to: '/portal/services', label: t('nav.portalServices'), shortLabel: t('nav.shortServices'), icon: Briefcase, enabled: flags.scheduling, mobile: true, mobileOrder: 2 },
          { to: '/portal/reports', label: t('nav.portalReports'), shortLabel: t('nav.shortReports'), icon: FileText, enabled: flags.reports, mobile: true, mobileOrder: 3 }
        ]
      }
    ];
  }

  if (role === 'emergency_scheduler') {
    return [
      {
        label: t('nav.operationsSection'),
        description: t('nav.operationsSectionDescription'),
        items: [
          { to: '/', label: t('nav.dashboard'), shortLabel: t('nav.shortDashboard'), icon: LayoutDashboard, enabled: flags.dashboard, mobile: true, mobileOrder: 1 },
          { to: '/services', label: t('nav.services'), shortLabel: t('nav.shortServices'), icon: Briefcase, enabled: flags.services, mobile: true, mobileOrder: 2 }
        ]
      }
    ];
  }

  if (role === 'editor' || role === 'view' || role === 'admin') {
    const groups: NavGroup[] = [
      {
        label: t('nav.operationsSection'),
        description: t('nav.operationsSectionDescription'),
        items: [
          { to: '/', label: t('nav.dashboard'), shortLabel: t('nav.shortDashboard'), icon: LayoutDashboard, enabled: flags.dashboard, mobile: true, mobileOrder: 1 },
          { to: '/services', label: t('nav.services'), shortLabel: t('nav.shortServices'), icon: Briefcase, enabled: flags.services, mobile: true, mobileOrder: 2 },
          { to: '/ai', label: t('nav.aiWorkspace'), shortLabel: t('nav.shortAi'), icon: Sparkles, enabled: flags.aiWorkspace, mobile: true, mobileOrder: 5 }
        ]
      },
      {
        label: t('nav.portfolioSection'),
        description: t('nav.portfolioSectionDescription'),
        items: [
          { to: '/management', label: t('nav.management'), shortLabel: t('nav.shortManagement'), icon: Landmark, enabled: flags.management, mobile: true, mobileOrder: 3 },
          { to: '/customers', label: t('nav.customers'), shortLabel: t('nav.shortCustomers'), icon: Landmark, enabled: flags.customers, mobile: false },
          { to: '/assets', label: t('nav.assets'), shortLabel: t('nav.shortAssets'), icon: Building2, enabled: flags.assets, mobile: false },
          { to: '/reports', label: t('nav.reports'), shortLabel: t('nav.shortReports'), icon: FileText, enabled: flags.reports, mobile: true, mobileOrder: 4 }
        ]
      },
      {
        label: t('nav.teamSection'),
        description: t('nav.teamSectionDescription'),
        items: [{ to: '/employees', label: t('nav.employees'), shortLabel: t('nav.shortTeam'), icon: Users, enabled: flags.employees, mobile: false }]
      },
      {
        label: t('nav.settingsSection'),
        description: t('nav.settingsSectionDescription'),
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
      label: t('nav.operationsSection'),
      description: t('nav.operationsSectionDescription'),
      items: [
        { to: '/', label: t('nav.dashboard'), shortLabel: t('nav.shortDashboard'), icon: LayoutDashboard, enabled: flags.dashboard, mobile: true, mobileOrder: 1 },
        { to: '/services', label: t('nav.services'), shortLabel: t('nav.shortServices'), icon: Briefcase, enabled: flags.services, mobile: true, mobileOrder: 2 },
        { to: '/buildings', label: t('nav.buildings'), shortLabel: t('nav.shortBuildings'), icon: Building2, enabled: flags.buildings, mobile: true, mobileOrder: 3 }
      ]
    },
    {
      label: t('nav.portfolioSection'),
      description: t('nav.portfolioSectionDescription'),
      items: [
        { to: '/management', label: t('nav.management'), shortLabel: t('nav.shortManagement'), icon: Landmark, enabled: flags.management, mobile: true, mobileOrder: 4 },
        { to: '/employees', label: t('nav.employees'), shortLabel: t('nav.shortTeam'), icon: Users, enabled: flags.employees, mobile: true, mobileOrder: 5 }
      ]
    },
    {
      label: t('nav.settingsSection'),
      description: t('nav.settingsSectionDescription'),
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

export function useNavItems(
  role: 'admin' | 'editor' | 'view' | 'building_admin' | 'emergency_scheduler' = 'view'
) {
  return useNavGroups(role)
    .flatMap((group) => group.items)
    .filter((item) => item.kind !== 'section' && item.to);
}

export function useMobileNavItems(
  role: 'admin' | 'editor' | 'view' | 'building_admin' | 'emergency_scheduler' = 'view'
) {
  return useNavItems(role)
    .filter((item) => item.mobile !== false)
    .sort((a, b) => (a.mobileOrder ?? Number.MAX_SAFE_INTEGER) - (b.mobileOrder ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 5);
}
