# Deuda de implementación actual

Actualizado: 2026-04-28 después de S5-T2/S5-T3.

## Resumen ejecutivo
La ola actual quedó cerrada en su objetivo principal:
- `service_orders` domina el flujo operativo visible
- `services` es el centro diario del producto
- `SchedulingPage` salió del flujo principal y `/scheduling` quedó como redirect técnico a `/services`
- web y functions ya tienen validación mínima explícita (`npm run build:minimum`)

La deuda fuerte ya no es la migración base. Lo pendiente ahora es **terminar de sacar residuos del namespace `scheduling` y unificar la narrativa final de cierre/reporte**.

## Qué quedó realmente cerrado

### 1. La frontera canónica ya no está siendo bypassada en los frentes principales
- `src/features/buildings/BuildingsPage.tsx` consume `useTenantServiceOrders(...)`.
- `src/lib/api/serviceOrders.ts` y `src/lib/api/queries.ts` siguen siendo la entrada operativa real para `service_orders`.

**Impacto:** el bypass importante detectado en edificios ya no aplica.

### 2. El shape operativo legacy dejó de gobernar la navegación diaria
- `src/features/scheduling/schedulingItem.ts` ya solo expone `source: 'service_order'`.
- `src/app/App.tsx` ya no monta `SchedulingPage`; `/scheduling` solo redirige a `/services`.
- la mayor parte del árbol histórico de scheduling fue eliminada del repo activo.

**Impacto:** el producto dejó de depender de `appointments` como modelo visible de operación.

### 3. Los reportes backend base ya leen `service_orders`
- `functions/src/reports.ts` genera la agenda PDF desde `service_orders`.
- `functions/src/serviceReports.ts` y `functions/src/clientPortal.ts` también operan sobre `service_orders`.

**Impacto:** la deuda de backend anclado a `appointments` ya no describe el estado real.

## Deuda alta

### 1. El cierre técnico todavía reutiliza infraestructura nombrada como `scheduling`
- `src/features/services/serviceCloseoutBridge.ts` sigue adaptando `ServiceCloseoutPage` a `useSchedulingCompletion`, `CompleteServiceModal` y helpers de `src/features/scheduling/*`.
- el dominio ya es correcto, pero la UX operativa final todavía depende de un puente transicional.

**Impacto:** el flujo ya vive en `services`, pero su última milla sigue cargando naming y piezas heredadas.

### 2. Reporte imprimible, reporte textual y PDF todavía no cuentan exactamente la misma historia
- `src/features/services/serviceReport.ts` construye la narrativa textual base.
- `src/features/services/ServiceReportPrintPage.tsx` usa esa narrativa para la vista imprimible.
- `functions/src/serviceReports.ts` todavía serializa `serviceOrder.report` casi crudo en PDF.

**Impacto:** el servicio se puede cerrar y exportar, pero la salida final aún no está totalmente unificada.

## Deuda media

### 3. Quedan residuos legacy pequeños, ya fuera del flujo principal
- `src/core/models/appointment.ts` sigue existiendo aunque ya no tiene imports activos.
- persisten labels y helpers con prefijo `scheduling` que hoy viven solo como compatibilidad interna del cierre.

**Impacto:** no bloquea operación, pero sigue ensuciando el modelo mental del repo.

### 4. El portal cliente ya es usable, pero sigue comprimido en una implementación mínima
- `/portal/services` y `/portal/reports` delegan en `src/features/buildingAdmin/BuildingAdminPage.tsx`.
- alcanza para el walkthrough actual, pero todavía no separa con claridad experiencia de servicios vs experiencia de reportes.

**Impacto:** el frente cliente quedó funcional, no todavía refinado.

## Deuda baja / aceptable por ahora

### 5. Alias y compatibilidades técnicas deliberadas
- `/scheduling` permanece como redirect a `/services`.
- algunas piezas transicionales sobreviven para no reabrir scope al final de la ola.

**Impacto:** aceptable mientras no vuelvan a crecer features sobre esa capa.

## Qué ya no corresponde seguir tratando como deuda principal
1. migración base de `BuildingsPage` a la capa canónica
2. `SchedulingPage` como centro del negocio
3. reportes backend base leyendo `appointments`
4. convivencia operativa diaria entre `appointments` y `service_orders`

## Siguiente frente recomendado
1. volver nativo de `services` el cierre técnico hoy puenteado por `scheduling`
2. unificar una sola representación del reporte entre closeout, imprimible y PDF
3. hacer una pasada corta de limpieza de naming residual (`scheduling` / `appointment`) ya sin presión funcional
4. decidir si el portal cliente merece separación real de `services` y `reports` o si se mantiene minimalista por otra ola
