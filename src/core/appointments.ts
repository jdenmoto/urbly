export const recurrenceOptions = ['semanal', 'quincenal', 'mensual', 'bimensual', 'semestral'] as const;

export type RecurrenceValue = (typeof recurrenceOptions)[number];

export const appointmentTypeOptions = ['mantenimiento', 'inspeccion', 'servicio', 'emergencia', 'otro'] as const;

export type AppointmentTypeValue = (typeof appointmentTypeOptions)[number];

export const cancelReasonOptions = [
  'cliente',
  'personal',
  'clima',
  'reprogramado',
  'otro'
] as const;

export type CancelReasonValue = (typeof cancelReasonOptions)[number];
