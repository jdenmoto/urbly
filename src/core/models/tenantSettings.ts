export type TenantScopedSetting = {
  id: string;
  administrationId: string | null;
  scope: 'global' | 'tenant';
  active: boolean;
  updatedAt?: string;
};

export type TenantTemplateSetting = TenantScopedSetting & {
  name: string;
  templateType: 'customer_message' | 'technical_report' | 'follow_up';
  subject?: string;
  content: string;
};

export type TenantAiPolicyModule = 'services' | 'reports' | 'portal' | 'general';

export type TenantAiPolicySetting = TenantScopedSetting & {
  name: string;
  module?: TenantAiPolicyModule;
  roleScope?: string | null;
  tone: string;
  instructions: string;
  customerMessagePrompt?: string;
  technicalReportPrompt?: string;
  followUpPrompt?: string;
};
