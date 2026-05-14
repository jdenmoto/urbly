import { describe, expect, it } from 'vitest';
import {
  AI_FORBIDDEN_SYSTEM_ACTIONS,
  createAiSuggestion,
  hasForbiddenAiSystemAction,
  isAiSuggestion,
  isSuggestionOnlyPolicy
} from '../aiSuggestion';

describe('aiSuggestion contract', () => {
  it('creates suggestions with a suggestion-only safety policy', () => {
    const suggestion = createAiSuggestion({
      id: 'service-1-summary',
      kind: 'technical_summary',
      title: 'Resumen técnico',
      content: 'Servicio programado con prioridad alta.',
      trace: {
        generatedAt: '2026-05-13T20:00:00.000Z',
        module: 'services',
        roleScope: 'operator',
        inputSummary: 'service-1 | scheduled'
      }
    });

    expect(suggestion.safety.mode).toBe('suggestion_only');
    expect(suggestion.safety.requiresHumanApproval).toBe(true);
    expect(suggestion.safety.forbiddenSystemActions).toEqual(AI_FORBIDDEN_SYSTEM_ACTIONS);
    expect(isSuggestionOnlyPolicy(suggestion.safety)).toBe(true);
    expect(isAiSuggestion(suggestion)).toBe(true);
  });

  it('rejects policies that allow auto-save, auto-send or mutation', () => {
    expect(
      isSuggestionOnlyPolicy({
        mode: 'suggestion_only',
        requiresHumanApproval: true,
        allowedUserActions: ['copy'],
        forbiddenSystemActions: ['auto_save', 'auto_send', 'auto_mutate']
      })
    ).toBe(true);

    expect(
      isSuggestionOnlyPolicy({
        mode: 'auto_save',
        requiresHumanApproval: false,
        allowedUserActions: ['auto_save'],
        forbiddenSystemActions: []
      })
    ).toBe(false);

    expect(hasForbiddenAiSystemAction(['copy', 'auto_send'])).toBe(true);
    expect(hasForbiddenAiSystemAction(['copy', 'insert_draft'])).toBe(false);
  });

  it('rejects malformed suggestion payloads', () => {
    expect(isAiSuggestion({ id: 'missing-contract' })).toBe(false);
    expect(
      isAiSuggestion({
        id: 'unsafe',
        kind: 'customer_message',
        title: 'Mensaje cliente',
        content: 'Hola cliente',
        trace: {
          generatedAt: '2026-05-13T20:00:00.000Z',
          module: 'services',
          inputSummary: 'service-1'
        },
        safety: {
          mode: 'suggestion_only',
          requiresHumanApproval: true,
          allowedUserActions: ['copy'],
          forbiddenSystemActions: ['auto_save']
        }
      })
    ).toBe(false);
  });
});
