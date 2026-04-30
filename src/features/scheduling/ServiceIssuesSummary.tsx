import { useI18n } from '@/lib/i18n';
import type { ServiceOrderIssue } from '@/core/models/serviceOrder';

export default function ServiceIssuesSummary({
  issues,
  resolveIssueLabel,
  openPhotoViewer
}: {
  issues: ServiceOrderIssue[];
  resolveIssueLabel: (prefix: 'scheduling.issue.types' | 'scheduling.issueCategories', value: string) => string;
  openPhotoViewer: (src: string, title?: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <p className="font-semibold text-ink-900">{t('scheduling.issues.title')}</p>
      {issues.map((issue) => (
        <div key={issue.id} className="space-y-1 rounded-lg border border-fog-200 bg-fog-50 p-2 text-xs text-ink-700">
          <p className="font-semibold text-ink-900">{resolveIssueLabel('scheduling.issue.types', issue.type)}</p>
          <p>{resolveIssueLabel('scheduling.issueCategories', issue.category)}</p>
          {issue.description ? <p>{issue.description}</p> : null}
          {issue.photos?.length ? (
            <div className="grid grid-cols-2 gap-2">
              {issue.photos.map((photo, index) => (
                <button
                  key={`${issue.id}-${index}`}
                  type="button"
                  onClick={() => openPhotoViewer(photo, `Novedad ${index + 1}`)}
                  className="block overflow-hidden rounded border border-fog-200 bg-white"
                >
                  <img src={photo} alt={`Novedad ${index + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
