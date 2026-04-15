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
    <div className="space-y-6">
      <PageHeader title={t('services.closeoutTitle')} subtitle={t('services.closeoutSubtitle')} />

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{serviceOrder.title}</h2>
          <p className="text-sm text-ink-600">{t('services.closeoutHint')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-fog-200 p-4">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.reportTitle')}</h3>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-ink-600">{JSON.stringify(serviceOrder.report ?? {}, null, 2)}</pre>
          </div>
          <div className="rounded-xl border border-fog-200 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.evidenceTitle')}</h3>
            <p className="text-sm text-ink-600">{t('services.evidenceCount', { count: serviceOrder.completionPhotos?.length ?? 0 })}</p>
            <p className="text-sm text-ink-600">{t('services.issuesCount', { count: serviceOrder.issues?.length ?? 0 })}</p>
            <p className="text-sm text-ink-600">{t('services.timelineCount', { count: serviceOrder.timeline?.length ?? 0 })}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-fog-200 p-4">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.issueSummaryTitle')}</h3>
            {serviceOrder.issues?.length ? (
              <div className="mt-3 space-y-2">
                {serviceOrder.issues.map((issue) => (
                  <div key={issue.id} className="rounded-lg bg-fog-50 p-3 text-sm text-ink-700">
                    <p className="font-semibold text-ink-900">{issue.type}</p>
                    <p>{issue.category}</p>
                    {issue.description ? <p className="mt-1 text-ink-600">{issue.description}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-600">{t('services.issueSummaryEmpty')}</p>
            )}
          </div>
          <div className="rounded-xl border border-fog-200 p-4">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.communicationTitle')}</h3>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-ink-600">{JSON.stringify(serviceOrder.communication ?? {}, null, 2)}</pre>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-fog-200 p-4">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.aiReportTitle')}</h3>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-ink-600">{aiReport}</pre>
          </div>
          <div className="rounded-xl border border-fog-200 p-4">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.aiCustomerMessageTitle')}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-600">{aiCustomerMessage}</p>
          </div>
          <div className="rounded-xl border border-fog-200 p-4">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.aiFollowUpTitle')}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-600">{aiFollowUp}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
