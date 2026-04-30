import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ToastProvider } from '@/components/ToastProvider';
import { I18nProvider } from '@/lib/i18n';
import { SchedulingPageContent } from '@/features/operations/scheduling/SchedulingPage';
import type { SchedulingPageData, SchedulingPageFilters } from '@/features/operations/scheduling/useSchedulingPageData';

const filters: SchedulingPageFilters = {
  technicianId: '',
  buildingId: '',
  status: '',
  type: '',
  priority: '',
  from: '',
  to: '',
};

const data: SchedulingPageData = {
  filteredOrders: [],
  calendarEvents: [],
  sidebarGroups: [],
  summary: {
    total: 0,
    scheduled: 0,
    unassigned: 0,
    conflicts: 0,
  },
};

describe('SchedulingPage shell', () => {
  it('renders the agenda shell with filters and placeholder regions', () => {
    const queryClient = new QueryClient();
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ToastProvider>
            <MemoryRouter>
              <SchedulingPageContent
                filters={filters}
                onFiltersChange={() => undefined}
                data={data}
                isLoading={false}
              />
            </MemoryRouter>
          </ToastProvider>
        </I18nProvider>
      </QueryClientProvider>,
    );

    expect(html).toContain('scheduling.title.default');
    expect(html).toContain('scheduling.filters.title');
    expect(html).toContain('scheduling.operational.calendar.title');
    expect(html).toContain('scheduling.details.select');
  });
});
