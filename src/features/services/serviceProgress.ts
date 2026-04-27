import type { ServiceOrder, ServiceOrderTimelineEvent } from '@/core/models/serviceOrder';

export type ServiceDailyProgress = {
  date: string;
  summary: string;
  hoursWorked?: number | null;
  percentComplete?: number | null;
};

export function getServiceDailyProgress(serviceOrder: ServiceOrder): ServiceDailyProgress[] {
  const timeline = serviceOrder.timeline ?? [];
  return timeline
    .filter((item) => item.type === 'note' && item.summary.startsWith('[daily-progress]'))
    .map((item) => {
      const raw = item.summary.replace('[daily-progress]', '').trim();
      const [date = '', percent = '', hours = '', ...rest] = raw.split('|');
      return {
        date: date.trim() || item.createdAt.slice(0, 10),
        percentComplete: percent ? Number(percent) : null,
        hoursWorked: hours ? Number(hours) : null,
        summary: rest.join('|').trim()
      };
    });
}

export function buildDailyProgressEvent(input: { date: string; summary: string; percentComplete?: number | null; hoursWorked?: number | null }): ServiceOrderTimelineEvent {
  return {
    id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    type: 'note',
    createdAt: new Date().toISOString(),
    actorRole: 'company',
    summary: `[daily-progress] ${input.date}|${input.percentComplete ?? ''}|${input.hoursWorked ?? ''}|${input.summary.trim()}`
  };
}
