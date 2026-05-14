type Nullable<T> = T | null | undefined;

type ReportChecklist = Record<string, string>;

type SnapshotReport = {
  entryHour?: Nullable<string>;
  exitHour?: Nullable<string>;
  observations?: Nullable<string>;
  checklist?: Nullable<ReportChecklist>;
  recommendations?: Nullable<string[] | string>;
  nextSteps?: Nullable<string[] | string>;
};

type SnapshotCommunication = {
  followUpSuggestion?: Nullable<string>;
};

type SnapshotReview = {
  status?: Nullable<string>;
  feedback?: Nullable<string>;
  reviewedAt?: Nullable<string>;
};

type SnapshotAssignee = {
  id?: Nullable<string>;
  name?: Nullable<string>;
  role?: Nullable<string>;
};

export type ServiceReportSnapshotInput = {
  id: string;
  accountId?: Nullable<string>;
  administrationId?: Nullable<string>;
  customerId?: Nullable<string>;
  customerName?: Nullable<string>;
  buildingId?: Nullable<string>;
  buildingName?: Nullable<string>;
  title?: Nullable<string>;
  description?: Nullable<string>;
  type?: Nullable<string>;
  priority?: Nullable<string>;
  status?: Nullable<string>;
  scheduledStartAt?: Nullable<string>;
  scheduledEndAt?: Nullable<string>;
  startedAt?: Nullable<string>;
  completedAt?: Nullable<string>;
  assignedTechnicianId?: Nullable<string>;
  assignedTechnicianName?: Nullable<string>;
  technicianName?: Nullable<string>;
  assignees?: Nullable<SnapshotAssignee[]>;
  report?: Nullable<SnapshotReport>;
  checklist?: Nullable<ReportChecklist>;
  issues?: Nullable<Array<Record<string, any>>>;
  attachments?: Nullable<string[]>;
  completionPhotos?: Nullable<string[]>;
  communication?: Nullable<SnapshotCommunication>;
  review?: Nullable<SnapshotReview>;
  recommendations?: Nullable<string[] | string>;
  nextSteps?: Nullable<string[] | string>;
  createdAt?: Nullable<string>;
  updatedAt?: Nullable<string>;
};

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export type ServiceReportSnapshotChecklistItem = {
  key: string;
  label: string;
  value: string;
  valueLabel: string;
};

export type ServiceReportSnapshotIssue = {
  id: string | null;
  type: string;
  typeLabel: string;
  category: string;
  categoryLabel: string;
  description: string;
  photos: string[];
  createdAt: string | null;
};

export type ServiceReportSnapshot = {
  service: {
    id: string;
    title: string;
    description: string;
    type: string;
    typeLabel: string;
    priority: string;
    priorityLabel: string;
    status: string;
    statusLabel: string;
  };
  context: {
    accountId: string | null;
    administrationId: string | null;
    customerId: string | null;
    customerName: string | null;
    buildingId: string;
    buildingName: string | null;
  };
  schedule: {
    scheduledStartAt: string;
    scheduledEndAt: string;
    startedAt: string | null;
    completedAt: string | null;
  };
  assignees: Array<{
    id: string | null;
    name: string | null;
    role: string;
  }>;
  results: {
    entryHour: string | null;
    exitHour: string | null;
    observations: string;
    checklist: ServiceReportSnapshotChecklistItem[];
    reviewStatus: string | null;
    reviewFeedback: string | null;
  };
  evidence: {
    photos: string[];
    attachments: string[];
    photoCount: number;
    attachmentCount: number;
    issuePhotoCount: number;
  };
  issues: ServiceReportSnapshotIssue[];
  observations: string;
  recommendations: string[];
  nextSteps: string[];
  timestamps: {
    createdAt: string | null;
    updatedAt: string | null;
    reviewedAt: string | null;
  };
  issueCount: number;
  attachmentCount: number;
  photoCount: number;
  checklistValues: string[];
};

export type ServiceReportSnapshotOptions = {
  t?: TranslateFn;
  statusKeyPrefix?: string;
  priorityKeyPrefix?: string;
  typeKeyPrefix?: string;
  issueTypeKeyPrefix?: string;
  issueCategoryKeyPrefix?: string;
};

export type ServiceReportPdfModel = {
  snapshot: ServiceReportSnapshot;
  title: string;
  summaryRows: Array<[string, string]>;
  description: string;
  operationalRows: Array<[string, string | null]>;
  checklist: string[];
  issues: string[];
  nextSteps: string[];
};

const defaultTranslate: TranslateFn = (key, params) => String(params?.defaultValue ?? key);

const statusLabelSuffix: Record<string, string> = {
  draft: 'draft',
  unassigned: 'unassigned',
  scheduled: 'scheduled',
  confirmed: 'confirmed',
  in_progress: 'in.progress',
  paused: 'paused',
  pending_review: 'pending.review',
  requires_reschedule: 'requires.reschedule',
  completed: 'completed',
  cancelled: 'cancelled',
};

const priorityLabelSuffix: Record<string, string> = {
  urgent: 'urgent',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

function cleanText(value: Nullable<unknown>) {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableCleanText(value: Nullable<unknown>) {
  const text = cleanText(value);
  return text || null;
}

function humanizeLabel(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function checklistValueLabel(value: string) {
  if (value === 'ok') return 'OK';
  if (value === 'regular') return 'Regular';
  if (value === 'malo') return 'Malo';
  if (value === 'na') return 'N/A';
  return humanizeLabel(value);
}

function arrayFromMaybe(value: Nullable<string[] | string>) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean);
  const text = cleanText(value);
  return text ? [text] : [];
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getServiceOrderStatusLabel(t: TranslateFn, status: string, keyPrefix = 'services.status') {
  return t(`${keyPrefix}.${statusLabelSuffix[status] ?? statusLabelSuffix.draft}`);
}

function getServiceOrderPriorityLabel(t: TranslateFn, priority: string, keyPrefix = 'services.priority') {
  return t(`${keyPrefix}.${priorityLabelSuffix[priority] ?? priorityLabelSuffix.medium}`);
}

function getServiceOrderTypeLabel(t: TranslateFn, type: string, keyPrefix = 'services.types') {
  return t(`${keyPrefix}.${type}`, { defaultValue: humanizeLabel(type) });
}

function getIssueTypeLabel(t: TranslateFn, value: string, keyPrefix = 'services.issue.types') {
  return t(`${keyPrefix}.${value}`, { defaultValue: humanizeLabel(value) });
}

function getIssueCategoryLabel(t: TranslateFn, value: string, keyPrefix = 'services.issue.categories') {
  return t(`${keyPrefix}.${value}`, { defaultValue: humanizeLabel(value) });
}

function normalizeChecklist(checklist: Nullable<ReportChecklist>): ServiceReportSnapshotChecklistItem[] {
  return Object.entries(checklist ?? {}).map(([key, value]) => {
    const normalizedValue = String(value);
    return {
      key,
      label: humanizeLabel(key),
      value: normalizedValue,
      valueLabel: checklistValueLabel(normalizedValue),
    };
  });
}

function normalizeIssues(
  issues: Nullable<Array<Record<string, any>>>,
  t: TranslateFn,
  options: ServiceReportSnapshotOptions
): ServiceReportSnapshotIssue[] {
  return (issues ?? []).map((issue) => {
    const type = cleanText(issue.type) || 'unknown';
    const category = cleanText(issue.category) || 'unknown';

    return {
      id: nullableCleanText(issue.id),
      type,
      typeLabel: getIssueTypeLabel(t, type, options.issueTypeKeyPrefix),
      category,
      categoryLabel: getIssueCategoryLabel(t, category, options.issueCategoryKeyPrefix),
      description: cleanText(issue.description),
      photos: stringArray(issue.photos),
      createdAt: nullableCleanText(issue.createdAt),
    };
  });
}

function normalizeAssignees(serviceOrder: ServiceReportSnapshotInput) {
  const explicitAssignees = (serviceOrder.assignees ?? [])
    .map((assignee) => ({
      id: nullableCleanText(assignee.id),
      name: nullableCleanText(assignee.name),
      role: cleanText(assignee.role) || 'technician',
    }))
    .filter((assignee) => assignee.id || assignee.name);

  if (explicitAssignees.length) return explicitAssignees;

  const technicianId = nullableCleanText(serviceOrder.assignedTechnicianId);
  const technicianName = nullableCleanText(serviceOrder.assignedTechnicianName) ?? nullableCleanText(serviceOrder.technicianName);

  return technicianId || technicianName
    ? [{ id: technicianId, name: technicianName, role: 'technician' }]
    : [];
}

export function buildServiceReportSnapshot(
  serviceOrder: ServiceReportSnapshotInput,
  options: ServiceReportSnapshotOptions = {}
): ServiceReportSnapshot {
  const t = options.t ?? defaultTranslate;
  const report = serviceOrder.report ?? {};
  const checklist = normalizeChecklist(report.checklist ?? serviceOrder.checklist ?? {});
  const photos = stringArray(serviceOrder.completionPhotos);
  const attachments = stringArray(serviceOrder.attachments);
  const issues = normalizeIssues(serviceOrder.issues, t, options);
  const observations = cleanText(report.observations);
  const recommendations = [
    ...arrayFromMaybe(report.recommendations),
    ...arrayFromMaybe(serviceOrder.recommendations),
  ];
  const nextSteps = [
    ...arrayFromMaybe(report.nextSteps),
    ...arrayFromMaybe(serviceOrder.nextSteps),
    ...arrayFromMaybe(serviceOrder.communication?.followUpSuggestion),
  ];

  return {
    service: {
      id: serviceOrder.id,
      title: cleanText(serviceOrder.title) || 'Servicio',
      description: cleanText(serviceOrder.description),
      type: cleanText(serviceOrder.type) || 'unknown',
      typeLabel: getServiceOrderTypeLabel(t, cleanText(serviceOrder.type) || 'unknown', options.typeKeyPrefix),
      priority: cleanText(serviceOrder.priority) || 'medium',
      priorityLabel: getServiceOrderPriorityLabel(t, cleanText(serviceOrder.priority) || 'medium', options.priorityKeyPrefix),
      status: cleanText(serviceOrder.status) || 'draft',
      statusLabel: getServiceOrderStatusLabel(t, cleanText(serviceOrder.status) || 'draft', options.statusKeyPrefix),
    },
    context: {
      accountId: nullableCleanText(serviceOrder.accountId),
      administrationId: nullableCleanText(serviceOrder.administrationId),
      customerId: nullableCleanText(serviceOrder.customerId),
      customerName: nullableCleanText(serviceOrder.customerName),
      buildingId: cleanText(serviceOrder.buildingId),
      buildingName: nullableCleanText(serviceOrder.buildingName),
    },
    schedule: {
      scheduledStartAt: cleanText(serviceOrder.scheduledStartAt),
      scheduledEndAt: cleanText(serviceOrder.scheduledEndAt),
      startedAt: nullableCleanText(serviceOrder.startedAt),
      completedAt: nullableCleanText(serviceOrder.completedAt),
    },
    assignees: normalizeAssignees(serviceOrder),
    results: {
      entryHour: nullableCleanText(report.entryHour),
      exitHour: nullableCleanText(report.exitHour),
      observations,
      checklist,
      reviewStatus: nullableCleanText(serviceOrder.review?.status),
      reviewFeedback: nullableCleanText(serviceOrder.review?.feedback),
    },
    evidence: {
      photos,
      attachments,
      photoCount: photos.length,
      attachmentCount: attachments.length,
      issuePhotoCount: issues.reduce((total, issue) => total + issue.photos.length, 0),
    },
    issues,
    observations,
    recommendations,
    nextSteps,
    timestamps: {
      createdAt: nullableCleanText(serviceOrder.createdAt),
      updatedAt: nullableCleanText(serviceOrder.updatedAt),
      reviewedAt: nullableCleanText(serviceOrder.review?.reviewedAt),
    },
    issueCount: issues.length,
    attachmentCount: attachments.length,
    photoCount: photos.length,
    checklistValues: checklist.map((item) => item.value),
  };
}

function formatIssue(issue: ServiceReportSnapshotIssue) {
  const label = `${issue.typeLabel} / ${issue.categoryLabel}`;
  return issue.description ? `${label}: ${issue.description}` : label;
}

export function buildServiceReportPdfModel(
  serviceOrder: ServiceReportSnapshotInput,
  options: ServiceReportSnapshotOptions = {}
): ServiceReportPdfModel {
  const snapshot = buildServiceReportSnapshot(serviceOrder, options);
  const technician = snapshot.assignees[0]?.name ?? snapshot.assignees[0]?.id ?? 'Sin asignar';

  return {
    snapshot,
    title: snapshot.service.title,
    summaryRows: [
      ['Tipo', snapshot.service.typeLabel],
      ['Estado', snapshot.service.statusLabel],
      ['Prioridad', snapshot.service.priorityLabel],
      ['Inicio', snapshot.schedule.scheduledStartAt],
      ['Fin', snapshot.schedule.scheduledEndAt],
      ['Técnico', technician],
      ['Fotos', String(snapshot.photoCount)],
      ['Adjuntos', String(snapshot.attachmentCount)],
    ],
    description: snapshot.service.description,
    operationalRows: [
      ['Hora entrada', snapshot.results.entryHour],
      ['Hora salida', snapshot.results.exitHour],
      ['Observaciones', snapshot.observations],
    ],
    checklist: snapshot.results.checklist.map((item) => `${item.label}: ${item.valueLabel}`),
    issues: snapshot.issues.map(formatIssue),
    nextSteps: snapshot.nextSteps,
  };
}
