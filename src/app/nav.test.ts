import { describe, expect, it } from 'vitest';
import { getBottomNavGridClass, getMobileNavItemsFromGroups, getNavGroupsForRole, type NavGroup, type NavItem } from './nav';
import type { AppUserRole } from '@/core/models/appUser';
import type { FeatureFlags } from '@/lib/featureFlags';

const Icon = (() => null) as unknown as NavItem['icon'];

function item(label: string, overrides: Partial<NavGroup['items'][number]> = {}): NavGroup['items'][number] {
  return {
    to: `/${label}`,
    label,
    icon: Icon,
    enabled: true,
    mobile: true,
    mobileOrder: 1,
    ...overrides
  };
}

function groupsForRole(role: AppUserRole, groups: NavGroup[], permissions: string[] = []) {
  return getMobileNavItemsFromGroups(groups, { role, permissions: permissions as never[] });
}

const allFlagsOn: FeatureFlags = {
  dashboard: true,
  buildings: true,
  management: true,
  employees: true,
  scheduling: true,
  users: true,
  settings: true,
  services: true,
  customers: true,
  assets: true,
  reports: true,
  aiWorkspace: true,
  technicianHome: true,
  clientSummary: true
};

const t = (key: string) => key;

function actualMobileRoutes(role: AppUserRole, flags: FeatureFlags = allFlagsOn) {
  return getMobileNavItemsFromGroups(getNavGroupsForRole(role, [], flags, t), { role }).map((navItem) => navItem.to);
}

describe('mobile nav model', () => {
  it('filters items by role and keeps Services as the operational entry', () => {
    const groups: NavGroup[] = [
      {
        label: 'Ops',
        items: [
          item('dashboard', { to: '/', mobileOrder: 1, allow: ['admin'] }),
          item('services', { to: '/services', mobileOrder: 2, allow: ['admin', 'operator'] }),
          item('scheduling', { to: '/scheduling', mobileOrder: 3, allow: ['admin'], mobile: false })
        ]
      }
    ];

    expect(groupsForRole('operator', groups).map((navItem) => navItem.to)).toEqual(['/services']);
    expect(groupsForRole('admin', groups).map((navItem) => navItem.to)).toEqual(['/', '/services']);
  });

  it('allows explicit permissions to expose role-restricted items', () => {
    const groups: NavGroup[] = [
      {
        label: 'Reports',
        items: [item('reports', { to: '/reports', allow: ['admin'], allowPermissions: ['review_reports'] })]
      }
    ];

    expect(groupsForRole('operator', groups)).toHaveLength(0);
    expect(groupsForRole('operator', groups, ['review_reports']).map((navItem) => navItem.to)).toEqual(['/reports']);
  });

  it('keeps client portal navigation separated from internal routes', () => {
    const groups: NavGroup[] = [
      {
        label: 'Portal',
        items: [
          item('portal', { to: '/portal', mobileOrder: 1, allow: ['client'] }),
          item('portal services', { to: '/portal/services', mobileOrder: 2, allow: ['client'] }),
          item('services', { to: '/services', mobileOrder: 3, allow: ['operator'] })
        ]
      }
    ];

    expect(groupsForRole('client', groups).map((navItem) => navItem.to)).toEqual(['/portal', '/portal/services']);
  });
});

describe('role navigation configuration', () => {
  it('sends client roles to portal routes instead of operational Services or Scheduling', () => {
    expect(actualMobileRoutes('client')).toEqual(['/portal', '/portal/services', '/portal/reports']);
    expect(actualMobileRoutes('building_admin')).toEqual(['/portal', '/portal/services', '/portal/reports']);
    expect(actualMobileRoutes('client')).not.toContain('/services');
    expect(actualMobileRoutes('building_admin')).not.toContain('/scheduling');
  });

  it('keeps Services as operational navigation for internal roles', () => {
    expect(actualMobileRoutes('operator')).toContain('/services');
    expect(actualMobileRoutes('scheduler')).toContain('/services');
    expect(actualMobileRoutes('admin')).toContain('/services');
  });

  it('does not couple the client portal services entry to the legacy Scheduling flag', () => {
    const routes = actualMobileRoutes('client', { ...allFlagsOn, scheduling: false, services: true });

    expect(routes).toContain('/portal/services');
    expect(routes).not.toContain('/scheduling');
  });

  it('uses role-specific operations descriptions for internal roles', () => {
    const supervisorGroups = getNavGroupsForRole('supervisor', [], allFlagsOn, t);
    const auditGroups = getNavGroupsForRole('auditoria', [], allFlagsOn, t);
    const operatorGroups = getNavGroupsForRole('operator', [], allFlagsOn, t);

    expect(supervisorGroups[0]?.description).toBe('nav.operations.section.description.supervisor');
    expect(auditGroups[0]?.description).toBe('nav.operations.section.description.audit');
    expect(operatorGroups[0]?.description).toBe('nav.operations.section.description.operations');
  });
});

describe('bottom nav layout', () => {
  it('uses a grid column count that matches available items', () => {
    expect(getBottomNavGridClass(1)).toBe('grid-cols-1');
    expect(getBottomNavGridClass(3)).toBe('grid-cols-3');
    expect(getBottomNavGridClass(8)).toBe('grid-cols-5');
  });
});
