import type { Employee } from '@/core/models/employee';
import type { Building } from '@/core/models/building';

type Props = {
  buildingId: string;
  title: string;
  type: string;
  startAt: string;
  endAt: string;
  employeeId?: string;
  recurrence?: string;
  editingId?: string | null;
  buildings: Building[];
  employees: Employee[];
};

export default function SchedulingWizardSummary(props: Props) {
  const { buildingId, title, type, startAt, endAt, employeeId, recurrence, editingId, buildings, employees } = props;
  return (
    <div className="rounded-xl border border-fog-200 bg-fog-50 p-4 text-sm text-ink-700 space-y-2">
      <p><span className="font-semibold text-ink-900">Edificio:</span> {buildings.find((building) => building.id === buildingId)?.name ?? 'Sin seleccionar'}</p>
      <p><span className="font-semibold text-ink-900">Servicio:</span> {title || 'Sin título'}</p>
      <p><span className="font-semibold text-ink-900">Tipo:</span> {type || 'Sin tipo'}</p>
      <p><span className="font-semibold text-ink-900">Inicio:</span> {startAt || 'Sin fecha'}</p>
      <p><span className="font-semibold text-ink-900">Fin:</span> {endAt || 'Sin fecha'}</p>
      <p><span className="font-semibold text-ink-900">Técnico:</span> {employees.find((employee) => employee.id === employeeId)?.fullName ?? 'Sin asignar'}</p>
      <p><span className="font-semibold text-ink-900">Recurrencia:</span> {recurrence || 'Sin recurrencia'}</p>
      {editingId ? <p className="text-xs text-amber-700">Estás reprogramando o actualizando un servicio existente.</p> : null}
    </div>
  );
}
