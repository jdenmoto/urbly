# TS-01 — Especificación técnica

# Definir modelo de datos base para agenda, servicios y edificios

## Estado

Draft técnico inicial, aterrizado contra el código actual del proyecto.

## Objetivo

Unificar y endurecer el modelo base del dominio para soportar:

- programación de servicios
- agenda multirol
- ficha de edificio como nodo central
- grupos de asignación
- reportes operativos
- cotizaciones y trazabilidad futura
- auditoría transversal

La meta de TS-01 no es implementar toda la lógica, sino dejar definido un modelo técnico coherente sobre el cual puedan construirse TS-02, TS-03, TS-04, TS-05, TS-06, TS-07 y TS-11 sin retrabajo estructural fuerte.

---

## 1. Hallazgo principal sobre el código actual

Hoy el dominio ya existe, pero está fragmentado.

### Modelos actuales detectados

#### `Building`
Archivo: `src/core/models/building.ts`

Ya contiene:

- `id`
- `name`
- `group`
- `type`
- `delegateName`
- `delegatePhone`
- `nit`
- `email`
- `billingEmail`
- `porterPhone`
- `managementCompanyId`
- `contractId`
- `addressText`
- `location`
- `googlePlaceId`
- `active`
- `createdAt`

#### `Appointment`
Archivo: `src/core/models/appointment.ts`

Hoy modela gran parte de la programación:

- `buildingId`
- `title`
- `description`
- `startAt`
- `endAt`
- `status`
- `type`
- `employeeId`
- `recurrence`
- `seriesId`
- `issues`
- `completionPhotos`
- `completionReport`

#### `ServiceOrder`
Archivo: `src/core/models/serviceOrder.ts`

Ya representa mejor una orden operativa y tiene:

- `buildingId`
- `contractId`
- `title`
- `type`
- `priority`
- `status`
- `scheduledStartAt`
- `scheduledEndAt`
- `assignedTechnicianId`
- `report`
- `issues`
- `attachments`
- `completionPhotos`
- `timeline`
- `communication`

### Conclusión técnica

El sistema hoy parece convivir con dos ejes de dominio:

1. `Appointment` como agenda/calendario
2. `ServiceOrder` como entidad operativa más rica

Eso genera riesgo de duplicación y ambigüedad si no se define una fuente de verdad clara.

---

## 2. Decisión arquitectónica recomendada

## Recomendación fuerte

La entidad operativa principal debe evolucionar hacia **ServiceOrder** como agregado raíz del servicio.

`Appointment` no debería seguir creciendo como modelo paralelo completo.

### Rol recomendado de cada pieza

#### `ServiceOrder`
Fuente de verdad del servicio.

Debe contener:

- identidad del servicio
- contexto comercial y operativo
- programación
- asignación
- estado operativo
- datos de ejecución
- vínculo a reportes
- trazabilidad principal

#### `Appointment`
Debe reducirse a una de estas dos opciones:

### Opción A, recomendada
Usarlo como representación derivada o proyección de calendario de `ServiceOrder`.

### Opción B
Eliminarlo progresivamente como modelo primario y dejar solo compatibilidad temporal.

### Decisión recomendada para TS-01
Definir **ServiceOrder como canónico** y dejar `Appointment` como modelo legado o proyección temporal.

---

## 3. Modelo de dominio base propuesto

## 3.1 Building

### Estado actual
Ya existe, pero necesita evolucionar.

### Propuesta

```ts
export type Building = {
  id: string;
  name: string;
  type: 'EDIFICIO' | 'CONJUNTO_RESIDENCIAL' | 'UNIDAD';
  managementCompanyId: string;
  contractId?: string | null;

  addressText: string;
  location: { lat: number; lng: number };
  googlePlaceId?: string;

  contactName?: string;
  contactPhone?: string;
  porterPhone?: string;
  email?: string;
  billingEmail?: string;
  nit?: string;

  assignmentGroupId?: string | null;

  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
```

### Ajustes respecto al modelo actual

- `group` debe migrar hacia `assignmentGroupId`
- `delegateName` debería normalizarse a `contactName`
- `delegatePhone` debería normalizarse a `contactPhone`
- agregar `updatedAt`
- agregar `deletedAt` para soft delete

---

## 3.2 AssignmentGroup

No existe aún como entidad fuerte. Debe crearse.

```ts
export type AssignmentGroupRule = {
  id: string;
  type: 'geographic' | 'route' | 'manual';
  description?: string;
  active: boolean;
};

export type AssignmentGroup = {
  id: string;
  name: string;
  color: string;
  buildingIds?: string[];
  rules?: AssignmentGroupRule[];
  active: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
```

### Nota

Aunque el grupo aplica inmediato, igual conviene guardar timestamps y soft delete.
No hace falta versionado completo en V1, pero sí trazabilidad de cambios.

---

## 3.3 ServiceOrder

Debe consolidarse como entidad principal.

```ts
export type ServiceOrderStatus =
  | 'pendiente_de_asignacion'
  | 'programado'
  | 'reprogramado'
  | 'en_curso'
  | 'ejecutado'
  | 'reportado'
  | 'en_revision'
  | 'cerrado'
  | 'con_novedad'
  | 'cancelado';

export type ServiceOrderScheduleType = 'unico' | 'recurrente' | 'emergencia';

export type ServiceOrderRescheduleType =
  | 'operativa'
  | 'emergencia'
  | 'solicitud_cliente';

export type ServiceOrderAssignment = {
  primaryOperatorId?: string | null;
  companionOperatorIds?: string[];
  pendingAssignment: boolean;
};

export type ServiceOrderSchedule = {
  startAt: string;
  endAt: string;
  scheduleType: ServiceOrderScheduleType;
  recurrenceRuleId?: string | null;
  seriesId?: string | null;
  rescheduleType?: ServiceOrderRescheduleType | null;
  rescheduleReason?: string | null;
  wasDisplacedByEmergency?: boolean;
};

export type ServiceOrder = {
  id: string;
  buildingId: string;
  contractId?: string | null;
  quotationId?: string | null;

  title: string;
  description?: string;
  serviceTypeId: string;
  serviceTypeName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: ServiceOrderStatus;

  assignment: ServiceOrderAssignment;
  schedule: ServiceOrderSchedule;

  reportId?: string | null;
  customerVisibleSummary?: string | null;

  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
```

### Comentario

Esta estructura separa mejor:

- programación
- asignación
- estado
- vínculo comercial
- vínculo a reporte

Y deja de depender de campos dispersos como `employeeId`, `recurrence` o `completionReport` sueltos.

---

## 3.4 RecurrenceRule

Hoy la recurrencia está simplificada como string. Eso no alcanza.

```ts
export type RecurrenceFrequency =
  | 'semanal'
  | 'quincenal'
  | 'mensual'
  | 'bimensual'
  | 'trimestral'
  | 'cada_x_dias';

export type RecurrenceRule = {
  id: string;
  frequency: RecurrenceFrequency;
  interval?: number;
  endType: 'until_date' | 'occurrences';
  endAt?: string;
  occurrences?: number;
  excludedDates?: string[];
  moveToNextBusinessDay: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};
```

---

## 3.5 ServiceReport

Hoy el reporte está embebido o disperso. Debe volverse entidad propia.

```ts
export type ServiceReportStatus =
  | 'borrador'
  | 'completado_por_operador'
  | 'en_revision_supervisor'
  | 'devuelto_para_ajustes'
  | 'aprobado';

export type ServiceReport = {
  id: string;
  serviceOrderId: string;
  buildingId: string;
  operatorId: string;

  status: ServiceReportStatus;

  entryHour?: string;
  exitHour?: string;
  observations?: string;
  structuredObservations?: Array<{
    id: string;
    finding?: string;
    impact?: string;
    recommendedAction?: string;
    priority?: string;
    componentKey?: string;
    evidencePhotoIds?: string[];
  }>;

  checklist?: Record<string, unknown>;
  photoIds?: string[];
  signatureUrl?: string | null;
  geo?: { lat: number; lng: number } | null;
  geoJustification?: string | null;

  dailyProgressIds?: string[];
  aiSummary?: string | null;
  customerSummary?: string | null;

  completedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
```

---

## 3.6 ServiceReportDailyProgress

Para servicios largos.

```ts
export type ServiceReportDailyProgress = {
  id: string;
  serviceOrderId: string;
  reportId?: string | null;
  date: string;
  notes?: string;
  checklist?: Record<string, unknown>;
  photoIds?: string[];
  dayStatus?: 'pendiente' | 'en_progreso' | 'completado';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
```

---

## 3.7 Quotation
n
TS-11 lo desarrollará más, pero TS-01 debe dejar el espacio.

```ts
export type QuotationStatus =
  | 'borrador'
  | 'generado'
  | 'en_revision_supervisor'
  | 'rechazado_interno'
  | 'aprobado_interno'
  | 'listo_para_entrega'
  | 'entregado_al_cliente'
  | 'en_revision_cliente'
  | 'cambios_solicitados_por_cliente'
  | 'aprobado_por_cliente'
  | 'rechazado_por_cliente'
  | 'vencido'
  | 'anulado';

export type Quotation = {
  id: string;
  version: number;
  status: QuotationStatus;
  customerId?: string | null;
  buildingIds?: string[];
  contractDraftId?: string | null;
  secureTokenId?: string | null;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
```

---

## 3.8 AuditEvent

La auditoría debe ser transversal, no un parche.

```ts
export type AuditEntityType =
  | 'building'
  | 'assignment_group'
  | 'service_order'
  | 'service_report'
  | 'quotation'
  | 'notification'
  | 'ai_suggestion';

export type AuditEvent = {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  actorId?: string;
  actorRole?: string;
  summary: string;
  diff?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
```

---

## 4. Regla de soft delete

Todas las entidades operativas principales deben soportar:

- `deletedAt?: string | null`

Y opcionalmente:

- `deletedBy?: string | null`

### Aplica mínimo a

- `Building`
- `AssignmentGroup`
- `ServiceOrder`
- `ServiceReport`
- `ServiceReportDailyProgress`
- `Quotation`

---

## 5. Estrategia de migración desde el modelo actual

## 5.1 Building

Migración relativamente simple:

- `group` -> `assignmentGroupId` o compatibilidad temporal
- normalizar campos de contacto
- agregar timestamps faltantes

## 5.2 Appointment

No conviene borrarlo de entrada.

### Estrategia recomendada

- mantener lectura compatible en corto plazo
- dejar de enriquecerlo como fuente primaria
- mover nueva lógica operativa a `ServiceOrder`
- crear adaptadores si FullCalendar aún depende de `Appointment`

## 5.3 ServiceOrder

Debe enriquecerse y absorber:

- asignación avanzada
- recurrencia estructurada
- estados reales del negocio
- vínculo a reportes
- contexto comercial

## 5.4 Completion report embebido

`completionReport` y `report` deberían migrar gradualmente a `ServiceReport`.

---

## 6. Decisiones de implementación para TS-01

TS-01 debe producir estos entregables concretos.

### Entregable 1
Documento técnico final del modelo canónico.

### Entregable 2
Mapa de migración desde:

- `Building`
- `Appointment`
- `ServiceOrder`

### Entregable 3
Definición de qué entidad es fuente de verdad por caso:

- agenda
- servicio
- reporte
- cotización
- auditoría

### Entregable 4
Lista de breaking changes potenciales.

---

## 7. Breaking changes probables

1. cambio de `building.group` a `assignmentGroupId`
2. deprecación progresiva de `Appointment` como modelo primario
3. cambio de `employeeId` a estructura de asignación con operador principal y acompañantes
4. cambio de reportes embebidos a entidad separada
5. expansión de estados operativos actuales

---

## 8. Criterios de aceptación refinados para TS-01

- existe definición explícita de entidad canónica para servicios
- existe definición explícita de entidad canónica para reportes
- existe propuesta de entidad `AssignmentGroup`
- existe propuesta de `RecurrenceRule`
- existe propuesta de `AuditEvent`
- el modelo contempla soft delete
- el documento explica cómo migrar desde `Appointment` y `ServiceOrder`
- el documento deja base suficiente para arrancar TS-02, TS-03 y TS-07

---

## 9. Recomendación de ejecución después de TS-01

Orden recomendado inmediato:

1. TS-02
2. TS-06
3. TS-03
4. TS-04
5. TS-05

Porque TS-01 define la base, pero TS-02 y TS-06 terminan de cerrar el corazón estructural de agenda y edificio.
