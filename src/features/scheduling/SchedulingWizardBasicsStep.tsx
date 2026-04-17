import type { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import type { Building } from '@/core/models/building';
import type { SchedulingFormValues } from './schedulingSeries';
import Input from '@/components/Input';
import Select from '@/components/Select';

type ServiceTypeOption = {
  id: string;
  code: string;
  name: string;
};

type Props = {
  t: (key: string) => string;
  buildings: Building[];
  filteredBuildings: Building[];
  buildingSearch: string;
  buildingDropdownOpen: boolean;
  setBuildingSearch: (value: string) => void;
  setBuildingDropdownOpen: (value: boolean) => void;
  setValue: UseFormSetValue<SchedulingFormValues>;
  register: UseFormRegister<SchedulingFormValues>;
  errors: FieldErrors<SchedulingFormValues>;
  serviceTypes: ServiceTypeOption[];
};

export default function SchedulingWizardBasicsStep(props: Props) {
  const {
    t,
    buildings,
    filteredBuildings,
    buildingSearch,
    buildingDropdownOpen,
    setBuildingSearch,
    setBuildingDropdownOpen,
    setValue,
    register,
    errors,
    serviceTypes
  } = props;

  return (
    <>
      <div className="space-y-1 text-sm text-ink-700">
        <label className="font-medium text-ink-800">
          {t('scheduling.building')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            value={buildingSearch}
            onChange={(event) => {
              const value = event.target.value;
              setBuildingSearch(value);
              setBuildingDropdownOpen(true);
              const match = buildings.find((building) => building.name.toLowerCase() === value.trim().toLowerCase());
              setValue('buildingId', match ? match.id : '', { shouldValidate: true });
            }}
            onFocus={() => setBuildingDropdownOpen(true)}
            onBlur={() => {
              setTimeout(() => setBuildingDropdownOpen(false), 100);
            }}
            placeholder={t('scheduling.searchBuilding')}
            className={[
              'w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-900',
              errors.buildingId ? 'border-red-400 focus:border-red-500' : 'border-fog-200'
            ].join(' ')}
          />
          {buildingDropdownOpen ? (
            <div className="absolute z-20 mt-2 w-full rounded-lg border border-fog-200 bg-white shadow-soft">
              <div className="max-h-[220px] overflow-y-auto py-1">
                {filteredBuildings.map((building) => (
                  <button
                    key={building.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink-700 hover:bg-fog-100"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setBuildingSearch(building.name);
                      setValue('buildingId', building.id, { shouldValidate: true });
                      setBuildingDropdownOpen(false);
                    }}
                  >
                    {building.name}
                  </button>
                ))}
                {!filteredBuildings.length ? (
                  <div className="px-3 py-2 text-xs text-ink-500">{t('common.noResults')}</div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        {errors.buildingId ? <span className="text-xs text-red-500">{errors.buildingId.message}</span> : null}
        <input type="hidden" {...register('buildingId')} />
      </div>
      <Input label={t('scheduling.titleLabel')} error={errors.title?.message} required {...register('title')} />
      <Input label={t('scheduling.description')} {...register('description')} />
      <Select label={t('scheduling.type')} error={errors.type?.message} required {...register('type')}>
        <option value="">{t('common.select')}</option>
        {serviceTypes.map((option) => (
          <option key={option.id} value={option.code}>
            {t(`scheduling.types.${option.code}`) !== `scheduling.types.${option.code}` ? t(`scheduling.types.${option.code}`) : option.name}
          </option>
        ))}
      </Select>
    </>
  );
}
