# Urbly — Plan de consolidación por archivo

Fecha: 2026-04-27
Estado base verificado:
- `npm run build` ✅
- `npm --prefix functions run build` ✅
- deuda principal activa: migración `appointments` → `service_orders`, extracción de `SchedulingPage`, consolidación de navegación v2, cierre de placeholders y validación funcional por actor.

---

## Objetivo
Bajar la reevaluación actual a tareas concretas por archivo para ejecutar la consolidación sin abrir más scope.

## Regla de ejecución
1. cerrar dominio y core antes de meter polish o nuevas features
2. cambios pequeños y reversibles
3. validar al final de cada bloque
4. preferir eliminar compatibilidad dispersa antes que moverla de lugar

---

# Fase 1 — Línea base y mapa de deuda ejecutable

## Tarea 1.1 — Inventario real del flujo legacy
### Objetivo
Dejar explícito qué partes siguen dependiendo de `appointments` y de `SchedulingPage`.

### Archivos
- `src/lib/api/serviceOrders.ts`
- `src/lib/api/queries.ts`
- `src/features/scheduling/SchedulingPage.tsx`
- `src/features/scheduling/schedulingItem.ts`
- `src/features/scheduling/schedulingLegacyMap.ts`
- `src/features/scheduling/schedulingSeries.ts`
- `src/features/buildings/BuildingsPage.tsx`
- `functions/src/reports.ts`
- `docs/implementation/current-implementation-debt.md`

### Trabajo
- clasificar cada uso de `Appointment` en:
  - adapter permitido
  - dependencia temporal aceptable
  - deuda que debe salir en esta ola
- listar qué responsabilidades siguen dentro de `SchedulingPage`
- actualizar la deuda técnica con el mapa real, no genérico

### Entregable
- deuda documentada con prioridad alta/media/baja
- lista de extracciones obligatorias para esta ola

### Verificación
- documentación actualizada y consistente con código real

---

# Fase 2 — Consolidación del dominio canónico

## Tarea 2.1 — Blindar la capa canónica de service orders
### Objetivo
Hacer que features nuevas/activas consuman `service_orders` como contrato principal.

### Archivos
- `src/lib/api/serviceOrders.ts`
- `src/lib/api/queries.ts`
- `src/core/models/serviceOrder.ts`
- `src/core/models/appointment.ts`
- `src/lib/api/functions.ts`
- `src/lib/api/queries.ts`

### Trabajo
- centralizar mapping `Appointment` → `ServiceOrder`
- dejar una única estrategia explícita de fallback legacy
- sacar decisiones de compatibilidad desde páginas hacia la capa API
- revisar nombres y tipos para que el contrato canónico sea el visible

### Verificación
- `rg -n "\bAppointment\b|appointments" src/lib src/core` devuelve solo usos esperados
- `npm run build`

---

## Tarea 2.2 — Limpiar consumidores que todavía piensan en appointments
### Objetivo
Reducir el alcance real del modelo legacy fuera de adapters.

### Archivos
- `src/features/buildings/BuildingsPage.tsx`
- `src/features/services/useOperationalServiceOrders.ts`
- `src/features/services/serviceOrderPresentation.ts`
- `src/features/services/serviceProgress.ts`
- `src/features/services/serviceSuggestions.ts`
- `src/features/services/reportQuality.ts`

### Trabajo
- cambiar consumo para usar `ServiceOrder` enriquecido
- quitar transformaciones repetidas entre features
- revisar si `BuildingsPage` todavía necesita leer `appointments` o si puede leer solo `service_orders`

### Verificación
- build verde
- menos referencias legacy en `src/features/*`

---

## Tarea 2.3 — Reports y functions alineados al dominio nuevo
### Objetivo
Evitar que backend/reportes siga fijando el modelo viejo como fuente principal.

### Archivos
- `functions/src/reports.ts`
- `functions/src/serviceReports.ts`
- `functions/src/index.ts`
- `src/lib/firebase/functions.ts`
- `src/lib/api/functions.ts`
- `docs/getting-started/functions.md`

### Trabajo
- revisar si reportes PDF pueden leer `service_orders` directamente
- si no se puede cerrar aún, dejar compatibilidad encapsulada y documentada
- documentar qué parte del backend sigue legacy y por cuánto tiempo

### Verificación
- `npm --prefix functions run build`
- criterio legacy explícito en doc/código

---

# Fase 3 — Extracción final del core operativo

## Tarea 3.1 — Partir responsabilidades de SchedulingPage
### Objetivo
Separar el monstruo actual en responsabilidades auditables.

### Archivos
- `src/features/scheduling/SchedulingPage.tsx`
- `src/features/scheduling/SchedulingWizardBasicsStep.tsx`
- `src/features/scheduling/SchedulingWizardScheduleStep.tsx`
- `src/features/scheduling/SchedulingWizardSummary.tsx`
- `src/features/scheduling/schedulingSelectors.ts`
- `src/features/scheduling/schedulingMutations.ts`
- `src/features/scheduling/schedulingCalendarMutations.ts`
- `src/features/scheduling/schedulingCompletion.ts`
- `src/features/scheduling/schedulingRules.ts`
- `src/features/scheduling/schedulingUtils.ts`

### Trabajo
- mapear y extraer:
  - agenda/calendario
  - wizard
  - cierre/validación
  - series/regeneración
  - dependencia legacy expuesta en UI
- decidir qué queda vivo en scheduling solo como capa de transición

### Verificación
- reducción medible de responsabilidades en `SchedulingPage.tsx`
- build verde

---

## Tarea 3.2 — Consolidar Services como centro operativo real
### Objetivo
Hacer que el flujo principal viva en services y no en scheduling.

### Archivos
- `src/features/services/ServicesPage.tsx`
- `src/features/services/ServiceDetailPage.tsx`
- `src/features/services/ServiceCloseoutPage.tsx`
- `src/features/services/ServiceReportPrintPage.tsx`
- `src/features/services/useOperationalServiceOrders.ts`
- `src/features/services/serviceAttachments.ts`
- `src/features/services/serviceOrderAi.ts`
- `src/features/services/serviceProgress.ts`
- `src/features/services/reportQuality.ts`

### Trabajo
- asegurar cobertura mínima del flujo:
  - ver lista
  - entrar al detalle
  - cerrar servicio
  - ver/imprimir reporte
- mover lógica reusable desde scheduling a services o a helpers compartidos
- quitar acoplamientos innecesarios con legacy

### Verificación
- smoke walkthrough manual del flujo de servicios
- `npm run build`

---

## Tarea 3.3 — Series, invalidaciones y cierre técnico sobre modelo canónico
### Objetivo
Cerrar la parte más riesgosa de la transición.

### Archivos
- `src/features/scheduling/schedulingSeries.ts`
- `src/features/scheduling/schedulingCompletion.ts`
- `src/features/scheduling/schedulingItem.ts`
- `src/features/scheduling/schedulingLegacyMap.ts`
- `src/lib/api/serviceOrders.ts`
- `src/lib/api/queries.ts`

### Trabajo
- revisar ramas defensivas que aún borran o absorben `appointments`
- dejar estrategia explícita para regeneración/edición de series
- alinear cierre técnico con `service_orders` sin cleanup oculto

### Verificación
- build verde
- legacy map actualizado con menos dependencias activas

---

# Fase 4 — Navegación y experiencia mínima por actor

## Tarea 4.1 — Consolidar shell y navegación v2
### Objetivo
Eliminar mezcla innecesaria entre rutas nuevas y viejas.

### Archivos
- `src/app/App.tsx`
- `src/app/Auth.tsx`
- `src/app/nav.ts`
- `src/app/layouts/AppLayout.tsx`
- `src/components/Sidebar.tsx`
- `src/components/TopBar.tsx`
- `src/features/dashboard/HomeRouterPage.tsx`

### Trabajo
- revisar rutas reales vs navegación visible
- quitar entradas dudosas o redundantes
- alinear landing por rol y acceso al flujo principal

### Verificación
- walkthrough manual por rol interno
- build verde

---

## Tarea 4.2 — Empresa: operación mínima coherente
### Objetivo
Dejar claro el camino principal para roles internos.

### Archivos
- `src/features/dashboard/DashboardPage.tsx`
- `src/features/management/ManagementPage.tsx`
- `src/features/buildings/BuildingsPage.tsx`
- `src/features/reports/ReportsPage.tsx`
- `src/features/notifications/NotificationsPage.tsx`

### Trabajo
- revisar quick actions
- asegurar acceso lógico a servicios, agenda, edificios y reportes
- eliminar desvíos innecesarios

### Verificación
- walkthrough empresa: inicio → servicios → detalle → reporte

---

## Tarea 4.3 — Técnico: flujo diario mínimo
### Objetivo
Hacer usable la experiencia técnica sin carga innecesaria.

### Archivos
- `src/features/technician/TechnicianHomePage.tsx`
- `src/features/services/ServicesPage.tsx`
- `src/features/services/ServiceDetailPage.tsx`
- `src/features/services/ServiceCloseoutPage.tsx`

### Trabajo
- revisar CTA principal
- asegurar secuencia simple: ver trabajo → abrir detalle → registrar/cerrar
- reducir dependencias con navegación pensada para empresa

### Verificación
- walkthrough técnico completo

---

## Tarea 4.4 — Cliente: portal mínimo creíble
### Objetivo
Dejar el portal cliente coherente con el modelo nuevo.

### Archivos
- `src/features/buildingAdmin/BuildingAdminPage.tsx`
- `src/features/portal/ClientSummaryPage.tsx`
- `src/features/portal/ClientSecurePortalPage.tsx`
- `functions/src/clientPortal.ts`

### Trabajo
- revisar fuentes de datos, estado mostrado, historial e informes
- asegurar que el cliente ve trazabilidad útil, no solo vistas parciales

### Verificación
- walkthrough cliente: resumen → historial → informe/estado

---

## Tarea 4.5 — Resolver placeholders o sacarlos del camino
### Objetivo
Evitar módulos “fantasma” en la ola actual.

### Archivos
- `src/features/customers/CustomersPage.tsx`
- `src/features/assets/AssetsPage.tsx`
- `src/features/shared/ComingSoonPage.tsx`
- `src/app/nav.ts`

### Trabajo
- decidir si cada módulo:
  - entra en esta ola
  - queda explícitamente fuera
  - se oculta de navegación principal
- evitar rutas visibles sin valor operativo

### Verificación
- navegación sin placeholders engañosos

---

# Fase 5 — Release hardening funcional

## Tarea 5.1 — Checklist de smoke tests por actor
### Objetivo
Pasar de “build verde” a “flujo usable”.

### Archivos
- `project/artifacts/qa-checklist.md`
- `docs/getting-started/current-status.md`
- `docs/implementation/current-implementation-debt.md`
- `docs/plans/2026-04-27-urbly-consolidation-file-plan.md`

### Trabajo
- definir checklist manual mínimo para:
  - empresa
  - técnico
  - cliente
  - reportes
  - navegación
- documentar qué queda fuera del corte

### Verificación
- checklist ejecutable y corto

---

## Tarea 5.2 — Endurecimiento liviano de performance y bundle
### Objetivo
Atacar la advertencia visible del build sin abrir una ola entera de performance.

### Archivos
- `src/app/App.tsx`
- `src/app/nav.ts`
- `vite.config.*` si existe
- módulos pesados detectados durante build

### Trabajo
- revisar si conviene lazy-load de pantallas pesadas
- revisar chunking básico si el costo es bajo
- dejar al menos un plan explícito si no entra en esta ola

### Verificación
- build sigue verde
- warning documentado o mitigado

---

# Sprint recomendado inicial (3–5 tareas)

## Sprint 1
1. **Tarea 1.1** — inventario real del flujo legacy
2. **Tarea 2.1** — blindar capa canónica de service orders
3. **Tarea 2.2** — limpiar consumidores que todavía piensan en appointments
4. **Tarea 3.1** — partir responsabilidades de SchedulingPage
5. **Tarea 4.5** — resolver placeholders o sacarlos del camino

### Por qué este sprint primero
Porque reduce la ambigüedad estructural antes de seguir con UX y walkthroughs.

---

# Criterio de cierre de esta ola
La ola se considera bien cerrada cuando:
- `service_orders` es el contrato principal visible
- `SchedulingPage` deja de concentrar el flujo crítico
- la navegación principal ya no expone módulos dudosos
- empresa, técnico y cliente tienen walkthrough mínimo usable
- `npm run build` y `npm --prefix functions run build` siguen verdes
