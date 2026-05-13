import { describe, expect, it, vi } from 'vitest';

vi.mock('../functions/src/admin', () => ({
  db: { collection: vi.fn() }
}));

import { canGenerateServiceReportPdfForMember } from '../functions/src/serviceReports';

const serviceOrder = {
  accountId: 'account-a',
  assignedTechnicianId: 'tech-1',
  customerId: 'customer-1',
  managementCompanyId: 'mgmt-1',
  buildingId: 'building-1'
};

describe('service report PDF authorization', () => {
  it('permite roles internos del account', () => {
    expect(canGenerateServiceReportPdfForMember({
      serviceOrder,
      member: { role: 'supervisor' },
      uid: 'user-1'
    })).toBe(true);
  });

  it('permite solo al técnico asignado', () => {
    expect(canGenerateServiceReportPdfForMember({
      serviceOrder,
      member: { role: 'technician' },
      uid: 'tech-1'
    })).toBe(true);

    expect(canGenerateServiceReportPdfForMember({
      serviceOrder,
      member: { role: 'technician' },
      uid: 'tech-2'
    })).toBe(false);
  });

  it('permite clientes relacionados por cliente, administración o edificio', () => {
    expect(canGenerateServiceReportPdfForMember({
      serviceOrder,
      member: { role: 'client', customerId: 'customer-1' },
      uid: 'client-1'
    })).toBe(true);

    expect(canGenerateServiceReportPdfForMember({
      serviceOrder,
      member: { role: 'building_admin', administrationId: 'mgmt-1' },
      uid: 'admin-building-1'
    })).toBe(true);

    expect(canGenerateServiceReportPdfForMember({
      serviceOrder,
      member: { role: 'building_admin', buildingId: 'building-1' },
      uid: 'admin-building-2'
    })).toBe(true);
  });

  it('rechaza roles externos o relaciones no vinculadas', () => {
    expect(canGenerateServiceReportPdfForMember({
      serviceOrder,
      member: { role: 'view' },
      uid: 'view-1'
    })).toBe(false);

    expect(canGenerateServiceReportPdfForMember({
      serviceOrder,
      member: { role: 'client', customerId: 'customer-2' },
      uid: 'client-2'
    })).toBe(false);
  });
});
