# Urbly — Sprint 1 detallado (pendiente real)

Fecha: 2026-04-27
Base: `docs/plans/2026-04-27-urbly-consolidation-file-plan.md`
Estado: actualizado después de los cortes ya implementados en scheduling

## Objetivo del sprint
Reducir ambigüedad estructural y dejar listo el terreno para ejecutar la consolidación del core sin seguir cargando deuda legacy.

## Regla del sprint
- no abrir scope nuevo
- priorizar claridad del dominio sobre polish visual
- cada tarea debe dejar evidencia verificable
- si una tarea descubre demasiado riesgo, se corta y se documenta

---

# Ya implementado en este sprint

## Base ya resuelta
- auditoría inicial del flujo legacy
- actualización de deuda técnica con evidencia real
- confirmación de la frontera canónica actual de `service_orders`
- migración de `BuildingsPage` para usar `useTenantServiceOrders(...)`
- reducción de dependencia legacy en:
  - `src/features/scheduling/schedulingItem.ts`
  - `src/features/scheduling/schedulingSeries.ts`
  - `src/features/scheduling/schedulingLegacyMap.ts`

## Extracciones ya resueltas en scheduling
`SchedulingPage` ya perdió estos bloques hacia componentes/hooks dedicados:

### Componentes extraídos
- `SelectedSchedulingDetail`
- `PhotoViewerModal`
- `CompleteServiceModal`
- `SchedulingFiltersCard`
- `SchedulingAgendaSurface`
- `SchedulingFormModal`
- `CancelSchedulingModal`
- `DeleteSchedulingConfirm`
- `SchedulingStatusOverlays`

### Hooks/helpers extraídos
- `useSchedulingCompletion`
- `useSchedulingAgenda`
- `useSchedulingFilters`
- `useSchedulingFormFlow`
- `useSchedulingSeriesFlow`
- `useSchedulingSubmitFlow`
- `useSchedulingListColumns`
- `schedulingPresentation.ts`

## Validación ya verificada
- `npm run build` verde en los cortes recientes de scheduling
- `npm --prefix functions run build` ya estaba validado antes en el sprint

---

# Trabajo pendiente real

## Tarea A — Blindar mejor la capa canónica de service orders

### A.1 Encapsular fallback legacy en un solo punto
**Objetivo:** evitar fallback disperso entre API y consumers.

**Archivos:**
- `src/lib/api/serviceOrders.ts`
- `src/lib/api/queries.ts`

**Acciones:**
1. mover decisiones de fallback a una sola capa
2. evitar branches duplicados en queries
3. documentar claramente por qué sigue existiendo fallback

**Verificación:**
- menos lógica de fallback fuera del módulo canónico
- build verde

### A.2 Normalizar tipos visibles hacia `ServiceOrder`
**Objetivo:** que las features consuman contrato canónico y no shape legacy adaptado por accidente.

**Archivos:**
- `src/core/models/serviceOrder.ts`
- `src/lib/api/serviceOrders.ts`
- `src/features/services/useOperationalServiceOrders.ts`

**Acciones:**
1. revisar shape enriquecido expuesto a features
2. eliminar fugas de tipos legacy en hooks activos
3. dejar nombres coherentes para campos derivados

**Verificación:**
- hooks principales exportan `ServiceOrder` o derivados canónicos

### A.3 Reducir imports directos de `Appointment` fuera de adapters
**Objetivo:** bajar superficie legacy real.

**Archivos objetivo inicial:**
- `src/lib/api/queries.ts`
- `src/lib/api/serviceOrders.ts`
- revisar si queda algo adicional en `src/features` y `src/lib`

**Acciones:**
1. mover import directo si solo se usa para transición
2. reemplazar consumo directo cuando ya exista shape canónico
3. dejar comentario temporal solo donde de verdad haga falta

**Verificación:**
- `rg -n "\bAppointment\b|appointments" src/features src/lib` queda más acotado

---

## Tarea B — Limpiar consumidores que aún piensan en appointments

### B.1 Revisar hook operativo principal de services
**Objetivo:** asegurar que el flujo nuevo no replique mapeos viejos.

**Archivos:**
- `src/features/services/useOperationalServiceOrders.ts`
- `src/features/services/serviceOrderPresentation.ts`
- `src/features/services/serviceProgress.ts`

**Acciones:**
1. revisar transformaciones hechas en el hook
2. mover las que deban vivir en capa API/presentación
3. simplificar contrato del hook si está filtrando demasiada complejidad

### B.2 Revisar helpers de sugerencias/calidad
**Objetivo:** evitar lógica duplicada o shape inconsistente.

**Archivos:**
- `src/features/services/serviceSuggestions.ts`
- `src/features/services/reportQuality.ts`
- `src/features/services/serviceOrderAi.ts`

**Acciones:**
1. revisar si consumen shape canónico o legacy adaptado
2. alinear helpers con contrato actual
3. sacar dependencias accidentales

### B.3 Confirmar punto de consumo canónico en services
**Objetivo:** dejar services como consumidor correcto.

**Archivos:**
- `src/features/services/ServicesPage.tsx`
- `src/features/services/ServiceDetailPage.tsx`
- `src/features/services/ServiceCloseoutPage.tsx`

**Acciones:**
1. revisar de dónde leen datos
2. validar que no rehacen fallback o mapping en UI
3. anotar huecos concretos para el siguiente sprint

---

## Tarea C — Cerrar el adelgazamiento útil de SchedulingPage

### C.1 Extraer selectors livianos del formulario
**Objetivo:** terminar de sacar cálculo derivado que sigue embebido en la página.

**Candidatos actuales:**
- `filteredBuildings`
- `selectedWizardBuilding`
- `selectedServiceTypeLabel`
- posiblemente `statusLabel` como cierre final si deja de aportar inline

**Acciones:**
1. agrupar selectors del wizard en hook/helper pequeño
2. mantener nombres actuales
3. no cambiar comportamiento

### C.2 Revisar qué sigue viviendo en `SchedulingPage` y decidir si queda o sale
**Objetivo:** cerrar Sprint 1 con una frontera razonable, no con extracción infinita.

**Revisar especialmente:**
- queries/config cargadas en la página
- wiring entre hooks
- si todavía hay estado local que debería vivir fuera
- si ya conviene detenerse y documentar frontera actual

**Salida esperada:**
- lista corta de “queda aquí por ahora” vs “sale en sprint siguiente”

### C.3 Revisar series y cierre como zona de riesgo antes de seguir tocando
**Objetivo:** no seguir extrayendo a ciegas áreas delicadas.

**Archivos:**
- `src/features/scheduling/schedulingSeries.ts`
- `src/features/scheduling/schedulingCompletion.ts`
- `src/features/scheduling/schedulingItem.ts`

**Acciones:**
1. revisar dependencia con cleanup legacy
2. marcar ramas defensivas peligrosas
3. anotar checks/manual tests necesarios antes de otra extracción relevante

---

## Tarea D — Delimitar frontera scheduling vs services

### D.1 Identificar acciones que deberían vivir en services
**Objetivo:** que scheduling no siga absorbiendo responsabilidades operativas.

**Archivos:**
- `src/features/scheduling/SchedulingPage.tsx`
- `src/features/services/ServicesPage.tsx`
- `src/features/services/ServiceDetailPage.tsx`

**Acciones:**
1. identificar acciones que conceptualmente pertenecen a services
2. dejar lista concreta de movimientos mínimos seguros
3. documentar qué no entra en este sprint

**Salida esperada:**
- transición mínima segura documentada

---

## Tarea E — Resolver placeholders o sacarlos de navegación

### E.1 Auditar placeholders visibles
**Objetivo:** saber qué pantallas fantasma siguen expuestas.

**Archivos:**
- `src/features/customers/CustomersPage.tsx`
- `src/features/assets/AssetsPage.tsx`
- `src/features/shared/ComingSoonPage.tsx`
- `src/app/nav.ts`
- `src/app/App.tsx`

**Acciones:**
1. listar rutas visibles con placeholder
2. decidir si cada una se oculta o queda fuera del flujo principal
3. verificar dependencias de permisos o menú

### E.2 Limpiar navegación principal
**Objetivo:** no mostrar módulos sin valor operativo en esta ola.

**Archivos:**
- `src/app/nav.ts`
- `src/components/Sidebar.tsx`
- `src/app/layouts/AppLayout.tsx`

**Acciones:**
1. ocultar o relegar entradas placeholder
2. mantener foco en rutas usables
3. evitar romper guards o layout

**Verificación:**
- navegación más limpia
- build verde

### E.3 Documentar lo que queda fuera del corte
**Objetivo:** no reabrir la discusión luego.

**Archivos:**
- `docs/implementation/current-implementation-debt.md`
- `docs/getting-started/current-status.md`

**Acciones:**
1. dejar explícito qué módulos no entran aún
2. anotar por qué quedan fuera
3. evitar que un placeholder se interprete como feature a medias

---

# Orden recomendado desde aquí
1. A.1
2. A.2
3. A.3
4. B.1
5. B.2
6. B.3
7. C.1
8. C.2
9. C.3
10. D.1
11. E.1
12. E.2
13. E.3

---

# Qué falta claramente por implementar

## Alta prioridad
- encapsular fallback legacy en un solo punto
- normalizar contratos visibles hacia `ServiceOrder`
- limpiar consumers de services que todavía dependan de shape legacy
- cerrar la frontera real entre scheduling y services

## Media prioridad
- terminar el adelgazamiento útil de `SchedulingPage` con selectors/frontera final
- revisar series/cierre como zona de riesgo antes de otra extracción mayor

## Baja prioridad dentro de este sprint
- limpiar placeholders expuestos en navegación
- documentar explícitamente lo que queda fuera

---

# Criterio de cierre actualizado del Sprint 1
El sprint se considera bien cerrado si:
- la frontera canónica de `service_orders` queda más blindada
- baja todavía más la superficie de consumo directo de `Appointment`
- services queda alineado con el contrato canónico
- `SchedulingPage` queda razonablemente orquestadora y con frontera explícita de lo que no sale aún
- la navegación principal deja de exponer placeholders dudosos
- `npm run build` y `npm --prefix functions run build` siguen verdes
