# Mission Control Implementation Plan — Urbly

## Objetivo
Implementar un nuevo Mission Control premium para Urbly con sistema visual base reusable y reemplazo del dashboard actual.

## Fase 1. Sistema visual base
1. Crear tokens y utilidades visuales premium para superficies glass, contenedores, pills y métricas.
2. Crear componentes base reutilizables:
   - `GlassPanel`
   - `MetricCard`
   - `SectionHeader`
   - `StatusPill`
   - `CommandBar`
3. Integrar Framer Motion con wrappers sobrios para page transitions y stagger grids.

## Fase 2. Mission Control
4. Crear `MissionControlPage` como nuevo centro operativo.
5. Implementar hero operativo con resumen diario y command bar.
6. Implementar grid de métricas clave.
7. Implementar bloques de agenda, asignaciones, alertas, pipeline comercial y actividad reciente usando datos reales disponibles.
8. Reapuntar el dashboard al nuevo Mission Control.

## Fase 3. Integración y consistencia
9. Completar labels/i18n para todos los nuevos textos.
10. Ajustar navegación y layout donde haga falta para soportar la nueva experiencia.
11. Validar motion, responsive y consistencia visual.

## Fase 4. Verificación
12. Correr `npm run lint`.
13. Correr `npm run build`.
14. Revisar diff final y dejar rama lista para PR.

## Criterios de éxito
- dashboard reemplazado por Mission Control premium
- sistema visual base reusable creado
- i18n completo en textos nuevos
- lint y build pasando
