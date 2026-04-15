import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useList, useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import type { ManagementCompany } from '@/core/models/managementCompany';
import { buildCustomerMessage, buildFollowUp, buildServiceSummary } from './serviceOrderAi';

const statusTone: Record<string, string> = {
  draft: 'bg-fog-100 text-ink-700',
  scheduled: 'bg-sky-50 text-sky-700',
  confirmed: 'bg-indigo-50 text-indigo-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700'
};

const priorityTone: Record<string, string> = {
  urgent: 'bg-rose-50 text-rose-700',
  high: 'bg-amber-50 text-amber-700',
  medium: 'bg-sky-50 text-sky-700',
  low: 'bg-emerald-50 text-emerald-700'
};

export default function ServiceDetailPage() {
  const { t } = useI18n();
  const { serviceOrderId = '' } = useParams();
  const { data: serviceOrders = [] } = useServiceOrders();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');

  const serviceOrder = useMemo(
    () => serviceOrders.find((item) => item.id === serviceOrderId) ?? null,
    [serviceOrderId, serviceOrders]
  );

  const building = buildings.find((item) => item.id === serviceOrder?.buildingId);
  const technician = employees.find((item) => item.id === serviceOrder?.assignedTechnicianId);
  const management = managements.find((item) => item.id === building?.managementCompanyId);
  const aiSummary = serviceOrder ? buildServiceSummary(serviceOrder) : '';
  const aiCustomerMessage = serviceOrder ? buildCustomerMessage(serviceOrder) : '';
  const aiFollowUp = serviceOrder ? buildFollowUp(serviceOrder) : '';

  if (!serviceOrder) {
    return <EmptyState title={t('services.detailTitle')} description={t('services.detailEmpty')} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader title={serviceOrder.title} subtitle={t('services.detailSubtitle')} />

      <div className="grid gap-4 xl:grid-cols-[1.45fr,1fr]">
        <Card className="space-y-6 p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[serviceOrder.status] ?? statusTone.draft}`}>
                  {serviceOrder.status}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone[serviceOrder.priority] ?? priorityTone.medium}`}>
                  {t('services.priorityPill', { value: serviceOrder.priority })}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink-900">{t('services.contextTitle')}</h2>
                <p className="max-w-2xl text-sm leading-6 text-ink-600">{t('services.contextSubtitle')}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-fog-200 bg-fog-50 px-4 py-3 text-sm text-ink-600">
              <p className="font-semibold text-ink-900">{serviceOrder.type}</p>
              <p>{t('services.activeTypeHint')}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm text-ink-700">
            <div className="rounded-2xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.buildingLabel')}</p>
              <p className="mt-1 font-semibold text-ink-900">{building?.name ?? t('common.noData')}</p>
            </div>
            <div className="rounded-2xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.customerLabel')}</p>
              <p className="mt-1 font-semibold text-ink-900">{management?.name ?? t('common.noData')}</p>
            </div>
            <div className="rounded-2xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.technicianLabel')}</p>
              <p className="mt-1 font-semibold text-ink-900">{technician?.fullName ?? t('common.unassigned')}</p>
            </div>
            <div className="rounded-2xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.startLabel')}</p>
              <p className="mt-1 font-semibold text-ink-900">{new Date(serviceOrder.scheduledStartAt).toLocaleString('es-CO')}</p>
            </div>
            <div className="rounded-2xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.endLabel')}</p>
              <p className="mt-1 font-semibold text-ink-900">{new Date(serviceOrder.scheduledEndAt).toLocaleString('es-CO')}</p>
            </div>
            <div className="rounded-2xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.issuesLabel')}</p>
              <p className="mt-1 font-semibold text-ink-900">{serviceOrder.issues?.length ?? 0}</p>
            </div>
          </div>

          {serviceOrder.description ? (
            <div className="rounded-2xl border border-fog-200 p-4">
              <h3 className="text-sm font-semibold text-ink-900">{t('services.descriptionLabel')}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-600">{serviceOrder.description}</p>
            </div>
          ) : null}
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4 p-6">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">{t('services.timelineTitle')}</h2>
              <p className="text-sm text-ink-600">{t('services.timelineSubtitle')}</p>
            </div>
            {serviceOrder.timeline?.length ? (
              <div className="space-y-3">
                {serviceOrder.timeline.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-fog-200 bg-fog-50 p-4">
                    <p className="text-sm font-semibold text-ink-900">{event.summary}</p>
                    <p className="mt-1 text-xs text-ink-500">{new Date(event.createdAt).toLocaleString('es-CO')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={t('services.timelineTitle')} description={t('services.timelineEmpty')} />
            )}
          </Card>

          <Card className="space-y-4 p-6">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">{t('services.issueSummaryTitle')}</h2>
              <p className="text-sm text-ink-600">{t('services.issueSummarySubtitle')}</p>
            </div>
            {serviceOrder.issues?.length ? (
              <div className="space-y-3">
                {serviceOrder.issues.map((issue) => (
                  <div key={issue.id} className="rounded-2xl border border-fog-200 bg-fog-50 p-4">
                    <p className="text-sm font-semibold text-ink-900">{issue.type}</p>
                    <p className="text-xs text-ink-500">{issue.category}</p>
                    {issue.description ? <p className="mt-2 text-sm leading-6 text-ink-600">{issue.description}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={t('services.issueSummaryTitle')} description={t('services.issueSummaryEmpty')} />
            )}
          </Card>
        </div>
      </div>

      <Card className="space-y-6 p-6">
        <div>
          <div className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            {t('services.aiBadge')}
          </div>
          <h2 className="mt-3 text-xl font-semibold text-ink-900">{t('services.aiActionsTitle')}</h2>
          <p className="text-sm leading-6 text-ink-600">{t('services.aiActionsSubtitle')}</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-3 text-sm text-ink-700">
          <div className="rounded-3xl border border-fog-200 bg-white p-5">
            <p className="font-semibold text-ink-900">{t('services.aiSummaryTitle')}</p>
            <p className="mt-3 whitespace-pre-wrap leading-6">{aiSummary}</p>
          </div>
          <div className="rounded-3xl border border-fog-200 bg-white p-5">
            <p className="font-semibold text-ink-900">{t('services.aiCustomerMessageTitle')}</p>
            <p className="mt-3 whitespace-pre-wrap leading-6">{aiCustomerMessage}</p>
          </div>
          <div className="rounded-3xl border border-fog-200 bg-white p-5">
            <p className="font-semibold text-ink-900">{t('services.aiFollowUpTitle')}</p>
            <p className="mt-3 whitespace-pre-wrap leading-6">{aiFollowUp}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
