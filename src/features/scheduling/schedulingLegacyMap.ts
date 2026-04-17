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
    area: 'query',
    key: 'appointments-query',
    detail: 'SchedulingPage todavía invalida la query appointments por compatibilidad legacy, aunque ya invalida también serviceOrders en el flujo principal.'
  },
  {
    area: 'type',
    key: 'appointment-shape',
    detail: 'Completion, series y schedulingItem todavía dependen parcialmente del shape Appointment.'
  }
];
