import { useMemo } from 'react';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';

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
        suggestion:
          item.priority === 'urgent'
            ? t('ai.suggestionUrgent')
            : item.issues?.length
              ? t('ai.suggestionIssues')
              : t('ai.suggestionDefault')
      }));
  }, [serviceOrders, t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t('ai.title')} subtitle={t('ai.subtitle')} />

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{t('ai.workspaceTitle')}</h2>
          <p className="text-sm text-ink-600">{t('ai.workspaceSubtitle')}</p>
        </div>

        {suggestions.length ? (
          <div className="space-y-3">
            {suggestions.map((item) => (
              <div key={item.id} className="rounded-xl border border-fog-200 p-4">
                <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                <p className="mt-1 text-sm text-ink-600">{item.suggestion}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={t('ai.workspaceTitle')} description={t('ai.empty')} />
        )}
      </Card>
    </div>
  );
}
