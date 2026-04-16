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

export type TenantAiPolicySetting = TenantScopedSetting & {
  name: string;
  tone: string;
  instructions: string;
  customerMessagePrompt?: string;
  technicalReportPrompt?: string;
  followUpPrompt?: string;
};
