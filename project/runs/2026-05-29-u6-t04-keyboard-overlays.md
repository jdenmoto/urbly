# U6-T04 — Keyboard en overlays (escape + tab cycle)

Fecha: 2026-05-29
Rama: feat/u6-t04-keyboard-overlays-20260529

## Cambios
- `TopBar`:
  - foco inicial al abrir panel de notificaciones.
  - cierre por `Escape` mantenido.
  - ciclo de tabulación contenido dentro del dialog de notificaciones (mobile/desktop).
  - refs de panel para manejo de foco (`tabIndex=-1`).

## Validación
- `npm run lint -- src/components/TopBar.tsx` ✅ (warnings preexistentes globales)
