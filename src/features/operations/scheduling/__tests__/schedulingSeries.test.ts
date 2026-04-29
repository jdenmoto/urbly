import { describe, expect, it } from 'vitest';

import {
  buildSchedulingSeriesMetadata,
  expandSchedulingSeriesOccurrences,
  filterSeriesByScope,
  parseSchedulingSeriesRule,
} from '@/features/operations/scheduling/schedulingSeries';

describe('scheduling series helpers', () => {
  it('builds stable metadata for a basic recurring series', () => {
    const metadata = buildSchedulingSeriesMetadata({
      startAt: '2026-05-10T14:00:00.000Z',
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        count: 4,
      },
      seriesId: 'series-1',
    });

    expect(metadata).toEqual({
      seriesId: 'series-1',
      recurrence: 'weekly:1:4',
      seriesAnchorStartAt: '2026-05-10T14:00:00.000Z',
      seriesOccurrenceIndex: 0,
    });
  });

  it('expands future occurrences from the anchor service window', () => {
    const occurrences = expandSchedulingSeriesOccurrences({
      scheduledStartAt: '2026-05-10T14:00:00.000Z',
      scheduledEndAt: '2026-05-10T15:30:00.000Z',
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        count: 3,
      },
    });

    expect(occurrences).toEqual([
      expect.objectContaining({
        occurrenceIndex: 0,
        scheduledStartAt: '2026-05-10T14:00:00.000Z',
        scheduledEndAt: '2026-05-10T15:30:00.000Z',
      }),
      expect.objectContaining({
        occurrenceIndex: 1,
        scheduledStartAt: '2026-05-17T14:00:00.000Z',
        scheduledEndAt: '2026-05-17T15:30:00.000Z',
      }),
      expect.objectContaining({
        occurrenceIndex: 2,
        scheduledStartAt: '2026-05-24T14:00:00.000Z',
        scheduledEndAt: '2026-05-24T15:30:00.000Z',
      }),
    ]);
  });

  it('filters the approved scopes for this occurrence or future occurrences', () => {
    const items = [
      { id: 'so-1', seriesOccurrenceIndex: 0 },
      { id: 'so-2', seriesOccurrenceIndex: 1 },
      { id: 'so-3', seriesOccurrenceIndex: 2 },
    ];

    expect(filterSeriesByScope({ items, currentOccurrenceIndex: 1, scope: 'this' })).toEqual([items[1]]);
    expect(filterSeriesByScope({ items, currentOccurrenceIndex: 1, scope: 'future' })).toEqual([items[1], items[2]]);
  });

  it('parses stored recurrence strings back into a rule', () => {
    expect(parseSchedulingSeriesRule('monthly:2:6')).toEqual({
      frequency: 'monthly',
      interval: 2,
      count: 6,
    });

    expect(parseSchedulingSeriesRule(null)).toBeNull();
  });
});
