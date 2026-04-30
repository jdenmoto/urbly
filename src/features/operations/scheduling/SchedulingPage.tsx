import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { GlassPanel, MetricCard, SectionHeader, StatusPill } from '@/components/premium';
import CreateServiceOrderDrawer from './CreateServiceOrderDrawer';
import SchedulingCalendar from './SchedulingCalendar';
import SchedulingEventDetailsPanel from './SchedulingEventDetailsPanel';
import SchedulingFiltersBar from './SchedulingFiltersBar';
import {
  useSchedulingPageData,
  type SchedulingPageData,
  type SchedulingPageFilters,
} from './useSchedulingPageData';
import { useI18n } from '@/lib/i18n';

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
  const { t } = useI18n();
  const { filters, onFiltersChange, data, isLoading, buildings = [], technicians = [] } = props;
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<{
    buildingId?: string;
    scheduledStartAt?: string;
    estimatedDurationMinutes?: number;
  } | null>(null);

  const selectedEvent = useMemo(
    () => data.calendarEvents.find((item) => item.id === selectedEventId) ?? null,
    [data.calendarEvents, selectedEventId],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('scheduling.title.default')}
        subtitle={t('scheduling.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              onClick={() => setIsCreateDrawerOpen(true)}
            >
              {t('scheduling.quick.create')}
            </button>
            <Link
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              to="/services"
            >
              {t('scheduling.go.to.services')}
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('scheduling.metrics.visible.services')} value={data.summary.total} hint={t('scheduling.metrics.visible.hint')} />
        <MetricCard label={t('scheduling.metrics.scheduled.default')} value={data.summary.scheduled} hint={t('scheduling.metrics.scheduled.hint')} />
        <MetricCard label={t('scheduling.metrics.unassigned.default')} value={data.summary.unassigned} hint={t('scheduling.metrics.unassigned.hint')} />
        <MetricCard label={t('scheduling.metrics.conflicts.default')} value={data.summary.conflicts} hint={t('scheduling.metrics.conflicts.hint')} />
      </section>

      <GlassPanel className="space-y-6">
        <SectionHeader
          eyebrow={t('scheduling.eyebrow')}
          title={t('scheduling.filters.title')}
          subtitle={t('scheduling.filters.subtitle')}
          aside={<StatusPill tone="info">{t('scheduling.filters.results', { count: data.filteredOrders.length })}</StatusPill>}
        />

        <SchedulingFiltersBar
          filters={filters}
          onChange={onFiltersChange}
          buildings={buildings}
          technicians={technicians}
        />
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-[1.7fr,1fr]">
        <GlassPanel className="space-y-4">
          <SectionHeader
            title={t('scheduling.operational.calendar.title')}
            subtitle={t('scheduling.operational.calendar.subtitle')}
          />

          {isLoading ? (
            <p className="text-sm text-slate-600">{t('scheduling.loading.agenda')}</p>
          ) : data.calendarEvents.length ? (
            <SchedulingCalendar
              events={data.calendarEvents}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
              onRangeSelect={(selection) => {
                const start = new Date(selection.start);
                const end = new Date(selection.end);
                const estimatedDurationMinutes = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));
                setPrefill({
                  scheduledStartAt: selection.start.slice(0, 16),
                  estimatedDurationMinutes,
                });
                setIsCreateDrawerOpen(true);
              }}
            />
          ) : (
            <EmptyState title={t('scheduling.operational.calendar.title')} description={t('scheduling.operational.calendar.empty')} />
          )}
        </GlassPanel>

        <SchedulingEventDetailsPanel event={selectedEvent} />
      </div>

      <CreateServiceOrderDrawer
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        buildings={buildings}
        technicians={technicians}
        prefill={prefill ?? undefined}
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
