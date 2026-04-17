import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { updateDocById } from '@/lib/api/firestore';
import { recordAuditEvent } from '@/lib/audit';
import { useAuth } from '@/app/Auth';
import Input from '@/components/Input';
import { uploadServiceAttachments } from './serviceAttachments';
import { useParams } from 'react-router-dom';
import Card from '@/components/Card';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import { buildCustomerMessage, buildFollowUp, buildTechnicalReport } from './serviceOrderAi';
import { generateServiceReportPdf } from '@/lib/api/functions';
import {
  getIssueCategoryLabel,
  getIssueTypeLabel,
  getServiceOrderStatusLabel
} from './serviceOrderPresentation';

export default function ServiceCloseoutPage() {
  const { t } = useI18n();
  const { user, hasPermission } = useAuth();
  const { serviceOrderId = '' } = useParams();
  const { data: serviceOrders = [] } = useServiceOrders();

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
    if (!serviceOrder?.quoteVersions?.length) return;
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
    return <EmptyState title={t('services.closeoutTitle')} description={t('services.closeoutEmpty')} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader title={t('services.closeoutTitle')} subtitle={t('services.closeoutSubtitle')} />

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {t('services.closeoutBadge')}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink-900">{serviceOrder.title}</h2>
              <p className="max-w-2xl text-sm leading-6 text-ink-600">{t('services.closeoutHint')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => void handleDownloadReport()} disabled={pdfLoading}>
              {pdfLoading ? 'Generando PDF...' : 'Descargar reporte técnico'}
            </Button>
            <Link to={`/services/${serviceOrder.id}/print`} className="inline-flex items-center rounded-full border border-fog-200 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-fog-50">
              Vista imprimible
            </Link>
            <div className="rounded-2xl border border-fog-200 bg-fog-50 px-4 py-3 text-sm text-ink-600">
              <p className="font-semibold text-ink-900">{getServiceOrderStatusLabel(t, serviceOrder.status)}</p>
              <p>{t('services.closeoutStatusHint')}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.35fr,0.95fr]">
          <div className="rounded-3xl border border-fog-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.reportTitle')}</h3>
            <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-fog-50 p-4 text-xs leading-6 text-ink-600">
              {JSON.stringify(serviceOrder.report ?? {}, null, 2)}
            </pre>
          </div>

          <div className="space-y-3">
            <div className="rounded-3xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.evidenceTitle')}</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{t('services.evidenceCount', { count: serviceOrder.completionPhotos?.length ?? 0 })}</p>
            </div>
            <div className="rounded-3xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.issuesLabel')}</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{t('services.issuesCount', { count: serviceOrder.issues?.length ?? 0 })}</p>
            </div>
            <div className="rounded-3xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.timelineLabel')}</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{t('services.timelineCount', { count: serviceOrder.timeline?.length ?? 0 })}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-fog-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.issueSummaryTitle')}</h3>
            {serviceOrder.issues?.length ? (
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
              <p className="mt-3 text-sm text-ink-600">{t('services.issueSummaryEmpty')}</p>
            )}
          </div>

          <div className="rounded-3xl border border-fog-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.communicationTitle')}</h3>
            <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-fog-50 p-4 text-xs leading-6 text-ink-600">
              {JSON.stringify(serviceOrder.communication ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      </Card>


        <div className="rounded-3xl border border-fog-200 bg-white p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Revisión del reporte</h3>
            <p className="mt-1 text-sm text-ink-600">Estado actual: {serviceOrder.review?.status ?? 'pending_review'}</p>
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
                  <span>{quote.status}</span>
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
            <div className="space-y-2">
              {(serviceOrder.attachments ?? []).map((url, index) => (
                <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block text-sm text-sky-700 underline">
                  Adjunto {index + 1}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-500">Sin adjuntos todavía.</p>
          )}
        </div>

      <Card className="space-y-6 p-6">
        <div>
          <div className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            {t('services.aiCloseoutBadge')}
          </div>
          <h2 className="mt-3 text-xl font-semibold text-ink-900">{t('services.aiCloseoutTitle')}</h2>
          <p className="text-sm leading-6 text-ink-600">{t('services.aiCloseoutSubtitle')}</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-fog-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.aiReportTitle')}</h3>
            <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-ink-600">{aiReport}</pre>
          </div>
          <div className="rounded-3xl border border-fog-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.aiCustomerMessageTitle')}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-600">{aiCustomerMessage}</p>
          </div>
          <div className="rounded-3xl border border-fog-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.aiFollowUpTitle')}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-600">{aiFollowUp}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
