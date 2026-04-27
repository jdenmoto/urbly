import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { Employee } from '@/core/models/employee';
import type { SchedulingFormValues } from './schedulingSeries';
import Input from '@/components/Input';
import Select from '@/components/Select';

type AssignmentSuggestion = {
  employeeId: string;
  score: number;
  reason: string;
};

type Props = {
  t: (key: string) => string;
  errors: FieldErrors<SchedulingFormValues>;
  register: UseFormRegister<SchedulingFormValues>;
  setValue: UseFormSetValue<SchedulingFormValues>;
  employees: Employee[];
  assignmentSuggestions: AssignmentSuggestion[];
  recurrenceOptions: readonly string[];
  selectedType?: string;
};

export default function SchedulingWizardScheduleStep(props: Props) {
  const { t, errors, register, setValue, employees, assignmentSuggestions, recurrenceOptions, selectedType } = props;

  return (
    <>
      <Input label={t('scheduling.startAt')} type="datetime-local" error={errors.startAt?.message} required {...register('startAt')} />
      <Input label={t('scheduling.endAt')} type="datetime-local" error={errors.endAt?.message} required {...register('endAt')} />
      <Select label={t('scheduling.status')} error={errors.status?.message} required {...register('status')}>
        <option value="programado">{t('scheduling.statusProgrammed')}</option>
        <option value="confirmado">{t('scheduling.statusConfirmed')}</option>
        <option value="completado">{t('scheduling.statusCompleted')}</option>
      </Select>
      <Select label={t('scheduling.employee')} error={errors.employeeId?.message} {...register('employeeId')}>
        <option value="">{t('common.unassigned')}</option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.fullName}
          </option>
        ))}
      </Select>
      {assignmentSuggestions.length ? (
        <div className="rounded-xl border border-fog-200 bg-fog-50 p-3 text-sm text-ink-700">
          <p className="font-semibold text-ink-900">{t('scheduling.assignmentSuggestionsTitle')}</p>
          <div className="mt-2 space-y-2">
            {assignmentSuggestions.map((suggestion) => {
              const employee = employees.find((item) => item.id === suggestion.employeeId);
              return (
                <button
                  key={suggestion.employeeId}
                  type="button"
                  className="block w-full rounded-lg border border-fog-200 bg-white px-3 py-2 text-left hover:bg-fog-100"
                  onClick={() => setValue('employeeId', suggestion.employeeId, { shouldValidate: true })}
                >
                  <p className="font-medium text-ink-900">{employee?.fullName ?? suggestion.employeeId} · {t('scheduling.assignmentScoreLabel')} {suggestion.score}</p>
                  <p className="text-xs text-ink-500">{suggestion.reason}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <Select label={t('scheduling.recurrence')} error={errors.recurrence?.message} disabled={selectedType === 'emergencia'} {...register('recurrence')}>
        <option value="">{t('scheduling.noRecurrence')}</option>
        {recurrenceOptions.map((option) => (
          <option key={option} value={option}>
            {t(`scheduling.recurrenceOptions.${option}`)}
          </option>
        ))}
      </Select>
    </>
  );
}
