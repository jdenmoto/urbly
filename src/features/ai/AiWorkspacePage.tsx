import { useMemo } from 'react';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import { buildCustomerMessage, buildFollowUp, buildServiceSummary } from '@/features/services/serviceOrderAi';
import { getServiceOrderPriorityPill, serviceOrderPriorityTone } from '@/features/services/serviceOrderPresentation';

export default function AiWorkspacePage() {
  const { t } = useI18n();
  const { data: serviceOrders = [] } = useServiceOrders();

  const suggestions = useMemo(() => {
    return serviceOrders
      .filter((item) => item.status !== 'completed' && item.status !== 'cancelled')
      .sort((a, b) => {
        if (a.priority === b.priority) {
          return new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime();
        }
        const rank = { urgent: 0, high: 1, medium: 2, low: 3 };
        return rank[a.priority] - rank[b.priority];
      })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        priority: item.priority,
        suggestion:
          item.priority === 'urgent'
            ? t('ai.suggestionUrgent')
            : item.issues?.length
              ? t('ai.suggestionIssues')
              : t('ai.suggestionDefault'),
        summary: buildServiceSummary(item, t),
        customerMessage: buildCustomerMessage(item, t),
        followUp: buildFollowUp(item)
      }));
  }, [serviceOrders, t]);

  return (
    <div className="space-y-8">
      <PageHeader title={t('ai.title')} subtitle={t('ai.subtitle')} />

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              {t('ai.workspaceBadge')}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink-900">{t('ai.workspaceTitle')}</h2>
              <p className="max-w-2xl text-sm leading-6 text-ink-600">{t('ai.workspaceSubtitle')}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-fog-200 bg-fog-50 px-4 py-3 text-sm text-ink-600">
            <p className="font-semibold text-ink-900">{suggestions.length}</p>
            <p>{t('ai.visibleSuggestionsHint')}</p>
          </div>
        </div>

        {suggestions.length ? (
          <div className="space-y-4">
            {suggestions.map((item) => (
              <article key={item.id} className="rounded-3xl border border-fog-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${serviceOrderPriorityTone[item.priority]}`}>
                      {getServiceOrderPriorityPill(t, item.priority, 'ai.priorityPill')}
                    </div>
                    <p className="mt-3 text-lg font-semibold text-ink-900">{item.title}</p>
                    <p className="mt-1 text-sm text-ink-600">{item.suggestion}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 xl:grid-cols-3 text-sm text-ink-700">
                  <div className="rounded-2xl bg-fog-50 p-4">
                    <p className="font-semibold text-ink-900">{t('ai.caseSummaryTitle')}</p>
                    <p className="mt-2 whitespace-pre-wrap leading-6">{item.summary}</p>
                  </div>
                  <div className="rounded-2xl bg-fog-50 p-4">
                    <p className="font-semibold text-ink-900">{t('ai.customerMessageTitle')}</p>
                    <p className="mt-2 whitespace-pre-wrap leading-6">{item.customerMessage}</p>
                  </div>
                  <div className="rounded-2xl bg-fog-50 p-4">
                    <p className="font-semibold text-ink-900">{t('ai.followUpTitle')}</p>
                    <p className="mt-2 whitespace-pre-wrap leading-6">{item.followUp}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title={t('ai.workspaceTitle')} description={t('ai.empty')} />
        )}
      </Card>
    </div>
  );
}
