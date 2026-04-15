import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useList, useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';

export default function ServiceDetailPage() {
  const { t } = useI18n();
  const { serviceOrderId = '' } = useParams();
  const { data: serviceOrders = [] } = useServiceOrders();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');

  const serviceOrder = useMemo(
    () => serviceOrders.find((item) => item.id === serviceOrderId) ?? null,
    [serviceOrderId, serviceOrders]
  );

  const building = buildings.find((item) => item.id === serviceOrder?.buildingId);
  const technician = employees.find((item) => item.id === serviceOrder?.assignedTechnicianId);

  if (!serviceOrder) {
    return <EmptyState title={t('services.detailTitle')} description={t('services.detailEmpty')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={serviceOrder.title} subtitle={t('services.detailSubtitle')} />

      <div className="grid gap-4 xl:grid-cols-[1.5fr,1fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{t('services.contextTitle')}</h2>
            <p className="text-sm text-ink-600">{t('services.contextSubtitle')}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 text-sm text-ink-700">
            <p><span className="font-semibold text-ink-900">{t('services.buildingLabel')}:</span> {building?.name ?? t('common.noData')}</p>
            <p><span className="font-semibold text-ink-900">{t('services.technicianLabel')}:</span> {technician?.fullName ?? t('common.unassigned')}</p>
            <p><span className="font-semibold text-ink-900">{t('services.statusLabel')}:</span> {serviceOrder.status}</p>
            <p><span className="font-semibold text-ink-900">{t('services.priorityLabel')}:</span> {serviceOrder.priority}</p>
            <p><span className="font-semibold text-ink-900">{t('services.startLabel')}:</span> {new Date(serviceOrder.scheduledStartAt).toLocaleString('es-CO')}</p>
            <p><span className="font-semibold text-ink-900">{t('services.endLabel')}:</span> {new Date(serviceOrder.scheduledEndAt).toLocaleString('es-CO')}</p>
          </div>
          {serviceOrder.description ? (
            <div>
              <h3 className="text-sm font-semibold text-ink-900">{t('services.descriptionLabel')}</h3>
              <p className="mt-1 text-sm text-ink-600">{serviceOrder.description}</p>
            </div>
          ) : null}
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{t('services.timelineTitle')}</h2>
            <p className="text-sm text-ink-600">{t('services.timelineSubtitle')}</p>
          </div>
          {serviceOrder.timeline?.length ? (
            <div className="space-y-3">
              {serviceOrder.timeline.map((event) => (
                <div key={event.id} className="rounded-xl border border-fog-200 p-3">
                  <p className="text-sm font-semibold text-ink-900">{event.summary}</p>
                  <p className="text-xs text-ink-500">{new Date(event.createdAt).toLocaleString('es-CO')}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t('services.timelineTitle')} description={t('services.timelineEmpty')} />
          )}
        </Card>
      </div>
    </div>
  );
}
