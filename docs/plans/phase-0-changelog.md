# Phase 0 — Tests/CI Base Changelog

Branch: `phase/0-tests-ci-base`

## Completed tasks

- F0-T01 — Mock/env Firebase para Vitest
  - Added dummy Firebase env setup in Vitest.
  - Fixed `auth/invalid-api-key` failures.
- F0-T02 — Agregar `npm run test:run` al CI
  - CI now runs Vitest before minimum build.
- F0-T03 — Configurar cobertura Vitest 70/90
  - Added `test:coverage`.
  - Added `@vitest/coverage-v8`.
  - Global threshold: 70%.
  - Critical thresholds: 90% for service order permissions/transitions.
  - Reports threshold exception documented until stable suite exists.
- F0-T04 — Firebase Rules test harness
  - Added `test:rules`.
  - Added Firebase emulator rules harness.
  - Added placeholder rules tests loading Firestore/Storage rules.

## Final validation

Executed successfully:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run test:coverage
npm run test:rules
npm run build:minimum
npm audit
npm --prefix functions audit
```

Notes:

- Lint still reports 8 preexisting warnings, 0 errors.
- React SSR `useLayoutEffect` warnings remain non-blocking in scheduling shell test.
- Vite still reports circular chunk warnings involving feature-buildings/services/scheduling.

## Next phase

Start Phase 1 — Multitenancy + security.

First task: `F1-T01 — Definir tipos Account y Membership`.
