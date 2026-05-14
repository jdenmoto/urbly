# Phase 4 Changelog — IA contextual suggestion-only

Branch de fase: `phase/4-contextual-ai`  
Base: `develop`  
Estado: listo para PR contra `develop`.

## Resumen

Fase 4 introduce IA contextual bajo contrato seguro: la IA solo sugiere. No guarda, no envía, no agenda ni muta datos automáticamente.

## Cambios principales

- Contrato `AiSuggestion` con política `suggestion_only`.
- Guards/factory para impedir acciones prohibidas: `auto_save`, `auto_send`, `auto_mutate`.
- `AiSuggestionCard` reutilizable con copy explícito de revisión humana.
- `AiWorkspacePage` migrada a sugerencias seguras.
- Resumen técnico sugerido en contexto de servicio.
- Borrador de reporte sugerido en cierre de servicio.
- Mensaje sugerido para cliente, sin envío automático.
- Detección sugerida de faltantes antes del cierre, sin bloquear automáticamente.
- Follow-up sugerido post-cierre, sin scheduling automático.
- Tests unitarios del contrato, card y helpers de sugerencias.

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
- Unit tests: 92 passed, 20 skipped de rules fuera de emulator normal.
- Coverage: pasa; umbrales críticos siguen verdes.
- Firebase Rules emulator: 20 passed.
- Build frontend + functions: pasa.

## Notas técnicas

- Las sugerencias IA son UI/domain helpers determinísticos por ahora; no hay envío automático ni persistencia implícita.
- Persisten warnings preexistentes de SSR/useLayoutEffect en tests legacy y chunks circulares durante build.

## Siguiente fase

Fase 5 — UX/mobile/i18n.

Primer punto de arranque:

1. Esperar merge/checks de Fase 4 en `develop`.
2. Crear/usar branch `phase/5-ux-mobile-i18n` desde `develop` actualizado.
3. Ejecutar F5-T01: bottom nav dinámico.
