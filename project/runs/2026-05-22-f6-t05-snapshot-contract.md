# F6-T05 — Tests de contrato del snapshot

Fecha: 2026-05-22
Branch: `phase/6-reports-pdf`

## Objetivo

Bloquear drift entre el snapshot canónico de reportes del frontend y el modelo usado por Cloud Functions para PDF.

## Cambios

- Agregado `src/features/services/__tests__/serviceReportSnapshot.contract.test.ts`.
- El contrato compara `buildServiceReportSnapshot` contra `buildServiceReportPdfModel(...).snapshot`.
- Se cubren dos fixtures:
  - servicio completo con contexto, assignees, checklist, evidencias, issues, review y timestamps.
  - servicio degradado con datos vacíos/no normalizados.
- Corregido `src/features/services/serviceReportSnapshot.ts` para aplicar defaults consistentes:
  - title vacío -> `Servicio`
  - type vacío -> `unknown`
  - priority vacío -> `medium`
  - status vacío -> `draft`

## Evidencia TDD

RED:

```bash
npm run test:run -- src/features/services/__tests__/serviceReportSnapshot.contract.test.ts
```

Falló por drift real: Functions normalizaba defaults, frontend no.

GREEN:

```bash
npm run test:run -- src/features/services/__tests__/serviceReportSnapshot.contract.test.ts
```

Resultado: 2 tests passing.

## Validaciones

```bash
npm run test:run -- src/features/services/__tests__/serviceReportSnapshot.test.ts src/features/services/__tests__/serviceReportPrint.test.ts src/features/services/__tests__/serviceSuggestions.test.ts src/serviceReports.snapshot.test.ts
npm run test:run
npm run typecheck
npm run lint
npm --prefix functions run build
npm run build:minimum
```

Resultados:

- Tests enfocados: PASS, 10 tests.
- Suite completa: PASS, 118 passed / 20 skipped.
- Typecheck: PASS.
- Lint: PASS con 6 warnings preexistentes/no relacionados.
- Functions build: PASS.
- Build minimum: PASS con warnings preexistentes de chunks circulares Vite.

## Commits

- `87aab8e` — `test: agregar contrato de snapshot de reporte`
- `27b16de` — `fix: alinear defaults del snapshot de reporte`

## Siguiente paso

Fase 7: `F7-T01 — Crear completeServiceOrderWithReport`.
