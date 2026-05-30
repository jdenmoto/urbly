# Evidencia ejecución atómica A1-A2-B1

Fecha: 2026-05-30
Owner: developer

## Tareas ejecutadas

### A1 — Workflow staging: credenciales seed users
- Archivo: `.github/workflows/deploy-develop.yml`
- Cambio: export de `FIREBASE_SERVICE_ACCOUNT_PATH="$HOME/firebase-sa.json"` en paso `Reset and seed develop data`.
- Resultado esperado: `seed:users` puede resolver credenciales por ruta explícita, además de `GOOGLE_APPLICATION_CREDENTIALS`.

### A2 — Script seed users hardening
- Archivo: `scripts/seed-demo-users.mjs`
- Cambios:
  - fallback de credenciales: `FIREBASE_SERVICE_ACCOUNT_PATH || GOOGLE_APPLICATION_CREDENTIALS || FIREBASE_SERVICE_ACCOUNT`
  - soporte de SA inline (`FIREBASE_SERVICE_ACCOUNT` JSON)
  - mensaje de error consolidado y más claro
- Validación local: ejecución negativa controlada sin envs devuelve error esperado y no falla por sintaxis.

### B1 — Cierre técnico desacoplado de scheduling (nativo services)
- Nuevos archivos:
  - `src/features/services/serviceCompletion.ts`
  - `src/features/services/useServiceCloseoutCompletion.ts`
  - `src/features/services/CompleteServiceModal.tsx`
- Archivo actualizado:
  - `src/features/services/legacySchedulingAdapter.tsx`
- Cambio principal: `legacySchedulingAdapter` deja de depender de `src/features/scheduling/*` para el flujo de cierre técnico.

## Verificación técnica
- `npm run typecheck` ✅
- Tests focalizados reportes/services:
  - `src/features/services/__tests__/serviceReportSnapshot.contract.test.ts`
  - `src/features/services/__tests__/serviceReportSnapshot.test.ts`
  - `src/features/services/__tests__/serviceReportPrint.test.ts`
  - `src/serviceReports.snapshot.test.ts`
  - `src/serviceReports.authorization.test.ts`
  Resultado: `5 passed`, `10 passed` ✅

## Pendiente para cerrar Fase A
- Ejecutar deploy staging real en GitHub Actions para confirmar `seed:all`/`seed:smoke` en entorno remoto.

### B2 — Limpieza de naming/puente legacy remanente
- Renombrado adapter:
  - `src/features/services/legacySchedulingAdapter.tsx` -> `src/features/services/serviceCloseoutAdapter.tsx`
- Imports actualizados:
  - `ServiceCloseoutPage.tsx`
  - `ServicesPage.tsx`
  - test del adapter
- Renombrado test:
  - `src/features/services/__tests__/legacySchedulingAdapter.test.ts`
  - -> `src/features/services/__tests__/serviceCloseoutAdapter.test.ts`
- Verificación:
  - `npm run typecheck` ✅
  - `npm run test:run -- src/features/services/__tests__/serviceCloseoutAdapter.test.ts` ✅

### D1 — Limpieza residual de referencias legacy
- Se movió creación rápida de service orders a namespace `services`:
  - `src/features/services/CreateServiceOrderDrawer.tsx`
  - `src/features/services/serviceQuickCreateSchemas.ts`
- `serviceCloseoutAdapter` ahora consume drawer local de `services`.
- Verificación: no quedan imports desde `src/features/services/*` hacia:
  - `features/scheduling`
  - `features/operations/scheduling`
- `npm run typecheck` ✅

## Validación técnica integral (cierre de ciclo)
- `npm run build:minimum` ✅
- `npm run lint` ✅ (5 warnings preexistentes, 0 errores)
- `npm run test:run` ✅ (34 archivos passed, 1 skipped; 122 tests passed, 20 skipped)
