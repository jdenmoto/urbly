import { formatServiceDateTime, getIssueCategoryLabel, getIssueTypeLabel, getServiceOrderPriorityLabel, getServiceOrderStatusLabel, getServiceOrderTypeLabel, type TranslateFn } from './serviceOrderPresentation';
import type { ServiceOrderReportLike } from './serviceReport';

export type ServiceOrderLike = ServiceOrderReportLike;

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

export function buildServiceSummary(serviceOrder: ServiceOrderLike, t: TranslateFn = defaultTranslate) {
  const issues = serviceOrder.issues ?? [];
  const lastEvent = serviceOrder.timeline?.[serviceOrder.timeline.length - 1];
  const parts = [
    `${serviceOrder.title} es un servicio ${getServiceOrderTypeLabel(t, serviceOrder.type)} con prioridad ${getServiceOrderPriorityLabel(t, serviceOrder.priority)}.`,
    `Estado actual: ${getServiceOrderStatusLabel(t, serviceOrder.status)}.`,
    `Ventana programada: ${formatServiceDateTime(serviceOrder.scheduledStartAt)} a ${formatServiceDateTime(serviceOrder.scheduledEndAt)}.`
  ];

  if (serviceOrder.description) {
    parts.push(`Contexto reportado: ${serviceOrder.description}.`);
  }

  if (issues.length) {
    const issueList = issues
      .slice(0, 3)
      .map((issue) => `${getIssueTypeLabel(t, issue.type)} (${getIssueCategoryLabel(t, issue.category)})${issue.description ? `: ${issue.description}` : ''}`)
      .join('; ');
    parts.push(`Novedades detectadas: ${issueList}.`);
  } else {
    parts.push('No hay novedades registradas por ahora.');
  }

  if (lastEvent) {
    parts.push(`Último movimiento: ${lastEvent.summary} (${formatServiceDateTime(lastEvent.createdAt)}).`);
  }

  return parts.join(' ');
}

export function buildCustomerMessage(serviceOrder: ServiceOrderLike, t: TranslateFn = defaultTranslate) {
  const issues = serviceOrder.issues ?? [];
  const intro = `Hola, te comparto actualización del servicio ${serviceOrder.title}.`;
  const status = `Actualmente está en estado ${getServiceOrderStatusLabel(t, serviceOrder.status)} y fue programado para ${formatServiceDateTime(serviceOrder.scheduledStartAt)}.`;
  const issuesText = issues.length
    ? `Detectamos ${issues.length} novedad${issues.length > 1 ? 'es' : ''}: ${issues
        .slice(0, 2)
        .map((issue) => getIssueTypeLabel(t, issue.type).toLowerCase())
        .join(', ')}.`
    : 'Por ahora no tenemos novedades críticas registradas.';
  const close = 'Quedo atento para confirmar próximos pasos o resolver cualquier duda adicional.';
  return [intro, status, issuesText, close].join(' ');
}

export function buildFollowUp(serviceOrder: ServiceOrderLike, t: TranslateFn = defaultTranslate) {
  const issues = serviceOrder.issues ?? [];
  const photos = serviceOrder.completionPhotos?.length ?? 0;
  const actions = [] as string[];

  if (issues.length) actions.push(`validar el tratamiento de las novedades antes de dejar el servicio en ${getServiceOrderStatusLabel(t, serviceOrder.status).toLowerCase()}`);
  if (!photos) actions.push('pedir o cargar evidencia fotográfica');
  if (serviceOrder.status !== 'completed') actions.push('confirmar cierre técnico y actualización de estado');
  if (!actions.length) actions.push('compartir reporte final con el cliente');

  return actions.map((action, index) => `${index + 1}. ${action}`).join('\n');
}

