import { describe, expect, it } from 'vitest';

import { ACCOUNT_ROLES, type Account, type AccountMember, type AccountRole } from '../account';
import type { AppUser } from '../appUser';

describe('account models', () => {
  it('exposes confirmed account roles', () => {
    expect(ACCOUNT_ROLES).toEqual([
      'owner',
      'admin',
      'editor',
      'supervisor',
      'scheduler',
      'operator',
      'technician',
      'auditoria',
      'view',
      'client',
      'building_admin',
    ]);
  });

  it('models accounts, memberships and active user account fields', () => {
    const account: Account = {
      id: 'urbly-default',
      name: 'Urbly Default',
      active: true,
    };

    const member: AccountMember = {
      id: 'user-1',
      uid: 'user-1',
      accountId: account.id,
      email: 'admin@example.com',
      role: 'admin',
      active: true,
      permissions: ['export_audit'],
    };

    const user: AppUser = {
      id: member.uid,
      email: member.email,
      role: 'admin',
      active: true,
      activeAccountId: account.id,
      accountIds: [account.id],
      permissions: member.permissions,
    };

    expect(user.activeAccountId).toBe(member.accountId);
    expect(user.accountIds).toContain(account.id);
  });

  it('keeps account membership roles on the confirmed role set', () => {
    const role: AccountRole = 'technician';

    expect(ACCOUNT_ROLES).toContain(role);
  });
});
