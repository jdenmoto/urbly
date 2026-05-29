import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { createAiSuggestion, type AiSuggestion } from '@/core/models/aiSuggestion';
import AiSuggestionCard from '@/features/ai/AiSuggestionCard';

const i18nMap: Record<string, string> = {
  'ai.card.blocked.title': 'Sugerencia IA bloqueada',
  'ai.card.blocked.subtitle': 'El contenido no cumple el contrato seguro de IA y no se muestra.',
  'ai.card.badge.ai': 'IA',
  'ai.card.badge.suggestion.only': 'Solo sugerencia',
  'ai.card.kind.technical.summary': 'Resumen técnico',
  'ai.card.kind.report.draft': 'Borrador de reporte',
  'ai.card.kind.customer.message': 'Mensaje cliente',
  'ai.card.kind.missing.requirements': 'Faltantes detectados',
  'ai.card.kind.follow.up': 'Follow-up',
  'ai.card.action.copy': 'Copiar',
  'ai.card.action.insert.draft': 'Insertar como borrador',
  'ai.card.action.dismiss': 'Descartar',
  'ai.card.action.regenerate': 'Regenerar',
  'ai.card.human.approval.required': 'Requiere aprobación humana',
  'ai.card.trace.module': 'Módulo',
  'ai.card.trace.generated': 'Generado',
  'ai.card.trace.input': 'Entrada',
  'ai.card.trace.role': 'Rol',
  'ai.card.trace.template': 'Plantilla',
  'ai.card.trace.policy': 'Política',
};

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => i18nMap[key] ?? key,
    loading: false
  })
}));

function makeSuggestion(): AiSuggestion {
  return createAiSuggestion({
    id: 'ai-1',
    kind: 'customer_message',
    title: 'Mensaje al cliente',
    content: 'Hola, validamos el avance y te confirmamos el siguiente paso.',
    trace: {
      generatedAt: '2026-05-13T20:00:00.000Z',
      module: 'services',
      roleScope: 'operator',
      inputSummary: 'Servicio urgente con una incidencia',
    },
    safety: {
      allowedUserActions: ['copy', 'insert_draft'],
    },
  });
}

describe('AiSuggestionCard', () => {
  it('renders a valid AiSuggestion as suggestion-only content with trace metadata', () => {
    const html = renderToStaticMarkup(<AiSuggestionCard suggestion={makeSuggestion()} />);

    expect(html).toContain('Mensaje al cliente');
    expect(html).toContain('Hola, validamos el avance');
    expect(html).toContain('Solo sugerencia');
    expect(html).toContain('Requiere aprobación humana');
    expect(html).toContain('services');
    expect(html).toContain('Servicio urgente con una incidencia');
    expect(html).not.toContain('Guardar');
    expect(html).not.toContain('Enviar');
    expect(html).not.toContain('auto_save');
    expect(html).not.toContain('auto_send');
    expect(html).not.toContain('auto_mutate');
  });

  it('only exposes explicit user action buttons declared by the safety policy', () => {
    const html = renderToStaticMarkup(
      <AiSuggestionCard
        suggestion={makeSuggestion()}
        actions={{
          copy: vi.fn(),
          insert_draft: vi.fn(),
          dismiss: vi.fn(),
          regenerate: vi.fn(),
        }}
      />,
    );

    expect(html).toContain('Copiar');
    expect(html).toContain('Insertar como borrador');
    expect(html).not.toContain('Descartar');
    expect(html).not.toContain('Regenerar');
  });

  it('does not render malformed or unsafe suggestion content', () => {
    const unsafeSuggestion = {
      ...makeSuggestion(),
      safety: {
        mode: 'suggestion_only',
        requiresHumanApproval: true,
        allowedUserActions: ['copy', 'auto_save'],
        forbiddenSystemActions: ['auto_save', 'auto_send', 'auto_mutate'],
      },
    } as unknown as AiSuggestion;

    const html = renderToStaticMarkup(<AiSuggestionCard suggestion={unsafeSuggestion} />);

    expect(html).toContain('Sugerencia IA bloqueada');
    expect(html).not.toContain('Hola, validamos el avance');
  });
});
