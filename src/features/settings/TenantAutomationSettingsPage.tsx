import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Select from '@/components/Select';
import { useAuth } from '@/app/Auth';
import { useList } from '@/lib/api/queries';
import { createDoc, updateDocById } from '@/lib/api/firestore';
import { listTenantAiPolicies, listTenantTemplates } from '@/lib/tenantSettings';
import type { ManagementCompany } from '@/core/models/managementCompany';
import type { TenantAiPolicySetting, TenantTemplateSetting } from '@/core/models/tenantSettings';
import { useToast } from '@/components/ToastProvider';

const templateTypes: TenantTemplateSetting['templateType'][] = ['customer_message', 'technical_report', 'follow_up'];

export default function TenantAutomationSettingsPage() {
  const { role, administrationId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const canManageGlobal = role === 'admin';
  const defaultAdministrationId = canManageGlobal ? '' : administrationId ?? '';
  const [templateForm, setTemplateForm] = useState({
    id: '',
    administrationId: defaultAdministrationId,
    name: '',
    templateType: 'customer_message' as TenantTemplateSetting['templateType'],
    subject: '',
    content: ''
  });
  const [policyForm, setPolicyForm] = useState({
    id: '',
    administrationId: defaultAdministrationId,
    name: '',
    tone: 'profesional',
    instructions: '',
    customerMessagePrompt: '',
    technicalReportPrompt: '',
    followUpPrompt: ''
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['tenantTemplates', administrationId ?? 'global'],
    queryFn: () => listTenantTemplates(administrationId ?? null),
    staleTime: 60_000
  });

  const { data: policies = [] } = useQuery({
    queryKey: ['tenantAiPolicies', administrationId ?? 'global'],
    queryFn: () => listTenantAiPolicies(administrationId ?? null),
    staleTime: 60_000
  });

  const administrationOptions = useMemo(() => [{ id: '', name: 'Global' }, ...managements], [managements]);

  const saveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.content.trim()) return;
    const payload = {
      administrationId: templateForm.administrationId || null,
      scope: templateForm.administrationId ? 'tenant' : 'global',
      active: true,
      name: templateForm.name.trim(),
      templateType: templateForm.templateType,
      subject: templateForm.subject.trim(),
      content: templateForm.content.trim(),
      updatedAt: new Date().toISOString()
    };
    if (templateForm.id) await updateDocById('tenant_templates', templateForm.id, payload);
    else await createDoc('tenant_templates', payload);
    await queryClient.invalidateQueries({ queryKey: ['tenantTemplates'] });
    toast('Plantilla guardada', 'success');
    setTemplateForm({ id: '', administrationId: defaultAdministrationId, name: '', templateType: 'customer_message', subject: '', content: '' });
  };

  const savePolicy = async () => {
    if (!policyForm.name.trim() || !policyForm.instructions.trim()) return;
    const payload = {
      administrationId: policyForm.administrationId || null,
      scope: policyForm.administrationId ? 'tenant' : 'global',
      active: true,
      name: policyForm.name.trim(),
      tone: policyForm.tone.trim(),
      instructions: policyForm.instructions.trim(),
      customerMessagePrompt: policyForm.customerMessagePrompt.trim(),
      technicalReportPrompt: policyForm.technicalReportPrompt.trim(),
      followUpPrompt: policyForm.followUpPrompt.trim(),
      updatedAt: new Date().toISOString()
    };
    if (policyForm.id) await updateDocById('tenant_ai_policies', policyForm.id, payload);
    else await createDoc('tenant_ai_policies', payload);
    await queryClient.invalidateQueries({ queryKey: ['tenantAiPolicies'] });
    toast('Política IA guardada', 'success');
    setPolicyForm({ id: '', administrationId: defaultAdministrationId, name: '', tone: 'profesional', instructions: '', customerMessagePrompt: '', technicalReportPrompt: '', followUpPrompt: '' });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Plantillas e IA" subtitle="Configuración base multi-tenant para mensajes, reportes y políticas de IA" />
      <Card className="space-y-4">
        <h3 className="text-sm font-semibold text-ink-900">Plantillas</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Nombre" value={templateForm.name} onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))} />
          <Select label="Tipo" value={templateForm.templateType} onChange={(e) => setTemplateForm((p) => ({ ...p, templateType: e.target.value as TenantTemplateSetting['templateType'] }))}>
            {templateTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </Select>
          <Select label="Administración" value={templateForm.administrationId} onChange={(e) => setTemplateForm((p) => ({ ...p, administrationId: e.target.value }))} disabled={!canManageGlobal && Boolean(administrationId)}>
            {administrationOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
          </Select>
          <Input label="Asunto" value={templateForm.subject} onChange={(e) => setTemplateForm((p) => ({ ...p, subject: e.target.value }))} />
        </div>
        <label className="flex flex-col gap-1 text-sm text-ink-700">
          <span className="font-medium text-ink-800">Contenido</span>
          <textarea className="min-h-32 rounded-xl border border-fog-200 px-3 py-2 outline-none" value={templateForm.content} onChange={(e) => setTemplateForm((p) => ({ ...p, content: e.target.value }))} />
        </label>
        <Button type="button" onClick={saveTemplate}>Guardar plantilla</Button>
        <div className="space-y-2">
          {templates.map((item) => <div key={item.id} className="rounded-xl border border-fog-200 p-3 text-sm"><div className="font-semibold">{item.name}</div><div className="text-xs text-ink-500">{item.templateType} · {item.administrationId ?? 'global'}</div></div>)}
        </div>
      </Card>
      <Card className="space-y-4">
        <h3 className="text-sm font-semibold text-ink-900">Políticas IA</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Nombre" value={policyForm.name} onChange={(e) => setPolicyForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Tono" value={policyForm.tone} onChange={(e) => setPolicyForm((p) => ({ ...p, tone: e.target.value }))} />
          <Select label="Administración" value={policyForm.administrationId} onChange={(e) => setPolicyForm((p) => ({ ...p, administrationId: e.target.value }))} disabled={!canManageGlobal && Boolean(administrationId)}>
            {administrationOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
          </Select>
        </div>
        <label className="flex flex-col gap-1 text-sm text-ink-700"><span className="font-medium text-ink-800">Instrucciones base</span><textarea className="min-h-28 rounded-xl border border-fog-200 px-3 py-2 outline-none" value={policyForm.instructions} onChange={(e) => setPolicyForm((p) => ({ ...p, instructions: e.target.value }))} /></label>
        <Input label="Prompt mensaje cliente" value={policyForm.customerMessagePrompt} onChange={(e) => setPolicyForm((p) => ({ ...p, customerMessagePrompt: e.target.value }))} />
        <Input label="Prompt reporte técnico" value={policyForm.technicalReportPrompt} onChange={(e) => setPolicyForm((p) => ({ ...p, technicalReportPrompt: e.target.value }))} />
        <Input label="Prompt seguimiento" value={policyForm.followUpPrompt} onChange={(e) => setPolicyForm((p) => ({ ...p, followUpPrompt: e.target.value }))} />
        <Button type="button" onClick={savePolicy}>Guardar política IA</Button>
        <div className="space-y-2">
          {policies.map((item) => <div key={item.id} className="rounded-xl border border-fog-200 p-3 text-sm"><div className="font-semibold">{item.name}</div><div className="text-xs text-ink-500">{item.tone} · {item.administrationId ?? 'global'}</div></div>)}
        </div>
      </Card>
    </div>
  );
}
