# Fase 2 — Cierre técnico (changelog)

Fecha: 2026-04-29
Rama: `feat/scheduling-phase-2`

## Implementado

### Flujo operativo
- Edición completa desde `services` y entrada directa desde `scheduling` (`/services?edit=<id>`).
- Asignación y reasignación de técnico desde listado y desde detalle.
- Acciones operativas en UI: confirmar y cancelar servicio con motivo.
- Creación rápida conectada a catálogo de tipos (`settings/service_types`).

### Evidencia / storage
- Reglas para `service-orders/*` en adjuntos, issues y completion photos.

### Técnico
- Visibilidad robusta de servicios asignados (compatibilidad de identidad técnica).

### UX/UI
- Corrección de duplicidad de header detectada en `services`.
- Favicon agregado y enlazado.

### CI/Seed develop
- Workflow develop con deploy backend + `firestore:clear` + `seed:all`.
- Smoke checks post-seed (`seed:smoke`).
- Scripts de clear/seed endurecidos para ejecución por SA de CI (`GOOGLE_APPLICATION_CREDENTIALS` / `FIREBASE_SERVICE_ACCOUNT_PATH`).
- Seed crea `service_orders` de muestra y fallback de `settings/service_types`.

## Validaciones automáticas
- `npm run typecheck` ✅
- `npm run build:minimum` ✅

## Pendiente para cierre total (manual/deploy)
- Validar en ambiente desplegado:
  - upload de adjuntos
  - upload de novedad (2 fotos)
  - upload de cierre
- Validar ejecución real del workflow `deploy-develop.yml` con seed+smoke en GitHub Actions.
- Confirmar coherencia final closeout → print → PDF con muestra real de datos de cierre.
