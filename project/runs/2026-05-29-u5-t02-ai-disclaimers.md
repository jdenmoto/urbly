# U5-T02 — Normalizar aviso de sugerencia y aprobación humana

Fecha: 2026-05-29
Rama: feat/u5-t02-ai-disclaimers-20260529

## Cambios
- `AiWorkspacePage`: agregado banner explícito de seguridad/operación:
  - IA solo sugiere
  - toda acción requiere validación humana
- `es.yaml`: nuevas claves `ai.disclaimer.*`.

## Validación
- `npm run test:run -- src/features/ai/__tests__/AiSuggestionCard.test.tsx` ✅
- `npm run lint -- src/features/ai/AiWorkspacePage.tsx public/locales/es.yaml` ✅ (warnings preexistentes globales)
