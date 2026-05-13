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
  type ServiceOrderPermissionRole,
} from '@/features/services/serviceOrderPermissions';

const fullAccessRoles: ServiceOrderPermissionRole[] = ['owner', 'admin', 'editor', 'supervisor'];
const internalReadOnlyRoles: ServiceOrderPermissionRole[] = ['view', 'auditoria'];
const requestOnlyRoles: ServiceOrderPermissionRole[] = ['building_admin', 'client'];
const technicianRoles: ServiceOrderPermissionRole[] = ['technician', 'emergency_scheduler'];

describe('service order permissions', () => {
  it('grants all operational actions to owner, admin, editor and supervisor', () => {
    for (const role of fullAccessRoles) {
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

  it('allows schedulers to schedule, assign and reschedule but not close services', () => {
    expect(getAllowedServiceOrderPermissionActions('scheduler')).toEqual([
      'create',
      'schedule',
      'assign',
      'confirm',
      'reschedule',
    ]);

    expect(canCreateServiceOrder('scheduler')).toBe(true);
    expect(canScheduleServiceOrder('scheduler')).toBe(true);
    expect(canAssignServiceOrder('scheduler')).toBe(true);
    expect(canConfirmServiceOrder('scheduler')).toBe(true);
    expect(canRescheduleServiceOrder('scheduler')).toBe(true);
    expect(canOverrideServiceOrderConflict('scheduler')).toBe(false);
    expect(canStartServiceOrder('scheduler')).toBe(false);
    expect(canPauseServiceOrder('scheduler')).toBe(false);
    expect(canResumeServiceOrder('scheduler')).toBe(false);
    expect(canReportServiceOrderIssue('scheduler')).toBe(false);
    expect(canCloseServiceOrder('scheduler')).toBe(false);
    expect(canCancelServiceOrder('scheduler')).toBe(false);
  });

  it('limits operators and technicians to execution actions', () => {
    for (const role of ['operator', ...technicianRoles] as const) {
      expect(getAllowedServiceOrderPermissionActions(role)).toEqual([
        'start',
        'pause',
        'resume',
        'report_issue',
        'close',
      ]);

      expect(canCreateServiceOrder(role)).toBe(false);
      expect(canScheduleServiceOrder(role)).toBe(false);
      expect(canAssignServiceOrder(role)).toBe(false);
      expect(canConfirmServiceOrder(role)).toBe(false);
      expect(canRescheduleServiceOrder(role)).toBe(false);
      expect(canOverrideServiceOrderConflict(role)).toBe(false);
      expect(canStartServiceOrder(role)).toBe(true);
      expect(canPauseServiceOrder(role)).toBe(true);
      expect(canResumeServiceOrder(role)).toBe(true);
      expect(canReportServiceOrderIssue(role)).toBe(true);
      expect(canCloseServiceOrder(role)).toBe(true);
      expect(canCancelServiceOrder(role)).toBe(false);
    }
  });

  it('keeps view and auditoria read-only for service mutations', () => {
    for (const role of internalReadOnlyRoles) {
      expect(getAllowedServiceOrderPermissionActions(role)).toEqual([]);
      expect(canCreateServiceOrder(role)).toBe(false);
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
    for (const role of [...fullAccessRoles, 'scheduler', 'operator', ...internalReadOnlyRoles] as const) {
      expect(isInternalServiceOrderRole(role)).toBe(true);
      expect(isTechnicianServiceOrderRole(role)).toBe(false);
      expect(isRequestOnlyServiceOrderRole(role)).toBe(false);
    }

    for (const role of technicianRoles) {
      expect(isInternalServiceOrderRole(role)).toBe(false);
      expect(isTechnicianServiceOrderRole(role)).toBe(true);
      expect(isRequestOnlyServiceOrderRole(role)).toBe(false);
    }

    for (const role of requestOnlyRoles) {
      expect(isInternalServiceOrderRole(role)).toBe(false);
      expect(isTechnicianServiceOrderRole(role)).toBe(false);
      expect(isRequestOnlyServiceOrderRole(role)).toBe(true);
    }
  });

  it('supports action-level checks through the generic helper', () => {
    expect(hasServiceOrderPermission('scheduler', 'assign')).toBe(true);
    expect(hasServiceOrderPermission('scheduler', 'close')).toBe(false);
    expect(hasServiceOrderPermission('client', 'create')).toBe(true);
    expect(hasServiceOrderPermission('client', 'assign')).toBe(false);
    expect(hasServiceOrderPermission('technician', 'close')).toBe(true);
    expect(hasServiceOrderPermission('emergency_scheduler', 'close')).toBe(true);
    expect(hasServiceOrderPermission('technician', 'override_conflict')).toBe(false);
  });

  it('returns no permissions for unknown legacy roles', () => {
    const unknownRole = 'legacy_role' as ServiceOrderPermissionRole;

    expect(getAllowedServiceOrderPermissionActions(unknownRole)).toEqual([]);
    expect(hasServiceOrderPermission(unknownRole, 'create')).toBe(false);
  });
});
