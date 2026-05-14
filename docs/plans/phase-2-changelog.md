# Phase 2 Changelog — Services como entrada operativa

Branch de fase: `phase/2-services-only`  
Base: `develop`  
Estado: listo para PR contra `develop`.

## Resumen

Fase 2 mueve la experiencia operativa visible hacia `/services` y deja `/scheduling` como legacy no visible/redirigido, sin borrar todavía el módulo histórico.

## Cambios principales

- Removido `/scheduling` de la navegación visible.
- `/scheduling` ahora redirige a `/services` con `Navigate replace`.
- Removido lazy import directo de `SchedulingPage` desde el router principal.
- Migrados labels usados por Services desde `scheduling.*` hacia `services.*`.
- Conservados labels legacy `scheduling.*` para el módulo histórico.
- Aislados imports legacy de scheduling detrás de `legacySchedulingAdapter.tsx`.
- `ServicesPage` y `ServiceCloseoutPage` ya no importan directamente scheduling.
- Agregado test del adapter legacy.

## Validaciones finales ejecutadas

```bash
npm run lint
npm run typecheck
npm run test:run
npm run test:coverage
npm run test:rules
npm run build:minimum
```

Resultado:

- Lint: pasa con 8 warnings preexistentes.
- Typecheck: pasa.
- Unit tests: 70 passed, 20 skipped de rules fuera de emulator normal.
- Coverage: pasa; umbrales críticos siguen verdes.
- Firebase Rules emulator: 20 passed.
- Build frontend + functions: pasa.

## Notas técnicas

- No se eliminó el módulo legacy de scheduling; queda aislado para evitar scope destructivo.
- Persisten warnings preexistentes de `useLayoutEffect` en tests legacy y chunks circulares durante build.
- El chunk `feature-scheduling` aún aparece porque el adapter conserva dependencias legacy puntuales; una fase posterior puede eliminarlo cuando se migre o borre el código heredado.

## Siguiente fase

Fase 3 — Portal cliente.

Primer punto de arranque:

1. Esperar merge/checks de Fase 2 en `develop`.
2. Crear/usar branch de fase de Fase 3 desde `develop` actualizado.
3. Ejecutar la primera tarea de portal cliente según `docs/plans/urbly-atomic-task-list.md`.
