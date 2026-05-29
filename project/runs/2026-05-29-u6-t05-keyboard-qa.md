# U6-T05 — QA de teclado en rutas críticas

Fecha: 2026-05-29
Rama: feat/u6-t05-keyboard-qa-report-20260529

## Rutas cubiertas (inspección + smoke)
- `/services`
- `/services/:id`
- `/services/:id/closeout`
- `/ai`
- `/portal`
- `/portal/services`
- `/portal/reports`

## Checklist
- [x] foco visible consistente en controles primarios
- [x] botones/links con semántica explícita (sin `div` clicables en componentes críticos)
- [x] overlay de notificaciones con `Escape` para cierre
- [x] overlay de notificaciones con ciclo de tabulación contenido
- [x] fallback `forced-colors` para focus ring global
- [x] contraste reforzado en badges críticos

## Validación técnica de soporte
- `npm run lint -- src/components/TopBar.tsx src/components/BuildingsMap.tsx src/components/Badge.tsx src/styles/index.css` ✅ (warnings preexistentes globales)
