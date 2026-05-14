import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase-functions/v2/https', () => {
  class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return { HttpsError, onCall: (handler: unknown) => handler };
});

vi.mock('../../functions/src/admin', () => ({ db: {} }));

import { resolveClientPortalScope } from '../../functions/src/clientPortal';

const validScope = {
  requestedCustomerId: 'customer-1',
  serviceOrder: {
    id: 'service-1',
    accountId: 'account-1',
    customerId: 'customer-1',
    buildingId: 'building-1',
    managementCompanyId: 'management-1'
  },
  building: {
    id: 'building-1',
    accountId: 'account-1',
    managementCompanyId: 'management-1'
  },
  customer: {
    id: 'customer-1',
    accountId: 'account-1',
    managementCompanyId: 'management-1'
  },
  managementCompany: {
    id: 'management-1',
    accountId: 'account-1',
    customerId: 'customer-1'
  }
};

describe('resolveClientPortalScope', () => {
  it('resolves account/customer/management/building scope for a valid service', () => {
    expect(resolveClientPortalScope(validScope)).toEqual({
      accountId: 'account-1',
      buildingId: 'building-1',
      customerId: 'customer-1',
      managementCompanyId: 'management-1'
    });
  });

  it('rejects a token customer that does not own the service', () => {
    expect(() => resolveClientPortalScope({ ...validScope, requestedCustomerId: 'customer-2' })).toThrow('Token no corresponde al cliente.');
  });

  it('rejects cross-account building access', () => {
    expect(() => resolveClientPortalScope({
      ...validScope,
      building: { ...validScope.building, accountId: 'account-2' }
    })).toThrow('Edificio pertenece a otra cuenta.');
  });

  it('rejects a customer outside the management relationship', () => {
    expect(() => resolveClientPortalScope({
      ...validScope,
      customer: { ...validScope.customer, managementCompanyId: 'management-2' }
    })).toThrow('Administración del cliente no corresponde al alcance del token.');
  });
});
