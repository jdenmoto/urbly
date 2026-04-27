# Deuda de implementación actual

Actualizado con auditoría real del código: `project/artifacts/2026-04-27-legacy-flow-audit.md`

## Resumen ejecutivo
La capa canónica `service_orders` ya existe y compila, pero todavía no gobierna todo el producto.

La frontera canónica actual está en:
- `src/lib/api/serviceOrders.ts#resolveServiceOrders`
- `src/lib/api/queries.ts#useServiceOrders`
- `src/lib/api/queries.ts#useTenantServiceOrders`

El problema ya no es ausencia de arquitectura; es **convivencia incompleta** entre capa canónica y consumidores legacy.

---

## Deuda alta

### 1. `BuildingsPage` bypassa la capa canónica
- `src/features/buildings/BuildingsPage.tsx` sigue leyendo `appointments` directamente.
- Reconstruye `ServiceOrder[]` en la UI usando `buildServiceOrders(...)`.
- Esto duplica la transición en una pantalla que debería consumir el contrato canónico.

**Impacto:** mantiene deuda legacy fuera de adapters.

### 2. Scheduling todavía arrastra shape legacy al centro del flujo
- `src/features/scheduling/schedulingItem.ts` conserva `source: 'appointment' | 'service_order'`.
- Sigue usando `Appointment['issues']` y `mapAppointmentToSchedulingItem(...)`.

**Impacto:** la UI operativa todavía depende del contrato viejo.

### 3. Series y edición siguen haciendo cleanup legacy
- `src/features/scheduling/schedulingSeries.ts` aún borra `appointments` cuando reaparece una entidad legacy.
- Conserva traducciones y payloads nombrados desde `appointment`.

**Impacto:** la zona de series/regeneración sigue siendo la parte más riesgosa de la migración.

### 4. Reportes backend siguen anclados a `appointments`
- `functions/src/reports.ts` genera PDF desde la colección `appointments`.
- `serviceReports.ts` y `clientPortal.ts` ya operan con `service_orders`, así que hoy hay convivencia híbrida.

**Impacto:** reportes históricos todavía fijan el modelo viejo como fuente primaria.

---

## Deuda media

### 5. `SchedulingPage` sigue siendo un módulo de demasiadas responsabilidades
Responsabilidades activas detectadas:
- fetch de datos y settings
- filtros y vista calendario/lista
- tabla operativa
- detalle del servicio
- mapa de dependencias legacy
- wizard crear/editar
- cancelación
- borrado
- cierre técnico completo
- generación de PDF
- visor de fotos
- checklist extenso

**Impacto:** dificulta extraer el flujo operativo sin riesgo.

### 6. `src/lib/api/queries.ts` todavía mezcla fetch canónico y fetch legacy
- Hace trabajo válido de compatibilidad.
- Pero sigue exponiendo demasiado conocimiento de la transición.

**Impacto:** la capa canónica existe, pero no está lo bastante blindada.

---

## Deuda baja / temporalmente aceptable

### 7. `src/lib/api/serviceOrders.ts`
- Hoy es el adapter correcto para la migración.
- Su deuda no es existir, sino seguir siendo la única barrera mientras consumers externos la bypassan.

### 8. `src/features/services/useOperationalServiceOrders.ts`
- Ya consume la capa canónica correctamente.
- Sirve como patrón objetivo para mover otros módulos.

---

## Qué entra en el corte actual
1. eliminar bypass de `BuildingsPage`
2. blindar la frontera canónica en queries/service orders
3. delimitar primer corte pequeño de extracción en `SchedulingPage`
4. preparar estrategia explícita antes de tocar series/reportes

## Qué NO entra todavía
1. rediseño visual grande
2. IA nueva
3. refactor profundo de reportes PDF sin definir compatibilidad temporal
4. reescritura completa de scheduling en un solo paso

---

## Recomendación inmediata
Orden recomendado:
1. mover `BuildingsPage` al contrato canónico
2. reducir superficie legacy en scheduling item/queries
3. extraer primer bloque barato de `SchedulingPage`
4. diseñar aparte la migración de series + reportes
