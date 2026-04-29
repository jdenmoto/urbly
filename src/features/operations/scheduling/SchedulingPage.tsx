import { useState } from 'react';
import { Link } from 'react-router-dom';

import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { GlassPanel, MetricCard, SectionHeader, StatusPill } from '@/components/premium';
import CreateServiceOrderDrawer from './CreateServiceOrderDrawer';
import SchedulingCalendar from './SchedulingCalendar';
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
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agendamientos"
        subtitle="Nueva superficie para programar y monitorear service orders sin volver al scheduling legado."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              onClick={() => setIsCreateDrawerOpen(true)}
            >
              Crear servicio rápido
            </button>
            <Link
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              to="/services"
            >
              Ir a services
            </Link>
          </div>
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

      <GlassPanel className="space-y-4">
        <SectionHeader
          title="Calendario operativo"
          subtitle="Semana operativa conectada a service orders."
        />

        {isLoading ? (
          <p className="text-sm text-slate-600">Cargando agenda...</p>
        ) : data.calendarEvents.length ? (
          <SchedulingCalendar
            events={data.calendarEvents}
          />
        ) : (
          <EmptyState title="Calendario operativo" description="No hay eventos visibles con los filtros actuales." />
        )}
      </GlassPanel>

      <CreateServiceOrderDrawer
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        buildings={buildings}
        technicians={technicians}
      />
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
