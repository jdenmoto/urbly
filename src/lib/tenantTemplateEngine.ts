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

function pickBestPolicy(policies: TenantAiPolicySetting[], administrationId: string | null) {
  return policies.find((item) => item.administrationId === administrationId)
    ?? policies.find((item) => item.administrationId === null)
    ?? null;
}

export async function renderTenantTemplate(params: {
  administrationId: string | null;
  templateType: TenantTemplateSetting['templateType'];
  context: TemplateRenderContext;
}) {
  const [templates, policies] = await Promise.all([
    listTenantTemplates(params.administrationId),
    listTenantAiPolicies(params.administrationId)
  ]);

  const template = pickBestTemplate(templates, params.templateType, params.administrationId);
  const policy = pickBestPolicy(policies, params.administrationId);

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
