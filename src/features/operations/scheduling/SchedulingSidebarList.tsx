import { Link } from 'react-router-dom';

import EmptyState from '@/components/EmptyState';
import { StatusPill } from '@/components/premium';
import type { SchedulingCalendarEvent, SchedulingSidebarGroup } from './useSchedulingPageData';

type Props = {
  groups: SchedulingSidebarGroup[];
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string) => void;
};

function getStatusTone(event: SchedulingCalendarEvent): 'success' | 'warning' | 'info' {
  if (event.hasConflict || event.status === 'requires_reschedule' || event.status === 'pending_review') {
    return 'warning';
  }

  if (event.status === 'completed') {
    return 'success';
  }

  return 'info';
}

function getStatusLabel(event: SchedulingCalendarEvent) {
  if (event.hasConflict) return 'Conflicto';

  switch (event.status) {
    case 'unassigned':
      return 'Sin técnico';
    case 'scheduled':
    case 'confirmed':
      return 'Programado';
    case 'in_progress':
      return 'En ejecución';
    case 'paused':
      return 'Pausado';
    case 'pending_review':
      return 'Pendiente';
    case 'requires_reschedule':
      return 'Reprogramar';
    case 'completed':
      return 'Completado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return event.status;
  }
}

export default function SchedulingSidebarList({ groups, selectedEventId, onSelectEvent }: Props) {
  if (!groups.length) {
    return <EmptyState title="Resumen lateral" description="Aún no hay grupos visibles para esta agenda." />;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.date} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{group.date}</p>
          <div className="space-y-2">
            {group.items.map((item) => {
              const isSelected = item.id === selectedEventId;

              return (
                <article
                  key={item.id}
                  className={[
                    'rounded-2xl border p-3 transition',
                    isSelected
                      ? 'border-sky-400 bg-sky-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <button type="button" onClick={() => onSelectEvent?.(item.id)} className="w-full text-left">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-600">{item.technicianName} · {item.buildingName}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.start.slice(11, 16)} → {item.end.slice(11, 16)}</p>
                      </div>
                      <StatusPill tone={getStatusTone(item)}>{getStatusLabel(item)}</StatusPill>
                    </div>
                  </button>

                  {isSelected ? (
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-sky-100 pt-3 text-sm">
                      <span className="text-slate-600">Abrir edición completa del service order.</span>
                      <Link
                        to={`/services?edit=${item.id}&from=scheduling`}
                        className="font-semibold text-sky-700 transition hover:text-sky-800"
                      >
                        Editar
                      </Link>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
