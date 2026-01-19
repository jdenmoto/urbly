export const recurrenceOptions = ['semanal', 'quincenal', 'mensual', 'bimensual', 'semestral'] as const;

export type RecurrenceValue = (typeof recurrenceOptions)[number];
