import { describe, expect, it } from 'vitest';
import type { Building } from '@/core/models/building';
import type { OperationalServiceOrder } from '@/features/services/useOperationalServiceOrders';
import {
  filterClientServiceOrders,
  getClientScopedBuildings,
  getClientVisibleServiceOrders,
  sortClientServicesByPriority
} from '@/features/portal/clientServices';
import { getClientVisibleReportItems, isPdfAttachment } from '@/features/portal/clientReports';

const buildings = [
  { id: 'b-1', managementCompanyId: 'client-1', name: 'Torre Norte' },
  { id: 'b-2', managementCompanyId: 'client-2', name: 'Torre Sur' }
] as Building[];

function serviceOrder(overrides: Partial<OperationalServiceOrder>): OperationalServiceOrder {
  return {
    id: 'service-1',
    buildingId: 'b-1',
    customerId: 'client-1',
    title: 'Mantenimiento ascensor',
    type: 'maintenance',
    priority: 'medium',
    status: 'scheduled',
    scheduledStartAt: '2026-05-14T10:00:00.000Z',
    scheduledEndAt: '2026-05-14T11:00:00.000Z',
    issues: [],
    attachments: [],
    completionPhotos: [],
    quoteVersions: [],
    timeline: [],
    ...overrides
  } as OperationalServiceOrder;
}

describe('client portal service selectors', () => {
  it('scopes buildings and services to the client administration', () => {
    const scopedBuildings = getClientScopedBuildings(buildings, 'client-1');
    const visibleServices = getClientVisibleServiceOrders(
      [
        serviceOrder({ id: 'visible-by-building', buildingId: 'b-1', customerId: null }),
        serviceOrder({ id: 'visible-by-customer', buildingId: 'unknown', customerId: 'client-1' }),
        serviceOrder({ id: 'hidden-building', buildingId: 'b-2', customerId: 'client-2' }),
        serviceOrder({ id: 'hidden-draft', buildingId: 'b-1', customerId: 'client-1', status: 'draft' })
      ],
      scopedBuildings,
      'client-1'
    );

    expect(scopedBuildings.map((building) => building.id)).toEqual(['b-1']);
    expect(visibleServices.map((service) => service.id)).toEqual(['visible-by-building', 'visible-by-customer']);
  });

  it('filters active and completed views without exposing cancelled services', () => {
    const services = [
      serviceOrder({ id: 'active', status: 'in_progress' }),
      serviceOrder({ id: 'completed', status: 'completed' }),
      serviceOrder({ id: 'cancelled', status: 'cancelled' })
    ];

    expect(filterClientServiceOrders(services, 'active').map((service) => service.id)).toEqual(['active']);
    expect(filterClientServiceOrders(services, 'completed').map((service) => service.id)).toEqual(['completed']);
  });

  it('prioritizes open urgent services before completed history', () => {
    const sorted = sortClientServicesByPriority([
      serviceOrder({ id: 'completed-urgent', status: 'completed', priority: 'urgent', scheduledStartAt: '2026-05-14T08:00:00.000Z' }),
      serviceOrder({ id: 'scheduled-low', status: 'scheduled', priority: 'low', scheduledStartAt: '2026-05-14T07:00:00.000Z' }),
      serviceOrder({ id: 'scheduled-urgent', status: 'scheduled', priority: 'urgent', scheduledStartAt: '2026-05-14T09:00:00.000Z' })
    ]);

    expect(sorted.map((service) => service.id)).toEqual(['scheduled-urgent', 'scheduled-low', 'completed-urgent']);
  });

  it('lists only client-visible reports and linked PDFs', () => {
    const reportItems = getClientVisibleReportItems(
      [
        serviceOrder({
          id: 'completed-report',
          status: 'completed',
          attachments: ['https://cdn.test/report.pdf', 'https://cdn.test/photo.jpg'],
          completedAt: '2026-05-15T10:00:00.000Z'
        }),
        serviceOrder({
          id: 'approved-report',
          status: 'pending_review',
          review: { status: 'approved' },
          attachments: ['https://cdn.test/approved.PDF?token=1'],
          updatedAt: '2026-05-16T10:00:00.000Z'
        }),
        serviceOrder({ id: 'hidden-draft', status: 'draft', attachments: ['https://cdn.test/draft.pdf'] }),
        serviceOrder({ id: 'hidden-client', customerId: 'client-2', buildingId: 'b-2', status: 'completed' })
      ],
      getClientScopedBuildings(buildings, 'client-1'),
      'client-1'
    );

    expect(reportItems.map((item) => item.serviceOrder.id)).toEqual(['approved-report', 'completed-report']);
    expect(reportItems.flatMap((item) => item.pdfAttachments)).toEqual([
      'https://cdn.test/approved.PDF?token=1',
      'https://cdn.test/report.pdf'
    ]);
  });

  it('detects PDF attachments from common storage URL shapes', () => {
    expect(isPdfAttachment('https://cdn.test/report.pdf?token=1')).toBe(true);
    expect(isPdfAttachment('https://cdn.test/application%2Fpdf%2Freport')).toBe(true);
    expect(isPdfAttachment('https://cdn.test/photo.jpg')).toBe(false);
  });
});
