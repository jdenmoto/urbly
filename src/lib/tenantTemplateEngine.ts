import type { TenantAiPolicySetting, TenantTemplateSetting } from '@/core/models/tenantSettings';
import { listTenantAiPolicies, listTenantTemplates } from '@/lib/tenantSettings';

export type TemplateRenderContext = Record<string, string | number | null | undefined>;

function interpolate(content: string, context: TemplateRenderContext) {
  return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = context[key];
    return value == null ? '' : String(value);
  });
}

function pickBestTemplate(templates: TenantTemplateSetting[], type: TenantTemplateSetting['templateType'], administrationId: string | null) {
  return templates.find((item) => item.templateType === type && item.administrationId === administrationId)
    ?? templates.find((item) => item.templateType === type && item.administrationId === null)
    ?? null;
}

function pickBestPolicy(policies: TenantAiPolicySetting[], administrationId: string | null, module: string, roleScope?: string | null) {
  const score = (item: TenantAiPolicySetting) => {
    let current = 0;
    current += item.administrationId === administrationId ? 8 : item.administrationId === null ? 4 : 0;
    current += item.module === module ? 4 : item.module === 'general' || !item.module ? 2 : 0;
    current += item.roleScope === roleScope ? 2 : item.roleScope == null ? 1 : 0;
    return current;
  };

  return [...policies].sort((a, b) => score(b) - score(a))[0] ?? null;
}

export async function renderTenantTemplate(params: {
  administrationId: string | null;
  templateType: TenantTemplateSetting['templateType'];
  module?: string;
  roleScope?: string | null;
  context: TemplateRenderContext;
}) {
  const [templates, policies] = await Promise.all([
    listTenantTemplates(params.administrationId),
    listTenantAiPolicies(params.administrationId)
  ]);

  const template = pickBestTemplate(templates, params.templateType, params.administrationId);
  const policy = pickBestPolicy(policies, params.administrationId, params.module ?? 'general', params.roleScope);

  if (!template) return null;

  return {
    templateId: template.id,
    policyId: policy?.id ?? null,
    subject: interpolate(template.subject ?? '', params.context),
    content: interpolate(template.content, {
      tone: policy?.tone ?? '',
      instructions: policy?.instructions ?? '',
      ...params.context
    })
  };
}
