# IMP-01 — Bloqueo detectado

## Resumen

Durante la implementación real de la migración hacia `ServiceOrder` como source of truth, apareció un bloqueo estructural en `SchedulingPage`.

## Lo que sí quedó avanzado

- `useServiceOrders()` ahora soporta colección `service_orders` como fuente primaria con fallback legacy a `appointments`
- se creó enriquecimiento de `ServiceOrder` con relaciones reales
- se introdujeron mutaciones base para `service_orders`:
  - guardar
  - cancelar
  - eliminar
  - mover en calendario
- se adaptó `schedulingSeries.ts` para empezar a generar `service_orders`

## Bloqueo real

`src/features/scheduling/SchedulingPage.tsx` está profundamente acoplada al shape legacy de `Appointment`.

No es solo lectura de lista. También depende de:

- `startAt` / `endAt`
- `employeeId`
- `recurrence`
- `completionReport`
- estados legacy (`programado`, `confirmado`, `completado`, `cancelado`)
- helpers y mutaciones que asumen ese shape
- flujos de selección y completion que esperan `Appointment`

## Implicación

Completar el corte total dentro de IMP-01 sin una refactorización específica del módulo de scheduling aumenta demasiado el riesgo de romper agenda, cierre técnico y build general.

## Decisión

Se creó tarjeta nueva al final de To Do:

- `IMP-30 Refactorizar SchedulingPage para desacoplarla del shape legacy de Appointment y soportar ServiceOrder nativo`

## Recomendación

Cerrar IMP-01 en dos pasos reales:

1. introducir capa base `service_orders` como fuente primaria y mutaciones nuevas
2. ejecutar refactorización controlada del módulo de scheduling en IMP-30

## Estado recomendado de IMP-01

No debe marcarse Done si el proyecto no compila o si la migración funcional sigue incompleta.
Debe quedar visible como bloqueada o moverse según decisión operativa del tablero.