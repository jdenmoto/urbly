import { renderTenantTemplate } from '@/lib/tenantTemplateEngine';
import type { ServiceOrderPriority, ServiceOrderStatus } from '@/core/models/serviceOrder';
export {
  buildServiceReportSnapshot,
  type ServiceReportSnapshot,
  type ServiceReportSnapshotInput,
} from './serviceReportSnapshot';
import {
  formatServiceDateTime,
  getIssueCategoryLabel,
  getIssueTypeLabel,
  getServiceOrderPriorityLabel,
  getServiceOrderStatusLabel,
  getServiceOrderTypeLabel,
  type TranslateFn
} from './serviceOrderPresentation';

type Issue = { type: string; category: string; description?: string };
type TimelineEvent = { summary: string; createdAt: string };
export type ServiceOrderReportLike = {
  administrationId?: string | null;
  title: string;
  status: ServiceOrderStatus;
  priority: ServiceOrderPriority;
  type: string;
  description?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  issues?: Issue[];
  timeline?: TimelineEvent[];
  completionPhotos?: string[];
};

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

export function buildTechnicalReport(
  serviceOrder: ServiceOrderReportLike,
  t: TranslateFn = defaultTranslate,
  options: TechnicalReportCopyOptions = {}
) {
  const issues = serviceOrder.issues ?? [];
  const timelineCount = serviceOrder.timeline?.length ?? 0;
  const photos = serviceOrder.completionPhotos?.length ?? 0;
  const labelsKeyPrefix = options.labelsKeyPrefix;
  const issueDetail = reportLabel(t, labelsKeyPrefix, 'issueDetail', 'Detalle de novedades');

  return [
    `${reportLabel(t, labelsKeyPrefix, 'service', 'Servicio')}: ${serviceOrder.title}`,
    `${reportLabel(t, labelsKeyPrefix, 'type', 'Tipo')}: ${getServiceOrderTypeLabel(t, serviceOrder.type, options.typeKeyPrefix)}`,
    `${reportLabel(t, labelsKeyPrefix, 'status', 'Estado')}: ${getServiceOrderStatusLabel(t, serviceOrder.status, options.statusKeyPrefix)}`,
    `${reportLabel(t, labelsKeyPrefix, 'priority', 'Prioridad')}: ${getServiceOrderPriorityLabel(t, serviceOrder.priority, options.priorityKeyPrefix)}`,
    `${reportLabel(t, labelsKeyPrefix, 'scheduledStart', 'Inicio programado')}: ${formatServiceDateTime(serviceOrder.scheduledStartAt)}`,
    `${reportLabel(t, labelsKeyPrefix, 'scheduledEnd', 'Fin programado')}: ${formatServiceDateTime(serviceOrder.scheduledEndAt)}`,
    `${reportLabel(t, labelsKeyPrefix, 'registeredIssues', 'Novedades registradas')}: ${issues.length}`,
    `${reportLabel(t, labelsKeyPrefix, 'timelineEvents', 'Eventos de la línea de tiempo')}: ${timelineCount}`,
    `${reportLabel(t, labelsKeyPrefix, 'photos', 'Evidencias fotográficas')}: ${photos}`,
    issues.length
      ? `${issueDetail}: ${issues.map((issue) => `${getIssueTypeLabel(t, issue.type, options.issueTypeKeyPrefix)}/${getIssueCategoryLabel(t, issue.category, options.issueCategoryKeyPrefix)}`).join(', ')}`
      : `${issueDetail}: ${reportLabel(t, labelsKeyPrefix, 'noIssues', 'sin novedades registradas por ahora')}`
  ].join('\n');
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
