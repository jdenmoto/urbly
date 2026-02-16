export const recurrenceOptions = ['semanal', 'quincenal', 'mensual', 'bimensual', 'semestral'] as const;

export type RecurrenceValue = (typeof recurrenceOptions)[number];

export const appointmentTypeOptions = [
  'mantenimiento',
  'lavado_tanque',
  'emergencia',
  'interventoria'
] as const;

export type AppointmentTypeValue = (typeof appointmentTypeOptions)[number];

export const cancelReasonOptions = [
  'cliente',
  'personal',
  'clima',
  'reprogramado',
  'otro'
] as const;

export type CancelReasonValue = (typeof cancelReasonOptions)[number];

export const issueTypeOptions = ['operativo', 'seguridad', 'infraestructura', 'otro'] as const;
export type IssueTypeValue = (typeof issueTypeOptions)[number];

export const issueCategoryOptions: Record<IssueTypeValue, string[]> = {
  operativo: ['limpieza', 'mantenimiento', 'logistica'],
  seguridad: ['acceso', 'incidente', 'prevencion'],
  infraestructura: ['electricidad', 'plomeria', 'estructura'],
  otro: ['general']
};
