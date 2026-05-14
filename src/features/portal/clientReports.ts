import type { OperationalServiceOrder } from '@/features/services/useOperationalServiceOrders';
import { getClientServiceLastUpdate, getClientVisibleServiceOrders } from './clientServices';
import type { Building } from '@/core/models/building';

export type ClientReportItem = {
  serviceOrder: OperationalServiceOrder;
  pdfAttachments: string[];
  photoCount: number;
  issueCount: number;
  lastUpdatedAt: string;
  isFinal: boolean;
};

function hasChecklistValues(serviceOrder: OperationalServiceOrder) {
  return Object.keys(serviceOrder.report?.checklist ?? serviceOrder.checklist ?? {}).length > 0;
}

function hasReportContent(serviceOrder: OperationalServiceOrder) {
  return Boolean(serviceOrder.report?.observations?.trim()) || hasChecklistValues(serviceOrder);
}

export function isPdfAttachment(url: string) {
  const normalized = url.split('?')[0]?.toLowerCase() ?? '';
  return normalized.endsWith('.pdf') || normalized.includes('/pdf/') || normalized.includes('application%2fpdf');
}

export function getClientVisibleReportItems(
  serviceOrders: OperationalServiceOrder[],
  buildings: Building[],
  administrationId: string | null
): ClientReportItem[] {
  return getClientVisibleServiceOrders(serviceOrders, buildings, administrationId)
    .filter((serviceOrder) => {
      const hasFinalStatus = serviceOrder.status === 'completed' || serviceOrder.review?.status === 'approved';
      return hasFinalStatus || hasReportContent(serviceOrder) || serviceOrder.completionPhotos.length > 0 || serviceOrder.attachments.some(isPdfAttachment);
    })
    .map((serviceOrder) => ({
      serviceOrder,
      pdfAttachments: serviceOrder.attachments.filter(isPdfAttachment),
      photoCount: serviceOrder.completionPhotos.length,
      issueCount: serviceOrder.issues.length,
      lastUpdatedAt: getClientServiceLastUpdate(serviceOrder),
      isFinal: serviceOrder.status === 'completed' || serviceOrder.review?.status === 'approved'
    }))
    .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
}
