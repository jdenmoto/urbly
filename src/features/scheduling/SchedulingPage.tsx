import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Button from '@/components/Button';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import useBreakpoint from '@/components/useBreakpoint';
import type { Appointment, Building } from '@/core/models';
import { createDoc, updateDocById } from '@/lib/api/firestore';
import { useList } from '@/lib/api/queries';
import { assertValidDateRange } from '@/core/validators';
import type { ColumnDef } from '@tanstack/react-table';

const schema = z.object({
  buildingId: z.string().min(1, 'Selecciona un edificio'),
  title: z.string().min(2, 'Requerido'),
  description: z.string().optional(),
  startAt: z.string().min(1, 'Requerido'),
  endAt: z.string().min(1, 'Requerido'),
  status: z.string().min(1, 'Requerido')
});

type FormValues = z.infer<typeof schema>;

export default function SchedulingPage() {
  const { isMobile } = useBreakpoint();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: appointments = [] } = useList<Appointment>('appointments', 'appointments');
  const [filters, setFilters] = useState({ buildingId: '', date: '', from: '', to: '' });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const filtered = appointments.filter((item) => {
    if (filters.buildingId && item.buildingId !== filters.buildingId) return false;
    if (filters.date && item.startAt.slice(0, 10) !== filters.date) return false;
    if (filters.from && item.startAt < filters.from) return false;
    if (filters.to && item.endAt > filters.to) return false;
    return true;
  });

  const columns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      { header: 'Titulo', accessorKey: 'title' },
      { header: 'Edificio', accessorFn: (row) => buildings.find((b) => b.id === row.buildingId)?.name ?? 'N/A' },
      { header: 'Inicio', accessorKey: 'startAt' },
      { header: 'Estado', accessorKey: 'status' }
    ],
    [buildings]
  );

  const onSubmit = async (values: FormValues) => {
    assertValidDateRange(values.startAt, values.endAt);
    await createDoc('appointments', {
      buildingId: values.buildingId,
      title: values.title,
      description: values.description ?? '',
      startAt: values.startAt,
      endAt: values.endAt,
      status: values.status
    });
    reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Agendamientos" subtitle="Calendario y agenda operativa" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="text-sm font-semibold text-ink-800">Nuevo agendamiento</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <Select label="Edificio" error={errors.buildingId?.message} {...register('buildingId')}>
              <option value="">Selecciona</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </Select>
            <Input label="Titulo" error={errors.title?.message} {...register('title')} />
            <Input label="Descripcion" {...register('description')} />
            <Input label="Inicio" type="datetime-local" error={errors.startAt?.message} {...register('startAt')} />
            <Input label="Fin" type="datetime-local" error={errors.endAt?.message} {...register('endAt')} />
            <Select label="Estado" error={errors.status?.message} {...register('status')}>
              <option value="programado">Programado</option>
              <option value="confirmado">Confirmado</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </Select>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Crear agendamiento'}
            </Button>
          </form>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-ink-800">Calendario</h3>
            <div className="mt-4">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
                height="auto"
                editable
                selectable
                events={filtered.map((item) => ({
                  id: item.id,
                  title: item.title,
                  start: item.startAt,
                  end: item.endAt
                }))}
                eventDrop={(info) => {
                  if (!info.event.start || !info.event.end) return;
                  void updateDocById('appointments', info.event.id, {
                    startAt: info.event.start.toISOString(),
                    endAt: info.event.end.toISOString()
                  });
                }}
                eventResize={(info) => {
                  if (!info.event.start || !info.event.end) return;
                  void updateDocById('appointments', info.event.id, {
                    startAt: info.event.start.toISOString(),
                    endAt: info.event.end.toISOString()
                  });
                }}
              />
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-ink-800">Filtros</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Select
                label="Edificio"
                value={filters.buildingId}
                onChange={(event) => setFilters((prev) => ({ ...prev, buildingId: event.target.value }))}
              >
                <option value="">Todos</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Fecha exacta"
                type="date"
                value={filters.date}
                onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value }))}
              />
              <Input
                label="Desde"
                type="date"
                value={filters.from}
                onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
              />
              <Input
                label="Hasta"
                type="date"
                value={filters.to}
                onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
              />
            </div>
          </Card>
          <DataTable
            columns={columns}
            data={filtered}
            emptyState={<EmptyState title="Sin agendamientos" description="Crea el primer evento." />}
          />
        </div>
      </div>
    </div>
  );
}
