# Auditoría legacy — 2026-04-27

## Resumen ejecutivo
La frontera canónica actual existe, pero todavía no gobierna todo el producto.

### Frontera canónica real hoy
- `src/lib/api/serviceOrders.ts#resolveServiceOrders`
- `src/lib/api/queries.ts#useServiceOrders`
- `src/lib/api/queries.ts#useTenantServiceOrders`

### Problema principal
Aunque la capa canónica ya existe, todavía hay consumidores y flujos que:
- leen `appointments` directamente
- convierten shape legacy fuera de la capa API
- mantienen limpieza defensiva de `appointments` en scheduling/series
- generan reportes backend sobre `appointments`

---

## Clasificación por archivo

### A. Adapters permitidos por ahora
Estos usos son aceptables temporalmente porque están exactamente en la frontera de compatibilidad.

#### `src/lib/api/serviceOrders.ts`
- importa `Appointment`
- mapea `Appointment` → `ServiceOrder`
- expone `resolveServiceOrders`
- centraliza fallback cuando `service_orders` está vacío

**Clasificación:** adapter permitido / fallback temporal controlado

#### `src/lib/api/queries.ts`
- construye `ServiceOrder[]` desde `appointments`
- hidrata `service_orders` canónicos
- todavía mezcla fetch canónico + fetch legacy

**Clasificación:** compatibilidad temporal aceptable, pero demasiado expuesta

---

### B. Deuda alta que debe salir de esta ola

#### `src/features/buildings/BuildingsPage.tsx`
- lee `appointments` directamente con `useList<Appointment>('appointments', 'appointments')`
- llama `buildServiceOrders(...)` localmente
- bypassa `useServiceOrders` / `useTenantServiceOrders`

**Problema:** la pantalla de edificios rehace la transición en vez de consumir el contrato canónico.

**Clasificación:** deuda alta

#### `src/features/scheduling/schedulingItem.ts`
- mantiene `SchedulingItem.source = 'appointment' | 'service_order'`
- mantiene `issues?: Appointment['issues']`
- contiene `mapAppointmentToSchedulingItem`

**Problema:** el modelo intermedio de scheduling todavía arrastra shape legacy al centro de la UI.

**Clasificación:** deuda alta

#### `src/features/scheduling/schedulingSeries.ts`
- conserva `buildAppointmentPayload`
- aún borra `appointments` cuando `current?.source === 'appointment'`
- traduce status con `mapAppointmentStatusToServiceOrderStatus`

**Problema:** la regeneración de series todavía limpia/absorbe legacy dentro del flujo operativo.

**Clasificación:** deuda alta / zona de riesgo

#### `functions/src/reports.ts`
- genera PDF leyendo `appointments`
- consulta `appointments` para servicios del rango y también para mantenimiento anual

**Problema:** backend/reportes sigue tomando el modelo legacy como fuente primaria.

**Clasificación:** deuda alta

---

### C. Deuda media

#### `src/features/scheduling/SchedulingPage.tsx`
Responsabilidades activas detectadas:
1. fetch de datos y settings
2. filtros y vista calendario/lista
3. tabla operativa
4. detalle del servicio
5. mapa de dependencias legacy en UI
6. wizard de crear/editar
7. cancelación
8. borrado
9. cierre técnico completo
10. generación de PDF
11. visor de fotos
12. lógica de checklist extensa

**Problema:** demasiadas responsabilidades vivas en un solo módulo.

**Clasificación:** deuda media-alta estructural

#### `src/features/scheduling/schedulingLegacyMap.ts`
- documenta bien la transición
- confirma que todavía existe cleanup de `appointments`

**Clasificación:** deuda media, pero útil como mapa de transición

#### `src/features/services/useOperationalServiceOrders.ts`
- ya consume `useTenantServiceOrders`
- no arrastra lógica propia

**Clasificación:** consumo correcto; no es deuda, pero confirma cuál debe ser el patrón

---

## Backend legacy

### Reportes alineados al modelo nuevo
- `functions/src/serviceReports.ts` ya lee `service_orders`
- `functions/src/clientPortal.ts` ya lee/escribe `service_orders`

### Reporte desalineado
- `functions/src/reports.ts` sigue anclado a `appointments`

**Conclusión backend:** el producto ya tiene convivencia híbrida; falta cerrar reportes PDF históricos.

---

## Primer corte de código recomendado

### Corte 1 — cerrar bypass de BuildingsPage
Mover `BuildingsPage` a consumo canónico y evitar `useList<Appointment>` + `buildServiceOrders(...)` en UI.

**Archivos:**
- `src/features/buildings/BuildingsPage.tsx`
- `src/lib/api/queries.ts`

### Corte 2 — delimitar SchedulingPage sin tocar la zona riesgosa todavía
Extraer primero bloques baratos:
- resumen de dependencias legacy
- paneles auxiliares / detalle visual
- filtros/presentación si el corte sale limpio

**Archivos:**
- `src/features/scheduling/SchedulingPage.tsx`
- componentes auxiliares nuevos si aplica

### Corte 3 — preparar migración de series/reportes
No ejecutar a ciegas. Antes de tocar:
- `src/features/scheduling/schedulingSeries.ts`
- `functions/src/reports.ts`

Hay que definir regla explícita de compatibilidad temporal.

---

## Prioridad resultante

### Alta
1. `src/features/buildings/BuildingsPage.tsx`
2. `src/features/scheduling/schedulingItem.ts`
3. `src/features/scheduling/schedulingSeries.ts`
4. `functions/src/reports.ts`

### Media
5. `src/features/scheduling/SchedulingPage.tsx`
6. `src/lib/api/queries.ts`

### Baja / estable por ahora
7. `src/lib/api/serviceOrders.ts`
8. `src/features/services/useOperationalServiceOrders.ts`

---

## Criterio para pasar a la siguiente tarea
La siguiente tarea debería arrancar por el corte más barato con ROI alto:
- dejar `BuildingsPage` consumiendo el contrato canónico
- luego delimitar extracción inicial de `SchedulingPage`
