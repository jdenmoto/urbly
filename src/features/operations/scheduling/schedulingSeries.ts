import { addDays, addMonths, addWeeks } from 'date-fns';

export const SCHEDULING_SERIES_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;

export type SchedulingSeriesFrequency = (typeof SCHEDULING_SERIES_FREQUENCIES)[number];

export type SchedulingSeriesRule = {
  frequency: SchedulingSeriesFrequency;
  interval: number;
  count?: number;
};

export type SchedulingSeriesMetadata = {
  seriesId: string;
  recurrence: string;
  seriesAnchorStartAt: string;
  seriesOccurrenceIndex: number;
};

export type SchedulingSeriesOccurrence = {
  occurrenceIndex: number;
  scheduledStartAt: string;
  scheduledEndAt: string;
};

export type SchedulingSeriesScope = 'this' | 'future';

export function serializeSchedulingSeriesRule(rule: SchedulingSeriesRule) {
  const count = rule.count ?? '';
  return `${rule.frequency}:${rule.interval}:${count}`.replace(/:$/, '');
}

export function parseSchedulingSeriesRule(recurrence: string | null | undefined): SchedulingSeriesRule | null {
  if (!recurrence) return null;

  const [frequency, intervalRaw, countRaw] = recurrence.split(':');
  if (!frequency || !SCHEDULING_SERIES_FREQUENCIES.includes(frequency as SchedulingSeriesFrequency)) return null;

  const interval = Number(intervalRaw ?? '1');
  if (!Number.isFinite(interval) || interval < 1) return null;

  const count = countRaw ? Number(countRaw) : undefined;
  return {
    frequency: frequency as SchedulingSeriesFrequency,
    interval,
    ...(count && Number.isFinite(count) && count > 0 ? { count } : {}),
  };
}

export function buildSchedulingSeriesMetadata(input: {
  startAt: string;
  recurrence: SchedulingSeriesRule;
  seriesId?: string;
}): SchedulingSeriesMetadata {
  return {
    seriesId: input.seriesId ?? (crypto?.randomUUID ? crypto.randomUUID() : `series-${Date.now()}`),
    recurrence: serializeSchedulingSeriesRule(input.recurrence),
    seriesAnchorStartAt: input.startAt,
    seriesOccurrenceIndex: 0,
  };
}

function addByRule(date: Date, rule: SchedulingSeriesRule) {
  switch (rule.frequency) {
    case 'daily':
      return addDays(date, rule.interval);
    case 'weekly':
      return addWeeks(date, rule.interval);
    case 'monthly':
      return addMonths(date, rule.interval);
    default:
      return date;
  }
}

export function expandSchedulingSeriesOccurrences(input: {
  scheduledStartAt: string;
  scheduledEndAt: string;
  recurrence: SchedulingSeriesRule;
}): SchedulingSeriesOccurrence[] {
  const total = input.recurrence.count ?? 1;
  const occurrences: SchedulingSeriesOccurrence[] = [];
  let currentStart = new Date(input.scheduledStartAt);
  let currentEnd = new Date(input.scheduledEndAt);

  for (let occurrenceIndex = 0; occurrenceIndex < total; occurrenceIndex += 1) {
    occurrences.push({
      occurrenceIndex,
      scheduledStartAt: currentStart.toISOString(),
      scheduledEndAt: currentEnd.toISOString(),
    });

    currentStart = addByRule(currentStart, input.recurrence);
    currentEnd = addByRule(currentEnd, input.recurrence);
  }

  return occurrences;
}

export function filterSeriesByScope<T extends { seriesOccurrenceIndex?: number | null }>(input: {
  items: T[];
  currentOccurrenceIndex: number;
  scope: SchedulingSeriesScope;
}) {
  if (input.scope === 'this') {
    return input.items.filter((item) => (item.seriesOccurrenceIndex ?? 0) === input.currentOccurrenceIndex);
  }

  return input.items.filter((item) => (item.seriesOccurrenceIndex ?? 0) >= input.currentOccurrenceIndex);
}
