# Estado actual del proyecto

## Qué está sólido
- base operativa de edificios, administraciones, empleados y agenda
- importación multi-entidad con pipeline compartido, validación y dry-run
- desacople importante de agenda hacia flujo `service-order-first`
- wizard de agenda parcialmente dividido y más mantenible

## Qué quedó recientemente cerrado
- compatibilidad del importador actual con pipeline compartido
- selectores canónicos de agenda
- desacople de mutaciones de calendario del naming legacy
- validación del cierre técnico alineada con `service_orders`
- limpieza principal de i18n del flujo nuevo
- mapa legacy ajustado al estado real

## Qué sigue pendiente a alto nivel
- extraer más responsabilidades de `SchedulingPage`
- completar migración desde `appointments` a `service_orders`
- consolidar invalidaciones, series y cierre técnico sobre modelo canónico
- seguir simplificando navegación y módulos de Urbly v2

## Validación operativa actual
- el criterio de cierre real es `npm run build` verde
- existe deuda histórica aislada en `functions`, pero el build principal del repo es la validación operativa actual
