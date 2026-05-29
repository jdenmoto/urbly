# U4-T01 — Homologar copy cliente

Fecha: 2026-05-29
Rama: feat/u4-t01-client-copy-20260529

## Cambios
- `ClientSummaryPage`:
  - eliminado copy hardcodeado para resumen de trazabilidad.
  - acciones del header migradas a `client.portal.actions.view.*`.
  - acceso faltante usa `client.portal.missing.access`.
  - empty de cobertura usa `client.portal.building.coverage.empty.hint`.
- `es.yaml`:
  - nuevas claves de acciones y resumen de trazabilidad por estado.
  - nuevo hint para empty state de cobertura por edificio.
- test `clientPortalCopy.test.ts` ampliado para incluir `ClientSummaryPage`.

## Validación
- `npm run test:run -- src/features/portal/__tests__/clientPortalCopy.test.ts` ✅
- `npm run lint -- src/features/portal/ClientSummaryPage.tsx src/features/portal/__tests__/clientPortalCopy.test.ts public/locales/es.yaml` ✅ (warnings preexistentes globales)
