import { describe, expect, it, vi } from 'vitest';

vi.mock('../functions/src/admin', () => ({
  db: { collection: vi.fn() },
  FieldValue: { serverTimestamp: vi.fn() }
}));

import { canImportBuildingsForMember, isControlledImportDownloadUrl } from '../functions/src/imports';

describe('building import authorization', () => {
  it('permite owner/admin/editor activos', () => {
    for (const role of ['owner', 'admin', 'editor']) {
      expect(canImportBuildingsForMember({ role, active: true, permissions: [] })).toBe(true);
    }
  });

  it('permite permiso import_buildings explícito en membresía activa', () => {
    expect(canImportBuildingsForMember({ role: 'scheduler', active: true, permissions: ['import_buildings'] })).toBe(true);
  });

  it('rechaza miembros inactivos o sin permiso específico', () => {
    expect(canImportBuildingsForMember({ role: 'admin', active: false, permissions: [] })).toBe(false);
    expect(canImportBuildingsForMember({ role: 'scheduler', active: true, permissions: [] })).toBe(false);
    expect(canImportBuildingsForMember(null)).toBe(false);
  });

  it('acepta solo URLs de Firebase Storage bajo imports', () => {
    expect(isControlledImportDownloadUrl('https://firebasestorage.googleapis.com/v0/b/demo.appspot.com/o/imports%2F1700000000000-buildings.xlsx?alt=media&token=abc')).toBe(true);
    expect(isControlledImportDownloadUrl('https://firebasestorage.googleapis.com/v0/b/demo.appspot.com/o/evidence%2Ffile.xlsx?alt=media')).toBe(false);
    expect(isControlledImportDownloadUrl('https://example.com/imports/file.xlsx')).toBe(false);
    expect(isControlledImportDownloadUrl('not-a-url')).toBe(false);
  });
});
