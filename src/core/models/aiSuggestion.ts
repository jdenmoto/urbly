export const AI_SUGGESTION_KINDS = ['technical_summary', 'report_draft', 'customer_message', 'missing_requirements', 'follow_up'] as const;

export const AI_ALLOWED_USER_ACTIONS = ['copy', 'insert_draft', 'dismiss', 'regenerate'] as const;

export const AI_FORBIDDEN_SYSTEM_ACTIONS = ['auto_save', 'auto_send', 'auto_mutate'] as const;

export type AiSuggestionKind = (typeof AI_SUGGESTION_KINDS)[number];
export type AiAllowedUserAction = (typeof AI_ALLOWED_USER_ACTIONS)[number];
export type AiForbiddenSystemAction = (typeof AI_FORBIDDEN_SYSTEM_ACTIONS)[number];

export type AiSuggestionTrace = {
  generatedAt: string;
  module: string;
  roleScope?: string | null;
  policyId?: string | null;
  templateId?: string | null;
  inputSummary: string;
};

export type AiSuggestionSafetyPolicy = {
  mode: 'suggestion_only';
  requiresHumanApproval: true;
  allowedUserActions: AiAllowedUserAction[];
  forbiddenSystemActions: AiForbiddenSystemAction[];
};

export type AiSuggestionInput = {
  id: string;
  kind: AiSuggestionKind;
  title: string;
  content: string;
  trace: AiSuggestionTrace;
  safety?: Partial<AiSuggestionSafetyPolicy>;
};

export type AiSuggestion = {
  id: string;
  kind: AiSuggestionKind;
  /** @deprecated Use kind. Kept while legacy UI migrates to the Fase 4 contract. */
  type: AiSuggestionKind | 'summary';
  title: string;
  content: string;
  trace: AiSuggestionTrace;
  safety: AiSuggestionSafetyPolicy;
};

const DEFAULT_ALLOWED_USER_ACTIONS: AiAllowedUserAction[] = ['copy', 'insert_draft', 'dismiss', 'regenerate'];

export function createAiSuggestion(input: AiSuggestionInput): AiSuggestion {
  const safety: AiSuggestionSafetyPolicy = {
    mode: 'suggestion_only',
    requiresHumanApproval: true,
    allowedUserActions: [...(input.safety?.allowedUserActions ?? DEFAULT_ALLOWED_USER_ACTIONS)],
    forbiddenSystemActions: [...AI_FORBIDDEN_SYSTEM_ACTIONS]
  };

  return {
    id: input.id,
    kind: input.kind,
    type: input.kind === 'technical_summary' ? 'summary' : input.kind,
    title: input.title,
    content: input.content,
    trace: input.trace,
    safety
  };
}

export function hasForbiddenAiSystemAction(actions: readonly unknown[]): boolean {
  return actions.some((action) => AI_FORBIDDEN_SYSTEM_ACTIONS.includes(action as AiForbiddenSystemAction));
}

export function isSuggestionOnlyPolicy(value: unknown): value is AiSuggestionSafetyPolicy {
  if (!isRecord(value)) return false;

  const allowedUserActions = Array.isArray(value.allowedUserActions) ? value.allowedUserActions : [];
  const forbiddenSystemActions = Array.isArray(value.forbiddenSystemActions) ? value.forbiddenSystemActions : [];

  return (
    value.mode === 'suggestion_only' &&
    value.requiresHumanApproval === true &&
    allowedUserActions.every((action) => AI_ALLOWED_USER_ACTIONS.includes(action as AiAllowedUserAction)) &&
    !hasForbiddenAiSystemAction(allowedUserActions) &&
    AI_FORBIDDEN_SYSTEM_ACTIONS.every((action) => forbiddenSystemActions.includes(action)) &&
    forbiddenSystemActions.every((action) => AI_FORBIDDEN_SYSTEM_ACTIONS.includes(action as AiForbiddenSystemAction))
  );
}

export function isAiSuggestion(value: unknown): value is AiSuggestion {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    isAiSuggestionKind(value.kind) &&
    typeof value.title === 'string' &&
    typeof value.content === 'string' &&
    isAiSuggestionTrace(value.trace) &&
    isSuggestionOnlyPolicy(value.safety)
  );
}

export function isAiSuggestionKind(value: unknown): value is AiSuggestionKind {
  return typeof value === 'string' && AI_SUGGESTION_KINDS.includes(value as AiSuggestionKind);
}

function isAiSuggestionTrace(value: unknown): value is AiSuggestionTrace {
  if (!isRecord(value)) return false;

  return typeof value.generatedAt === 'string' && typeof value.module === 'string' && typeof value.inputSummary === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
