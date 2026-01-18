export const recurrenceOptions = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'bimensual', label: 'Bimensual' },
  { value: 'semestral', label: 'Semestral' }
] as const;

export type RecurrenceValue = (typeof recurrenceOptions)[number]['value'];
