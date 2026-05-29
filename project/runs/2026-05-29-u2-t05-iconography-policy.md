# U2-T05 — Política de iconografía

Fecha: 2026-05-29
Rama: feat/u2-t05-iconography-policy-20260529

## Objetivo
Definir política de iconografía por módulo y normalizar implementación en navegación.

## Cambios
- `docs/implementation/urbly-v2/u2-t05-iconography-policy-2026-05-29.md`
  - reglas de estilo (`currentColor`, `strokeWidth`, grid, consistencia por módulo).
  - mapa explícito de iconos por módulo.
- `src/app/navIcons.tsx`
  - normalización técnica usando constantes compartidas (`base`, `strokeWidth`).
  - `ShieldUser` alineado a la misma convención.
- `project/artifacts/ui-ux-tracker-2026-05-29.md`
  - `U2-T05` marcado como completado.
  - fase U2 marcada como `done`.

## Validación
- `npm run lint -- src/app/navIcons.tsx`
- `npm run typecheck`

Resultado:
- lint: ok (warnings preexistentes no relacionados)
- typecheck: ok
