import { Link } from 'react-router-dom';

import type { SchedulingCalendarEvent } from './useSchedulingPageData';

type Props = {
  event: SchedulingCalendarEvent | null;
};

function statusLabel(status: SchedulingCalendarEvent['status']) {
  switch (status) {
    case 'unassigned': return 'Sin técnico';
    case 'scheduled': return 'Programado';
    case 'confirmed': return 'Confirmado';
    case 'in_progress': return 'En ejecución';
    case 'paused': return 'Pausado';
    case 'pending_review': return 'Pendiente revisión';
    case 'requires_reschedule': return 'Reprogramar';
    case 'completed': return 'Completado';
    case 'cancelled': return 'Cancelado';
    default: return status;
  }
}

function priorityLabel(priority: SchedulingCalendarEvent['priority']) {
  if (priority === 'low') return 'Baja';
  if (priority === 'medium') return 'Media';
  if (priority === 'high') return 'Alta';
  if (priority === 'urgent') return 'Urgente';
  return priority;
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function SchedulingEventDetailsPanel({ event }: Props) {
  if (!event) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Selecciona un agendamiento para ver su detalle y acciones rápidas.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Servicio</p>
        <p className="font-semibold text-slate-900">{event.title}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Estado</p>
          <p className="font-medium">{statusLabel(event.status)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Prioridad</p>
          <p className="font-medium">{priorityLabel(event.priority)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Técnico</p>
          <p className="font-medium">{event.technicianName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Tipo</p>
          <p className="font-medium">{humanize(event.type)}</p>
        </div>
      </div>

      {event.hasConflict ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Conflicto detectado en agenda para este horario.
        </div>
      ) : null}

      <div className="text-sm">
        <p className="text-xs text-slate-500">Edificio</p>
        <p className="font-medium">{event.buildingName}</p>
      </div>

      <div className="text-sm">
        <p className="text-xs text-slate-500">Horario</p>
        <p className="font-medium">
          {new Date(event.start).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
          {' · '}
          {new Date(event.end).toLocaleString('es-CO', { timeStyle: 'short' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Link to={`/services?edit=${event.id}&from=scheduling`} className="rounded-xl border border-slate-200 px-3 py-2 text-center font-semibold hover:bg-slate-50">Editar</Link>
        <Link to={`/services/${event.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-center font-semibold hover:bg-slate-50">Detalle</Link>
      </div>
    </div>
  );
}
