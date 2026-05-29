# U3-T02 — Sticky CTA móvil sin solapamiento

Fecha: 2026-05-29
Rama: feat/u3-t02-sticky-cta-safe-area-20260529

## Objetivo
Evitar que el CTA móvil tape contenido crítico, respetando safe area de dispositivos.

## Cambios
- `src/features/technician/TechnicianHomePage.tsx`
  - ajuste de padding inferior del layout con `env(safe-area-inset-bottom)`.
  - ajuste de posición del sticky CTA para móvil con offset seguro y variante desktop.
- `project/artifacts/ui-ux-tracker-2026-05-29.md`
  - `U3-T02` marcado como completado.

## Validación
- `npm run test:run -- src/features/technician/__tests__/TechnicianHomePage.test.ts src/features/technician/__tests__/TechnicianPrimaryMobileCta.test.ts`
- `npm run lint -- src/features/technician/TechnicianHomePage.tsx`
- `npm run typecheck`

Resultado:
- tests: ok
- lint: ok (warnings preexistentes no relacionados)
- typecheck: ok
