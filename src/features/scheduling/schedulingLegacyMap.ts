export type SchedulingLegacyDependency = {
  area: 'data' | 'mutation' | 'query' | 'type';
  key: string;
  detail: string;
};

export const schedulingLegacyDependencies: SchedulingLegacyDependency[] = [
  {
    area: 'query',
    key: 'appointments-fallback-centralized',
    detail: 'El fallback desde appointments sigue existiendo, pero ahora vive centralizado en resolveServiceOrders dentro de src/lib/api/serviceOrders.ts.'
  },
  {
    area: 'type',
    key: 'appointment-shape-boundary',
    detail: 'Appointment queda como contrato legacy de entrada. Scheduling y services consumen ServiceOrder canónico y solo traducen status/shape en adapters puntuales.'
  },
  {
    area: 'mutation',
    key: 'appointments-collection-cleanup',
    detail: 'Aún hay ramas defensivas que borran appointments legacy si un item antiguo reaparece en edición/regeneración de series.'
  },
  {
    area: 'query',
    key: 'services-own-operational-flow',
    detail: 'El seguimiento diario, detalle operativo y cierre viven en /services. Scheduling queda enfocado en agenda, reasignación y reprogramación.'
  }
];
