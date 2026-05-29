import type { ReactNode } from 'react';
import clsx from 'clsx';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import type { AiAllowedUserAction, AiSuggestion, AiSuggestionKind } from '@/core/models/aiSuggestion';
import { isAiSuggestion } from '@/core/models/aiSuggestion';
import { useI18n } from '@/lib/i18n';

type AiSuggestionActionHandlers = Partial<Record<AiAllowedUserAction, (suggestion: AiSuggestion) => void>>;

type AiSuggestionCardProps = {
  suggestion: AiSuggestion;
  actions?: AiSuggestionActionHandlers;
  className?: string;
};

export default function AiSuggestionCard({ suggestion, actions, className }: AiSuggestionCardProps) {
  const { t } = useI18n();
  const kindLabel: Record<AiSuggestionKind, string> = {
    technical_summary: t('ai.card.kind.technical.summary'),
    report_draft: t('ai.card.kind.report.draft'),
    customer_message: t('ai.card.kind.customer.message'),
    missing_requirements: t('ai.card.kind.missing.requirements'),
    follow_up: t('ai.card.kind.follow.up'),
  };
  const actionLabel: Record<AiAllowedUserAction, string> = {
    copy: t('ai.card.action.copy'),
    insert_draft: t('ai.card.action.insert.draft'),
    dismiss: t('ai.card.action.dismiss'),
    regenerate: t('ai.card.action.regenerate'),
  };

  if (!isAiSuggestion(suggestion)) {
    return (
      <article className={clsx('rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 shadow-sm', className)}>
        <p className="font-semibold">{t('ai.card.blocked.title')}</p>
        <p className="mt-2 leading-6">{t('ai.card.blocked.subtitle')}</p>
      </article>
    );
  }

  const availableActions = suggestion.safety.allowedUserActions.filter((action) => Boolean(actions?.[action]));
  const quickFacts = [
    {
      label: t('ai.card.quick.kind'),
      value: kindLabel[suggestion.kind],
    },
    {
      label: t('ai.card.quick.actions.label'),
      value: t('ai.card.quick.actions.count', { count: suggestion.safety.allowedUserActions.length }),
    },
    {
      label: t('ai.card.quick.policy'),
      value: suggestion.trace.policyId ?? t('common.no.data'),
    },
  ];

  return (
    <article className={clsx('rounded-3xl border border-fog-200 bg-white p-5 shadow-sm', className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-sky-50 text-sky-700">{t('ai.card.badge.ai')}</Badge>
            <Badge tone="warning">{t('ai.card.badge.suggestion.only')}</Badge>
            <Badge tone="neutral">{kindLabel[suggestion.kind]}</Badge>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink-900">{suggestion.title}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-500">{t('ai.card.human.approval.required')}</p>
          </div>
        </div>

        {availableActions.length ? (
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <Button key={action} type="button" variant="secondary" onClick={() => actions?.[action]?.(suggestion)}>
                {actionLabel[action]}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {quickFacts.map((item) => (
          <div key={item.label} className="rounded-2xl border border-fog-200 bg-fog-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-fog-50 p-4 text-sm leading-6 text-ink-700">
        <p className="whitespace-pre-wrap">{suggestion.content}</p>
      </div>

      <div className="mt-4 grid gap-3 text-xs text-ink-600 md:grid-cols-3">
        <TraceItem label={t('ai.card.trace.module')} value={suggestion.trace.module} />
        <TraceItem label={t('ai.card.trace.generated')} value={formatGeneratedAt(suggestion.trace.generatedAt)} />
        <TraceItem label={t('ai.card.trace.input')} value={suggestion.trace.inputSummary} />
        {suggestion.trace.roleScope ? <TraceItem label={t('ai.card.trace.role')} value={suggestion.trace.roleScope} /> : null}
        {suggestion.trace.templateId ? <TraceItem label={t('ai.card.trace.template')} value={suggestion.trace.templateId} /> : null}
        {suggestion.trace.policyId ? <TraceItem label={t('ai.card.trace.policy')} value={suggestion.trace.policyId} /> : null}
      </div>
    </article>
  );
}

function TraceItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-fog-200 bg-white px-3 py-2">
      <p className="font-semibold text-ink-900">{label}</p>
      <p className="mt-1 break-words">{value}</p>
    </div>
  );
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
