import { describe, expect, it } from 'vitest';

import type { AccountMember } from '@/core/models/account';
import {
  canCloseService,
  canReadEvidence,
  canReopenService,
  hasAccountRole,
  hasPermission,
} from '@/lib/permissions/accountPermissions';

function member(overrides: Partial<AccountMember> = {}): AccountMember {
  return {
    id: 'member-1',
    uid: 'user-1',
    accountId: 'account-1',
    email: 'user@example.com',
    role: 'view',
    active: true,
    permissions: [],
    ...overrides,
  };
}

describe('account permissions', () => {
  it('checks account role only for active memberships', () => {
    expect(hasAccountRole(member({ role: 'admin' }), 'admin')).toBe(true);
    expect(hasAccountRole(member({ role: 'admin', active: false }), 'admin')).toBe(false);
    expect(hasAccountRole(null, 'admin')).toBe(false);
  });

  it('checks explicit permissions only for active memberships', () => {
    expect(hasPermission(member({ permissions: ['review_reports'] }), 'review_reports')).toBe(true);
    expect(hasPermission(member({ permissions: ['review_reports'], active: false }), 'review_reports')).toBe(false);
    expect(hasPermission(member(), 'review_reports')).toBe(false);
  });

  it('matches the confirmed evidence read matrix', () => {
    for (const role of ['owner', 'admin', 'editor', 'supervisor', 'operator', 'technician', 'auditoria', 'client', 'building_admin'] as const) {
      expect(canReadEvidence(member({ role })), role).toBe(true);
    }

    expect(canReadEvidence(member({ role: 'scheduler' }))).toBe(false);
    expect(canReadEvidence(member({ role: 'view' }))).toBe(false);
  });

  it('matches the confirmed service close matrix', () => {
    for (const role of ['owner', 'admin', 'editor', 'supervisor', 'operator', 'technician'] as const) {
      expect(canCloseService(member({ role })), role).toBe(true);
    }

    for (const role of ['scheduler', 'auditoria', 'view', 'client', 'building_admin'] as const) {
      expect(canCloseService(member({ role })), role).toBe(false);
    }
  });

  it('matches the confirmed service reopen matrix', () => {
    for (const role of ['owner', 'admin', 'editor', 'supervisor'] as const) {
      expect(canReopenService(member({ role })), role).toBe(true);
    }

    for (const role of ['scheduler', 'operator', 'technician', 'auditoria', 'view', 'client', 'building_admin'] as const) {
      expect(canReopenService(member({ role })), role).toBe(false);
    }
  });
});
