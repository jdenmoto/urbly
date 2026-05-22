import { renderTenantTemplate } from '@/lib/tenantTemplateEngine';
import {
  buildServiceReportSnapshot,
  type ServiceReportSnapshot,
  type ServiceReportSnapshotInput,
} from './serviceReportSnapshot';
export {
  buildServiceReportSnapshot,
  type ServiceReportSnapshot,
  type ServiceReportSnapshotInput,
} from './serviceReportSnapshot';
import {
  formatServiceDateTime,
  getServiceOrderPriorityLabel,
  getServiceOrderStatusLabel,
  getServiceOrderTypeLabel,
  type TranslateFn
} from './serviceOrderPresentation';

export type ServiceOrderReportLike = ServiceReportSnapshotInput;

const defaultTranslate: TranslateFn = (key, params) => {
  const dictionaries: Record<string, string> = {
    'services.status.draft': 'Borrador',
    'services.status.scheduled': 'Programado',
    'services.status.confirmed': 'Confirmado',
    'services.status.in.progress': 'En progreso',
    'services.status.completed': 'Completado',
    'services.status.cancelled': 'Cancelado',
    'services.priority.urgent': 'urgente',
    'services.priority.high': 'alta',
    'services.priority.medium': 'media',
    'services.priority.low': 'baja'
  };

  return dictionaries[key] ?? String(params?.defaultValue ?? key);
};

type TechnicalReportCopyOptions = {
  labelsKeyPrefix?: string;
  statusKeyPrefix?: string;
  priorityKeyPrefix?: string;
  typeKeyPrefix?: string;
  issueTypeKeyPrefix?: string;
  issueCategoryKeyPrefix?: string;
};

function reportLabel(t: TranslateFn, keyPrefix: string | undefined, key: string, fallback: string) {
  return keyPrefix ? t(`${keyPrefix}.${key}`, { defaultValue: fallback }) : fallback;
}

export type PrintableServiceReportModel = {
  snapshot: ServiceReportSnapshot;
  summary: {
    title: string;
    statusLabel: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    photoCount: number;
    issueCount: number;
    attachmentCount: number;
  };
  reportText: string;
  photos: string[];
  attachments: string[];
};

function formatSnapshotChecklist(snapshot: ServiceReportSnapshot) {
  return snapshot.results.checklist.length
    ? snapshot.results.checklist.map((item) => `${item.label}: ${item.valueLabel}`).join(', ')
    : null;
}

function formatSnapshotIssueDetail(snapshot: ServiceReportSnapshot) {
  return snapshot.issues.length
    ? snapshot.issues.map((issue) => `${issue.typeLabel}/${issue.categoryLabel}`).join(', ')
    : null;
}

function buildSnapshotReportText(snapshot: ServiceReportSnapshot, t: TranslateFn, options: TechnicalReportCopyOptions = {}) {
  const labelsKeyPrefix = options.labelsKeyPrefix;
  const issueDetail = reportLabel(t, labelsKeyPrefix, 'issueDetail', 'Detalle de novedades');
  const checklist = formatSnapshotChecklist(snapshot);
  const issueDetailValue = formatSnapshotIssueDetail(snapshot);
  const lines = [
    `${reportLabel(t, labelsKeyPrefix, 'service', 'Servicio')}: ${snapshot.service.title}`,
    `${reportLabel(t, labelsKeyPrefix, 'type', 'Tipo')}: ${snapshot.service.typeLabel}`,
    `${reportLabel(t, labelsKeyPrefix, 'status', 'Estado')}: ${snapshot.service.statusLabel}`,
    `${reportLabel(t, labelsKeyPrefix, 'priority', 'Prioridad')}: ${snapshot.service.priorityLabel}`,
    `${reportLabel(t, labelsKeyPrefix, 'scheduledStart', 'Inicio programado')}: ${formatServiceDateTime(snapshot.schedule.scheduledStartAt)}`,
    `${reportLabel(t, labelsKeyPrefix, 'scheduledEnd', 'Fin programado')}: ${formatServiceDateTime(snapshot.schedule.scheduledEndAt)}`,
    `${reportLabel(t, labelsKeyPrefix, 'registeredIssues', 'Novedades registradas')}: ${snapshot.issueCount}`,
    `${reportLabel(t, labelsKeyPrefix, 'photos', 'Evidencias fotográficas')}: ${snapshot.photoCount}`,
    `${issueDetail}: ${issueDetailValue ?? reportLabel(t, labelsKeyPrefix, 'noIssues', 'sin novedades registradas por ahora')}`,
  ];

  if (snapshot.results.entryHour) {
    lines.push(`${reportLabel(t, labelsKeyPrefix, 'entryHour', 'Hora de ingreso')}: ${snapshot.results.entryHour}`);
  }
  if (snapshot.results.exitHour) {
    lines.push(`${reportLabel(t, labelsKeyPrefix, 'exitHour', 'Hora de salida')}: ${snapshot.results.exitHour}`);
  }
  if (snapshot.observations) {
    lines.push(`${reportLabel(t, labelsKeyPrefix, 'observations', 'Observaciones')}: ${snapshot.observations}`);
  }
  if (checklist) {
    lines.push(`${reportLabel(t, labelsKeyPrefix, 'checklist', 'Checklist')}: ${checklist}`);
  }
  if (snapshot.nextSteps.length) {
    lines.push(`${reportLabel(t, labelsKeyPrefix, 'nextSteps', 'Siguientes pasos')}: ${snapshot.nextSteps.join(', ')}`);
  }

  return lines.join('\n');
}

export function buildPrintableServiceReportModel(
  serviceOrder: ServiceReportSnapshotInput,
  t: TranslateFn = defaultTranslate
): PrintableServiceReportModel {
  const snapshot = buildServiceReportSnapshot(serviceOrder, { t });

  return {
    snapshot,
    summary: {
      title: snapshot.service.title,
      statusLabel: snapshot.service.statusLabel,
      scheduledStartAt: snapshot.schedule.scheduledStartAt,
      scheduledEndAt: snapshot.schedule.scheduledEndAt,
      photoCount: snapshot.photoCount,
      issueCount: snapshot.issueCount,
      attachmentCount: snapshot.attachmentCount,
    },
    reportText: buildSnapshotReportText(snapshot, t),
    photos: snapshot.evidence.photos,
    attachments: snapshot.evidence.attachments,
  };
}

export function buildTechnicalReport(
  serviceOrder: ServiceOrderReportLike,
  t: TranslateFn = defaultTranslate,
  options: TechnicalReportCopyOptions = {}
) {
  const snapshot = buildServiceReportSnapshot(serviceOrder, {
    t,
    statusKeyPrefix: options.statusKeyPrefix,
    priorityKeyPrefix: options.priorityKeyPrefix,
    typeKeyPrefix: options.typeKeyPrefix,
    issueTypeKeyPrefix: options.issueTypeKeyPrefix,
    issueCategoryKeyPrefix: options.issueCategoryKeyPrefix,
  });

  return buildSnapshotReportText(snapshot, t, options);
}

export function buildClientTechnicalReport(
  serviceOrder: ServiceOrderReportLike,
  t: TranslateFn = defaultTranslate
) {
  return buildTechnicalReport(serviceOrder, t, {
    labelsKeyPrefix: 'client.portal.reports.technicalReport',
    statusKeyPrefix: 'client.portal.services.status',
    priorityKeyPrefix: 'client.portal.services.priority',
    typeKeyPrefix: 'client.portal.services.type',
    issueTypeKeyPrefix: 'client.portal.services.issue.types',
    issueCategoryKeyPrefix: 'client.portal.services.issue.categories'
  });
}

export async function buildTenantAwareTechnicalReport(
  serviceOrder: ServiceOrderReportLike,
  t: TranslateFn = defaultTranslate
) {
  const fallback = buildTechnicalReport(serviceOrder, t);
  const rendered = await renderTenantTemplate({
    administrationId: serviceOrder.administrationId ?? null,
    templateType: 'technical_report',
    module: 'services',
    roleScope: 'operator',
    context: {
      service_title: serviceOrder.title,
      service_status: getServiceOrderStatusLabel(t, serviceOrder.status),
      service_priority: getServiceOrderPriorityLabel(t, serviceOrder.priority),
      service_type: getServiceOrderTypeLabel(t, serviceOrder.type),
      scheduled_start: formatServiceDateTime(serviceOrder.scheduledStartAt),
      scheduled_end: formatServiceDateTime(serviceOrder.scheduledEndAt),
      technical_report: fallback
    }
  });

  return rendered?.content?.trim() || fallback;
}
