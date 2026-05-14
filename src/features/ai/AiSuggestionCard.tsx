import type { ReactNode } from 'react';
import clsx from 'clsx';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import type { AiAllowedUserAction, AiSuggestion, AiSuggestionKind } from '@/core/models/aiSuggestion';
import { isAiSuggestion } from '@/core/models/aiSuggestion';

type AiSuggestionActionHandlers = Partial<Record<AiAllowedUserAction, (suggestion: AiSuggestion) => void>>;

type AiSuggestionCardProps = {
  suggestion: AiSuggestion;
  actions?: AiSuggestionActionHandlers;
  className?: string;
};

const kindLabel: Record<AiSuggestionKind, string> = {
  technical_summary: 'Resumen técnico',
  report_draft: 'Borrador de reporte',
  customer_message: 'Mensaje cliente',
  missing_requirements: 'Faltantes detectados',
  follow_up: 'Follow-up',
};

const actionLabel: Record<AiAllowedUserAction, string> = {
  copy: 'Copiar',
  insert_draft: 'Insertar como borrador',
  dismiss: 'Descartar',
  regenerate: 'Regenerar',
};

export default function AiSuggestionCard({ suggestion, actions, className }: AiSuggestionCardProps) {
  if (!isAiSuggestion(suggestion)) {
    return (
      <article className={clsx('rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 shadow-sm', className)}>
        <p className="font-semibold">Sugerencia IA bloqueada</p>
        <p className="mt-2 leading-6">El contenido no cumple el contrato seguro de IA y no se muestra.</p>
      </article>
    );
  }

  const availableActions = suggestion.safety.allowedUserActions.filter((action) => Boolean(actions?.[action]));

  return (
    <article className={clsx('rounded-3xl border border-violet-100 bg-white p-5 shadow-sm', className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-violet-50 text-violet-700">IA</Badge>
            <Badge tone="warning">Solo sugerencia</Badge>
            <Badge tone="neutral">{kindLabel[suggestion.kind]}</Badge>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink-900">{suggestion.title}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-500">Requiere aprobación humana</p>
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

      <div className="mt-4 rounded-2xl bg-fog-50 p-4 text-sm leading-6 text-ink-700">
        <p className="whitespace-pre-wrap">{suggestion.content}</p>
      </div>

      <div className="mt-4 grid gap-3 text-xs text-ink-600 md:grid-cols-3">
        <TraceItem label="Módulo" value={suggestion.trace.module} />
        <TraceItem label="Generado" value={formatGeneratedAt(suggestion.trace.generatedAt)} />
        <TraceItem label="Entrada" value={suggestion.trace.inputSummary} />
        {suggestion.trace.roleScope ? <TraceItem label="Rol" value={suggestion.trace.roleScope} /> : null}
        {suggestion.trace.templateId ? <TraceItem label="Plantilla" value={suggestion.trace.templateId} /> : null}
        {suggestion.trace.policyId ? <TraceItem label="Política" value={suggestion.trace.policyId} /> : null}
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
