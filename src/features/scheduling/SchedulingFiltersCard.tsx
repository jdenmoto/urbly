import type { Dispatch, SetStateAction } from 'react';
import Card from '@/components/Card';
import Input from '@/components/Input';
import type { Building } from '@/core/models/building';
import { useI18n } from '@/lib/i18n';
import type { SchedulingFiltersState } from './useSchedulingFilters';

export default function SchedulingFiltersCard({
  selectedFilterBuilding,
  filtersOpen,
  setFiltersOpen,
  filterBuildingSearch,
  setFilterBuildingSearch,
  filterDropdownOpen,
  setFilterDropdownOpen,
  activeBuildings,
  filters,
  setFilters
}: {
  selectedFilterBuilding: Building | null;
  filtersOpen: boolean;
  setFiltersOpen: Dispatch<SetStateAction<boolean>>;
  filterBuildingSearch: string;
  setFilterBuildingSearch: Dispatch<SetStateAction<string>>;
  filterDropdownOpen: boolean;
  setFilterDropdownOpen: Dispatch<SetStateAction<boolean>>;
  activeBuildings: Building[];
  filters: SchedulingFiltersState;
  setFilters: Dispatch<SetStateAction<SchedulingFiltersState>>;
}) {
  const { t } = useI18n();

  return (
    <>
      {selectedFilterBuilding ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <div className="space-y-1">
            <p className="font-semibold">Contexto operativo activo</p>
            <p>Estás programando o revisando agenda para el edificio {selectedFilterBuilding.name}.</p>
            <p className="text-xs text-sky-700">Siguiente paso sugerido: revisar agenda existente o crear un nuevo servicio ya asociado a este edificio.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-100"
            onClick={() => {
              setFilters((prev) => ({ ...prev, buildingId: '' }));
              setFilterBuildingSearch('');
            }}
          >
            Limpiar contexto
          </button>
        </div>
      ) : null}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-800">{t('scheduling.filtersTitle')}</h3>
          <button className="text-xs font-semibold text-ink-600" onClick={() => setFiltersOpen((prev) => !prev)}>
            {filtersOpen ? t('common.hideFilters') : t('common.showFilters')}
          </button>
        </div>
        {filtersOpen ? (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1 space-y-1 text-sm text-ink-700">
              <label className="font-medium text-ink-800">{t('scheduling.building')}</label>
              <div className="relative">
                <input
                  value={filterBuildingSearch}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilterBuildingSearch(value);
                    const match = activeBuildings.find((building) => building.name.toLowerCase() === value.trim().toLowerCase());
                    setFilters((prev) => ({ ...prev, buildingId: match ? match.id : '' }));
                  }}
                  onFocus={() => setFilterDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setFilterDropdownOpen(false), 100)}
                  placeholder={t('scheduling.searchBuilding')}
                  className="w-full rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-900"
                />
                {filterDropdownOpen ? (
                  <div className="absolute z-20 mt-2 w-full rounded-lg border border-fog-200 bg-white shadow-soft">
                    <div className="max-h-[220px] overflow-y-auto py-1">
                      {activeBuildings
                        .filter((building) => building.name.toLowerCase().includes(filterBuildingSearch.toLowerCase()))
                        .map((building) => (
                          <button
                            key={building.id}
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink-700 hover:bg-fog-100"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              setFilterBuildingSearch(building.name);
                              setFilters((prev) => ({ ...prev, buildingId: building.id }));
                              setFilterDropdownOpen(false);
                            }}
                          >
                            {building.name}
                          </button>
                        ))}
                      {!activeBuildings.length ? <div className="px-3 py-2 text-xs text-ink-500">{t('common.noResults')}</div> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="w-[160px]">
              <Input
                label={t('scheduling.from')}
                type="date"
                value={filters.from}
                onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
              />
            </div>
            <div className="w-[160px]">
              <Input
                label={t('scheduling.to')}
                type="date"
                value={filters.to}
                onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
              />
            </div>
          </div>
        ) : null}
      </Card>
    </>
  );
}
