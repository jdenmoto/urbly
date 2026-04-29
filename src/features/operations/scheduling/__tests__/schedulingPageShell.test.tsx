import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

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
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SchedulingPageContent
          filters={filters}
          onFiltersChange={() => undefined}
          data={data}
          isLoading={false}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('Agenda operativa');
    expect(html).toContain('Filtros');
    expect(html).toContain('Calendario operativo');
    expect(html).toContain('Resumen lateral');
  });
});
