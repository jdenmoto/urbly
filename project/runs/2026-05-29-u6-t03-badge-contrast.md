# U6-T03 — Verificar contraste mínimo de pills/etiquetas críticas

Fecha: 2026-05-29
Rama: feat/u6-t03-badge-contrast-20260529

## Cambios
- `Badge` ahora usa combinaciones con mayor contraste:
  - neutral: `bg-fog-200 text-ink-900`
  - success: `bg-emerald-200 text-emerald-900`
  - warning: `bg-amber-200 text-amber-900`
  - danger: `bg-rose-200 text-rose-900`

## Validación
- `npm run test:run -- src/features/ai/__tests__/AiSuggestionCard.test.tsx` ✅
- `npm run lint -- src/components/Badge.tsx` ✅ (warnings preexistentes globales)
