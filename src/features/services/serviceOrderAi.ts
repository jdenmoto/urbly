type Issue = { type: string; category: string; description?: string };
type TimelineEvent = { summary: string; createdAt: string };
type ServiceOrderLike = {
  title: string;
  status: string;
  priority: string;
  type: string;
  description?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  issues?: Issue[];
  timeline?: TimelineEvent[];
  completionPhotos?: string[];
};

export function buildServiceSummary(serviceOrder: ServiceOrderLike) {
  const issues = serviceOrder.issues ?? [];
  const lastEvent = serviceOrder.timeline?.[serviceOrder.timeline.length - 1];
  const parts = [
    `${serviceOrder.title} es un servicio ${serviceOrder.type} con prioridad ${serviceOrder.priority}.`,
    `Estado actual: ${serviceOrder.status}.`,
    `Ventana programada: ${new Date(serviceOrder.scheduledStartAt).toLocaleString('es-CO')} a ${new Date(serviceOrder.scheduledEndAt).toLocaleString('es-CO')}.`
  ];

  if (serviceOrder.description) {
    parts.push(`Contexto reportado: ${serviceOrder.description}.`);
  }

  if (issues.length) {
    const issueList = issues
      .slice(0, 3)
      .map((issue) => `${issue.type} (${issue.category})${issue.description ? `: ${issue.description}` : ''}`)
      .join('; ');
    parts.push(`Novedades detectadas: ${issueList}.`);
  } else {
    parts.push('No hay novedades registradas hasta ahora.');
  }

  if (lastEvent) {
    parts.push(`Último movimiento: ${lastEvent.summary} (${new Date(lastEvent.createdAt).toLocaleString('es-CO')}).`);
  }

  return parts.join(' ');
}

export function buildCustomerMessage(serviceOrder: ServiceOrderLike) {
  const issues = serviceOrder.issues ?? [];
  const intro = `Hola, te comparto actualización del servicio ${serviceOrder.title}.`;
  const status = `Actualmente está en estado ${serviceOrder.status} y fue programado para ${new Date(serviceOrder.scheduledStartAt).toLocaleString('es-CO')}.`;
  const issuesText = issues.length
    ? `Detectamos ${issues.length} novedad${issues.length > 1 ? 'es' : ''}: ${issues
        .slice(0, 2)
        .map((issue) => issue.type.toLowerCase())
        .join(', ')}.`
    : 'Por ahora no tenemos novedades críticas registradas.';
  const close = 'Quedo atento para confirmar próximos pasos o resolver cualquier duda.';
  return [intro, status, issuesText, close].join(' ');
}

export function buildFollowUp(serviceOrder: ServiceOrderLike) {
  const issues = serviceOrder.issues ?? [];
  const photos = serviceOrder.completionPhotos?.length ?? 0;
  const actions = [] as string[];

  if (issues.length) actions.push('validar tratamiento de novedades antes de cerrar');
  if (!photos) actions.push('pedir o cargar evidencia fotográfica');
  if (serviceOrder.status !== 'completed') actions.push('confirmar cierre técnico y actualización de estado');
  if (!actions.length) actions.push('compartir reporte final con el cliente');

  return actions.map((action, index) => `${index + 1}. ${action}`).join('\n');
}

export function buildTechnicalReport(serviceOrder: ServiceOrderLike) {
  const issues = serviceOrder.issues ?? [];
  const timelineCount = serviceOrder.timeline?.length ?? 0;
  const photos = serviceOrder.completionPhotos?.length ?? 0;

  return [
    `Servicio: ${serviceOrder.title}`,
    `Tipo: ${serviceOrder.type}`,
    `Estado: ${serviceOrder.status}`,
    `Prioridad: ${serviceOrder.priority}`,
    `Inicio programado: ${new Date(serviceOrder.scheduledStartAt).toLocaleString('es-CO')}`,
    `Fin programado: ${new Date(serviceOrder.scheduledEndAt).toLocaleString('es-CO')}`,
    `Novedades registradas: ${issues.length}`,
    `Eventos de timeline: ${timelineCount}`,
    `Evidencias fotográficas: ${photos}`,
    issues.length
      ? `Detalle de novedades: ${issues.map((issue) => `${issue.type}/${issue.category}`).join(', ')}`
      : 'Detalle de novedades: sin novedades registradas'
  ].join('\n');
}
