# Urbly — Plan vigente de implementación

Fecha: 2026-05-30
Estado: en ejecución

## Objetivo de la fase actual
Consolidar la operación sobre `service_orders` con cierre técnico 100% nativo en `services`, reporte unificado y pipeline de staging estable (deploy + seed + smoke).

## Fase A — Estabilidad CI/CD (prioridad máxima)
1. Corregir `deploy-develop.yml` para que `seed:users` reciba credenciales en formato compatible (`FIREBASE_SERVICE_ACCOUNT_PATH` o fallback equivalente).
2. Endurecer `scripts/seed-demo-users.mjs` para aceptar la misma estrategia de credenciales usada por `seed-firestore` y `clear-firestore`.
3. Ejecutar validación completa en staging: `firestore:clear` -> `seed:all` -> `seed:smoke`.
4. Documentar precondiciones de secrets en workflows (`FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, `SEED_DEMO_PASSWORD`).

## Fase B — Cierre técnico nativo en services
1. Retirar dependencia transicional de `serviceCloseoutBridge` sobre piezas `scheduling`.
2. Mover lógica de cierre y helpers necesarios al namespace de `services`.
3. Alinear rutas, naming y contratos para que el flujo final no dependa de compatibilidad legacy.

## Fase C — Reporte único (closeout/print/PDF)
1. Definir un contrato de salida único para reporte de servicio.
2. Reusar el contrato en:
   - `serviceReport.ts` (narrativa operativa),
   - `ServiceReportPrintPage.tsx` (impresión),
   - `functions/src/serviceReports.ts` (PDF backend).
3. Agregar validaciones de consistencia para evitar divergencia entre formatos.

## Fase D — Limpieza residual y guardrails
1. Eliminar residuos `appointments/scheduling` sin uso real.
2. Conservar solo alias de compatibilidad estrictamente necesarios y con fecha de retiro.
3. Actualizar documentación técnica para reflejar arquitectura actual (sin flujo principal legacy).

## Definición de terminado (DoD)
- Deploy staging verde con seed completo (`seed:all`) y `seed:smoke` en verde.
- Cierre técnico ejecutado solo con componentes/lógica de `services`.
- Reporte funcionalmente consistente entre vista operativa, imprimible y PDF.
- Sin referencias legacy en flujo principal de operación.
- `npm run build:minimum`, `npm run test:run`, `npm run lint` en verde (warnings preexistentes documentados).

## Estado de ejecución (2026-05-30)
- [x] A1 Workflow staging credenciales seed
- [x] A2 Hardening `seed-demo-users.mjs`
- [ ] A3 Validación staging remota (`seed:all` + `seed:smoke` en GitHub Actions)
- [x] B1 Desacople de cierre técnico de `features/scheduling`
- [x] B2 Retiro de naming/puente legacy remanente en cierre
- [x] C1 Contrato único de reporte closeout/print/PDF
- [x] D1 Limpieza residual de referencias legacy
