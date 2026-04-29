import type { ServiceOrderStatus } from '@/core/models/serviceOrder';

export type SchedulableServiceOrderLike = {
  id: string;
  title: string;
  assignedTechnicianId?: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: ServiceOrderStatus;
};

export type SchedulingConflict = {
  id: string;
  title: string;
  status: ServiceOrderStatus;
  scheduledStartAt: string;
  scheduledEndAt: string;
  overlapMinutes: number;
};

export type SchedulingWarning = {
  id: string;
  title: string;
  type: 'tight_turnaround';
  gapMinutes: number;
  scheduledStartAt: string;
  scheduledEndAt: string;
};

export type SchedulingConflictUiState = 'clear' | 'warning' | 'block' | 'override_needed';

export type DetectSchedulingConflictsInput = {
  serviceOrders: SchedulableServiceOrderLike[];
  technicianId?: string | null;
  serviceOrderId?: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string;
  overrideAllowed?: boolean;
  minimumGapMinutes?: number;
};

export type SchedulingConflictResult = {
  technicianId: string | null;
  hasConflicts: boolean;
  conflicts: SchedulingConflict[];
  warnings: SchedulingWarning[];
  uiState: SchedulingConflictUiState;
};

const TERMINAL_STATUSES = new Set<ServiceOrderStatus>(['completed', 'cancelled']);

function toMs(value: string) {
  return new Date(value).getTime();
}

function roundMinutes(ms: number) {
  return Math.max(0, Math.round(ms / 60000));
}

export function hasSchedulingOverlap(
  left: Pick<SchedulableServiceOrderLike, 'scheduledStartAt' | 'scheduledEndAt'>,
  right: Pick<SchedulableServiceOrderLike, 'scheduledStartAt' | 'scheduledEndAt'>,
) {
  return toMs(left.scheduledStartAt) < toMs(right.scheduledEndAt)
    && toMs(right.scheduledStartAt) < toMs(left.scheduledEndAt);
}

function getOverlapMinutes(
  left: Pick<SchedulableServiceOrderLike, 'scheduledStartAt' | 'scheduledEndAt'>,
  right: Pick<SchedulableServiceOrderLike, 'scheduledStartAt' | 'scheduledEndAt'>,
) {
  const overlapStart = Math.max(toMs(left.scheduledStartAt), toMs(right.scheduledStartAt));
  const overlapEnd = Math.min(toMs(left.scheduledEndAt), toMs(right.scheduledEndAt));
  return roundMinutes(overlapEnd - overlapStart);
}

function getGapMinutes(
  left: Pick<SchedulableServiceOrderLike, 'scheduledStartAt' | 'scheduledEndAt'>,
  right: Pick<SchedulableServiceOrderLike, 'scheduledStartAt' | 'scheduledEndAt'>,
) {
  const leftEnd = toMs(left.scheduledEndAt);
  const rightStart = toMs(right.scheduledStartAt);
  const rightEnd = toMs(right.scheduledEndAt);
  const leftStart = toMs(left.scheduledStartAt);

  if (leftEnd <= rightStart) return roundMinutes(rightStart - leftEnd);
  if (rightEnd <= leftStart) return roundMinutes(leftStart - rightEnd);
  return 0;
}

export function detectSchedulingConflicts(input: DetectSchedulingConflictsInput): SchedulingConflictResult {
  const technicianId = input.technicianId ?? null;
  if (!technicianId) {
    return {
      technicianId,
      hasConflicts: false,
      conflicts: [],
      warnings: [],
      uiState: 'clear',
    };
  }

  const candidate = {
    scheduledStartAt: input.scheduledStartAt,
    scheduledEndAt: input.scheduledEndAt,
  };

  const relevantOrders = input.serviceOrders.filter((serviceOrder) => (
    serviceOrder.assignedTechnicianId === technicianId
    && serviceOrder.id !== input.serviceOrderId
    && !TERMINAL_STATUSES.has(serviceOrder.status)
  ));

  const conflicts = relevantOrders
    .filter((serviceOrder) => hasSchedulingOverlap(candidate, serviceOrder))
    .map<SchedulingConflict>((serviceOrder) => ({
      id: serviceOrder.id,
      title: serviceOrder.title,
      status: serviceOrder.status,
      scheduledStartAt: serviceOrder.scheduledStartAt,
      scheduledEndAt: serviceOrder.scheduledEndAt,
      overlapMinutes: getOverlapMinutes(candidate, serviceOrder),
    }))
    .sort((a, b) => toMs(a.scheduledStartAt) - toMs(b.scheduledStartAt));

  const minimumGapMinutes = input.minimumGapMinutes ?? 0;
  const warnings = minimumGapMinutes > 0
    ? relevantOrders
      .filter((serviceOrder) => !hasSchedulingOverlap(candidate, serviceOrder))
      .map((serviceOrder) => ({
        serviceOrder,
        gapMinutes: getGapMinutes(candidate, serviceOrder),
      }))
      .filter(({ gapMinutes }) => gapMinutes > 0 && gapMinutes < minimumGapMinutes)
      .map<SchedulingWarning>(({ serviceOrder, gapMinutes }) => ({
        id: serviceOrder.id,
        title: serviceOrder.title,
        type: 'tight_turnaround',
        gapMinutes,
        scheduledStartAt: serviceOrder.scheduledStartAt,
        scheduledEndAt: serviceOrder.scheduledEndAt,
      }))
      .sort((a, b) => a.gapMinutes - b.gapMinutes)
    : [];

  const hasConflicts = conflicts.length > 0;
  const uiState: SchedulingConflictUiState = hasConflicts
    ? (input.overrideAllowed ? 'override_needed' : 'block')
    : warnings.length > 0
      ? 'warning'
      : 'clear';

  return {
    technicianId,
    hasConflicts,
    conflicts,
    warnings,
    uiState,
  };
}
