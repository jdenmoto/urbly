# IMP-01 — Plan de implementación

## Objetivo

Migrar el sistema para que `ServiceOrder` sea la fuente de verdad real del servicio, reduciendo `Appointment` a compatibilidad temporal donde todavía haga falta.

## Estado actual detectado

- existe modelo `ServiceOrder`
- la UI de servicios ya trabaja sobre `ServiceOrder`
- `useServiceOrders()` deriva datos desde `appointments`
- scheduling todavía crea, edita, mueve, cancela y completa sobre colección `appointments`
- funciones backend de reportes también dependen de `appointments`

## Estrategia

Hacer migración por compatibilidad, no big bang.

## Tareas

### T1
Crear capa de acceso real a `service_orders` y fallback compatible desde `appointments`.

### T2
Actualizar queries de servicios para priorizar `service_orders` y usar fallback legacy solo si hace falta.

### T3
Agregar mutaciones base de `service_orders` para crear, actualizar agenda, cancelar y completar.

### T4
Migrar el módulo de scheduling para escribir en `service_orders` en vez de `appointments`.

### T5
Mantener compatibilidad temporal de lectura donde aún se use `Appointment`, minimizando ruptura.

### T6
Actualizar exportación backend y piezas dependientes más obvias para leer `service_orders`.

### T7
Verificar build y corregir regresiones visibles.

## Criterio de cierre

- nuevas operaciones principales de agenda escriben en `service_orders`
- `useServiceOrders()` deja de depender primariamente de `appointments`
- el proyecto compila
- si aparece bloqueo estructural real, crear nueva tarjeta en To Do
