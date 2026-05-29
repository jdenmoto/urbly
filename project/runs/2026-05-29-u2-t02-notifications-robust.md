# U2-T02 — Notificaciones robustas

Fecha: 2026-05-29
Rama: feat/u2-t02-notifications-robust-20260529

## Objetivo
Normalizar dropdown de notificaciones: scroll, estado vacío, acción principal y cierre por fuera/ESC.

## Cambios
- `src/components/TopBar.tsx`
  - cierre por click fuera y tecla Escape.
  - dropdown con `role="dialog"` y `aria-label`.
  - header con acción principal `Ver` hacia `/notifications`.
  - lista con `max-h-80` + `overflow-y-auto` para scroll robusto.
  - botón de apertura con `aria-expanded` y `aria-haspopup`.
- `project/artifacts/ui-ux-tracker-2026-05-29.md`
  - `U2-T02` marcado como completado.

## Validación
- `npm run lint -- src/components/TopBar.tsx`
- `npm run typecheck`
- `npm run test:run -- src/app/nav.test.ts`

Resultado:
- lint: ok (warnings preexistentes no relacionados)
- typecheck: ok
- tests: ok
