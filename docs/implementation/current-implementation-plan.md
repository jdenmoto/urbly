# Urbly — Plan vigente (Fase 2 Agendamiento)

Fecha: 2026-04-29
Estado: en ejecución

## Objetivo
Cerrar completamente el flujo de agendamiento operativo en `develop`, corrigiendo fallos funcionales en ambiente desplegado y completando los faltantes de producto, seguridad y datos.

## Bloques de ejecución

### Bloque 1 — Riesgo crítico operativo (prioridad máxima)
1. Storage/Evidencia: corregir permisos y rutas de subida para `service-orders/*`.
2. Asignación/Reasignación usable: flujo claro desde listado y detalle.
3. Vista técnico confiable: garantizar visibilidad de órdenes asignadas.
4. Checklist + cierre completo: diligenciamiento, validación y persistencia estables.

### Bloque 2 — Flujo completo de producto
5. Edición completa funcional: crear/editar en flujo único operativo.
6. Tipos de servicio: campo seleccionable conectado a catálogo real (`settings/service_types`).
7. Confirmación/reprogramación/cancelación: cubrir acciones y transiciones en UX y dominio.

### Bloque 3 — UX/UI y coherencia de experiencia
8. Header/navegación: eliminar duplicados y limpiar jerarquía.
9. Consistencia visual y de interacción: estados vacíos, mensajes, CTA, errores.
10. Branding base: favicon y validación en deploy.

### Bloque 4 — CI/Seed para develop siempre usable
11. Pipeline develop: reset + seed mínimo operativo en cada despliegue.
12. Seed y limpieza: scripts idempotentes y consistentes con modelo actual.
13. Smoke checks post-seed: validaciones automáticas mínimas de datos críticos.

## Otras implementaciones necesarias (pendientes transversales)
- Unificar salida de reporte entre closeout, vista imprimible y PDF backend.
- Reducir dependencia residual del namespace `scheduling` en cierre técnico.
- Resolver naming/data legacy (`appointments`, alias transicionales) sin romper operación.
- Validar que técnico y operación interna compartan el mismo criterio de identidad en asignación.

## Definición de terminado (DoD)
- Flujo completo: crear → asignar → confirmar/reprogramar → ejecutar → cerrar → reportar.
- Sin errores de permisos en subida de evidencia.
- Técnico ve y opera sus servicios asignados correctamente.
- CI develop deja ambiente funcional con datos mínimos en cada corrida.
- `npm run build:minimum` y pruebas críticas en verde.
