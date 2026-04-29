import esLocale from '@fullcalendar/core/locales/es';
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

import type { SchedulingCalendarEvent } from './useSchedulingPageData';

type Props = {
  events: SchedulingCalendarEvent[];
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string) => void;
};

function getEventClassNames(event: SchedulingCalendarEvent) {
  const classes = ['urbly-scheduling-event', 'urbly-scheduling-event--interactive'];

  if (event.hasConflict) classes.push('urbly-scheduling-event--conflict');

  switch (event.status) {
    case 'completed':
      classes.push('urbly-scheduling-event--completed');
      break;
    case 'paused':
      classes.push('urbly-scheduling-event--paused');
      break;
    case 'requires_reschedule':
    case 'pending_review':
      classes.push('urbly-scheduling-event--attention');
      break;
    default:
      classes.push('urbly-scheduling-event--active');
      break;
  }

  return classes;
}

export default function SchedulingCalendar({ events, selectedEventId, onSelectEvent }: Props) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek' }}
        height="auto"
        allDaySlot={false}
        locale={esLocale}
        slotMinTime="06:00:00"
        slotMaxTime="20:00:00"
        events={events.map((event) => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          classNames: [
            ...getEventClassNames(event),
            ...(selectedEventId === event.id ? ['urbly-scheduling-event--selected'] : []),
          ],
          extendedProps: {
            buildingName: event.buildingName,
            technicianName: event.technicianName,
            status: event.status,
            hasConflict: event.hasConflict,
          },
        }))}
        eventClick={(info) => {
          onSelectEvent?.(info.event.id);
        }}
        eventContent={(info) => (
          <div className="px-1 py-0.5 text-xs">
            <p className="truncate font-semibold">{info.event.title}</p>
            <p className="truncate opacity-80">{String(info.event.extendedProps.technicianName ?? 'Sin técnico')}</p>
          </div>
        )}
      />
    </div>
  );
}
