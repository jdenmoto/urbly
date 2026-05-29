# U6-T01 — Focus-visible consistente

Fecha: 2026-05-29
Rama: feat/u6-t01-focus-visible-global-20260529

## Cambios
- Refuerzo global de `focus-visible` para:
  - `button`, `a`, `input`, `select`, `textarea`,
  - elementos interactivos con `role="button"` o `tabindex="0"`.
- Added fallback para `forced-colors` (alto contraste del sistema).

## Validación
- `npm run lint -- src/styles/index.css` ✅ (warnings preexistentes globales)
