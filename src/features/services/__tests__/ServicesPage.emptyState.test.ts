import { describe, expect, it } from 'vitest';
import { getServicesEmptyState, hasActiveServiceFilters } from '../ServicesPage';

describe('ServicesPage empty states', () => {
  it('uses a technician-specific empty state when the technician has no assigned services', () => {
    expect(
      getServicesEmptyState({
        isTechnicianView: true,
        hasActiveFilters: false,
        scopedTotal: 0,
        selectedBuildingName: null,
      }),
    ).toEqual({
      titleKey: 'services.empty.technician.title',
      descriptionKey: 'services.empty.technician.description',
      action: 'none',
    });
  });

  it('prompts technicians to clear filters when assigned services are hidden', () => {
    expect(
      getServicesEmptyState({
        isTechnicianView: true,
        hasActiveFilters: true,
        scopedTotal: 3,
        selectedBuildingName: 'Torre Norte',
      }),
    ).toEqual({
      titleKey: 'services.empty.technician.filtered.title',
      descriptionKey: 'services.empty.technician.filtered.description',
      action: 'clearFilters',
      descriptionParams: { building: 'Torre Norte' },
    });
  });

  it('prompts operators to create the first service when there are no service orders', () => {
    expect(
      getServicesEmptyState({
        isTechnicianView: false,
        hasActiveFilters: false,
        scopedTotal: 0,
        selectedBuildingName: null,
      }).action,
    ).toBe('createService');
  });

  it('detects active filters', () => {
    expect(hasActiveServiceFilters({ buildingId: '', from: '', to: '', status: '' })).toBe(false);
    expect(hasActiveServiceFilters({ buildingId: 'building-1', from: '', to: '', status: '' })).toBe(true);
    expect(hasActiveServiceFilters({ buildingId: '', from: '2026-05-13', to: '', status: '' })).toBe(true);
  });
});
