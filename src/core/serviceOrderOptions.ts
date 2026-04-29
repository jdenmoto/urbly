export const recurrenceOptions = ['semanal', 'quincenal', 'mensual', 'bimensual', 'semestral'] as const;

export type RecurrenceValue = (typeof recurrenceOptions)[number];

export const serviceTypeOptions = [
  'mantenimiento',
  'lavado_tanque',
  'emergencia',
  'interventoria'
] as const;

export type ServiceTypeValue = (typeof serviceTypeOptions)[number];

export const cancelReasonOptions = [
  'cliente',
  'personal',
  'clima',
  'reprogramado',
  'otro'
] as const;

export type CancelReasonValue = (typeof cancelReasonOptions)[number];

export const serviceIssueTypeOptions = ['operativo', 'seguridad', 'infraestructura', 'otro'] as const;
export type ServiceIssueTypeValue = (typeof serviceIssueTypeOptions)[number];

export const serviceIssueCategoryOptions: Record<ServiceIssueTypeValue, string[]> = {
  operativo: ['limpieza', 'mantenimiento', 'logistica'],
  seguridad: ['acceso', 'incidente', 'prevencion'],
  infraestructura: ['electricidad', 'plomeria', 'estructura'],
  otro: ['general']
};
