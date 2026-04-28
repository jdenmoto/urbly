import { Building2, Users, Landmark, LayoutDashboard, ShieldUser, Settings, Briefcase, Sparkles, FileText } from './navIcons';
import { useI18n } from '@/lib/i18n';
import { useFeatureFlags } from '@/lib/featureFlags';
import type { AppUserRole } from '@/core/models/appUser';

export type NavItem = {
  to?: string;
  label: string;
  shortLabel?: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  enabled: boolean;
  allow?: AppUserRole[];
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

const internalDashboardRoles: AppUserRole[] = ['admin', 'editor', 'view', 'supervisor', 'scheduler', 'operator', 'auditoria'];

const routeAccess: Record<string, AppUserRole[]> = {
  '/': ['admin', 'editor', 'view', 'supervisor', 'scheduler', 'operator', 'auditoria'],
  '/technician': ['emergency_scheduler'],
  '/services': ['admin', 'editor', 'view', 'emergency_scheduler', 'supervisor', 'scheduler', 'operator', 'auditoria'],
  '/buildings': ['admin', 'editor', 'view'],
  '/management': ['admin', 'editor', 'view'],
  '/customers': ['admin', 'editor', 'view'],
  '/assets': ['admin', 'editor', 'view'],
  '/employees': ['admin', 'editor', 'view'],
  '/notifications': ['admin', 'editor', 'view', 'supervisor', 'scheduler', 'operator', 'auditoria'],
  '/reports': ['admin', 'editor', 'view', 'supervisor', 'auditoria'],
  '/ai': ['admin', 'editor', 'view', 'supervisor', 'scheduler', 'operator', 'auditoria'],
  '/users': ['admin'],
  '/settings/groups': ['admin'],
  '/settings/issues': ['admin'],
  '/settings/service-types': ['admin'],
  '/settings/automation': ['admin', 'editor', 'building_admin', 'client', 'supervisor'],
  '/settings/contracts': ['admin'],
  '/settings/labs': ['admin'],
  '/settings/calendar/holidays': ['admin'],
  '/settings/calendar/non-working': ['admin'],
  '/portal': ['building_admin', 'client'],
  '/portal/services': ['building_admin', 'client'],
  '/portal/reports': ['building_admin', 'client']
};

function canAccessRoute(role: AppUserRole, to?: string) {
  if (!to) return true;
  const allowedRoles = routeAccess[to];
  return Array.isArray(allowedRoles) ? allowedRoles.includes(role) : false;
}

export function getDefaultRouteForRole(role: AppUserRole) {
  if (role === 'emergency_scheduler') return '/technician';
  if (role === 'building_admin' || role === 'client') return '/portal';
  if (role === 'scheduler' || role === 'operator') return '/services';
  if (role === 'auditoria') return '/reports';
  if (role === 'supervisor') return '/notifications';
  return '/';
}

export function useNavGroups(role: AppUserRole = 'view') {
  const { t } = useI18n();
  const { flags } = useFeatureFlags();

  if (role === 'building_admin' || role === 'client') {
    const groups: NavGroup[] = [
      {
        label: t('nav.portalSection'),
        description: t('nav.portalSectionDescription'),
        items: [
          { to: '/portal', label: t('nav.clientSummary'), shortLabel: t('nav.shortDashboard'), icon: LayoutDashboard, enabled: flags.clientSummary, allow: routeAccess['/portal'], mobile: true, mobileOrder: 1 },
          { to: '/portal/services', label: t('nav.portalServices'), shortLabel: t('nav.shortServices'), icon: Briefcase, enabled: flags.scheduling, allow: routeAccess['/portal/services'], mobile: true, mobileOrder: 2 },
          { to: '/portal/reports', label: t('nav.portalReports'), shortLabel: t('nav.shortReports'), icon: FileText, enabled: flags.reports, allow: routeAccess['/portal/reports'], mobile: true, mobileOrder: 3 }
        ]
      }
    ];

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.enabled && canAccessRoute(role, item.to) && (!item.allow || item.allow.includes(role)))
      }))
      .filter((group) => group.items.length > 0);
  }

  if (role === 'emergency_scheduler') {
    const groups: NavGroup[] = [
      {
        label: t('nav.operationsSection'),
        description: t('nav.operationsSectionDescription'),
        items: [
          { to: '/technician', label: t('nav.dashboard'), shortLabel: t('nav.shortDashboard'), icon: LayoutDashboard, enabled: flags.technicianHome, allow: routeAccess['/technician'], mobile: true, mobileOrder: 1 },
          { to: '/services', label: t('nav.myServices'), shortLabel: t('nav.shortMyServices'), icon: Briefcase, enabled: flags.services, allow: routeAccess['/services'], mobile: true, mobileOrder: 2 }
        ]
      }
    ];

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.enabled && canAccessRoute(role, item.to) && (!item.allow || item.allow.includes(role)))
      }))
      .filter((group) => group.items.length > 0);
  }

  if (internalDashboardRoles.includes(role)) {
    const groups: NavGroup[] = [
      {
        label: t('nav.operationsSection'),
        description: t('nav.operationsSectionDescription'),
        items: [
          { to: '/', label: t('nav.dashboard'), shortLabel: t('nav.shortDashboard'), icon: LayoutDashboard, enabled: flags.dashboard, allow: routeAccess['/'], mobile: true, mobileOrder: 1 },
          { to: '/services', label: t('nav.services'), shortLabel: t('nav.shortServices'), icon: Briefcase, enabled: flags.services, allow: routeAccess['/services'], mobile: true, mobileOrder: 2 },
          { to: '/buildings', label: t('nav.buildings'), shortLabel: t('nav.shortBuildings'), icon: Building2, enabled: flags.buildings, allow: routeAccess['/buildings'], mobile: true, mobileOrder: 3 },
          { to: '/reports', label: t('nav.reports'), shortLabel: t('nav.shortReports'), icon: FileText, enabled: flags.reports, allow: routeAccess['/reports'], mobile: true, mobileOrder: 4 }
        ]
      },
      {
        label: t('nav.portfolioSection'),
        description: t('nav.portfolioSectionDescription'),
        items: [
          { to: '/management', label: t('nav.management'), shortLabel: t('nav.shortManagement'), icon: Landmark, enabled: flags.management, allow: routeAccess['/management'], mobile: true, mobileOrder: 5 },
          { to: '/notifications', label: t('nav.notifications'), shortLabel: t('nav.shortNotifications'), icon: FileText, enabled: true, allow: routeAccess['/notifications'], mobile: false },
          { to: '/ai', label: t('nav.aiWorkspace'), shortLabel: t('nav.shortAi'), icon: Sparkles, enabled: flags.aiWorkspace, allow: routeAccess['/ai'], mobile: false }
        ]
      },
      {
        label: t('nav.teamSection'),
        description: t('nav.teamSectionDescription'),
        items: [{ to: '/employees', label: t('nav.employees'), shortLabel: t('nav.shortTeam'), icon: Users, enabled: flags.employees, allow: routeAccess['/employees'], mobile: false }]
      },
      {
        label: t('nav.settingsSection'),
        description: t('nav.settingsSectionDescription'),
        items: [
          {
            to: '/settings/groups',
            label: t('nav.settingsGroups'),
            icon: Settings,
            allow: routeAccess['/settings/groups'],
            enabled: flags.settings
          },
          {
            to: '/settings/issues',
            label: t('nav.settingsIssues'),
            icon: Settings,
            allow: routeAccess['/settings/issues'],
            enabled: flags.settings
          },
          {
            to: '/settings/service-types',
            label: t('nav.settingsServiceTypes'),
            icon: Settings,
            allow: routeAccess['/settings/service-types'],
            enabled: flags.settings
          },
          {
            to: '/settings/automation',
            label: t('nav.settingsAutomation'),
            icon: Settings,
            allow: routeAccess['/settings/automation'],
            enabled: flags.settings
          },
          {
            to: '/settings/contracts',
            label: t('nav.settingsContracts'),
            icon: Settings,
            allow: routeAccess['/settings/contracts'],
            enabled: flags.settings
          },
          {
            to: '/settings/labs',
            label: t('nav.settingsLabs'),
            icon: Settings,
            allow: routeAccess['/settings/labs'],
            enabled: flags.settings
          },
          {
            to: '/users',
            label: t('nav.users'),
            icon: ShieldUser,
            allow: routeAccess['/users'],
            enabled: flags.users
          },
          {
            label: t('nav.settingsCalendarSection'),
            icon: Settings,
            allow: routeAccess['/settings/calendar/holidays'],
            enabled: flags.settings,
            kind: 'section',
            sectionId: 'calendar'
          },
          {
            to: '/settings/calendar/holidays',
            label: t('nav.settingsCalendarHolidays'),
            icon: Settings,
            allow: routeAccess['/settings/calendar/holidays'],
            enabled: flags.settings,
            sectionId: 'calendar'
          },
          {
            to: '/settings/calendar/non-working',
            label: t('nav.settingsCalendarNonWorking'),
            icon: Settings,
            allow: routeAccess['/settings/calendar/non-working'],
            enabled: flags.settings,
            sectionId: 'calendar'
          }
        ]
      }
    ];

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.enabled && canAccessRoute(role, item.to) && (!item.allow || item.allow.includes(role)))
      }))
      .filter((group) => group.items.length > 0);
  }

  return [];
}

export function useNavItems(role: AppUserRole = 'view') {
  return useNavGroups(role)
    .flatMap((group) => group.items)
    .filter((item) => item.kind !== 'section' && item.to);
}

export function useMobileNavItems(role: AppUserRole = 'view') {
  return useNavItems(role)
    .filter((item) => item.mobile !== false)
    .sort((a, b) => (a.mobileOrder ?? Number.MAX_SAFE_INTEGER) - (b.mobileOrder ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 5);
}
