import Input from '@/components/Input';
import Select from '@/components/Select';
import type { SchedulingPageFilters } from './useSchedulingPageData';

type Props = {
  filters: SchedulingPageFilters;
  onChange: (next: SchedulingPageFilters) => void;
  buildings: Array<{ id: string; name: string }>;
  technicians: Array<{ id: string; fullName: string }>;
};

export default function SchedulingFiltersBar({ filters, onChange, buildings, technicians }: Props) {
  const setFilter = <K extends keyof SchedulingPageFilters>(key: K, value: SchedulingPageFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="grid gap-3 rounded-[24px] border border-white/70 bg-slate-50/80 p-4 md:grid-cols-2 xl:grid-cols-4">
      <Select label="Técnico" value={filters.technicianId} onChange={(event) => setFilter('technicianId', event.target.value)}>
        <option value="">Todos</option>
        {technicians.map((technician) => (
          <option key={technician.id} value={technician.id}>
            {technician.fullName}
          </option>
        ))}
      </Select>

      <Select label="Edificio" value={filters.buildingId} onChange={(event) => setFilter('buildingId', event.target.value)}>
        <option value="">Todos</option>
        {buildings.map((building) => (
          <option key={building.id} value={building.id}>
            {building.name}
          </option>
        ))}
      </Select>

      <Select label="Estado" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
        <option value="">Todos</option>
        <option value="draft">Borrador</option>
        <option value="unassigned">Sin técnico</option>
        <option value="scheduled">Programado</option>
        <option value="confirmed">Confirmado</option>
        <option value="in_progress">En ejecución</option>
        <option value="paused">Pausado</option>
        <option value="pending_review">Pendiente de revisión</option>
        <option value="requires_reschedule">Requiere reprogramación</option>
        <option value="completed">Completado</option>
        <option value="cancelled">Cancelado</option>
      </Select>

      <Select label="Prioridad" value={filters.priority} onChange={(event) => setFilter('priority', event.target.value)}>
        <option value="">Todas</option>
        <option value="low">Baja</option>
        <option value="medium">Media</option>
        <option value="high">Alta</option>
        <option value="urgent">Urgente</option>
      </Select>

      <Input label="Tipo" value={filters.type} onChange={(event) => setFilter('type', event.target.value)} placeholder="mantenimiento, inspección..." />
      <Input label="Desde" type="date" value={filters.from} onChange={(event) => setFilter('from', event.target.value)} />
      <Input label="Hasta" type="date" value={filters.to} onChange={(event) => setFilter('to', event.target.value)} />
      <button
        type="button"
        className="self-end rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        onClick={() => onChange({ technicianId: '', buildingId: '', status: '', type: '', priority: '', from: '', to: '' })}
      >
        Limpiar filtros
      </button>
    </div>
  );
}
