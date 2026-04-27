import { useI18n } from '@/lib/i18n';
import type { SchedulingLegacyDependency } from './schedulingLegacyMap';

export default function LegacyDependencySummary({
  dependencies
}: {
  dependencies: SchedulingLegacyDependency[];
}) {
  const { t } = useI18n();

  return (
    <div className="rounded-xl border border-fog-200 bg-fog-50 p-3 text-sm text-ink-700">
      <p className="font-semibold text-ink-900">{t('scheduling.legacyDependencyMapTitle')}</p>
      <ul className="mt-2 space-y-1 text-xs text-ink-600">
        {dependencies.map((dependency) => (
          <li key={dependency.key}>
            <span className="font-semibold text-ink-900">{dependency.area}:</span> {dependency.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
