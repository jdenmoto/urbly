# U2-T04 — TopBar responsive

Fecha: 2026-05-29
Rama: feat/u2-t04-topbar-responsive-20260529

## Objetivo
Mejorar jerarquía visual y usabilidad de TopBar en móvil/tablet.

## Cambios
- `src/components/TopBar.tsx`
  - layout general del header adaptado a `flex-col` en móvil y `flex-row` en desktop.
  - fila móvil con badge de rol + acceso a notificaciones.
  - dropdown de notificaciones con ancho responsivo seguro (`min(24rem, 100vw-2rem)`).
  - refs separadas para dropdown móvil/desktop para cierre fuera robusto.
- `project/artifacts/ui-ux-tracker-2026-05-29.md`
  - `U2-T04` marcado como completado.

## Validación
- `npm run lint -- src/components/TopBar.tsx`
- `npm run typecheck`

Resultado:
- lint: ok (warnings preexistentes no relacionados)
- typecheck: ok
