# U3-T05 — QA tap targets móvil

Fecha: 2026-05-29
Rama: feat/u3-t05-tap-targets-20260529

## Objetivo
Asegurar targets táctiles consistentes (44px+) en acciones críticas de técnico móvil.

## Cambios
- `src/features/technician/TechnicianPrimaryMobileCta.tsx`
  - CTA principal móvil con `min-h-11`.
- `src/features/technician/TechnicianHomePage.tsx`
  - CTAs principales/secundarios con `min-h-11` para consistencia táctil.
  - botón de acción en header también normalizado a altura mínima.
- `project/artifacts/ui-ux-tracker-2026-05-29.md`
  - `U3-T05` marcado como completado.
  - fase U3 marcada como `done`.

## Validación
- `npm run test:run -- src/features/technician/__tests__/TechnicianHomePage.test.ts src/features/technician/__tests__/TechnicianPrimaryMobileCta.test.ts`
- `npm run lint -- src/features/technician/TechnicianHomePage.tsx src/features/technician/TechnicianPrimaryMobileCta.tsx`
- `npm run typecheck`

Resultado:
- tests: ok
- lint: ok (warnings preexistentes no relacionados)
- typecheck: ok
