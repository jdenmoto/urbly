# U5-T04 — Alinear acciones IA con flujos de Services/Closeout

Fecha: 2026-05-29
Rama: feat/u5-t04-ai-services-alignment-20260529

## Cambios
- `AiWorkspacePage` agrega CTAs directos por caso:
  - Ver servicio (`/services/:id`)
  - Ir a cierre (`/services/:id/closeout`)
- Se añaden claves i18n `ai.workspace.action.*`.

## Validación
- `npm run test:run -- src/features/ai/__tests__/AiSuggestionCard.test.tsx` ✅
- `npm run lint -- src/features/ai/AiWorkspacePage.tsx public/locales/es.yaml` ✅ (warnings preexistentes globales)
