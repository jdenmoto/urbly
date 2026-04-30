import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { ServiceOrder, ServiceOrderChecklistValue, ServiceOrderIssue, ServiceOrderReport } from '@/core/models/serviceOrder';
import type { SchedulingItem } from './schedulingItem';
import { storage } from '@/lib/firebase/client';

export type IssueDraft = {
  id: string;
  type: string;
  category: string;
  description: string;
  photos: File[];
};

export type CompletionReport = {
  entryHour: string;
  exitHour: string;
  observations: string;
  checklist: Record<string, string>;
};

export type CompletionChecklistValue = ServiceOrderChecklistValue;

export function hasMinTwoPhotos(photos: File[]) {
  return photos.filter((photo) => photo instanceof File).length >= 2;
}

function safeStorageName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadIssuePhotos(schedulingItemId: string, issueId: string, photos: File[]) {
  const uploads = await Promise.all(
    photos
      .filter((file): file is File => file instanceof File)
      .map(async (file, index) => {
        const storageRef = ref(storage, `service-orders/${schedulingItemId}/issues/${issueId}/${index}-${safeStorageName(file.name)}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      })
  );

  return uploads;
}

export async function uploadCompletionPhotos(schedulingItemId: string, photos: File[]) {
  const uploads = await Promise.all(
    photos
      .filter((file): file is File => file instanceof File)
      .map(async (file, index) => {
        const storageRef = ref(storage, `service-orders/${schedulingItemId}/completion-photos/${Date.now()}-${index}-${safeStorageName(file.name)}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      })
  );

  return uploads;
}

function toMinutes(time: string) {
  const [hour = '0', minute = '0'] = time.split(':');
  return Number(hour) * 60 + Number(minute);
}

export function validateCompletion(args: {
  t: (key: string) => string;
  hasIssues: 'yes' | 'no' | '';
  issues: IssueDraft[];
  completionPhotos: File[];
  completionReport: CompletionReport;
}) {
  const { t, hasIssues, issues, completionPhotos, completionReport } = args;

  if (!hasIssues) return t('scheduling.issue.decision.required');
  if (hasIssues === 'yes' && issues.length === 0) return t('scheduling.issue.at.least.one');
  if (completionPhotos.length < 1) return t('scheduling.completion.photo.required');
  if (!completionReport.entryHour || !completionReport.exitHour || !completionReport.observations.trim()) {
    return t('scheduling.completion.required.fields');
  }
  if (toMinutes(completionReport.exitHour) <= toMinutes(completionReport.entryHour)) {
    return t('scheduling.completion.exit.after.entry');
  }

  return null;
}

export function buildNormalizedChecklist(args: {
  completionReport: CompletionReport;
  completionChecklistItems: string[];
  completionChecklistGroup1: string[];
  group1Units: number[];
  makeGroup1Key: (unit: number, item: string) => string;
  makeGroup1RedKey: (unit: number, item: string) => string;
}) {
  const {
    completionReport,
    completionChecklistItems,
    completionChecklistGroup1,
    group1Units,
    makeGroup1Key,
    makeGroup1RedKey
  } = args;

  const normalizedChecklist = completionChecklistItems.reduce<Record<string, CompletionChecklistValue>>((acc, item) => {
    if (!completionChecklistGroup1.includes(item)) {
      const value = completionReport.checklist[item];
      acc[item] = (value as CompletionChecklistValue) || 'na';
    }
    return acc;
  }, {});

  group1Units.forEach((unit) => {
    completionChecklistGroup1.forEach((item) => {
      const key = makeGroup1Key(unit, item);
      const redKey = makeGroup1RedKey(unit, item);
      normalizedChecklist[key] = (completionReport.checklist[key] as CompletionChecklistValue) || 'na';
      normalizedChecklist[redKey] = (completionReport.checklist[redKey] as CompletionChecklistValue) || 'na';
    });
  });

  return normalizedChecklist;
}

export async function buildCompletionPayload(args: {
  schedulingItemId: string;
  hasIssues: 'yes' | 'no' | '';
  issues: IssueDraft[];
  completionPhotos: File[];
  completionReport: CompletionReport;
  normalizedChecklist: Record<string, CompletionChecklistValue>;
}) {
  const { schedulingItemId, hasIssues, issues, completionPhotos, completionReport, normalizedChecklist } = args;
  const completionPhotoUrls = await uploadCompletionPhotos(schedulingItemId, completionPhotos);

  let payload: Record<string, unknown> = {
    status: 'completed',
    completedAt: new Date().toISOString(),
    report: {
      ...completionReport,
      checklist: normalizedChecklist
    } as ServiceOrderReport,
    completionPhotos: completionPhotoUrls
  };

  if (hasIssues === 'yes') {
    const resolvedIssues = await Promise.all(
      issues.map(async (issue) => {
        const photoUrls = await uploadIssuePhotos(schedulingItemId, issue.id, issue.photos);
        return {
          id: issue.id,
          type: issue.type,
          category: issue.category,
          description: issue.description?.trim() || null,
          photos: photoUrls,
          createdAt: new Date().toISOString()
        };
      })
    );

    payload = { ...payload, issues: resolvedIssues };
  }

  return payload;
}

export function applyCompletionToSelected(selected: SchedulingItem | null, schedulingItemId: string, payload: Record<string, unknown>) {
  if (!selected || selected.id !== schedulingItemId) return selected;

  return {
    ...selected,
    status: 'completado',
    completedAt: payload.completedAt as string,
    issues: payload.issues as ServiceOrderIssue[],
    completionPhotos: payload.completionPhotos as string[],
    completionReport: payload.report as SchedulingItem['completionReport']
  };
}
