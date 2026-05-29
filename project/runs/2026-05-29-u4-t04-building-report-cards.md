# U4-T04 — Normalizar tarjetas por edificio y reportes visibles

Fecha: 2026-05-29
Rama: feat/u4-t04-building-report-cards-20260529

## Cambios
- `ClientReportsPage`: cada tarjeta de reporte ahora muestra de forma consistente:
  - nombre de edificio,
  - dirección del edificio o fallback explícito,
  - actualización visible del reporte.
- Se reutiliza `client.portal.building.coverage.no.address` para mantener copy consistente.

## Validación
- `npm run test:run -- src/features/portal/__tests__/clientPortalCopy.test.ts` ✅
- `npm run lint -- src/features/portal/ClientReportsPage.tsx` ✅ (warnings preexistentes globales)
