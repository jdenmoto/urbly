import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import { buildPrintableServiceReportModel } from './serviceReport';
import { useOperationalServiceOrders } from './useOperationalServiceOrders';
import { useI18n } from '@/lib/i18n';

function getReportFlowTitle(status: string, t: (key: string, params?: Record<string, string | number>) => string) {
  if (status === 'completed') return t('services.print.flow.title.completed');
  if (status === 'in_progress') return t('services.print.flow.title.in.progress');
  return t('services.print.flow.title.default');
}

function getReportFlowHint(status: string, t: (key: string, params?: Record<string, string | number>) => string) {
  if (status === 'completed') return t('services.print.flow.hint.completed');
  if (status === 'in_progress') return t('services.print.flow.hint.in.progress');
  return t('services.print.flow.hint.default');
}

function formatDateTime(value: string | null | undefined, t: (key: string, params?: Record<string, string | number>) => string) {
  if (!value) return t('common.not.available');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

type ServiceReportPrintLocationState = {
  fromPath?: string;
  fromDetail?: boolean;
  fromCloseout?: boolean;
  serviceStatus?: string;
};

function getBackToFlowLabel(locationState: ServiceReportPrintLocationState | null, t: (key: string, params?: Record<string, string | number>) => string) {
  if (locationState?.fromPath?.startsWith('/technician')) return t('services.print.back.technician');
  if (locationState?.fromCloseout) return t('services.print.back.closeout');
  if (locationState?.fromDetail) return t('services.print.back.detail');
  return t('services.print.back.default');
}

export default function ServiceReportPrintPage() {
  const { t } = useI18n();
  const location = useLocation();
  const { serviceOrderId = '' } = useParams();
  const { data: serviceOrders = [] } = useOperationalServiceOrders();
  const serviceOrder = useMemo(() => serviceOrders.find((item) => item.id === serviceOrderId) ?? null, [serviceOrders, serviceOrderId]);
  const locationState = (location.state as ServiceReportPrintLocationState | null) ?? null;

  if (!serviceOrder) {
    return <EmptyState title={t('services.print.empty.title')} description={t('services.print.empty.description')} />;
  }

  const printableReport = buildPrintableServiceReportModel(serviceOrder, t);

  const backTarget = locationState?.fromPath ?? `/services/${serviceOrder.id}/closeout`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 bg-white p-8 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">{getReportFlowTitle(serviceOrder.status, t)}</h1>
          <p className="text-sm text-slate-600">{getReportFlowHint(serviceOrder.status, t)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={backTarget}
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {getBackToFlowLabel(locationState, t)}
          </Link>
          <Button onClick={() => window.print()}>{t('services.print.actions.print')}</Button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{printableReport.summary.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('services.print.summary.status')}: {printableReport.summary.statusLabel}</p>
            <p className="text-sm text-slate-600">{t('services.print.summary.window')}: {formatDateTime(printableReport.summary.scheduledStartAt, t)} → {formatDateTime(printableReport.summary.scheduledEndAt, t)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">{t('services.print.flow.block.title')}</p>
            <p>
              {locationState?.fromCloseout
                ? t('services.print.flow.block.from.closeout')
                : locationState?.fromDetail
                  ? t('services.print.flow.block.from.detail')
                  : t('services.print.flow.block.default')}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('services.print.metrics.evidence.title')}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{printableReport.summary.photoCount}</p>
          <p className="text-sm text-slate-600">{t('services.print.metrics.evidence.hint')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('services.print.metrics.issues.title')}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{printableReport.summary.issueCount}</p>
          <p className="text-sm text-slate-600">{t('services.print.metrics.issues.hint')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('services.print.metrics.attachments.title')}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{printableReport.summary.attachmentCount}</p>
          <p className="text-sm text-slate-600">{t('services.print.metrics.attachments.hint')}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold">{t('services.print.report.title')}</h2>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-800">{printableReport.reportText}</pre>
      </section>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold">{t('services.print.attachments.section.title')}</h2>
        {(printableReport.attachments.length || printableReport.photos.length) ? (
          <div className="mt-4 space-y-5">
            {printableReport.photos.length ? (
              <div>
                <p className="text-sm font-semibold text-slate-800">{t('services.print.attachments.photos.title')}</p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {printableReport.photos.map((url, index) => (
                    <a key={`photo-${index}`} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200">
                      <img src={url} alt={t('services.print.attachments.photos.alt', { index: index + 1 })} className="h-24 w-full object-cover" loading="lazy" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {printableReport.attachments.length ? (
              <div>
                <p className="text-sm font-semibold text-slate-800">{t('services.print.attachments.list.title')}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {printableReport.attachments.map((url, index) => (
                    <li key={`attachment-${index}`}>
                      <a href={url} target="_blank" rel="noreferrer" className="underline">{t('services.print.attachments.list.item', { index: index + 1 })}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">{t('services.print.attachments.empty')}</p>
        )}
      </section>
    </div>
  );
}
