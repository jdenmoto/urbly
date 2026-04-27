import type { Employee } from '@/core/models/employee';
import type { Building } from '@/core/models/building';
import { useI18n } from '@/lib/i18n';

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
  resolvedTypeLabel?: string;
};

export default function SchedulingWizardSummary(props: Props) {
  const { t } = useI18n();
  const { buildingId, title, type, startAt, endAt, employeeId, recurrence, editingId, buildings, employees, resolvedTypeLabel } = props;
  return (
    <div className="rounded-xl border border-fog-200 bg-fog-50 p-4 text-sm text-ink-700 space-y-2">
      <p><span className="font-semibold text-ink-900">{t('scheduling.wizardSummaryBuilding')}:</span> {buildings.find((building) => building.id === buildingId)?.name ?? t('scheduling.wizardSummaryNoSelection')}</p>
      <p><span className="font-semibold text-ink-900">{t('scheduling.wizardSummaryService')}:</span> {title || t('scheduling.wizardSummaryNoTitle')}</p>
      <p><span className="font-semibold text-ink-900">{t('scheduling.wizardSummaryType')}:</span> {resolvedTypeLabel || type || t('scheduling.wizardSummaryNoType')}</p>
      <p><span className="font-semibold text-ink-900">Acción:</span> {editingId ? 'reprogramar o ajustar este servicio' : 'crear un servicio nuevo en agenda'}</p>
      <p><span className="font-semibold text-ink-900">{t('scheduling.wizardSummaryStart')}:</span> {startAt || t('scheduling.wizardSummaryNoDate')}</p>
      <p><span className="font-semibold text-ink-900">{t('scheduling.wizardSummaryEnd')}:</span> {endAt || t('scheduling.wizardSummaryNoDate')}</p>
      <p><span className="font-semibold text-ink-900">{t('scheduling.wizardSummaryTechnician')}:</span> {employees.find((employee) => employee.id === employeeId)?.fullName ?? t('scheduling.wizardSummaryUnassigned')}</p>
      <p><span className="font-semibold text-ink-900">{t('scheduling.wizardSummaryRecurrence')}:</span> {recurrence || t('scheduling.wizardSummaryNoRecurrence')}</p>
      {editingId ? <p className="text-xs text-amber-700">{t('scheduling.wizardEditingHint')}</p> : null}
    </div>
  );
}
