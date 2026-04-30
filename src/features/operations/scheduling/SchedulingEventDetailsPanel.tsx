import { Link } from 'react-router-dom';

import { useI18n } from '@/lib/i18n';
import type { SchedulingCalendarEvent } from './useSchedulingPageData';

type Props = {
  event: SchedulingCalendarEvent | null;
};

function statusLabel(t: (key: string) => string, status: SchedulingCalendarEvent['status']) {
  switch (status) {
    case 'unassigned': return t('services.status.unassigned');
    case 'scheduled': return t('services.status.scheduled');
    case 'confirmed': return t('services.status.confirmed');
    case 'in_progress': return t('services.status.in.progress');
    case 'paused': return t('services.status.paused');
    case 'pending_review': return t('services.status.pending.review');
    case 'requires_reschedule': return t('services.status.requires.reschedule');
    case 'completed': return t('services.status.completed');
    case 'cancelled': return t('services.status.cancelled');
    default: return status;
  }
}

function priorityLabel(t: (key: string) => string, priority: SchedulingCalendarEvent['priority']) {
  if (priority === 'low') return t('services.priority.low');
  if (priority === 'medium') return t('services.priority.medium');
  if (priority === 'high') return t('services.priority.high');
  if (priority === 'urgent') return t('services.priority.urgent');
  return priority;
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function SchedulingEventDetailsPanel({ event }: Props) {
  const { t } = useI18n();

  if (!event) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        {t('scheduling.details.select')}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">{t('scheduling.details.service')}</p>
        <p className="font-semibold text-slate-900">{event.title}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">{t('scheduling.filters.status')}</p>
          <p className="font-medium">{statusLabel(t, event.status)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('scheduling.filters.priority')}</p>
          <p className="font-medium">{priorityLabel(t, event.priority)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('scheduling.filters.technician')}</p>
          <p className="font-medium">{event.technicianName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('scheduling.filters.type.default')}</p>
          <p className="font-medium">{humanize(event.type)}</p>
        </div>
      </div>

      {event.hasConflict ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {t('scheduling.details.conflict')}
        </div>
      ) : null}

      <div className="text-sm">
        <p className="text-xs text-slate-500">{t('scheduling.filters.building')}</p>
        <p className="font-medium">{event.buildingName}</p>
      </div>

      <div className="text-sm">
        <p className="text-xs text-slate-500">{t('scheduling.details.schedule')}</p>
        <p className="font-medium">
          {new Date(event.start).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
          {' · '}
          {new Date(event.end).toLocaleString('es-CO', { timeStyle: 'short' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Link to={`/services?edit=${event.id}&from=scheduling`} className="rounded-xl border border-slate-200 px-3 py-2 text-center font-semibold hover:bg-slate-50">{t('common.edit')}</Link>
        <Link to={`/services/${event.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-center font-semibold hover:bg-slate-50">{t('services.view.detail')}</Link>
      </div>
    </div>
  );
}
