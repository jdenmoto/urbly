# U5-T03 — Mejorar estructura de cards IA para escaneo rápido

Fecha: 2026-05-29
Rama: feat/u5-t03-ai-card-scan-20260529

## Cambios
- `AiSuggestionCard` añade bloque de facts rápidos:
  - tipo de sugerencia,
  - cantidad de acciones permitidas,
  - política aplicada.
- `es.yaml` incorpora claves `ai.card.quick.*`.

## Validación
- `npm run test:run -- src/features/ai/__tests__/AiSuggestionCard.test.tsx` ✅
- `npm run lint -- src/features/ai/AiSuggestionCard.tsx public/locales/es.yaml` ✅ (warnings preexistentes globales)
