import { describe, expect, it } from 'vitest';
import { getTechnicianPrimaryCtaTarget, isTechnicianRole } from '../TechnicianPrimaryMobileCta';

describe('TechnicianPrimaryMobileCta model', () => {
  it('treats technician and legacy emergency scheduler as technician workflow roles', () => {
    expect(isTechnicianRole('technician')).toBe(true);
    expect(isTechnicianRole('emergency_scheduler')).toBe(true);
    expect(isTechnicianRole('operator')).toBe(false);
    expect(isTechnicianRole(null)).toBe(false);
  });

  it('keeps Services as the primary operational entry point', () => {
    expect(getTechnicianPrimaryCtaTarget('service-1')).toBe('/services/service-1');
    expect(getTechnicianPrimaryCtaTarget(null)).toBe('/services');
  });
});
