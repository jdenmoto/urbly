export type AiSuggestionTrace = {
  generatedAt: string;
  module: string;
  roleScope?: string | null;
  policyId?: string | null;
  templateId?: string | null;
  inputSummary: string;
};

export type AiSuggestion = {
  id: string;
  type: 'summary' | 'customer_message' | 'follow_up';
  content: string;
  trace: AiSuggestionTrace;
};
