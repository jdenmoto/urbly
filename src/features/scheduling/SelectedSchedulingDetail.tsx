import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { CancelIcon, CheckIcon, EditIcon, TrashIcon } from '@/components/ActionIcons';
import LegacyDependencySummary from './LegacyDependencySummary';
import CompletedServiceReportCard from './CompletedServiceReportCard';
import ServiceIssuesSummary from './ServiceIssuesSummary';
import { schedulingLegacyDependencies } from './schedulingLegacyMap';
import type { SchedulingItem } from './schedulingItem';

type Props = {
  selected: SchedulingItem;
  canEdit: boolean;
  buildingName: string;
  employeeName: string;
  statusLabel: (status: SchedulingItem['status']) => string;
  formatDateTime: (value?: string | null) => string;
  completionChecklistGroup1: string[];
  completionChecklistGroups: {
    grupo2: readonly string[];
    grupo3: readonly string[];
  };
  formatChecklistLabel: (value: string) => string;
  checklistValueLabel: (value?: string) => string;
  openPhotoViewer: (src: string, title?: string) => void;
  resolveIssueLabel: (prefix: 'scheduling.issueTypes' | 'scheduling.issueCategories', value: string) => string;
  onClose: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

export default function SelectedSchedulingDetail({
  selected,
  canEdit,
  buildingName,
  employeeName,
  statusLabel,
  formatDateTime,
  completionChecklistGroup1,
  completionChecklistGroups,
  formatChecklistLabel,
  checklistValueLabel,
  openPhotoViewer,
  resolveIssueLabel,
  onClose,
  onEdit,
  onComplete,
  onCancel,
  onDelete
}: Props) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ink-900">{selected.title}</h3>
            <p className="text-sm text-ink-600">{t('scheduling.detailTitle')}</p>
          </div>
          <button className="text-sm text-ink-500" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
        <div className="mt-4 space-y-2 text-sm text-ink-700">
          <p>
            <span className="font-semibold text-ink-900">{t('scheduling.buildingLabel')}:</span> {buildingName}
          </p>
          <p>
            <span className="font-semibold text-ink-900">{t('scheduling.employee')}:</span> {employeeName}
          </p>
          <p>
            <span className="font-semibold text-ink-900">{t('scheduling.startAt')}:</span> {formatDateTime(selected.startAt)}
          </p>
          <p>
            <span className="font-semibold text-ink-900">{t('scheduling.endAt')}:</span> {formatDateTime(selected.endAt)}
          </p>
          <p><span className="font-semibold text-ink-900">{t('scheduling.statusLabel')}:</span> {statusLabel(selected.status)}</p>
          <LegacyDependencySummary dependencies={schedulingLegacyDependencies} />
          <p>
            <span className="font-semibold text-ink-900">{t('scheduling.type')}:</span>{' '}
            {selected.type ? t(`scheduling.types.${selected.type}`) : t('common.noData')}
          </p>
          <p>
            <span className="font-semibold text-ink-900">{t('scheduling.recurrenceLabel')}:</span>{' '}
            {selected.recurrence ? t(`scheduling.recurrenceOptions.${selected.recurrence}`) : t('scheduling.noRecurrence')}
          </p>
          {selected.status === 'completado' ? (
            <CompletedServiceReportCard
              selected={selected}
              completionChecklistGroup1={completionChecklistGroup1}
              completionChecklistGroups={completionChecklistGroups}
              formatChecklistLabel={formatChecklistLabel}
              checklistValueLabel={checklistValueLabel}
              openPhotoViewer={openPhotoViewer}
            />
          ) : null}
          {selected.issues?.length ? (
            <ServiceIssuesSummary
              issues={selected.issues}
              resolveIssueLabel={resolveIssueLabel}
              openPhotoViewer={openPhotoViewer}
            />
          ) : null}
          {selected.status === 'cancelado' ? (
            <>
              <p>
                <span className="font-semibold text-ink-900">{t('scheduling.cancelReason')}:</span>{' '}
                {selected.cancelReason ? t(`scheduling.cancelReasons.${selected.cancelReason}`) : t('common.noData')}
              </p>
              <p>
                <span className="font-semibold text-ink-900">{t('scheduling.cancelNote')}:</span>{' '}
                {selected.cancelNote || t('common.noData')}
              </p>
            </>
          ) : null}
          {selected.description ? (
            <p><span className="font-semibold text-ink-900">{t('scheduling.descriptionLabel')}:</span> {selected.description}</p>
          ) : null}
        </div>
        {selected.status === 'completado' ? null : (
          <div className="mt-6 flex items-center justify-end gap-2">
            <Link
              className="inline-flex items-center gap-1 rounded-md border border-sky-200 px-2 py-1 text-xs text-sky-700 hover:border-sky-400"
              to={`/services/${selected.id}`}
            >
              Ver detalle operativo
            </Link>
            {canEdit ? (
              <button
                className="inline-flex items-center gap-1 rounded-md border border-fog-200 px-2 py-1 text-xs text-ink-700 hover:border-ink-900"
                onClick={onEdit}
              >
                <EditIcon className="h-3.5 w-3.5" />
                {t('common.edit')}
              </button>
            ) : null}
            {canEdit && selected.status !== 'cancelado' ? (
              <button
                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:border-emerald-400"
                onClick={onComplete}
              >
                <CheckIcon className="h-3.5 w-3.5" />
                {t('scheduling.complete')}
              </button>
            ) : null}
            {canEdit && selected.status !== 'cancelado' ? (
              <button
                className="inline-flex items-center gap-1 rounded-md border border-amber-200 px-2 py-1 text-xs text-amber-700 hover:border-amber-400"
                onClick={onCancel}
              >
                <CancelIcon className="h-3.5 w-3.5" />
                {t('scheduling.cancel')}
              </button>
            ) : null}
            {canEdit ? (
              <button
                className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:border-rose-400"
                onClick={onDelete}
              >
                <TrashIcon className="h-3.5 w-3.5" />
                {t('common.delete')}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
