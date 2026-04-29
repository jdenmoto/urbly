import { describe, expect, it } from 'vitest';

import {
  createServiceOrderStatus,
  getAllowedServiceOrderActions,
  getNextServiceOrderStatuses,
  isServiceOrderTransitionAllowed,
  resolveServiceOrderTransition,
  type ServiceOrderIssueOutcome,
} from '@/features/services/serviceOrderTransitions';

describe('service order transition rules', () => {
  it('derives the approved creation statuses from completeness and assignment', () => {
    expect(createServiceOrderStatus({ isDraft: true })).toBe('draft');
    expect(createServiceOrderStatus({ assignedTechnicianId: null })).toBe('unassigned');
    expect(createServiceOrderStatus({ assignedTechnicianId: 'tech-1' })).toBe('scheduled');
  });

  it('makes assignment explicit as the path into scheduled work', () => {
    expect(resolveServiceOrderTransition('draft', 'assign')).toBe('scheduled');
    expect(resolveServiceOrderTransition('unassigned', 'assign')).toBe('scheduled');
    expect(resolveServiceOrderTransition('requires_reschedule', 'assign')).toBe('scheduled');
    expect(isServiceOrderTransitionAllowed('completed', 'assign')).toBe(false);
  });

  it('only allows starting work from scheduled operational states', () => {
    expect(getNextServiceOrderStatuses('scheduled', 'start')).toEqual(['in_progress']);
    expect(getNextServiceOrderStatuses('confirmed', 'start')).toEqual(['in_progress']);
    expect(isServiceOrderTransitionAllowed('unassigned', 'start')).toBe(false);
  });

  it('supports explicit confirmation before execution', () => {
    expect(resolveServiceOrderTransition('scheduled', 'confirm')).toBe('confirmed');
    expect(isServiceOrderTransitionAllowed('confirmed', 'confirm')).toBe(false);
    expect(isServiceOrderTransitionAllowed('unassigned', 'confirm')).toBe(false);
  });

  it('supports pause and resume only around active execution', () => {
    expect(resolveServiceOrderTransition('in_progress', 'pause')).toBe('paused');
    expect(resolveServiceOrderTransition('paused', 'resume')).toBe('in_progress');
    expect(isServiceOrderTransitionAllowed('scheduled', 'pause')).toBe(false);
    expect(isServiceOrderTransitionAllowed('in_progress', 'resume')).toBe(false);
  });

  it('routes issue reporting into the approved review or reschedule statuses', () => {
    const outcomes: ServiceOrderIssueOutcome[] = ['pending_review', 'requires_reschedule'];

    expect(getNextServiceOrderStatuses('in_progress', 'report_issue')).toEqual(outcomes);
    expect(resolveServiceOrderTransition('in_progress', 'report_issue')).toBeNull();
    expect(resolveServiceOrderTransition('in_progress', 'report_issue', { issueOutcome: 'pending_review' })).toBe('pending_review');
    expect(resolveServiceOrderTransition('paused', 'report_issue', { issueOutcome: 'requires_reschedule' })).toBe('requires_reschedule');
    expect(resolveServiceOrderTransition('scheduled', 'report_issue', { issueOutcome: 'pending_review' })).toBeNull();
  });

  it('makes rescheduling return to scheduled or unassigned depending on assignment', () => {
    expect(getNextServiceOrderStatuses('requires_reschedule', 'reschedule')).toEqual(['unassigned', 'scheduled']);
    expect(resolveServiceOrderTransition('requires_reschedule', 'reschedule')).toBeNull();
    expect(resolveServiceOrderTransition('requires_reschedule', 'reschedule', { assignedTechnicianId: null })).toBe('unassigned');
    expect(resolveServiceOrderTransition('pending_review', 'reschedule', { assignedTechnicianId: 'tech-1' })).toBe('scheduled');
    expect(isServiceOrderTransitionAllowed('completed', 'reschedule')).toBe(false);
  });

  it('keeps complete and cancel explicit, blocking terminal orders from changing again', () => {
    expect(resolveServiceOrderTransition('in_progress', 'complete')).toBe('completed');
    expect(resolveServiceOrderTransition('scheduled', 'cancel')).toBe('cancelled');
    expect(getAllowedServiceOrderActions('completed')).toEqual([]);
    expect(getAllowedServiceOrderActions('cancelled')).toEqual([]);
  });

  it('exposes the reusable action menu for active states', () => {
    expect(getAllowedServiceOrderActions('scheduled')).toEqual(['assign', 'confirm', 'start', 'reschedule', 'cancel']);
    expect(getAllowedServiceOrderActions('paused')).toEqual(['resume', 'report_issue', 'cancel']);
  });
});
