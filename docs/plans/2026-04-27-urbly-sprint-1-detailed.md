# Urbly — Sprint 1 detallado

Fecha: 2026-04-27
Base: `docs/plans/2026-04-27-urbly-consolidation-file-plan.md`

## Objetivo del sprint
Reducir ambigüedad estructural y dejar listo el terreno para ejecutar la consolidación del core sin seguir cargando deuda legacy.

## Regla del sprint
- no abrir scope nuevo
- priorizar claridad del dominio sobre polish visual
- cada tarea debe dejar evidencia verificable
- si una tarea descubre demasiado riesgo, se corta y se documenta

---

# Tarea 1 — Inventario real del flujo legacy

## 1.1 Mapear referencias legacy en capa API
**Objetivo:** saber exactamente dónde `Appointment` sigue gobernando datos.

**Archivos:**
- `src/lib/api/serviceOrders.ts`
- `src/lib/api/queries.ts`
- `src/core/models/appointment.ts`

**Acciones:**
1. listar imports y usos de `Appointment`
2. marcar qué usos son:
   - adapter permitido
   - fallback temporal
   - dependencia que debe salir
3. anotar qué función es hoy la frontera canónica real

**Salida esperada:**
- listado corto por archivo con clasificación

**Verificación:**
- documento actualizado con mapa real

---

## 1.2 Mapear referencias legacy en features
**Objetivo:** detectar qué pantallas todavía piensan en `appointments`.

**Archivos:**
- `src/features/buildings/BuildingsPage.tsx`
- `src/features/scheduling/SchedulingPage.tsx`
- `src/features/scheduling/schedulingItem.ts`
- `src/features/scheduling/schedulingSeries.ts`
- `src/features/scheduling/schedulingLegacyMap.ts`
- `src/features/services/useOperationalServiceOrders.ts`

**Acciones:**
1. revisar consumo de datos por feature
2. identificar transformaciones legacy hechas en UI
3. separar dependencias críticas vs accesorias

**Salida esperada:**
- tabla corta de feature → dependencia legacy → prioridad

---

## 1.3 Mapear backend/reportes legacy
**Objetivo:** saber si functions/reportes siguen amarrados al modelo viejo.

**Archivos:**
- `functions/src/reports.ts`
- `functions/src/serviceReports.ts`
- `functions/src/index.ts`

**Acciones:**
1. revisar fuente de datos real de reportes
2. marcar si lee `appointments`, `service_orders` o ambos
3. identificar compatibilidad temporal necesaria

**Salida esperada:**
- nota clara de dependencia backend legacy

---

## 1.4 Auditar responsabilidades de SchedulingPage
**Objetivo:** bajar `SchedulingPage` a bloques concretos de responsabilidad.

**Archivos:**
- `src/features/scheduling/SchedulingPage.tsx`
- `src/features/scheduling/SchedulingWizardBasicsStep.tsx`
- `src/features/scheduling/SchedulingWizardScheduleStep.tsx`
- `src/features/scheduling/SchedulingWizardSummary.tsx`

**Acciones:**
1. listar responsabilidades activas dentro de `SchedulingPage`
2. agrupar en:
   - agenda
   - wizard
   - detalle/edición
   - cierre
   - series
   - legacy/debug UI
3. marcar qué parte debe salir primero

**Salida esperada:**
- mapa de responsabilidades con prioridad de extracción

---

## 1.5 Actualizar deuda técnica con evidencia real
**Objetivo:** convertir hallazgos en backlog ejecutable.

**Archivos:**
- `docs/implementation/current-implementation-debt.md`
- opcionalmente `project/artifacts/dev-backlog.md`

**Acciones:**
1. reemplazar deuda genérica por deuda observada
2. etiquetar alta/media/baja prioridad
3. dejar claro qué entra en Sprint 1 y qué no

**Done:**
- deuda técnica alineada con el código real

---

# Tarea 2 — Blindar la capa canónica de service orders

## 2.1 Identificar la frontera canónica actual
**Objetivo:** decidir con precisión qué función/módulo manda.

**Archivos:**
- `src/lib/api/serviceOrders.ts`
- `src/lib/api/queries.ts`

**Acciones:**
1. ubicar la función que ya resuelve `service_orders`
2. confirmar cómo entra el fallback desde `appointments`
3. decidir si hace falta una función pública única adicional

**Salida esperada:**
- frontera canónica definida por nombre y archivo

---

## 2.2 Encapsular fallback legacy en un solo punto
**Objetivo:** evitar fallback disperso.

**Archivos:**
- `src/lib/api/serviceOrders.ts`
- `src/lib/api/queries.ts`

**Acciones:**
1. mover decisiones de fallback a una sola capa
2. evitar branches duplicados en queries
3. documentar razones de fallback con nombres explícitos

**Verificación:**
- menos lógica de fallback fuera del módulo canónico
- build verde

---

## 2.3 Normalizar tipos visibles hacia ServiceOrder
**Objetivo:** que las features lean contrato canónico.

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

---

## 2.4 Reducir imports directos de Appointment fuera de adapters
**Objetivo:** bajar superficie legacy real.

**Archivos objetivo inicial:**
- `src/features/buildings/BuildingsPage.tsx`
- `src/lib/api/queries.ts`
- `src/lib/api/serviceOrders.ts`

**Acciones:**
1. mover import directo si solo se usa para transición
2. reemplazar consumo directo cuando ya exista shape canónico
3. dejar comentario temporal solo donde de verdad haga falta

**Verificación:**
- `rg -n "\bAppointment\b|appointments" src/features src/lib` baja o queda más acotado

---

# Tarea 3 — Limpiar consumidores que aún piensan en appointments

## 3.1 Revisar BuildingsPage como consumidor legacy
**Objetivo:** decidir si debe seguir leyendo `appointments`.

**Archivos:**
- `src/features/buildings/BuildingsPage.tsx`
- `src/lib/api/queries.ts`

**Acciones:**
1. verificar por qué lee `appointments`
2. probar si puede usar `service_orders` resuelto
3. documentar bloqueo si no se puede migrar aún

---

## 3.2 Revisar hook operativo principal
**Objetivo:** asegurar que el flujo nuevo no replique mapeos viejos.

**Archivos:**
- `src/features/services/useOperationalServiceOrders.ts`
- `src/features/services/serviceOrderPresentation.ts`
- `src/features/services/serviceProgress.ts`

**Acciones:**
1. revisar transformaciones hechas en el hook
2. mover las que deban vivir en capa API/presentación
3. simplificar contrato del hook si está filtrando demasiada complejidad

---

## 3.3 Revisar helpers de sugerencias/calidad
**Objetivo:** evitar lógica duplicada o shape inconsistente.

**Archivos:**
- `src/features/services/serviceSuggestions.ts`
- `src/features/services/reportQuality.ts`
- `src/features/services/serviceOrderAi.ts`

**Acciones:**
1. revisar si consumen shape canónico o legacy adaptado
2. alinear helpers con contrato actual
3. sacar dependencias accidentales

---

## 3.4 Confirmar punto de consumo canónico en services
**Objetivo:** dejar services como consumidor correcto.

**Archivos:**
- `src/features/services/ServicesPage.tsx`
- `src/features/services/ServiceDetailPage.tsx`
- `src/features/services/ServiceCloseoutPage.tsx`

**Acciones:**
1. revisar de dónde leen datos
2. validar que no rehacen fallback o mapping en UI
3. anotar huecos para siguiente tarea de extracción

---

# Tarea 4 — Partir responsabilidades de SchedulingPage

## 4.1 Delimitar bloques internos del archivo
**Objetivo:** preparar extracción sin romper todo.

**Archivo:**
- `src/features/scheduling/SchedulingPage.tsx`

**Acciones:**
1. marcar regiones/bloques funcionales
2. identificar estado, efectos y handlers por bloque
3. detectar qué depende de wizard, qué depende de agenda y qué de cierre

---

## 4.2 Separar primero lo más barato de extraer
**Objetivo:** elegir la primera extracción con mejor ROI.

**Candidatos:**
- panel legacy/debug
- resumen de dependencias legacy
- bloques de UI auxiliares
- filtros/presentación

**Acciones:**
1. elegir un primer corte pequeño
2. moverlo a componente/helper propio
3. verificar que el archivo baja complejidad sin cambiar comportamiento

---

## 4.3 Delimitar frontera agenda vs services
**Objetivo:** que scheduling deje de absorber responsabilidades operativas.

**Archivos:**
- `src/features/scheduling/SchedulingPage.tsx`
- `src/features/services/ServicesPage.tsx`
- `src/features/services/ServiceDetailPage.tsx`

**Acciones:**
1. identificar acciones que deberían vivir en services
2. dejar lista de movimientos concretos para el siguiente sprint
3. documentar transición mínima segura

---

## 4.4 Revisar series y cierre como zona de riesgo
**Objetivo:** ubicar lo que no conviene tocar a ciegas.

**Archivos:**
- `src/features/scheduling/schedulingSeries.ts`
- `src/features/scheduling/schedulingCompletion.ts`
- `src/features/scheduling/schedulingItem.ts`

**Acciones:**
1. revisar dependencia con cleanup legacy
2. marcar ramas defensivas peligrosas
3. anotar pruebas/manual checks necesarios antes de extraer

---

# Tarea 5 — Resolver placeholders o sacarlos de navegación

## 5.1 Auditar placeholders visibles
**Objetivo:** saber qué pantallas fantasma están expuestas.

**Archivos:**
- `src/features/customers/CustomersPage.tsx`
- `src/features/assets/AssetsPage.tsx`
- `src/features/shared/ComingSoonPage.tsx`
- `src/app/nav.ts`
- `src/app/App.tsx`

**Acciones:**
1. listar rutas visibles con placeholder
2. decidir si cada una se oculta o se mantiene fuera del flujo principal
3. verificar si alguna tiene dependencia de permisos o menú

---

## 5.2 Limpiar navegación principal
**Objetivo:** no mostrar módulos sin valor operativo en esta ola.

**Archivos:**
- `src/app/nav.ts`
- `src/components/Sidebar.tsx`
- `src/app/layouts/AppLayout.tsx`

**Acciones:**
1. ocultar o relegar entradas placeholder
2. mantener foco en rutas que sí tienen flujo usable
3. evitar romper guards o layout

**Verificación:**
- navegación más limpia
- build verde

---

## 5.3 Documentar lo que queda fuera del corte
**Objetivo:** no reabrir la discusión luego.

**Archivos:**
- `docs/implementation/current-implementation-debt.md`
- `docs/getting-started/current-status.md`

**Acciones:**
1. dejar explícito qué módulos no entran aún
2. anotar por qué quedan fuera
3. evitar que un placeholder se interprete como feature a medias

---

# Orden recomendado de ejecución
1. 1.1
2. 1.2
3. 1.3
4. 1.4
5. 1.5
6. 2.1
7. 2.2
8. 2.3
9. 2.4
10. 3.1
11. 3.2
12. 3.3
13. 3.4
14. 4.1
15. 4.2
16. 4.3
17. 4.4
18. 5.1
19. 5.2
20. 5.3

---

# Criterio de cierre del Sprint 1
El sprint se considera bien cerrado si:
- existe mapa real de deuda legacy
- la frontera canónica de `service_orders` quedó explícita
- bajó la superficie de consumo directo de `Appointment`
- `SchedulingPage` quedó dividido conceptualmente y con primer corte de extracción viable
- la navegación principal dejó de exponer placeholders dudosos
- `npm run build` y `npm --prefix functions run build` siguen verdes
