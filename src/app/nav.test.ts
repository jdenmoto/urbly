import { describe, expect, it } from 'vitest';
import { getBottomNavGridClass, getMobileNavItemsFromGroups, type NavGroup, type NavItem } from './nav';
import type { AppUserRole } from '@/core/models/appUser';

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

describe('bottom nav layout', () => {
  it('uses a grid column count that matches available items', () => {
    expect(getBottomNavGridClass(1)).toBe('grid-cols-1');
    expect(getBottomNavGridClass(3)).toBe('grid-cols-3');
    expect(getBottomNavGridClass(8)).toBe('grid-cols-5');
  });
});
