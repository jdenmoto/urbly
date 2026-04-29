import type { ServiceOrderStatus } from '@/core/models/serviceOrder';

export const SERVICE_ORDER_TRANSITION_ACTIONS = [
  'create',
  'assign',
  'start',
  'pause',
  'resume',
  'report_issue',
  'reschedule',
  'complete',
  'cancel',
] as const;

export type ServiceOrderTransitionAction = (typeof SERVICE_ORDER_TRANSITION_ACTIONS)[number];
export type ServiceOrderIssueOutcome = Extract<ServiceOrderStatus, 'pending_review' | 'requires_reschedule'>;
export type ServiceOrderCreationStatus = Extract<ServiceOrderStatus, 'draft' | 'unassigned' | 'scheduled'>;

type ServiceOrderTransitionContext = {
  assignedTechnicianId?: string | null;
  issueOutcome?: ServiceOrderIssueOutcome;
  isDraft?: boolean;
};

type ServiceOrderTransitionRule = {
  from: readonly ServiceOrderStatus[];
  resolve: (context?: ServiceOrderTransitionContext) => readonly ServiceOrderStatus[];
};

const TERMINAL_STATUSES: readonly ServiceOrderStatus[] = ['completed', 'cancelled'];

const TRANSITION_RULES: Record<Exclude<ServiceOrderTransitionAction, 'create'>, ServiceOrderTransitionRule> = {
  assign: {
    from: ['draft', 'unassigned', 'scheduled', 'confirmed', 'pending_review', 'requires_reschedule'],
    resolve: () => ['scheduled'],
  },
  start: {
    from: ['scheduled', 'confirmed'],
    resolve: () => ['in_progress'],
  },
  pause: {
    from: ['in_progress'],
    resolve: () => ['paused'],
  },
  resume: {
    from: ['paused'],
    resolve: () => ['in_progress'],
  },
  report_issue: {
    from: ['in_progress', 'paused'],
    resolve: () => ['pending_review', 'requires_reschedule'],
  },
  reschedule: {
    from: ['draft', 'unassigned', 'scheduled', 'confirmed', 'pending_review', 'requires_reschedule'],
    resolve: (context) => deriveAssignedSchedulingStatuses(context),
  },
  complete: {
    from: ['in_progress'],
    resolve: () => ['completed'],
  },
  cancel: {
    from: ['draft', 'unassigned', 'scheduled', 'confirmed', 'in_progress', 'paused', 'pending_review', 'requires_reschedule'],
    resolve: () => ['cancelled'],
  },
};

function deriveAssignedSchedulingStatuses(
  context?: Pick<ServiceOrderTransitionContext, 'assignedTechnicianId'>,
): readonly ServiceOrderStatus[] {
  if (typeof context?.assignedTechnicianId === 'string' && context.assignedTechnicianId.length > 0) {
    return ['scheduled'];
  }

  if (context && 'assignedTechnicianId' in context) {
    return ['unassigned'];
  }

  return ['unassigned', 'scheduled'];
}

function dedupeStatuses(statuses: readonly ServiceOrderStatus[]) {
  return [...new Set(statuses)] satisfies ServiceOrderStatus[];
}

export function createServiceOrderStatus(context?: Pick<ServiceOrderTransitionContext, 'assignedTechnicianId' | 'isDraft'>): ServiceOrderCreationStatus {
  if (context?.isDraft) return 'draft';
  return context?.assignedTechnicianId ? 'scheduled' : 'unassigned';
}

export function getNextServiceOrderStatuses(
  currentStatus: ServiceOrderStatus,
  action: Exclude<ServiceOrderTransitionAction, 'create'>,
  context?: ServiceOrderTransitionContext,
): ServiceOrderStatus[] {
  const rule = TRANSITION_RULES[action];
  if (!rule.from.includes(currentStatus)) return [];

  if (action === 'report_issue' && context?.issueOutcome) {
    return [context.issueOutcome];
  }

  return dedupeStatuses(rule.resolve(context));
}

export function isServiceOrderTransitionAllowed(
  currentStatus: ServiceOrderStatus,
  action: Exclude<ServiceOrderTransitionAction, 'create'>,
  context?: ServiceOrderTransitionContext,
) {
  return getNextServiceOrderStatuses(currentStatus, action, context).length > 0;
}

export function resolveServiceOrderTransition(
  currentStatus: ServiceOrderStatus,
  action: Exclude<ServiceOrderTransitionAction, 'create'>,
  context?: ServiceOrderTransitionContext,
): ServiceOrderStatus | null {
  const nextStatuses = getNextServiceOrderStatuses(currentStatus, action, context);
  if (nextStatuses.length !== 1) return null;

  return nextStatuses[0] ?? null;
}

export function getAllowedServiceOrderActions(currentStatus: ServiceOrderStatus): Exclude<ServiceOrderTransitionAction, 'create'>[] {
  if (TERMINAL_STATUSES.includes(currentStatus)) return [];

  return (Object.entries(TRANSITION_RULES) as Array<[
    Exclude<ServiceOrderTransitionAction, 'create'>,
    ServiceOrderTransitionRule,
  ]>)
    .filter(([, rule]) => rule.from.includes(currentStatus))
    .map(([action]) => action);
}
