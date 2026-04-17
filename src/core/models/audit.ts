export type AuditActor = {
  uid?: string | null;
  role?: string | null;
};

export type AuditEvent = {
  id: string;
  entityType: 'service_order' | 'appointment' | 'user' | 'document';
  entityId: string;
  action: string;
  summary: string;
  actor: AuditActor;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
