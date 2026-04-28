# Auditoría del flujo actual de `services`

Fecha: 2026-04-28  
Tarea: S2-T1

## Alcance auditado
- `src/features/services/ServicesPage.tsx`
- `src/features/services/ServiceDetailPage.tsx`
- `src/features/services/ServiceCloseoutPage.tsx`
- `src/features/services/ServiceReportPrintPage.tsx`
- `src/features/services/useOperationalServiceOrders.ts`
- referencias necesarias en `scheduling` y `functions/src/serviceReports.ts`

## Veredicto corto
`services` ya es la entrada visible del flujo operativo y consume la fuente canónica `service_orders`, pero todavía **no cierra el flujo completo por sí solo**.

Hoy cubre bien:
- listado operativo
- detalle de contexto
- vistas de revisión/post-cierre
- salida imprimible/PDF

Hoy no cubre bien:
- cierre técnico real dentro de `services`
- continuidad consistente entre reporte, imprimible y PDF
- concentración de responsabilidades operativas en un solo lugar

## Mapa real del flujo

### 1. Lista (`ServicesPage`)
Cubre:
- carga canónica vía `useOperationalServiceOrders`
- filtros por edificio, estado y fechas
- resumen de métricas
- entrada a detalle y a closeout
- registro de avance diario con escritura directa en `service_orders`

Evidencia:
- `ServicesPage.tsx:46` usa `useOperationalServiceOrders()`
- `ServicesPage.tsx:90` limita la vista a `getRecentServiceOrders(filteredOrders)`
- `ServicesPage.tsx:237-249` expone CTAs a detalle y closeout
- `ServicesPage.tsx:106` actualiza `service_orders` directamente para avances diarios

Huecos:
1. La lista visible se recorta a 12 ítems (`getRecentServiceOrders`) incluso después de filtrar. Operativamente sirve para foco, pero no representa un listado completo.
2. El avance diario vive aquí como mutación directa; no pasa por una capa común de acciones ni deja auditoría explícita.
3. La lista no muestra una acción clara para “continuar cierre” vs “revisar post-cierre”; ambos terminan mezclados bajo `closeout`.

### 2. Detalle (`ServiceDetailPage`)
Cubre:
- contexto principal del servicio
- timeline
- resumen de novedades
- avances diarios
- acceso a closeout e imprimible
- bloques de IA/sugerencias

Evidencia:
- `ServiceDetailPage.tsx:37` vuelve a consumir `useOperationalServiceOrders()`
- `ServiceDetailPage.tsx:75-83` enlaza a closeout e imprimible
- `ServiceDetailPage.tsx:150-163` muestra timeline
- `ServiceDetailPage.tsx:192-211` muestra avances diarios
- `ServiceDetailPage.tsx:216-261` dedica bastante superficie a IA y trazabilidad

Huecos:
1. El detalle es mayormente de lectura; no concentra acciones operativas fuertes aparte de navegar.
2. No explica si el siguiente paso correcto es ejecutar cierre, revisar reporte o imprimir; eso queda implícito.
3. La jerarquía actual da bastante peso a bloques de IA aunque el flujo base todavía tiene huecos funcionales.

### 3. Cierre / post-cierre (`ServiceCloseoutPage`)
Cubre:
- descarga de PDF
- acceso a vista imprimible
- revisión interna del reporte
- versionado/aprobación interna de cotización
- carga de adjuntos
- score de calidad
- bloques de IA

Evidencia:
- `ServiceCloseoutPage.tsx:163` genera PDF por Cloud Function
- `ServiceCloseoutPage.tsx:264-280` maneja revisión del reporte
- `ServiceCloseoutPage.tsx:286-314` maneja cotización interna
- `ServiceCloseoutPage.tsx:321-340` maneja adjuntos

Hueco principal:
**esta pantalla no ejecuta el cierre técnico real del servicio.**

El cierre real sigue viviendo en `scheduling`:
- `useSchedulingPageController.tsx:161` usa `useSchedulingCompletion`
- `schedulingCompletion.ts:135-159` marca `status: 'completed'`, escribe `report`, `completionPhotos` e `issues`

Conclusión:
`ServiceCloseoutPage` hoy funciona más como **post-cierre / QA / documentación** que como cierre operativo primario. Ese es el hueco más importante del sprint.

### 4. Reporte / imprimible
Hay tres salidas distintas para el mismo servicio:

1. `ServiceCloseoutPage` muestra `serviceOrder.report` crudo en JSON.
2. `ServiceReportPrintPage` imprime `buildTechnicalReport(serviceOrder, t)`.
3. `functions/src/serviceReports.ts` genera un PDF con otro formato y también serializa `serviceOrder.report` como JSON.

Evidencia:
- `ServiceReportPrintPage.tsx:19` usa `buildTechnicalReport(...)`
- `ServiceReportPrintPage.tsx:33` imprime `serviceOrder.status` crudo
- `functions/src/serviceReports.ts:48` serializa `serviceOrder.report` con `JSON.stringify(...)`

Huecos:
1. No existe una representación única del reporte técnico.
2. La vista imprimible y el PDF no cuentan exactamente la misma historia.
3. El estado impreso usa valor crudo (`completed`, `in_progress`, etc.) en lugar de presentación normalizada.

## Dependencia residual con `scheduling`

`services` ya es el centro visible, pero `scheduling` todavía conserva la responsabilidad más crítica del flujo: completar el servicio.

Además:
- `useOperationalServiceOrders` solo normaliza arrays y shape base.
- detalle/closeout siguen resolviendo relaciones en cada página (`buildings`, `employees`, `managements`) en vez de recibir un contrato operativo más completo.
- el conocimiento de cómo se completa el servicio sigue fuera del módulo `services`.

## Duplicaciones y responsabilidades mal ubicadas

### Duplicaciones
- lookup de entidades relacionadas repartido entre páginas
- múltiples formatos de reporte para el mismo servicio
- mutaciones directas en páginas sin capa operativa común (`updateDocById` desde lista y closeout)

### Responsabilidades mal ubicadas
- cierre técnico real en `scheduling`, no en `services`
- `closeout` mezcla QA interna, cotización, adjuntos, IA y reporte sin distinguir pre-cierre vs post-cierre
- el detalle carga bastante UI de IA antes de cerrar la continuidad base del flujo

## Lista concreta de huecos a cerrar en S2

### Crítico
1. Mover o rehacer el cierre técnico real dentro de `services`.
2. Alinear `closeout` para que represente claramente el paso operativo correcto.

### Alto
3. Unificar la narrativa de reporte entre detalle, closeout, imprimible y PDF.
4. Diferenciar mejor acciones de ejecución vs revisión interna.

### Medio
5. Decidir si la lista debe seguir siendo “agenda resumida” o un listado operativo completo.
6. Consolidar mutaciones operativas clave detrás de helpers/acciones compartidas.
7. Reducir peso visual de bloques IA cuando compiten con acciones base.

## Recomendación operativa para las siguientes tareas
- **S2-T2:** cerrar continuidad lista → detalle, aclarando CTA principal y contexto de aterrizaje.
- **S2-T3:** traer el cierre técnico real a `services` o convertir `closeout` en ese flujo real.
- **S2-T4:** unificar representación del reporte técnico y su versión imprimible/PDF.
- **S2-T5:** mover helpers/acciones residuales para que `services` sea dueño real del flujo.

## Decisión de esta tarea
No apliqué refactor ni microajustes de código.

Motivo: la auditoría encontró un hueco estructural claro pero no apareció un ajuste trivial, seguro y local que lo resolviera sin contaminar S2-T2/S2-T3.