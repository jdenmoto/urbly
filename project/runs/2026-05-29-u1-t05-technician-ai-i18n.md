# U1-T05 — Technician/AI i18n (es)

Fecha: 2026-05-29
Rama: feat/u1-t05-technician-ai-i18n-20260529

## Objetivo
Completar i18n en módulos técnicos/IA con alcance exclusivo `es`.

## Cambios
- `src/features/ai/AiSuggestionCard.tsx`
  - migración de labels hardcodeados a claves `ai.card.*` (tipos de sugerencia, acciones, badges, trazabilidad y estados bloqueados).
- `public/locales/es.yaml`
  - agregado bloque `ai.card.*`.
- `project/artifacts/ui-ux-tracker-2026-05-29.md`
  - `U1-T05` marcado como completado.

## Validación
- `npm run test:run -- src/features/technician/__tests__/TechnicianHomePage.test.ts src/features/technician/__tests__/TechnicianPrimaryMobileCta.test.ts`
- `npm run typecheck`
- `npm run lint -- src/features/ai/AiSuggestionCard.tsx src/features/ai/AiWorkspacePage.tsx src/features/technician/TechnicianHomePage.tsx src/features/technician/TechnicianPrimaryMobileCta.tsx`

Resultado:
- tests: ok
- typecheck: ok
- lint: ok (warnings preexistentes no relacionados)
