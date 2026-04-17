import { createDoc } from '@/lib/api/firestore';
import type { AuditEvent } from '@/core/models/audit';

export async function recordAuditEvent(event: Omit<AuditEvent, 'id' | 'createdAt'>) {
  return createDoc('audit_events', {
    ...event,
    createdAt: new Date().toISOString()
  });
}
