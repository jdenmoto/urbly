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
    area: 'mutation',
    key: 'appointment-naming',
    detail: 'Las mutaciones de agenda conservan naming legacy: saveAppointment, moveAppointmentOnCalendar, cancelAppointment y deleteAppointment.'
  },
  {
    area: 'query',
    key: 'appointments-query',
    detail: 'SchedulingPage invalida todavía la query appointments como parte del flujo principal de agenda.'
  },
  {
    area: 'type',
    key: 'appointment-shape',
    detail: 'Completion, series y schedulingItem todavía dependen parcialmente del shape Appointment.'
  }
];
