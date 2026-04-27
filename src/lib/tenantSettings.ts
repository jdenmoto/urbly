import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { TenantAiPolicySetting, TenantTemplateSetting } from '@/core/models/tenantSettings';

function sortScoped<T extends { administrationId: string | null }>(items: T[], administrationId: string | null) {
  return [...items].sort((a, b) => {
    const aScore = a.administrationId === administrationId ? 0 : a.administrationId === null ? 1 : 2;
    const bScore = b.administrationId === administrationId ? 0 : b.administrationId === null ? 1 : 2;
    return aScore - bScore;
  });
}

export async function listTenantTemplates(administrationId: string | null) {
  const snapshot = await getDoc(doc(db, 'settings', 'tenant_templates'));
  const payload = snapshot.exists() ? (snapshot.data() as { items?: TenantTemplateSetting[] }) : { items: [] };
  return sortScoped((payload.items ?? []).filter((item) => item.active !== false), administrationId);
}

export async function listTenantAiPolicies(administrationId: string | null) {
  const snapshot = await getDoc(doc(db, 'settings', 'tenant_ai_policies'));
  const payload = snapshot.exists() ? (snapshot.data() as { items?: TenantAiPolicySetting[] }) : { items: [] };
  return sortScoped((payload.items ?? []).filter((item) => item.active !== false), administrationId);
}
