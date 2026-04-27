# Development Backlog

## Backlog activo — 2026-04-27
Fuente: `project/artifacts/2026-04-27-legacy-flow-audit.md`

### Alta prioridad
1. Migrar `src/features/buildings/BuildingsPage.tsx` para consumir contrato canónico en vez de `appointments` directos.
2. Reducir dependencia legacy en `src/features/scheduling/schedulingItem.ts`.
3. Diseñar corte seguro para `src/features/scheduling/schedulingSeries.ts` antes de tocar series/regeneración.
4. Definir estrategia de migración para `functions/src/reports.ts` desde `appointments` a `service_orders`.

### Prioridad media
5. Blindar mejor `src/lib/api/queries.ts` como capa de transición.
6. Ejecutar primer corte pequeño de extracción en `src/features/scheduling/SchedulingPage.tsx`.
7. Ocultar o relegar placeholders visibles de navegación si siguen expuestos.

### Verificación obligatoria en cada corte
- `npm run build`
- `npm --prefix functions run build` cuando se toque `functions/`
- evidencia documental de qué deuda baja o queda explícitamente diferida
