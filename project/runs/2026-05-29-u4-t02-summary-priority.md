# U4-T02 — Reordenar bloques de resumen por prioridad de negocio

Fecha: 2026-05-29
Rama: feat/u4-t02-summary-priority-20260529

## Cambios
- Reordenamiento de métricas del resumen cliente para priorizar:
  1) informes listos,
  2) urgentes activos,
  3) servicios activos,
  4) cobertura de edificios.
- Segunda fila de métricas con lectura de contexto:
  - servicios completados,
  - próximas visitas.
- Nuevo cálculo `urgent` en `ClientSummaryPage`.
- Nuevas claves de i18n para `client.portal.metrics.upcoming.*`.

## Validación
- `npm run test:run -- src/features/portal/__tests__/clientPortalCopy.test.ts` ✅
- `npm run lint -- src/features/portal/ClientSummaryPage.tsx public/locales/es.yaml` ✅ (warnings preexistentes globales)
