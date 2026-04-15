import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import { buildCustomerMessage, buildFollowUp, buildTechnicalReport } from './serviceOrderAi';

export default function ServiceCloseoutPage() {
  const { t } = useI18n();
  const { serviceOrderId = '' } = useParams();
  const { data: serviceOrders = [] } = useServiceOrders();

  const serviceOrder = useMemo(
    () => serviceOrders.find((item) => item.id === serviceOrderId) ?? null,
    [serviceOrderId, serviceOrders]
  );
  const aiReport = serviceOrder ? buildTechnicalReport(serviceOrder) : '';
  const aiCustomerMessage = serviceOrder ? buildCustomerMessage(serviceOrder) : '';
  const aiFollowUp = serviceOrder ? buildFollowUp(serviceOrder) : '';

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
              Cierre operativo
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink-900">{serviceOrder.title}</h2>
              <p className="max-w-2xl text-sm leading-6 text-ink-600">{t('services.closeoutHint')}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-fog-200 bg-fog-50 px-4 py-3 text-sm text-ink-600">
            <p className="font-semibold text-ink-900">{serviceOrder.status}</p>
            <p>estado actual para cierre y reporte</p>
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
              <p className="text-xs uppercase tracking-wide text-ink-500">Novedades</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{t('services.issuesCount', { count: serviceOrder.issues?.length ?? 0 })}</p>
            </div>
            <div className="rounded-3xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">Timeline</p>
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
                    <p className="font-semibold text-ink-900">{issue.type}</p>
                    <p className="text-xs text-ink-500">{issue.category}</p>
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

      <Card className="space-y-6 p-6">
        <div>
          <div className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            IA para cierre
          </div>
          <h2 className="mt-3 text-xl font-semibold text-ink-900">Acciones listas para enviar o ajustar</h2>
          <p className="text-sm leading-6 text-ink-600">
            Este bloque resume el servicio, sugiere reporte y deja listo el siguiente paso con mejor legibilidad.
          </p>
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
