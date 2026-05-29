# U6-T02 — Semántica de controles interactivos

Fecha: 2026-05-29
Rama: feat/u6-t02-interactive-semantics-20260529

## Cambios
- `BuildingsMap`:
  - overlay de cierre en modo expandido migrado de `div` clicable a `button` semántico con `aria-label`.
  - botón de expandir/reducir declara `type="button"` explícito.
  - removido `onClick` de contenedor no interactivo.

## Validación
- `npm run lint -- src/components/BuildingsMap.tsx` ✅ (warnings preexistentes globales)
