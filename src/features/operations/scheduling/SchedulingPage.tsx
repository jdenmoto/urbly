import { useState } from 'react';
import { Link } from 'react-router-dom';

import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { GlassPanel, MetricCard, SectionHeader, StatusPill } from '@/components/premium';
import SchedulingFiltersBar from './SchedulingFiltersBar';
import {
  useSchedulingPageData,
  type SchedulingPageData,
  type SchedulingPageFilters,
} from './useSchedulingPageData';

const defaultFilters: SchedulingPageFilters = {
  technicianId: '',
  buildingId: '',
  status: '',
  type: '',
  priority: '',
  from: '',
  to: '',
};

export function SchedulingPageContent(props: {
  filters: SchedulingPageFilters;
  onFiltersChange: (next: SchedulingPageFilters) => void;
  data: SchedulingPageData;
  isLoading: boolean;
  buildings?: Array<{ id: string; name: string }>;
  technicians?: Array<{ id: string; fullName: string }>;
}) {
  const { filters, onFiltersChange, data, isLoading, buildings = [], technicians = [] } = props;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agenda operativa"
        subtitle="Nueva superficie para programar y monitorear service orders sin volver al scheduling legado."
        actions={
          <Link
            className="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            to="/services"
          >
            Crear o abrir servicio
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Servicios visibles" value={data.summary.total} hint="Scope actual de la agenda." />
        <MetricCard label="Programados" value={data.summary.scheduled} hint="Con franja activa y asignación operativa." />
        <MetricCard label="Sin técnico" value={data.summary.unassigned} hint="Listos para asignación." />
        <MetricCard label="Conflictos" value={data.summary.conflicts} hint="Detectados sobre la agenda filtrada." />
      </section>

      <GlassPanel className="space-y-6">
        <SectionHeader
          eyebrow="Scheduling v2"
          title="Filtros"
          subtitle="Filtra por técnico, edificio, estado, tipo, prioridad y ventana de fechas antes de abrir flujos de edición completos."
          aside={<StatusPill tone="info">{`${data.filteredOrders.length} resultados`}</StatusPill>}
        />

        <SchedulingFiltersBar
          filters={filters}
          onChange={onFiltersChange}
          buildings={buildings}
          technicians={technicians}
        />
      </GlassPanel>

      <div className="grid gap-6 xl:grid-cols-[1.7fr,1fr]">
        <GlassPanel className="space-y-4">
          <SectionHeader
            title="Calendario operativo"
            subtitle="En la siguiente tarea este bloque se conecta al calendario real. Por ahora ya consume la data layer nueva y muestra el estado de carga correcto."
          />

          {isLoading ? (
            <p className="text-sm text-slate-600">Cargando agenda...</p>
          ) : data.calendarEvents.length ? (
            <div className="space-y-3">
              {data.calendarEvents.slice(0, 6).map((event) => (
                <article key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{event.title}</p>
                      <p className="text-sm text-slate-600">{event.buildingName} · {event.technicianName}</p>
                    </div>
                    <StatusPill tone={event.hasConflict ? 'warning' : 'success'}>
                      {event.hasConflict ? 'Conflicto detectado' : 'Sin conflicto'}
                    </StatusPill>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{event.start} → {event.end}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Calendario operativo" description="No hay eventos visibles con los filtros actuales." />
          )}
        </GlassPanel>

        <GlassPanel className="space-y-4">
          <SectionHeader
            title="Resumen lateral"
            subtitle="Shell lateral para la vista principal día/semana."
          />

          {data.sidebarGroups.length ? (
            <div className="space-y-4">
              {data.sidebarGroups.map((group) => (
                <section key={group.date} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{group.date}</p>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-600">{item.technicianName}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState title="Resumen lateral" description="Aún no hay grupos visibles para esta agenda." />
          )}
        </GlassPanel>
      </div>
    </div>
  );
}

export default function SchedulingPage() {
  const [filters, setFilters] = useState<SchedulingPageFilters>(defaultFilters);
  const { buildingsQuery, techniciansQuery, isLoading, ...data } = useSchedulingPageData(filters);

  return (
    <SchedulingPageContent
      filters={filters}
      onFiltersChange={setFilters}
      data={data}
      isLoading={isLoading}
      buildings={(buildingsQuery.data ?? []).map((building) => ({ id: building.id, name: building.name }))}
      technicians={(techniciansQuery.data ?? []).map((technician) => ({ id: technician.id, fullName: technician.fullName }))}
    />
  );
}
