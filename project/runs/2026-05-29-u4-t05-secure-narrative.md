# U4-T05 — Ajustar narrativa de control y siguiente acción en portal seguro

Fecha: 2026-05-29
Rama: feat/u4-t05-secure-next-action-20260529

## Cambios
- `ClientSecurePortalPage`:
  - nuevo bloque inicial de narrativa de control para acceso seguro.
  - nueva sección de "siguiente acción recomendada" dinámica por estado del servicio.
- `es.yaml`:
  - claves `client.portal.secure.control.*`.
  - claves `client.portal.secure.nextAction.*`.

## Validación
- `npm run test:run -- src/features/portal/__tests__/clientPortalCopy.test.ts` ✅
- `npm run lint -- src/features/portal/ClientSecurePortalPage.tsx public/locales/es.yaml` ✅ (warnings preexistentes globales)
