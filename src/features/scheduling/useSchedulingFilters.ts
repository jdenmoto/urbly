import { useEffect, useMemo, useState } from 'react';
import type { Building } from '@/core/models/building';

export type SchedulingFiltersState = {
  buildingId: string;
  from: string;
  to: string;
};

export default function useSchedulingFilters({
  searchParams,
  activeBuildings
}: {
  searchParams: URLSearchParams;
  activeBuildings: Building[];
}) {
  const [filters, setFilters] = useState<SchedulingFiltersState>({ buildingId: '', from: '', to: '' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterBuildingSearch, setFilterBuildingSearch] = useState('');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  useEffect(() => {
    const buildingId = searchParams.get('buildingId') ?? '';
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';

    setFilters((prev) => ({
      ...prev,
      buildingId: buildingId || prev.buildingId,
      from: from || prev.from,
      to: to || prev.to
    }));

    if (buildingId) {
      const matchedBuilding = activeBuildings.find((building) => building.id === buildingId);
      if (matchedBuilding) {
        setFilterBuildingSearch(matchedBuilding.name);
        setFiltersOpen(true);
      }
    }
  }, [searchParams, activeBuildings]);

  const selectedFilterBuilding = useMemo(
    () => activeBuildings.find((building) => building.id === filters.buildingId) ?? null,
    [activeBuildings, filters.buildingId]
  );

  return {
    filters,
    setFilters,
    filtersOpen,
    setFiltersOpen,
    filterBuildingSearch,
    setFilterBuildingSearch,
    filterDropdownOpen,
    setFilterDropdownOpen,
    selectedFilterBuilding
  };
}
