# Fase 7 — Cierre técnico canónico

Fecha: 2026-05-22
Branch: `phase/7-technician-closeout`

## Objetivo

Convertir el cierre técnico en un comando canónico con validaciones obligatorias, timeline/auditoría, reapertura controlada y sin bypasses directos a `status: completed`.

## Cambios

- Agregado `completeServiceOrderWithReport` en `src/lib/api/serviceOrders.ts`.
- Agregado `validateServiceOrderCloseout`.
- Agregado `reopenServiceOrder`.
- `completeServiceOrder` ahora delega al cierre canónico usando el reporte/evidencia existente.
- `useSchedulingCompletion` ya no persiste `status: completed` directamente; llama a `completeServiceOrderWithReport`.
- `buildCompletionPayload` deja de construir payload con `status: completed`.
- Agregado `src/lib/api/__tests__/serviceOrderCloseout.test.ts`.
- Actualizado `serviceOrderActions.test.ts` para exigir reporte/fotos en cierre semántico.

## Cobertura por tarea

- F7-T01: `completeServiceOrderWithReport` creado.
- F7-T02: checklist obligatorio.
- F7-T03: fotos obligatorias.
- F7-T04: observaciones obligatorias.
- F7-T05: timeline `completed` con actor, nota y timestamp.
- F7-T06: reapertura por `owner`, `admin`, `editor`, `supervisor`.
- F7-T07: flujo heredado sin bypass directo a `status: completed`.
- F7-T08: tests de cierre válido/inválido.

## Validaciones

```bash
npm run test:run -- src/lib/api/__tests__/serviceOrderCloseout.test.ts src/lib/api/__tests__/serviceOrderActions.test.ts
npm run test:run
npm run typecheck
npm run lint
npm run build:minimum
```

Resultados:

- Tests enfocados: PASS, 11 tests.
- Suite completa: PASS, 121 passed / 20 skipped.
- Typecheck: PASS.
- Lint: PASS con warnings preexistentes/no relacionados.
- Build minimum: PASS con warnings preexistentes de chunks circulares Vite.

## Commits

- `11978f1` — `test: agregar contrato de cierre canonico`
- `4094375` — `feat: crear cierre canonico de servicios`
- `3d1e14b` — `test: actualizar cierre semantico canonico`
- `b58819a` — `refactor: usar cierre canonico en flujo heredado`

## Siguiente paso

Gate final/changelog/PR de Fase 7, o extender `urbly-master-implementation-plan.md` con la siguiente fase antes de continuar.
