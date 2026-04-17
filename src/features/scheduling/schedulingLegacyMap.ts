export type SchedulingLegacyDependency = {
  area: 'data' | 'mutation' | 'query' | 'type';
  key: string;
  detail: string;
};

export const schedulingLegacyDependencies: SchedulingLegacyDependency[] = [
  {
    area: 'data',
    key: 'appointments-fallback',
    detail: 'SchedulingPage sigue usando appointments como fallback cuando serviceOrders no tiene datos canónicos.'
  },
  {
    area: 'type',
    key: 'appointment-shape',
    detail: 'Completion, series y schedulingItem todavía dependen parcialmente del shape Appointment.'
  }
];
