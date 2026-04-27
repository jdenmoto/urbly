import { useI18n } from '@/lib/i18n';
import type { SchedulingItem } from './schedulingItem';

export default function CompletedServiceReportCard({
  selected,
  completionChecklistGroup1,
  completionChecklistGroups,
  formatChecklistLabel,
  checklistValueLabel,
  openPhotoViewer
}: {
  selected: SchedulingItem;
  completionChecklistGroup1: string[];
  completionChecklistGroups: {
    grupo2: readonly string[];
    grupo3: readonly string[];
  };
  formatChecklistLabel: (value: string) => string;
  checklistValueLabel: (value?: string) => string;
  openPhotoViewer: (src: string, title?: string) => void;
}) {
  const { t } = useI18n();
  const checklist = (selected.completionReport?.checklist as Record<string, string>) || {};
  const bombaIds = Array.from(
    new Set(
      Object.keys(checklist)
        .map((key) => key.match(/^bomba_(\d+)__/)?.[1])
        .filter((id): id is string => Boolean(id))
    )
  ).sort((a, b) => Number(a) - Number(b));
  const group2Entries = completionChecklistGroups.grupo2.map((item) => [item, checklist[item] || 'na'] as const);
  const group3Entries = completionChecklistGroups.grupo3.map((item) => [item, checklist[item] || 'na'] as const);

  return (
    <div className="space-y-3 rounded-lg border border-fog-200 bg-fog-50 p-3">
      <p className="font-semibold text-ink-900">{t('scheduling.serviceReport')}</p>
      <p><span className="font-semibold text-ink-900">{t('scheduling.entryHourLabel')}:</span> {String(selected.completionReport?.entryHour || t('common.noData'))}</p>
      <p><span className="font-semibold text-ink-900">{t('scheduling.exitHourLabel')}:</span> {String(selected.completionReport?.exitHour || t('common.noData'))}</p>
      <p><span className="font-semibold text-ink-900">{t('scheduling.observationsLabel')}:</span> {String(selected.completionReport?.observations || t('common.noData'))}</p>

      <div className="space-y-2">
        <p className="font-semibold text-ink-900">{t('scheduling.checklistTitle')}</p>
        <div className="max-h-80 space-y-2 overflow-y-auto rounded border border-fog-200 bg-white p-2 text-xs">
          <div className="space-y-2 rounded border border-fog-200 p-2">
            <p className="font-semibold text-ink-900">{t('scheduling.group1Pumps')}</p>
            {bombaIds.length ? (
              bombaIds.map((bombaId, pumpIndex) => (
                <div key={bombaId} className="space-y-1 rounded border border-fog-200 bg-fog-50 p-2">
                  <p className="font-semibold text-ink-900">{t('scheduling.pumpLabel', { index: pumpIndex + 1 })}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-ink-700">
                          <th className="py-1 pr-2 font-semibold">{t('scheduling.itemLabel')}</th>
                          <th className="py-1 pr-2 font-semibold">{t('scheduling.statusLabelShort')}</th>
                          <th className="py-1 font-semibold">{t('scheduling.distributionNetworkLabel')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completionChecklistGroup1.map((item) => {
                          const itemKey = `bomba_${bombaId}__${item}`;
                          const redKey = `${itemKey}__red_distribucion`;
                          return (
                            <tr key={itemKey} className="border-t border-fog-200">
                              <td className="py-1 pr-2">{formatChecklistLabel(item)}</td>
                              <td className="py-1 pr-2">{checklistValueLabel(checklist[itemKey])}</td>
                              <td className="py-1">{checklistValueLabel(checklist[redKey])}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-ink-600">{t('common.noData')}</p>
            )}
          </div>

          <div className="space-y-1 rounded border border-fog-200 p-2">
            <p className="font-semibold text-ink-900">{t('scheduling.group2Label')}</p>
            {group2Entries.map(([item, value]) => (
              <p key={item}>
                <span className="font-semibold text-ink-900">{formatChecklistLabel(item)}:</span> {checklistValueLabel(value)}
              </p>
            ))}
          </div>

          <div className="space-y-1 rounded border border-fog-200 p-2">
            <p className="font-semibold text-ink-900">{t('scheduling.group3Label')}</p>
            {group3Entries.map(([item, value]) => (
              <p key={item}>
                <span className="font-semibold text-ink-900">{formatChecklistLabel(item)}:</span> {checklistValueLabel(value)}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="font-semibold text-ink-900">{t('scheduling.servicePhotosTitle')}</p>
        {selected.completionPhotos?.length ? (
          <div className="grid grid-cols-2 gap-2">
            {selected.completionPhotos.map((photo, index) => (
              <button
                key={`${photo}-${index}`}
                type="button"
                onClick={() => openPhotoViewer(photo, `Foto servicio ${index + 1}`)}
                className="block overflow-hidden rounded border border-fog-200 bg-white"
              >
                <img src={photo} alt={`Foto servicio ${index + 1}`} className="h-24 w-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-600">{t('common.noData')}</p>
        )}
      </div>
    </div>
  );
}
