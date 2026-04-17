export type ServiceOrderStatus =
  | 'draft'
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

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

export type ServiceOrderTimelineEvent = {
  id: string;
  type: 'created' | 'scheduled' | 'assigned' | 'issue_added' | 'completed' | 'cancelled' | 'note';
  createdAt: string;
  actorRole: ServiceOrderActorRole;
  actorId?: string;
  summary: string;
};

export type ServiceOrder = {
  id: string;
  appointmentId?: string | null;
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
