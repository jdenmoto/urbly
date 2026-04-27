import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import Select from '@/components/Select';
import { useI18n } from '@/lib/i18n';
import type { CompletionReport, IssueDraft } from './schedulingCompletion';

export default function CompleteServiceModal({
  open,
  onClose,
  completionReport,
  getTimeParts,
  setReportTimePart,
  groupPanelsOpen,
  setGroupPanelsOpen,
  group1Units,
  setGroup1Units,
  bombaPanelsOpen,
  setBombaPanelsOpen,
  completionChecklistGroup1,
  completionChecklistGroups,
  formatChecklistLabel,
  setCompletionReport,
  makeGroup1Key,
  makeGroup1RedKey,
  timeHourOptions,
  timeMinuteOptions,
  completionPhotos,
  setCompletionPhotos,
  hasIssues,
  setHasIssues,
  issueError,
  setIssueError,
  issueDraft,
  setIssueDraft,
  dynamicIssueTypes,
  dynamicIssueCategories,
  resolveIssueLabel,
  addIssue,
  issues,
  removeIssue,
  completeSubmitting,
  completeService
}: {
  open: boolean;
  onClose: () => void;
  completionReport: CompletionReport;
  getTimeParts: (value: string) => { hour: string; minute: string };
  setReportTimePart: (field: 'entryHour' | 'exitHour', part: 'hour' | 'minute', nextValue: string) => void;
  groupPanelsOpen: { grupo1: boolean; grupo2: boolean; grupo3: boolean };
  setGroupPanelsOpen: React.Dispatch<React.SetStateAction<{ grupo1: boolean; grupo2: boolean; grupo3: boolean }>>;
  group1Units: number[];
  setGroup1Units: React.Dispatch<React.SetStateAction<number[]>>;
  bombaPanelsOpen: Record<number, boolean>;
  setBombaPanelsOpen: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  completionChecklistGroup1: readonly string[];
  completionChecklistGroups: { grupo2: readonly string[]; grupo3: readonly string[] };
  formatChecklistLabel: (value: string) => string;
  setCompletionReport: React.Dispatch<React.SetStateAction<any>>;
  makeGroup1Key: (unit: number, item: string) => string;
  makeGroup1RedKey: (unit: number, item: string) => string;
  timeHourOptions: string[];
  timeMinuteOptions: string[];
  completionPhotos: File[];
  setCompletionPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  hasIssues: 'yes' | 'no' | '';
  setHasIssues: React.Dispatch<React.SetStateAction<'yes' | 'no' | ''>>;
  issueError: string | null;
  setIssueError: React.Dispatch<React.SetStateAction<string | null>>;
  issueDraft: IssueDraft;
  setIssueDraft: React.Dispatch<React.SetStateAction<IssueDraft>>;
  dynamicIssueTypes: readonly string[];
  dynamicIssueCategories: Record<string, string[]>;
  resolveIssueLabel: (prefix: 'scheduling.issueTypes' | 'scheduling.issueCategories', value: string) => string;
  addIssue: () => void;
  issues: IssueDraft[];
  removeIssue: (id: string) => void;
  completeSubmitting: boolean;
  completeService: () => void;
}) {
  const { t } = useI18n();

  return (
    <Modal open={open} title={t('scheduling.completeTitle')} onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-3 rounded-xl border border-fog-200 bg-fog-50 p-4">
          <p className="text-sm font-semibold text-ink-900">{t('scheduling.serviceReport')}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-ink-800">{t('scheduling.entryHourLabel')} <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={getTimeParts(completionReport.entryHour).hour} onChange={(event) => setReportTimePart('entryHour', 'hour', event.target.value)}>
                  <option value="">{t('scheduling.hourPlaceholder')}</option>
                  {timeHourOptions.map((hour) => <option key={`entry-hour-${hour}`} value={hour}>{hour}</option>)}
                </Select>
                <Select value={getTimeParts(completionReport.entryHour).minute} onChange={(event) => setReportTimePart('entryHour', 'minute', event.target.value)}>
                  <option value="">{t('scheduling.minutePlaceholder')}</option>
                  {timeMinuteOptions.map((minute) => <option key={`entry-minute-${minute}`} value={minute}>{minute}</option>)}
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-ink-800">{t('scheduling.exitHourLabel')} <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={getTimeParts(completionReport.exitHour).hour} onChange={(event) => setReportTimePart('exitHour', 'hour', event.target.value)}>
                  <option value="">{t('scheduling.hourPlaceholder')}</option>
                  {timeHourOptions.map((hour) => <option key={`exit-hour-${hour}`} value={hour}>{hour}</option>)}
                </Select>
                <Select value={getTimeParts(completionReport.exitHour).minute} onChange={(event) => setReportTimePart('exitHour', 'minute', event.target.value)}>
                  <option value="">{t('scheduling.minutePlaceholder')}</option>
                  {timeMinuteOptions.map((minute) => <option key={`exit-minute-${minute}`} value={minute}>{minute}</option>)}
                </Select>
              </div>
            </div>
          </div>
          <Input label={t('scheduling.observationsLabel')} required value={completionReport.observations} onChange={(event) => setCompletionReport((prev: any) => ({ ...prev, observations: event.target.value }))} />
          <div className="space-y-3">
            <p className="text-xs font-semibold text-ink-700">{t('scheduling.reviewDetailsTitle')}</p>
            <div className="space-y-2 rounded-lg border border-fog-200 bg-white p-2">
              <button type="button" className="flex w-full items-center justify-between text-left text-xs font-semibold text-ink-800" onClick={() => setGroupPanelsOpen((prev) => ({ ...prev, grupo1: !prev.grupo1 }))}>
                <span>{t('scheduling.group1Pumps')}</span>
                <span>{groupPanelsOpen.grupo1 ? '▾' : '▸'}</span>
              </button>
              {groupPanelsOpen.grupo1 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-end">
                    <Button type="button" variant="secondary" onClick={() => {
                      const nextUnit = (group1Units.length ? group1Units[group1Units.length - 1] : 0) + 1;
                      setGroup1Units((prev) => [...prev, nextUnit]);
                      setBombaPanelsOpen((prev) => ({ ...prev, [nextUnit]: true }));
                    }}>{t('scheduling.addPump')}</Button>
                  </div>
                  {group1Units.map((unit, index) => (
                    <div key={unit} className="space-y-2 rounded-lg border border-fog-200 bg-fog-50 p-2">
                      <div className="flex items-center justify-between">
                        <button type="button" className="flex items-center gap-2 text-xs font-semibold text-ink-700" onClick={() => setBombaPanelsOpen((prev) => ({ ...prev, [unit]: !(prev[unit] ?? true) }))}>
                          <span>{bombaPanelsOpen[unit] ?? true ? '▾' : '▸'}</span>
                          <span>{t('scheduling.pumpLabel', { index: index + 1 })}</span>
                        </button>
                        {group1Units.length > 1 ? (
                          <button type="button" className="text-xs text-rose-600" onClick={() => {
                            setGroup1Units((prev) => prev.filter((value) => value !== unit));
                            setBombaPanelsOpen((prev) => {
                              const next = { ...prev };
                              delete next[unit];
                              return next;
                            });
                          }}>{t('common.delete')}</button>
                        ) : null}
                      </div>
                      {(bombaPanelsOpen[unit] ?? true) ? (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {completionChecklistGroup1.map((item) => {
                            const key = makeGroup1Key(unit, item);
                            const redKey = makeGroup1RedKey(unit, item);
                            return (
                              <div key={key} className="space-y-2 rounded-lg border border-fog-200 bg-white p-2">
                                <p className="mb-1 text-xs text-ink-700">{formatChecklistLabel(item)} <span className="text-red-500">*</span></p>
                                <Select value={completionReport.checklist[key] ?? 'na'} onChange={(event) => setCompletionReport((prev: any) => ({ ...prev, checklist: { ...prev.checklist, [key]: event.target.value as 'ok' | 'regular' | 'malo' | 'na' } }))}>
                                  <option value="ok">{t('scheduling.goodOption')}</option>
                                  <option value="regular">{t('scheduling.regularOption')}</option>
                                  <option value="malo">{t('scheduling.badOption')}</option>
                                  <option value="na">{t('scheduling.notApplicableOption')}</option>
                                </Select>
                                <div className="space-y-1">
                                  <p className="text-xs text-ink-700">{t('scheduling.distributionNetworkLabel')} <span className="text-red-500">*</span></p>
                                  <Select value={completionReport.checklist[redKey] ?? 'na'} onChange={(event) => setCompletionReport((prev: any) => ({ ...prev, checklist: { ...prev.checklist, [redKey]: event.target.value as 'ok' | 'regular' | 'malo' | 'na' } }))}>
                                    <option value="ok">{t('scheduling.goodFemaleOption')}</option>
                                    <option value="regular">{t('scheduling.regularOption')}</option>
                                    <option value="malo">{t('scheduling.badFemaleOption')}</option>
                                    <option value="na">{t('scheduling.notApplicableOption')}</option>
                                  </Select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            {[
              { key: 'grupo2', title: t('scheduling.group2Label'), items: completionChecklistGroups.grupo2 },
              { key: 'grupo3', title: t('scheduling.group3Label'), items: completionChecklistGroups.grupo3 }
            ].map((group) => (
              <div key={group.title} className="space-y-2 rounded-lg border border-fog-200 bg-white p-2">
                <button type="button" className="flex w-full items-center justify-between text-left text-xs font-semibold text-ink-800" onClick={() => setGroupPanelsOpen((prev) => ({ ...prev, [group.key]: !prev[group.key as 'grupo2' | 'grupo3'] }))}>
                  <span>{group.title}</span>
                  <span>{groupPanelsOpen[group.key as 'grupo2' | 'grupo3'] ? '▾' : '▸'}</span>
                </button>
                {groupPanelsOpen[group.key as 'grupo2' | 'grupo3'] ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {group.items.map((item) => (
                      <div key={item} className="space-y-2 rounded-lg border border-fog-200 bg-fog-50 p-2">
                        <p className="mb-1 text-xs text-ink-700">{formatChecklistLabel(item)} <span className="text-red-500">*</span></p>
                        <Select value={completionReport.checklist[item] ?? 'na'} onChange={(event) => setCompletionReport((prev: any) => ({ ...prev, checklist: { ...prev.checklist, [item]: event.target.value as 'ok' | 'regular' | 'malo' | 'na' } }))}>
                          <option value="ok">{t('scheduling.goodOption')}</option>
                          <option value="regular">{t('scheduling.regularOption')}</option>
                          <option value="malo">{t('scheduling.badOption')}</option>
                          <option value="na">{t('scheduling.notApplicableOption')}</option>
                        </Select>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-800">{t('scheduling.servicePhotosTitle')} <span className="text-red-500">*</span> {t('scheduling.servicePhotosRequirement')}</label>
            <input type="file" accept="image/*" multiple onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (!files.length) return;
              setCompletionPhotos((prev) => [...prev, ...files]);
              setIssueError(null);
            }} className="block w-full text-xs" />
            {completionPhotos.length ? (
              <div className="space-y-1">
                {completionPhotos.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs">
                    <span className="truncate">{file.name}</span>
                    <button type="button" className="text-rose-600" onClick={() => setCompletionPhotos((prev) => prev.filter((_, i) => i !== index))}>
                      {t('common.delete')}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-ink-800">{t('scheduling.issueQuestion')}</p>
          <Button variant={hasIssues === 'yes' ? 'primary' : 'secondary'} onClick={() => { setIssueError(null); setHasIssues('yes'); }} type="button">{t('common.yes')}</Button>
          <Button variant={hasIssues === 'no' ? 'primary' : 'secondary'} onClick={() => { setIssueError(null); setHasIssues('no'); }} type="button">{t('common.no')}</Button>
        </div>
        {issueError && hasIssues !== 'yes' ? <p className="text-xs text-red-500">{issueError}</p> : null}
        {hasIssues === 'yes' ? (
          <div className="space-y-4 rounded-xl border border-fog-200 bg-fog-50 p-4">
            <Select label={t('scheduling.issueType')} required value={issueDraft.type} onChange={(event) => setIssueDraft((prev) => ({ ...prev, type: event.target.value, category: '' }))}>
              <option value="">{t('common.select')}</option>
              {dynamicIssueTypes.map((option: string) => <option key={option} value={option}>{resolveIssueLabel('scheduling.issueTypes', option)}</option>)}
            </Select>
            <Select label={t('scheduling.issueCategory')} required value={issueDraft.category} onChange={(event) => setIssueDraft((prev) => ({ ...prev, category: event.target.value }))} disabled={!issueDraft.type}>
              <option value="">{t('common.select')}</option>
              {(issueDraft.type ? dynamicIssueCategories[issueDraft.type] ?? [] : []).map((option: string) => <option key={option} value={option}>{resolveIssueLabel('scheduling.issueCategories', option)}</option>)}
            </Select>
            <Input label={t('scheduling.issueDescription')} value={issueDraft.description} onChange={(event) => setIssueDraft((prev) => ({ ...prev, description: event.target.value }))} maxLength={300} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-800">{t('scheduling.issuePhotos')}<span className="ml-1 text-red-500">*</span></label>
              <input type="file" accept="image/*" multiple onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (!files.length) return;
                setIssueDraft((prev) => ({ ...prev, photos: [...prev.photos, ...files] }));
              }} className="block w-full text-xs" />
              {issueDraft.photos.length ? (
                <div className="space-y-1">
                  {issueDraft.photos.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs text-ink-700">
                      <span className="truncate">{file.name}</span>
                      <button type="button" className="text-rose-600" onClick={() => setIssueDraft((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }))}>{t('common.delete')}</button>
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="text-xs text-ink-500">{t('scheduling.issuePhotosHint')}</p>
            </div>
            {issueError ? <p className="text-xs text-red-500">{issueError}</p> : null}
            <Button type="button" variant="secondary" onClick={addIssue}>{t('scheduling.addIssue')}</Button>
            {issues.length ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-ink-700">{t('scheduling.issueList')}</p>
                {issues.map((issue) => (
                  <div key={issue.id} className="flex items-center justify-between rounded-lg bg-white p-2 text-xs text-ink-700">
                    <div>
                      <p className="font-semibold">{t(`scheduling.issueTypes.${issue.type}`)}</p>
                      <p>{t(`scheduling.issueCategories.${issue.category}`)}</p>
                    </div>
                    <button type="button" className="text-rose-600" onClick={() => removeIssue(issue.id)}>{t('common.delete')}</button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <Button type="button" className="w-full" disabled={completeSubmitting} onClick={completeService}>
          {completeSubmitting ? t('scheduling.completing') : t('scheduling.complete')}
        </Button>
      </div>
    </Modal>
  );
}
