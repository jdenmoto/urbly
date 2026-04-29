import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { GlassPanel, MetricCard, SectionHeader, StatusPill } from '@/components/premium';
import SchedulingCalendar from './SchedulingCalendar';
import SchedulingFiltersBar from './SchedulingFiltersBar';
import SchedulingSidebarList from './SchedulingSidebarList';
import {
  getDefaultSelectedSchedulingEventId,
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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => data.calendarEvents.find((event) => event.id === selectedEventId) ?? null,
    [data.calendarEvents, selectedEventId],
  );

  useEffect(() => {
    setSelectedEventId((current) => getDefaultSelectedSchedulingEventId(data.calendarEvents, current));
  }, [data.calendarEvents]);

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
            subtitle="Semana operativa conectada a service orders, con selección sincronizada contra el resumen lateral."
            aside={
              selectedEvent ? (
                <StatusPill tone={selectedEvent.hasConflict ? 'warning' : 'success'}>
                  {selectedEvent.hasConflict ? 'Conflicto detectado' : 'Seleccionado'}
                </StatusPill>
              ) : undefined
            }
          />

          {isLoading ? (
            <p className="text-sm text-slate-600">Cargando agenda...</p>
          ) : data.calendarEvents.length ? (
            <SchedulingCalendar
              events={data.calendarEvents}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
            />
          ) : (
            <EmptyState title="Calendario operativo" description="No hay eventos visibles con los filtros actuales." />
          )}
        </GlassPanel>

        <GlassPanel className="space-y-4">
          <SectionHeader
            title="Resumen lateral"
            subtitle="Agrupa la agenda por día, conserva contexto del técnico y permite abrir el detalle completo."
          />

          <SchedulingSidebarList
            groups={data.sidebarGroups}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
          />
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
