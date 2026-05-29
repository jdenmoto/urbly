# U3-T03 — Cards de cola técnica (patrón de estado)

Fecha: 2026-05-29
Rama: feat/u3-t03-queue-cards-pattern-20260529

## Objetivo
Homologar cards de la cola técnica para escaneo rápido de estado en lista.

## Cambios
- `src/features/technician/TechnicianHomePage.tsx`
  - cada card de cola agrega mini-bloques consistentes: `Estado`, `Novedades`, `Avances`.
  - mantiene patrón visual homogéneo con superficies `bg-fog-50` y labels uppercase.
- `public/locales/es.yaml`
  - nueva clave `technician.progress.label`.
- `project/artifacts/ui-ux-tracker-2026-05-29.md`
  - `U3-T03` marcado como completado.

## Validación
- `npm run test:run -- src/features/technician/__tests__/TechnicianHomePage.test.ts`
- `npm run lint -- src/features/technician/TechnicianHomePage.tsx`
- `npm run typecheck`

Resultado:
- tests: ok
- lint: ok (warnings preexistentes no relacionados)
- typecheck: ok
