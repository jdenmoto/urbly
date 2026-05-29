# Urbly — UI Visual Contract v1

Fecha: 2026-05-29
Estado: activo

## Superficies canónicas

- `GlassPanel`: superficie primaria para dashboards y módulos operativos.
- `Card`: superficie secundaria/compatibilidad legacy (migración progresiva).

## Encabezados

- Página: `PageHeader` (H1 + subtítulo + acciones).
- Sección: `SectionHeader` (título + subtítulo + badge/aside opcional).

## Métricas

- `MetricCard` como estándar para KPIs operativos.
- `StatCard` se mantiene temporalmente en vistas legacy; migrar gradualmente.

## Estados canónicos

- `loading`: mensaje corto + skeleton opcional.
- `empty`: usar `EmptyState` con acción clara.
- `error`: mensaje explicativo + retry cuando aplique.
- `success`: feedback no bloqueante con toast.

## Motion

- Duración rápida: 140ms
- Duración base: 220ms
- Duración lenta: 320ms
- Easing base: `cubic-bezier(0.2, 0.8, 0.2, 1)`

## Accesibilidad base

- Todos los elementos interactivos visibles deben tener `focus-visible`.
- Contraste mínimo AA en texto y estados críticos.
- Overlay/modales: cierre con `Esc` y enfoque predecible.
