# Phase 1 Changelog — Multitenancy + Seguridad

Branch de fase: `phase/1-multitenancy-security`  
Base: `develop`  
Estado: listo para PR contra `develop`.

## Resumen

Fase 1 endurece el modelo multi-tenant de Urbly alrededor de `account`, memberships por cuenta, permisos por rol y reglas explícitas para datos/archivos críticos de órdenes de servicio.

## Cambios principales

- Agregado modelo base de `Account`, memberships y roles tenant-aware.
- Centralizados helpers de permisos por cuenta (`role + permissions[]`).
- Agregada migración idempotente para `urbly-default`.
- Endurecidas Firestore Rules con helpers tenant-aware y reglas explícitas para `service_orders`.
- Separadas reglas de lectura/escritura de `service_orders` por rol:
  - roles internos autorizados dentro del account
  - técnico solo si está asignado
  - cliente/building admin solo por relación permitida
  - `view`/`auditoria` sin escritura
- Endurecidas Storage Rules para evidencias de órdenes de servicio por account/service order/rol.
- Protegido `generateServiceReportPdf` con validación granular de account, membership, rol y relación.
- Protegido `importBuildings` con membership activa, permiso `import_buildings` o rol autorizado.
- Persistencia de importación propaga `accountId` a edificios y administraciones.
- Agregada corrección de cobertura para mantener umbral crítico de `serviceOrderPermissions.ts`.

## Validaciones finales ejecutadas

```bash
npm run lint
npm run typecheck
npm run test:run
npm run test:coverage
npm run test:rules
npm run build:minimum
npm audit
npm --prefix functions audit
```

Resultado:

- Lint: pasa con 8 warnings preexistentes.
- Typecheck: pasa.
- Unit tests: 69 passed, 20 skipped de rules fuera de emulator normal.
- Coverage: pasa; `serviceOrderPermissions.ts` queda en 100% branch coverage.
- Firebase Rules emulator: 20 passed.
- Build frontend + functions: pasa.
- Audit root/functions: 0 vulnerabilities reportadas en este estado.

## Notas técnicas

- Firestore Rules no permite lectura parcial/proyección de campos; por eso no se concedió lectura básica a `view` sobre documentos que pueden contener evidencias sensibles.
- El fallback legacy se cerró específicamente para escrituras críticas de `service_orders`; otros cierres progresivos quedan para fases posteriores si aparecen durante auditoría.
- Build mantiene warnings de chunks circulares preexistentes entre `feature-buildings`, `feature-services` y `feature-scheduling`.

## Siguiente fase

Fase 2 — unificación Services/Scheduling.

Primer punto de arranque:

1. Crear/usar branch de fase `phase/2-services-only` desde `develop` actualizado cuando Fase 1 esté integrada.
2. Ejecutar F2-T01: quitar Scheduling del nav visible.
3. Mantener `/services` como verdad operativa y redirigir `/scheduling` progresivamente.
