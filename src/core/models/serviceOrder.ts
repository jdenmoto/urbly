export const SERVICE_ORDER_STATUSES = [
  'draft',
  'unassigned',
  'scheduled',
  'confirmed',
  'in_progress',
  'paused',
  'pending_review',
  'requires_reschedule',
  'completed',
  'cancelled',
] as const;

export type ServiceOrderStatus = (typeof SERVICE_ORDER_STATUSES)[number];

export type ServiceOrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ServiceOrderActorRole = 'company' | 'technician' | 'client' | 'system';

export type ServiceOrderIssue = {
  id: string;
  type: string;
  category: string;
  description?: string;
  photos: string[];
  createdAt?: string;
};

export type ServiceOrderChecklistValue = 'ok' | 'regular' | 'malo' | 'na';

export type ServiceOrderChecklist = Record<string, ServiceOrderChecklistValue>;

export type ServiceOrderReport = {
  entryHour?: string;
  exitHour?: string;
  observations?: string;
  checklist?: ServiceOrderChecklist;
};

export type ServiceOrderReview = {
  status?: 'pending_review' | 'changes_requested' | 'approved';
  reviewerId?: string;
  reviewedAt?: string;
  feedback?: string;
};

export type ServiceOrderQuoteVersion = {
  id: string;
  version: number;
  status: 'draft' | 'pending_internal_review' | 'changes_requested' | 'approved';
  scope: string;
  amount: number;
  currency: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewFeedback?: string;
};

export type ServiceOrderCommunication = {
  customerMessage?: string;
  internalSummary?: string;
  followUpSuggestion?: string;
  generatedAt?: string;
};

export const SERVICE_ORDER_TIMELINE_EVENT_TYPES = [
  'created',
  'scheduled',
  'assigned',
  'reassigned',
  'started',
  'paused',
  'resumed',
  'issue_added',
  'pending_review',
  'requires_reschedule',
  'rescheduled',
  'completed',
  'cancelled',
  'note',
] as const;

export type ServiceOrderTimelineEvent = {
  id: string;
  type: (typeof SERVICE_ORDER_TIMELINE_EVENT_TYPES)[number];
  createdAt: string;
  actorRole: ServiceOrderActorRole;
  actorId?: string;
  summary: string;
};

export type ServiceOrderDataSource = 'service_order';

export type ServiceOrder = {
  id: string;
  dataSource?: ServiceOrderDataSource;
  customerId?: string | null;
  buildingId: string;
  contractId?: string | null;
  title: string;
  description?: string;
  type: string;
  priority: ServiceOrderPriority;
  status: ServiceOrderStatus;
  scheduledStartAt: string;
  scheduledEndAt: string;
  assignedTechnicianId?: string | null;
  recurrence?: string | null;
  seriesId?: string | null;
  checklist?: ServiceOrderChecklist;
  issues?: ServiceOrderIssue[];
  attachments?: string[];
  completionPhotos?: string[];
  report?: ServiceOrderReport;
  communication?: ServiceOrderCommunication;
  quoteVersions?: ServiceOrderQuoteVersion[];
  review?: ServiceOrderReview;
  timeline?: ServiceOrderTimelineEvent[];
  cancelReason?: string | null;
  cancelNote?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
