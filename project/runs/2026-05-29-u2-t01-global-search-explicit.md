# U2-T01 — Búsqueda global explícitamente deshabilitada

Fecha: 2026-05-29
Rama: feat/u2-t01-global-search-explicit-20260529

## Objetivo
Evitar affordance engañosa de búsqueda global cuando todavía no existe backend/flujo funcional.

## Cambios
- `src/components/TopBar.tsx`
  - botón de búsqueda global marcado como deshabilitado explícito (`disabled`, `aria-disabled`, `title`).
  - estilo visual de control inactivo para comunicar estado no disponible.
- `project/artifacts/ui-ux-tracker-2026-05-29.md`
  - fase U2 pasa a `in_progress`.
  - `U2-T01` marcado como completado.

## Validación
- `npm run lint -- src/components/TopBar.tsx`
- `npm run typecheck`

Resultado:
- lint: ok (warnings preexistentes no relacionados)
- typecheck: ok
