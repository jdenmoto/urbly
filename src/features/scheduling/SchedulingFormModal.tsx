import Button from '@/components/Button';
import Modal from '@/components/Modal';
import SchedulingWizardBasicsStep from './SchedulingWizardBasicsStep';
import SchedulingWizardScheduleStep from './SchedulingWizardScheduleStep';
import SchedulingWizardSummary from './SchedulingWizardSummary';

export default function SchedulingFormModal({
  open,
  canEdit,
  editingId,
  onClose,
  handleSubmit,
  onSubmit,
  wizardSteps,
  wizardStep,
  prevWizardStep,
  nextWizardStep,
  isSubmitting,
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
  serviceTypes,
  selectedBuilding,
  employees,
  assignmentSuggestions,
  recurrenceOptions,
  selectedType,
  getValues,
  resolvedTypeLabel
}: {
  open: boolean;
  canEdit: boolean;
  editingId: string | null;
  onClose: () => void;
  handleSubmit: any;
  onSubmit: any;
  wizardSteps: readonly { id: 1 | 2 | 3; title: string }[];
  wizardStep: 1 | 2 | 3;
  prevWizardStep: () => void;
  nextWizardStep: () => void;
  isSubmitting: boolean;
  t: (key: string) => string;
  buildings: any[];
  filteredBuildings: any[];
  buildingSearch: string;
  buildingDropdownOpen: boolean;
  setBuildingSearch: any;
  setBuildingDropdownOpen: any;
  setValue: any;
  register: any;
  errors: any;
  serviceTypes: any[];
  selectedBuilding: any;
  employees: any[];
  assignmentSuggestions: any[];
  recurrenceOptions: readonly string[];
  selectedType: string;
  getValues: any;
  resolvedTypeLabel: string;
}) {
  if (!canEdit) return null;

  return (
    <Modal open={open} title={editingId ? t('scheduling.update') : t('scheduling.create')} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {wizardSteps.map((step) => (
              <div
                key={step.id}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${wizardStep === step.id ? 'bg-slate-950 text-white' : wizardStep > step.id ? 'bg-emerald-100 text-emerald-700' : 'bg-fog-100 text-ink-600'}`}
              >
                {step.id}. {step.title}
              </div>
            ))}
          </div>

          {wizardStep === 1 ? (
            <SchedulingWizardBasicsStep
              t={t}
              buildings={buildings}
              filteredBuildings={filteredBuildings}
              buildingSearch={buildingSearch}
              buildingDropdownOpen={buildingDropdownOpen}
              setBuildingSearch={setBuildingSearch}
              setBuildingDropdownOpen={setBuildingDropdownOpen}
              setValue={setValue}
              register={register}
              errors={errors}
              serviceTypes={serviceTypes}
              selectedBuilding={selectedBuilding}
            />
          ) : null}

          {wizardStep === 2 ? (
            <SchedulingWizardScheduleStep
              t={t}
              errors={errors}
              register={register}
              setValue={setValue}
              employees={employees}
              assignmentSuggestions={assignmentSuggestions}
              recurrenceOptions={recurrenceOptions}
              selectedType={selectedType}
            />
          ) : null}

          {wizardStep === 3 ? (
            <SchedulingWizardSummary
              buildingId={getValues('buildingId')}
              title={getValues('title')}
              type={getValues('type')}
              startAt={getValues('startAt')}
              endAt={getValues('endAt')}
              employeeId={getValues('employeeId')}
              recurrence={getValues('recurrence')}
              editingId={editingId}
              buildings={buildings}
              employees={employees}
              resolvedTypeLabel={resolvedTypeLabel}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={prevWizardStep} disabled={wizardStep === 1} className="flex-1">
            {t('scheduling.wizardPrevious')}
          </Button>
          {wizardStep < 3 ? (
            <Button type="button" onClick={nextWizardStep} className="flex-1">
              {t('scheduling.wizardNext')}
            </Button>
          ) : (
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? t('scheduling.saving') : editingId ? t('scheduling.wizardSaveReschedule') : t('scheduling.wizardStepCreateService')}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
