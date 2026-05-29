# UI/UX Changelog — 2026-05-29

## Alcance
Implementación secuencial del plan UI/UX U0→U7 sobre `develop` con ramas atómicas por tarea y evidencia por ejecución.

## Resumen por fase
- U0 Baseline visual: tokens, motion, focus-ring y contrato visual base.
- U1 Copy/i18n: hardening `es` en dashboard/services/portal/technician/ai y cobertura de tests de copy.
- U2 Shell/Nav: notificaciones robustas, navegación por rol, topbar responsive, política de iconografía.
- U3 Técnico móvil: lectura 5s, CTA sticky safe-area, cards de cola, feedback y tap-targets.
- U4 Portal cliente: copy cliente, prioridad de resumen, trazabilidad legible, tarjetas por edificio, narrativa segura.
- U5 AI workspace: semántica visual homologada, disclaimers humanos, cards escaneables, CTAs a services/closeout.
- U6 Accesibilidad: focus-visible transversal, semántica de interacción, contraste de badges, overlays keyboard-safe, QA teclado.
- U7 Cierre: validación final, evidencia y handoff a verify.

## Validación final ejecutada
- `npm run test:run` ✅ (34 files passed, 1 skipped; 122 tests passed, 20 skipped)
- `npm run typecheck` ✅
- `npm run build:minimum` ✅
- `npm run lint` ✅ con 5 warnings preexistentes (sin errores)

## Nota de warnings preexistentes
- `src/app/layouts/AppLayout.tsx` (unused vars)
- `src/components/ShellContextPanel.tsx` (unused type)
- `src/features/services/useOperationalServiceOrders.ts` (unused var)
- `src/features/settings/TenantAutomationSettingsPage.tsx` (unused type)
