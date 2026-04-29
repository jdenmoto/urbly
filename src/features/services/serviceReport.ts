import { renderTenantTemplate } from '@/lib/tenantTemplateEngine';
import type { ServiceOrderPriority, ServiceOrderStatus } from '@/core/models/serviceOrder';
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
    'services.statusDraft': 'Borrador',
    'services.statusScheduled': 'Programado',
    'services.statusConfirmed': 'Confirmado',
    'services.statusInProgress': 'En progreso',
    'services.statusCompleted': 'Completado',
    'services.statusCancelled': 'Cancelado',
    'services.priorityUrgent': 'urgente',
    'services.priorityHigh': 'alta',
    'services.priorityMedium': 'media',
    'services.priorityLow': 'baja'
  };

  return dictionaries[key] ?? String(params?.defaultValue ?? key);
};

export type ServiceReportSnapshot = {
  observations: string;
  issueCount: number;
  attachmentCount: number;
  photoCount: number;
  checklistValues: string[];
};

export function buildServiceReportSnapshot(serviceOrder: {
  report?: { observations?: string | null; checklist?: Record<string, string> | null } | null;
  checklist?: Record<string, string> | null;
  issues?: unknown[] | null;
  attachments?: unknown[] | null;
  completionPhotos?: unknown[] | null;
}): ServiceReportSnapshot {
  return {
    observations: serviceOrder.report?.observations?.trim() ?? '',
    issueCount: serviceOrder.issues?.length ?? 0,
    attachmentCount: serviceOrder.attachments?.length ?? 0,
    photoCount: serviceOrder.completionPhotos?.length ?? 0,
    checklistValues: Object.values(serviceOrder.report?.checklist ?? serviceOrder.checklist ?? {})
  };
}

export function buildTechnicalReport(serviceOrder: ServiceOrderReportLike, t: TranslateFn = defaultTranslate) {
  const issues = serviceOrder.issues ?? [];
  const timelineCount = serviceOrder.timeline?.length ?? 0;
  const photos = serviceOrder.completionPhotos?.length ?? 0;

  return [
    `Servicio: ${serviceOrder.title}`,
    `Tipo: ${getServiceOrderTypeLabel(t, serviceOrder.type)}`,
    `Estado: ${getServiceOrderStatusLabel(t, serviceOrder.status)}`,
    `Prioridad: ${getServiceOrderPriorityLabel(t, serviceOrder.priority)}`,
    `Inicio programado: ${formatServiceDateTime(serviceOrder.scheduledStartAt)}`,
    `Fin programado: ${formatServiceDateTime(serviceOrder.scheduledEndAt)}`,
    `Novedades registradas: ${issues.length}`,
    `Eventos de la línea de tiempo: ${timelineCount}`,
    `Evidencias fotográficas: ${photos}`,
    issues.length
      ? `Detalle de novedades: ${issues.map((issue) => `${getIssueTypeLabel(t, issue.type)}/${getIssueCategoryLabel(t, issue.category)}`).join(', ')}`
      : 'Detalle de novedades: sin novedades registradas por ahora'
  ].join('\n');
}

export async function buildTenantAwareTechnicalReport(serviceOrder: ServiceOrderReportLike, t: TranslateFn = defaultTranslate) {
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
