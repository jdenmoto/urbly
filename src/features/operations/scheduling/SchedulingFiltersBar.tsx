import Input from '@/components/Input';
import Select from '@/components/Select';
import { useI18n } from '@/lib/i18n';
import type { SchedulingPageFilters } from './useSchedulingPageData';

type Props = {
  filters: SchedulingPageFilters;
  onChange: (next: SchedulingPageFilters) => void;
  buildings: Array<{ id: string; name: string }>;
  technicians: Array<{ id: string; fullName: string }>;
};

export default function SchedulingFiltersBar({ filters, onChange, buildings, technicians }: Props) {
  const { t } = useI18n();
  const setFilter = <K extends keyof SchedulingPageFilters>(key: K, value: SchedulingPageFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="grid gap-3 rounded-[24px] border border-white/70 bg-slate-50/80 p-4 md:grid-cols-2 xl:grid-cols-4">
      <Select label={t('scheduling.filters.technician')} value={filters.technicianId} onChange={(event) => setFilter('technicianId', event.target.value)}>
        <option value="">{t('common.all')}</option>
        {technicians.map((technician) => (
          <option key={technician.id} value={technician.id}>
            {technician.fullName}
          </option>
        ))}
      </Select>

      <Select label={t('scheduling.filters.building')} value={filters.buildingId} onChange={(event) => setFilter('buildingId', event.target.value)}>
        <option value="">{t('common.all')}</option>
        {buildings.map((building) => (
          <option key={building.id} value={building.id}>
            {building.name}
          </option>
        ))}
      </Select>

      <Select label={t('scheduling.filters.status')} value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
        <option value="">{t('common.all')}</option>
        <option value="draft">{t('services.status.draft')}</option>
        <option value="unassigned">{t('services.status.unassigned')}</option>
        <option value="scheduled">{t('services.status.scheduled')}</option>
        <option value="confirmed">{t('services.status.confirmed')}</option>
        <option value="in_progress">{t('services.status.in.progress')}</option>
        <option value="paused">{t('services.status.paused')}</option>
        <option value="pending_review">{t('services.status.pending.review')}</option>
        <option value="requires_reschedule">{t('services.status.requires.reschedule')}</option>
        <option value="completed">{t('services.status.completed')}</option>
        <option value="cancelled">{t('services.status.cancelled')}</option>
      </Select>

      <Select label={t('scheduling.filters.priority')} value={filters.priority} onChange={(event) => setFilter('priority', event.target.value)}>
        <option value="">{t('common.all')}</option>
        <option value="low">{t('services.priority.low')}</option>
        <option value="medium">{t('services.priority.medium')}</option>
        <option value="high">{t('services.priority.high')}</option>
        <option value="urgent">{t('services.priority.urgent')}</option>
      </Select>

      <Input label={t('scheduling.filters.type.default')} value={filters.type} onChange={(event) => setFilter('type', event.target.value)} placeholder={t('scheduling.filters.type.placeholder')} />
      <Input label={t('scheduling.from')} type="date" value={filters.from} onChange={(event) => setFilter('from', event.target.value)} />
      <Input label={t('scheduling.to')} type="date" value={filters.to} onChange={(event) => setFilter('to', event.target.value)} />
      <button
        type="button"
        className="self-end rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        onClick={() => onChange({ technicianId: '', buildingId: '', status: '', type: '', priority: '', from: '', to: '' })}
      >
        {t('scheduling.filters.clear')}
      </button>
    </div>
  );
}
