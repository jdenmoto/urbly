import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { updateDocById } from '@/lib/api/firestore';
import { recordAuditEvent } from '@/lib/audit';
import { createInternalNotification } from '@/lib/internalNotifications';
import { useAuth } from '@/app/Auth';
import Input from '@/components/Input';
import { uploadServiceAttachments } from './serviceAttachments';
import { analyzeReportQuality } from './reportQuality';
import Card from '@/components/Card';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useOperationalServiceOrders } from './useOperationalServiceOrders';
import { useI18n } from '@/lib/i18n';
import { buildCustomerMessage, buildFollowUp } from './serviceOrderAi';
import { buildTechnicalReport } from './serviceReport';
import { generateServiceReportPdf } from '@/lib/api/functions';
import { useToast } from '@/components/ToastProvider';
import CompleteServiceModal from '@/features/scheduling/CompleteServiceModal';
import {
  mapServiceOrderToCloseoutItem,
  resolveServiceIssueLabel,
  serviceIssueCategoryOptions,
  serviceIssueTypeOptions,
  useServiceCloseoutCompletion
} from './serviceCloseoutBridge';
import type { SchedulingItem } from '@/features/scheduling/schedulingItem';
import { getIssueCategoryLabel, getIssueTypeLabel, getServiceOrderStatusLabel } from './serviceOrderPresentation';

type ServiceCloseoutLocationState = {
  fromDetail?: boolean;
  fromPath?: string;
  serviceStatus?: string;
  closeoutActionLabel?: string;
};

function getBackToFlowLabel(fromPath?: string) {
  if (fromPath?.startsWith('/technician')) return 'Volver al panel técnico';
  if (fromPath?.startsWith('/services/')) return 'Volver al detalle';
  return 'Volver a servicios';
}

function getCloseoutHeadline(status: string) {
  if (status === 'completed') return 'Cierre técnico completado';
  if (status === 'in_progress') return 'Continúa el cierre técnico';
  return 'Ejecuta el cierre técnico';
}

function getCloseoutDescription(status: string) {
  if (status === 'completed') {
    return 'El servicio ya quedó completado. Desde aquí puedes revisar la evidencia, validar el reporte y continuar con el post-cierre.';
  }
  if (status === 'in_progress') {
    return 'Registra horas, checklist, fotos finales y novedades para cerrar el servicio sin volver al agendamiento legado.';
  }
  return 'Este es el paso operativo para completar el servicio dentro de services. Registra el cierre antes de pasar a revisión o reporte.';
}

function getCloseoutPrimaryAction(status: string, stateLabel?: string) {
  if (stateLabel) return stateLabel;
  if (status === 'completed') return 'Revisar cierre técnico';
  if (status === 'in_progress') return 'Continuar cierre técnico';
  return 'Ejecutar cierre técnico';
}

function getReportFlowHeadline(status: string) {
  if (status === 'completed') return 'Reporte final listo para revisar y compartir';
  if (status === 'in_progress') return 'Primero cierra el servicio, luego valida el reporte final';
  return 'El reporte final aparece al completar el cierre técnico';
}

function getReportFlowDescription(status: string) {
  if (status === 'completed') {
    return 'La vista imprimible y el PDF salen de este mismo cierre. Revisa el resumen técnico, la evidencia y luego genera la salida final.';
  }
  if (status === 'in_progress') {
    return 'Cuando completes el cierre aquí mismo, este módulo te deja revisar la narrativa final del servicio antes de imprimir o descargar el reporte.';
  }
  return 'Usa este cierre para registrar el trabajo y convertirlo después en un reporte técnico coherente con evidencia y novedades.';
}

function checklistValueLabel(value: string) {
  if (value === 'ok') return 'OK';
  if (value === 'regular') return 'Regular';
  if (value === 'malo') return 'Malo';
  if (value === 'na') return 'No aplica';
  return value;
}

function checklistKeyLabel(key: string) {
  return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function reviewStatusLabel(value?: string) {
  if (value === 'approved') return 'Aprobado';
  if (value === 'changes_requested') return 'Solicita cambios';
  return 'Pendiente de revisión';
}

function quoteStatusLabel(value: string) {
  if (value === 'draft') return 'Borrador';
  if (value === 'pending_internal_review') return 'Pendiente revisión interna';
  if (value === 'changes_requested') return 'Con observaciones';
  if (value === 'approved') return 'Aprobada';
  return value;
}

export default function ServiceCloseoutPage() {
  const { t } = useI18n();
  const { user, hasPermission, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { serviceOrderId = '' } = useParams();
  const { data: serviceOrders = [] } = useOperationalServiceOrders();
  const locationState = (location.state as ServiceCloseoutLocationState | null) ?? null;
  const [selected, setSelected] = useState<SchedulingItem | null>(null);

  const serviceOrder = useMemo(
    () => serviceOrders.find((item) => item.id === serviceOrderId) ?? null,
    [serviceOrderId, serviceOrders]
  );
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [quoteScope, setQuoteScope] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteFeedback, setQuoteFeedback] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const aiReport = serviceOrder ? buildTechnicalReport(serviceOrder, t) : '';
  const aiCustomerMessage = serviceOrder ? buildCustomerMessage(serviceOrder, t) : '';
  const aiFollowUp = serviceOrder ? buildFollowUp(serviceOrder, t) : '';
  const qualityAnalysis = serviceOrder ? analyzeReportQuality(serviceOrder) : null;
  const detailTarget = locationState?.fromPath ?? `/services/${serviceOrderId}`;
  const primaryActionLabel = getCloseoutPrimaryAction(serviceOrder?.status ?? 'draft', locationState?.closeoutActionLabel);
  const reportTarget = `/services/${serviceOrderId}/print`;
  const reportState = {
    fromCloseout: true,
    fromPath: `${location.pathname}${location.search}`,
    serviceStatus: serviceOrder?.status
  };
  const isTechnicianView = role === 'emergency_scheduler';

  const completion = useServiceCloseoutCompletion({
    t,
    toast,
    invalidateScheduling: () => queryClient.invalidateQueries({ queryKey: ['serviceOrders'] }),
    selected,
    setSelected
  });

  const openCompletionFlow = () => {
    if (!serviceOrder) return;
    const item = mapServiceOrderToCloseoutItem(serviceOrder);
    setSelected(item);
    completion.startComplete(item);
  };

  const resolveIssueLabel = (prefix: string, value: string) =>
    resolveServiceIssueLabel(t, prefix.endsWith('types') ? 'type' : 'category', value);

  const saveAttachments = async () => {
    if (!serviceOrder || !attachmentFiles.length) return;
    try {
      setAttachmentUploading(true);
      const uploaded = await uploadServiceAttachments(serviceOrder.id, attachmentFiles);
      await updateDocById('service_orders', serviceOrder.id, {
        attachments: [...(serviceOrder.attachments ?? []), ...uploaded]
      });
      await recordAuditEvent({
        entityType: 'service_order',
        entityId: serviceOrder.id,
        action: 'attachments_uploaded',
        summary: `Se cargaron ${uploaded.length} adjuntos al servicio`,
        actor: { uid: user?.uid ?? null, role: null },
        metadata: { uploadedCount: uploaded.length }
      });
      setAttachmentFiles([]);
    } finally {
      setAttachmentUploading(false);
    }
  };

  const saveQuoteVersion = async () => {
    if (!serviceOrder || !quoteScope.trim() || !quoteAmount) return;
    const current = serviceOrder.quoteVersions ?? [];
    const nextVersion = current.length + 1;
    await updateDocById('service_orders', serviceOrder.id, {
      quoteVersions: [
        ...current,
        {
          id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
          version: nextVersion,
          status: 'pending_internal_review',
          scope: quoteScope.trim(),
          amount: Number(quoteAmount),
          currency: 'COP',
          notes: quoteNotes.trim(),
          createdAt: new Date().toISOString(),
          createdBy: user?.uid ?? undefined
        }
      ]
    });
    await recordAuditEvent({
      entityType: 'service_order',
      entityId: serviceOrder.id,
      action: 'quote_version_created',
      summary: `Se creó la versión ${nextVersion} de cotización`,
      actor: { uid: user?.uid ?? null, role: null },
      metadata: { version: nextVersion, amount: Number(quoteAmount) }
    });
    setQuoteScope('');
    setQuoteAmount('');
    setQuoteNotes('');
  };

  const updateLatestQuoteReview = async (status: 'changes_requested' | 'approved') => {
    if (!serviceOrder || !serviceOrder.quoteVersions.length) return;
    const current = [...serviceOrder.quoteVersions];
    const latest = current[current.length - 1];
    current[current.length - 1] = {
      ...latest,
      status,
      reviewFeedback: quoteFeedback.trim(),
      reviewedAt: new Date().toISOString(),
      reviewedBy: user?.uid ?? undefined
    };
    await updateDocById('service_orders', serviceOrder.id, { quoteVersions: current });
    await recordAuditEvent({
      entityType: 'service_order',
      entityId: serviceOrder.id,
      action: 'quote_review_updated',
      summary: `Se marcó la cotización como ${status}`,
      actor: { uid: user?.uid ?? null, role: null },
      metadata: { status, feedback: quoteFeedback.trim() }
    });
  };

  const saveReview = async (status: 'changes_requested' | 'approved') => {
    if (!serviceOrder) return;
    try {
      setReviewSaving(true);
      await updateDocById('service_orders', serviceOrder.id, {
        review: {
          status,
          feedback: reviewFeedback.trim(),
          reviewerId: user?.uid ?? null,
          reviewedAt: new Date().toISOString()
        }
      });
      await recordAuditEvent({
        entityType: 'service_order',
        entityId: serviceOrder.id,
        action: 'report_review_updated',
        summary: `Se actualizó la revisión del reporte a ${status}`,
        actor: { uid: user?.uid ?? null, role: null },
        metadata: { status, feedback: reviewFeedback.trim() }
      });
      await createInternalNotification({
        userId: null,
        title: 'Revisión de reporte actualizada',
        message: `El servicio ${serviceOrder.title} quedó en estado ${status}.`,
        tone: status === 'approved' ? 'success' : 'warning'
      });
    } finally {
      setReviewSaving(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!serviceOrder) return;
    try {
      setPdfLoading(true);
      const response = await generateServiceReportPdf({ serviceOrderId: serviceOrder.id });
      const bytes = Uint8Array.from(atob(response.contentBase64), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.filename;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  };

  if (!serviceOrder) {
    return <EmptyState title={t('services.closeout.title')} description={t('services.closeout.empty')} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('services.closeout.title')}
        subtitle={t('services.closeout.subtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to={detailTarget}
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {getBackToFlowLabel(locationState?.fromPath)}
            </Link>
            {serviceOrder.status !== 'completed' ? (
              <Button onClick={openCompletionFlow}>{primaryActionLabel}</Button>
            ) : null}
          </div>
        }
      />

      <Card className="space-y-5 border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Flujo principal</p>
            <h2 className="mt-2 text-xl font-semibold text-emerald-950">{getCloseoutHeadline(serviceOrder.status)}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-900">{getCloseoutDescription(serviceOrder.status)}</p>
          </div>
          {serviceOrder.status !== 'completed' ? (
            <Button onClick={openCompletionFlow}>{primaryActionLabel}</Button>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-900">
              <p className="font-semibold">{getServiceOrderStatusLabel(t, serviceOrder.status)}</p>
              <p>Ahora puedes revisar reporte, evidencia y post-cierre.</p>
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Estado</p>
            <p className="mt-1 font-semibold text-emerald-950">{getServiceOrderStatusLabel(t, serviceOrder.status)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Evidencia final</p>
            <p className="mt-1 font-semibold text-emerald-950">{serviceOrder.completionPhotos.length} fotos</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Novedades</p>
            <p className="mt-1 font-semibold text-emerald-950">{serviceOrder.issues.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Checklist</p>
            <p className="mt-1 font-semibold text-emerald-950">{serviceOrder.report?.checklist ? Object.keys(serviceOrder.report.checklist).length : 0} ítems</p>
          </div>
        </div>
      </Card>

      {isTechnicianView ? (
        <Card className="space-y-4 border border-sky-200 bg-sky-50 p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Ruta corta</p>
              <h2 className="mt-2 text-lg font-semibold text-sky-950">Cierre sin ruido administrativo</h2>
              <p className="mt-2 text-sm leading-6 text-sky-900">
                Aquí ves solo el paso operativo, la evidencia y el acceso al entregable final cuando el servicio quede completado.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {serviceOrder.status !== 'completed' ? <Button onClick={openCompletionFlow}>{primaryActionLabel}</Button> : null}
              <Link
                to={reportTarget}
                state={reportState}
                className="inline-flex items-center rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
              >
                Abrir entregable
              </Link>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {t('services.closeout.badge')}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink-900">{serviceOrder.title}</h2>
              <p className="max-w-2xl text-sm leading-6 text-ink-600">{t('services.closeout.hint')}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-fog-200 bg-fog-50 px-4 py-3 text-sm text-ink-600">
            <p className="font-semibold text-ink-900">{getServiceOrderStatusLabel(t, serviceOrder.status)}</p>
            <p>{t('services.closeout.status.hint')}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Reporte y entregable</p>
              <h3 className="mt-2 text-lg font-semibold text-ink-900">{getReportFlowHeadline(serviceOrder.status)}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600">{getReportFlowDescription(serviceOrder.status)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => void handleDownloadReport()} disabled={pdfLoading || serviceOrder.status !== 'completed'}>
                {pdfLoading ? 'Generando PDF...' : 'Descargar PDF'}
              </Button>
              <Link
                to={reportTarget}
                state={reportState}
                className="inline-flex items-center rounded-full border border-fog-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-fog-50"
              >
                Abrir vista imprimible
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.35fr,0.95fr]">
          <div className="space-y-4 rounded-3xl border border-fog-200 bg-white p-5">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Resumen técnico listo para imprimir</h3>
              <p className="mt-1 text-sm text-ink-600">Esta es la misma narrativa base que verás en la vista imprimible dentro del flujo de services.</p>
            </div>
            <pre className="whitespace-pre-wrap rounded-2xl bg-fog-50 p-4 text-xs leading-6 text-ink-600">
              {aiReport}
            </pre>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Datos capturados del cierre</h4>
              <div className="mt-3 space-y-3 rounded-2xl bg-fog-50 p-4 text-xs leading-6 text-ink-700">
                <p><span className="font-semibold">Entrada:</span> {serviceOrder.report?.entryHour ?? 'No disponible'}</p>
                <p><span className="font-semibold">Salida:</span> {serviceOrder.report?.exitHour ?? 'No disponible'}</p>
                <p><span className="font-semibold">Observaciones:</span> {serviceOrder.report?.observations?.trim() || 'Sin observaciones.'}</p>
                <div>
                  <p className="font-semibold">Checklist</p>
                  {(serviceOrder.report?.checklist && Object.keys(serviceOrder.report.checklist).length) ? (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {Object.entries(serviceOrder.report.checklist).map(([key, value]) => (
                        <div key={key} className="rounded-xl border border-fog-200 bg-white px-3 py-2 text-xs">
                          <p className="font-medium text-ink-800">{checklistKeyLabel(key)}</p>
                          <p className="text-ink-600">{checklistValueLabel(String(value))}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-ink-600">Sin checklist registrado.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-3xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.evidence.title')}</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{t('services.evidence.count', { count: serviceOrder.completionPhotos.length })}</p>
            </div>
            <div className="rounded-3xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.issues.label')}</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{t('services.issues.count', { count: serviceOrder.issues.length })}</p>
            </div>
            <div className="rounded-3xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.timeline.label')}</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{t('services.timeline.count', { count: serviceOrder.timeline.length })}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-fog-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.issue.summary.title')}</h3>
            {serviceOrder.issues.length ? (
              <div className="mt-4 space-y-3">
                {serviceOrder.issues.map((issue) => (
                  <div key={issue.id} className="rounded-2xl bg-fog-50 p-4 text-sm text-ink-700">
                    <p className="font-semibold text-ink-900">{getIssueTypeLabel(t, issue.type)}</p>
                    <p className="text-xs text-ink-500">{getIssueCategoryLabel(t, issue.category)}</p>
                    {issue.description ? <p className="mt-2 leading-6 text-ink-600">{issue.description}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-600">{t('services.issue.summary.empty')}</p>
            )}
          </div>

          <div className="rounded-3xl border border-fog-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.communication.title')}</h3>
            <div className="mt-3 space-y-3 rounded-2xl bg-fog-50 p-4 text-sm leading-6 text-ink-700">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Mensaje cliente</p>
                <p>{serviceOrder.communication?.customerMessage?.trim() || 'Sin mensaje.'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Resumen interno</p>
                <p>{serviceOrder.communication?.internalSummary?.trim() || 'Sin resumen interno.'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Siguiente paso</p>
                <p>{serviceOrder.communication?.followUpSuggestion?.trim() || 'Sin recomendación.'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {!isTechnicianView ? (
        <>
          <div className="rounded-3xl border border-fog-200 bg-white p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Revisión del reporte</h3>
              <p className="mt-1 text-sm text-ink-600">Estado actual: {reviewStatusLabel(serviceOrder.review?.status)}</p>
              {serviceOrder.review?.reviewedAt ? <p className="text-xs text-ink-500">Última revisión: {serviceOrder.review.reviewedAt}</p> : null}
            </div>
            <Input label="Feedback de revisión" value={reviewFeedback} onChange={(event) => setReviewFeedback(event.target.value)} />
            {hasPermission('review_reports') ? (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => void saveReview('changes_requested')} disabled={reviewSaving}>Solicitar cambios</Button>
                <Button onClick={() => void saveReview('approved')} disabled={reviewSaving}>Aprobar reporte</Button>
              </div>
            ) : null}
            {serviceOrder.review?.feedback ? (
              <div className="rounded-2xl bg-fog-50 p-4 text-sm text-ink-700">
                <p className="font-semibold text-ink-900">Último feedback</p>
                <p className="mt-2 whitespace-pre-wrap">{serviceOrder.review.feedback}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-fog-200 bg-white p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Cotización versionada</h3>
              <p className="mt-1 text-sm text-ink-600">Versiones internas para revisar antes de compartir con cliente.</p>
            </div>
            <Input label="Alcance" value={quoteScope} onChange={(event) => setQuoteScope(event.target.value)} />
            <Input label="Monto" type="number" value={quoteAmount} onChange={(event) => setQuoteAmount(event.target.value)} />
            <Input label="Notas" value={quoteNotes} onChange={(event) => setQuoteNotes(event.target.value)} />
            <Button onClick={() => void saveQuoteVersion()}>Crear nueva versión</Button>
            <div className="space-y-3">
              {(serviceOrder.quoteVersions ?? []).length ? (serviceOrder.quoteVersions ?? []).slice().reverse().map((quote) => (
                <div key={quote.id} className="rounded-2xl border border-fog-200 p-4">
                  <div className="flex flex-wrap gap-2 text-xs text-ink-500">
                    <span>v{quote.version}</span>
                    <span>{quoteStatusLabel(quote.status)}</span>
                    <span>{quote.amount} {quote.currency}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink-900">{quote.scope}</p>
                  {quote.notes ? <p className="mt-1 text-sm text-ink-600">{quote.notes}</p> : null}
                  {quote.reviewFeedback ? <p className="mt-2 text-sm text-amber-700">Feedback: {quote.reviewFeedback}</p> : null}
                </div>
              )) : <p className="text-sm text-ink-500">Sin versiones de cotización todavía.</p>}
            </div>
            {hasPermission('approve_quotations_internal') ? (
              <div className="space-y-3">
                <Input label="Feedback interno" value={quoteFeedback} onChange={(event) => setQuoteFeedback(event.target.value)} />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => void updateLatestQuoteReview('changes_requested')}>Devolver cotización</Button>
                  <Button onClick={() => void updateLatestQuoteReview('approved')}>Aprobar cotización</Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-fog-200 bg-white p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Documentos y adjuntos</h3>
              <p className="mt-1 text-sm text-ink-600">Carga base de archivos asociados al servicio.</p>
            </div>
            <input type="file" multiple onChange={(event) => setAttachmentFiles(Array.from(event.target.files ?? []))} />
            <Button onClick={() => void saveAttachments()} disabled={attachmentUploading || !attachmentFiles.length}>
              {attachmentUploading ? 'Subiendo...' : 'Subir adjuntos'}
            </Button>
            {(serviceOrder.attachments ?? []).length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(serviceOrder.attachments ?? []).map((url, index) => (
                  <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-fog-200 bg-fog-50">
                    <img src={url} alt={`Adjunto ${index + 1}`} className="h-24 w-full object-cover" loading="lazy" />
                    <span className="block px-2 py-1 text-xs text-sky-700">Adjunto {index + 1}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-500">Sin adjuntos todavía.</p>
            )}
          </div>

          <Card className="space-y-6 p-6">
            <div>
              <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Calidad IA</div>
              <h2 className="mt-3 text-xl font-semibold text-ink-900">Calidad del reporte y hallazgos críticos</h2>
              <p className="text-sm leading-6 text-ink-600">Evaluación base para detectar faltantes y riesgos en el cierre técnico.</p>
            </div>

            <div className="rounded-3xl border border-fog-200 bg-white p-5">
              <p className="text-sm font-semibold text-ink-900">Score de calidad</p>
              <p className="mt-2 text-3xl font-bold text-ink-900">{qualityAnalysis?.score ?? 0}/100</p>
            </div>

            <div className="space-y-3">
              {qualityAnalysis?.findings.map((finding, index) => (
                <div key={`${finding.message}-${index}`} className="rounded-2xl border border-fog-200 bg-fog-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{finding.severity}</p>
                  <p className="mt-2 text-sm text-ink-800">{finding.message}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-6 p-6">
            <div>
              <div className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                {t('services.ai.closeout.badge')}
              </div>
              <h2 className="mt-3 text-xl font-semibold text-ink-900">{t('services.ai.closeout.title')}</h2>
              <p className="text-sm leading-6 text-ink-600">{t('services.ai.closeout.subtitle')}</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-3xl border border-fog-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-ink-900">{t('services.ai.report.title')}</h3>
                <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-ink-600">{aiReport}</pre>
              </div>
              <div className="rounded-3xl border border-fog-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-ink-900">{t('services.ai.customer.message.title')}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-600">{aiCustomerMessage}</p>
              </div>
              <div className="rounded-3xl border border-fog-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-ink-900">{t('services.ai.follow.up.title')}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-600">{aiFollowUp}</p>
              </div>
            </div>
          </Card>
        </>
      ) : null}

      <CompleteServiceModal
        open={Boolean(completion.completeTarget)}
        onClose={() => completion.setCompleteTarget(null)}
        completionReport={completion.completionReport}
        getTimeParts={completion.getTimeParts}
        setReportTimePart={completion.setReportTimePart}
        groupPanelsOpen={completion.groupPanelsOpen}
        setGroupPanelsOpen={completion.setGroupPanelsOpen}
        group1Units={completion.group1Units}
        setGroup1Units={completion.setGroup1Units}
        bombaPanelsOpen={completion.bombaPanelsOpen}
        setBombaPanelsOpen={completion.setBombaPanelsOpen}
        completionChecklistGroup1={completion.completionChecklistGroup1}
        completionChecklistGroups={completion.completionChecklistGroups}
        formatChecklistLabel={completion.formatChecklistLabel}
        setCompletionReport={completion.setCompletionReport}
        makeGroup1Key={completion.makeGroup1Key}
        makeGroup1RedKey={completion.makeGroup1RedKey}
        timeHourOptions={completion.timeHourOptions}
        timeMinuteOptions={completion.timeMinuteOptions}
        completionPhotos={completion.completionPhotos}
        setCompletionPhotos={completion.setCompletionPhotos}
        hasIssues={completion.hasIssues}
        setHasIssues={completion.setHasIssues}
        issueError={completion.issueError}
        setIssueError={completion.setIssueError}
        issueDraft={completion.issueDraft}
        setIssueDraft={completion.setIssueDraft}
        dynamicIssueTypes={serviceIssueTypeOptions}
        dynamicIssueCategories={serviceIssueCategoryOptions}
        resolveIssueLabel={resolveIssueLabel}
        addIssue={completion.addIssue}
        issues={completion.issues}
        removeIssue={completion.removeIssue}
        completeSubmitting={completion.completeSubmitting}
        completeService={() => void completion.completeService()}
      />
    </div>
  );
}
