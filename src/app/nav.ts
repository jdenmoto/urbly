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
  '/scheduling': ['admin', 'editor', 'view', 'supervisor', 'scheduler', 'operator', 'auditoria'],
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
        label: t('nav.portal.section.default'),
        description: t('nav.portal.section.description'),
        items: [
          { to: '/portal', label: t('nav.client.summary'), shortLabel: t('nav.short.dashboard'), icon: LayoutDashboard, enabled: flags.clientSummary, allow: routeAccess['/portal'], mobile: true, mobileOrder: 1 },
          { to: '/portal/services', label: t('nav.portal.services'), shortLabel: t('nav.short.services'), icon: Briefcase, enabled: flags.scheduling, allow: routeAccess['/portal/services'], mobile: true, mobileOrder: 2 },
          { to: '/portal/reports', label: t('nav.portal.reports'), shortLabel: t('nav.short.reports'), icon: FileText, enabled: flags.reports, allow: routeAccess['/portal/reports'], mobile: true, mobileOrder: 3 }
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
        label: t('nav.operations.section.default'),
        description: t('nav.operations.section.description'),
        items: [
          { to: '/technician', label: t('nav.dashboard'), shortLabel: t('nav.short.dashboard'), icon: LayoutDashboard, enabled: flags.technicianHome, allow: routeAccess['/technician'], mobile: true, mobileOrder: 1 },
          { to: '/services', label: t('nav.my.services'), shortLabel: t('nav.short.my.services'), icon: Briefcase, enabled: flags.services, allow: routeAccess['/services'], mobile: true, mobileOrder: 2 }
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
        label: t('nav.operations.section.default'),
        description: t('nav.operations.section.description'),
        items: [
          { to: '/', label: t('nav.dashboard'), shortLabel: t('nav.short.dashboard'), icon: LayoutDashboard, enabled: flags.dashboard, allow: routeAccess['/'], mobile: true, mobileOrder: 1 },
          { to: '/services', label: t('nav.services'), shortLabel: t('nav.short.services'), icon: Briefcase, enabled: flags.services, allow: routeAccess['/services'], mobile: true, mobileOrder: 2 },
          { to: '/buildings', label: t('nav.buildings'), shortLabel: t('nav.short.buildings'), icon: Building2, enabled: flags.buildings, allow: routeAccess['/buildings'], mobile: true, mobileOrder: 3 },
          { to: '/reports', label: t('nav.reports'), shortLabel: t('nav.short.reports'), icon: FileText, enabled: flags.reports, allow: routeAccess['/reports'], mobile: true, mobileOrder: 4 }
        ]
      },
      {
        label: t('nav.portfolio.section.default'),
        description: t('nav.portfolio.section.description'),
        items: [
          { to: '/management', label: t('nav.management'), shortLabel: t('nav.short.management'), icon: Landmark, enabled: flags.management, allow: routeAccess['/management'], mobile: true, mobileOrder: 5 },
          { to: '/notifications', label: t('nav.notifications'), shortLabel: t('nav.short.notifications'), icon: FileText, enabled: true, allow: routeAccess['/notifications'], mobile: false },
          { to: '/ai', label: t('nav.ai.workspace'), shortLabel: t('nav.short.ai'), icon: Sparkles, enabled: flags.aiWorkspace, allow: routeAccess['/ai'], mobile: false }
        ]
      },
      {
        label: t('nav.team.section.default'),
        description: t('nav.team.section.description'),
        items: [{ to: '/employees', label: t('nav.employees'), shortLabel: t('nav.short.team'), icon: Users, enabled: flags.employees, allow: routeAccess['/employees'], mobile: false }]
      },
      {
        label: t('nav.settings.section.default'),
        description: t('nav.settings.section.description'),
        items: [
          {
            to: '/settings/groups',
            label: t('nav.settings.groups'),
            icon: Settings,
            allow: routeAccess['/settings/groups'],
            enabled: flags.settings
          },
          {
            to: '/settings/issues',
            label: t('nav.settings.issues'),
            icon: Settings,
            allow: routeAccess['/settings/issues'],
            enabled: flags.settings
          },
          {
            to: '/settings/service-types',
            label: t('nav.settings.service.types'),
            icon: Settings,
            allow: routeAccess['/settings/service-types'],
            enabled: flags.settings
          },
          {
            to: '/settings/automation',
            label: t('nav.settings.automation'),
            icon: Settings,
            allow: routeAccess['/settings/automation'],
            enabled: flags.settings
          },
          {
            to: '/settings/contracts',
            label: t('nav.settings.contracts'),
            icon: Settings,
            allow: routeAccess['/settings/contracts'],
            enabled: flags.settings
          },
          {
            to: '/settings/labs',
            label: t('nav.settings.labs'),
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
            label: t('nav.settings.calendar.section'),
            icon: Settings,
            allow: routeAccess['/settings/calendar/holidays'],
            enabled: flags.settings,
            kind: 'section',
            sectionId: 'calendar'
          },
          {
            to: '/settings/calendar/holidays',
            label: t('nav.settings.calendar.holidays'),
            icon: Settings,
            allow: routeAccess['/settings/calendar/holidays'],
            enabled: flags.settings,
            sectionId: 'calendar'
          },
          {
            to: '/settings/calendar/non-working',
            label: t('nav.settings.calendar.non.working'),
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
