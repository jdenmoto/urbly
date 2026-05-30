# Deuda de implementación actual

Actualizado: 2026-05-30.

## Resumen ejecutivo
La migración operativa principal está cerrada y el cierre técnico ya quedó nativo en `services`. La deuda vigente se concentra en cerrar validación remota de staging y mantener consistencia continua del contrato de reporte.

## Deuda alta

### 1. Pipeline staging falla en `seed:users`
- El workflow `deploy-develop.yml` exporta `GOOGLE_APPLICATION_CREDENTIALS`, pero `scripts/seed-demo-users.mjs` exige `FIREBASE_SERVICE_ACCOUNT_PATH`.
- Esto rompe `npm run seed:all` durante deploy staging.

Impacto: bloquea la promesa de ambiente `develop` siempre usable después del deploy.

### 2. Validación remota pendiente de contrato de reporte
- El contrato único de snapshot/reporte está implementado y cubierto por tests, pero falta comprobarlo en corrida remota de staging tras deploy y seed.

Impacto: sin verificación remota todavía existe riesgo de deriva por configuración de entorno.

## Deuda media

### 3. Hardening continuo de CI
- Mantener control de warnings y checks para evitar regresiones en pipelines de deploy.

Impacto: reduce riesgo de degradación silenciosa en ramas protegidas.

## Deuda baja

### 6. Alias transicionales aceptados temporalmente
- `/scheduling` como redirect técnico a `/services`.

Impacto: tolerable mientras no crezcan features nuevas sobre esa capa.

## Fuera de deuda principal (ya cerrado)
1. `service_orders` como modelo operativo visible dominante.
2. `services` como centro de operación diaria.
3. salida de `SchedulingPage` del flujo principal.
4. validación mínima web/functions con `npm run build:minimum`.

## Orden recomendado de resolución
1. Validación remota de staging (`seed:all` + `seed:smoke`) y cierre de A3.
2. Mantener cobertura de contrato de reporte en CI (frontend/functions).
3. Cerrar guardrails finales de deuda baja (`/scheduling` alias) según ventana de release.
