import { describe, expect, it } from 'vitest';

import {
  canAssignServiceOrder,
  canCancelServiceOrder,
  canCloseServiceOrder,
  canConfirmServiceOrder,
  canCreateServiceOrder,
  canOverrideServiceOrderConflict,
  canPauseServiceOrder,
  canReportServiceOrderIssue,
  canRescheduleServiceOrder,
  canResumeServiceOrder,
  canScheduleServiceOrder,
  canStartServiceOrder,
  getAllowedServiceOrderPermissionActions,
  hasServiceOrderPermission,
  isInternalServiceOrderRole,
  isRequestOnlyServiceOrderRole,
  isTechnicianServiceOrderRole,
  SERVICE_ORDER_PERMISSION_ACTIONS,
} from '@/features/services/serviceOrderPermissions';
import type { AppUserRole } from '@/core/models/appUser';

const internalRoles: AppUserRole[] = ['admin', 'editor', 'view', 'supervisor', 'scheduler', 'operator', 'auditoria'];
const requestOnlyRoles: AppUserRole[] = ['building_admin', 'client'];
const technicianRole: AppUserRole = 'emergency_scheduler';

describe('service order permissions', () => {
  it('grants all operational actions to internal roles', () => {
    for (const role of internalRoles) {
      expect(getAllowedServiceOrderPermissionActions(role)).toEqual(SERVICE_ORDER_PERMISSION_ACTIONS);
      expect(canCreateServiceOrder(role)).toBe(true);
      expect(canScheduleServiceOrder(role)).toBe(true);
      expect(canAssignServiceOrder(role)).toBe(true);
      expect(canConfirmServiceOrder(role)).toBe(true);
      expect(canRescheduleServiceOrder(role)).toBe(true);
      expect(canOverrideServiceOrderConflict(role)).toBe(true);
      expect(canStartServiceOrder(role)).toBe(true);
      expect(canPauseServiceOrder(role)).toBe(true);
      expect(canResumeServiceOrder(role)).toBe(true);
      expect(canReportServiceOrderIssue(role)).toBe(true);
      expect(canCloseServiceOrder(role)).toBe(true);
      expect(canCancelServiceOrder(role)).toBe(true);
    }
  });

  it('limits technicians to execution actions only', () => {
    expect(getAllowedServiceOrderPermissionActions(technicianRole)).toEqual([
      'start',
      'pause',
      'resume',
      'report_issue',
      'close',
    ]);

    expect(canCreateServiceOrder(technicianRole)).toBe(false);
    expect(canScheduleServiceOrder(technicianRole)).toBe(false);
    expect(canAssignServiceOrder(technicianRole)).toBe(false);
    expect(canConfirmServiceOrder(technicianRole)).toBe(false);
    expect(canRescheduleServiceOrder(technicianRole)).toBe(false);
    expect(canOverrideServiceOrderConflict(technicianRole)).toBe(false);
    expect(canStartServiceOrder(technicianRole)).toBe(true);
    expect(canPauseServiceOrder(technicianRole)).toBe(true);
    expect(canResumeServiceOrder(technicianRole)).toBe(true);
    expect(canReportServiceOrderIssue(technicianRole)).toBe(true);
    expect(canCloseServiceOrder(technicianRole)).toBe(true);
    expect(canCancelServiceOrder(technicianRole)).toBe(false);
  });

  it('allows building admins and clients to create requests only', () => {
    for (const role of requestOnlyRoles) {
      expect(getAllowedServiceOrderPermissionActions(role)).toEqual(['create']);
      expect(canCreateServiceOrder(role)).toBe(true);
      expect(canScheduleServiceOrder(role)).toBe(false);
      expect(canAssignServiceOrder(role)).toBe(false);
      expect(canConfirmServiceOrder(role)).toBe(false);
      expect(canRescheduleServiceOrder(role)).toBe(false);
      expect(canOverrideServiceOrderConflict(role)).toBe(false);
      expect(canStartServiceOrder(role)).toBe(false);
      expect(canPauseServiceOrder(role)).toBe(false);
      expect(canResumeServiceOrder(role)).toBe(false);
      expect(canReportServiceOrderIssue(role)).toBe(false);
      expect(canCloseServiceOrder(role)).toBe(false);
      expect(canCancelServiceOrder(role)).toBe(false);
    }
  });

  it('classifies service order roles by permission scope', () => {
    for (const role of internalRoles) {
      expect(isInternalServiceOrderRole(role)).toBe(true);
      expect(isTechnicianServiceOrderRole(role)).toBe(false);
      expect(isRequestOnlyServiceOrderRole(role)).toBe(false);
    }

    expect(isInternalServiceOrderRole(technicianRole)).toBe(false);
    expect(isTechnicianServiceOrderRole(technicianRole)).toBe(true);
    expect(isRequestOnlyServiceOrderRole(technicianRole)).toBe(false);

    for (const role of requestOnlyRoles) {
      expect(isInternalServiceOrderRole(role)).toBe(false);
      expect(isTechnicianServiceOrderRole(role)).toBe(false);
      expect(isRequestOnlyServiceOrderRole(role)).toBe(true);
    }
  });

  it('supports action-level checks through the generic helper', () => {
    expect(hasServiceOrderPermission('scheduler', 'assign')).toBe(true);
    expect(hasServiceOrderPermission('client', 'create')).toBe(true);
    expect(hasServiceOrderPermission('client', 'assign')).toBe(false);
    expect(hasServiceOrderPermission('emergency_scheduler', 'close')).toBe(true);
    expect(hasServiceOrderPermission('emergency_scheduler', 'override_conflict')).toBe(false);
  });

  it('returns no permissions for unknown legacy roles', () => {
    const unknownRole = 'legacy_role' as AppUserRole;

    expect(getAllowedServiceOrderPermissionActions(unknownRole)).toEqual([]);
    expect(hasServiceOrderPermission(unknownRole, 'create')).toBe(false);
  });
});
