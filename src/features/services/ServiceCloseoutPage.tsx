import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';

export default function ServiceCloseoutPage() {
  const { t } = useI18n();
  const { serviceOrderId = '' } = useParams();
  const { data: serviceOrders = [] } = useServiceOrders();

  const serviceOrder = useMemo(
    () => serviceOrders.find((item) => item.id === serviceOrderId) ?? null,
    [serviceOrderId, serviceOrders]
  );

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
          <div className="rounded-xl border border-fog-200 p-4">
            <h3 className="text-sm font-semibold text-ink-900">{t('services.evidenceTitle')}</h3>
            <p className="mt-2 text-sm text-ink-600">{t('services.evidenceCount', { count: serviceOrder.completionPhotos?.length ?? 0 })}</p>
            <p className="mt-2 text-sm text-ink-600">{t('services.issuesCount', { count: serviceOrder.issues?.length ?? 0 })}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
