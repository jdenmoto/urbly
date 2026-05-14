# Phase 3 Changelog — Portal cliente tokenizado

Branch de fase: `phase/3-client-portal`  
Base: `develop`  
Estado: listo para PR contra `develop`.

## Resumen

Fase 3 habilita el portal cliente tokenizado sin login interno, con tokens revocables y scope validado por cuenta/cliente/edificio/servicio. Agrega vistas públicas de servicios y reportes, más creación de solicitudes desde portal.

## Cambios principales

- `/portal/access` queda como ruta pública fuera de `ProtectedRoute` y `AppLayout`.
- JWT del portal incluye `jti`, `tokenVersion` y `version`.
- La generación de token actualiza estado activo, `activeTokenJti` y metadata de revocación.
- La validación rechaza tokens revocados, inactivos, desactualizados o con `jti` distinto.
- Validación de scope token-servicio-cliente-account:
  - `accountId`
  - `customerId`
  - `managementCompanyId`
  - `buildingId`
  - relación con service/report solicitado
- Agregada `ClientServicesPage` para `/portal/services`.
- Agregada `ClientReportsPage` para `/portal/reports`.
- Agregado flujo de creación de solicitudes desde portal sin login interno.
- Agregados tests de scope y solicitudes del portal.

## Validaciones finales ejecutadas

```bash
npm run lint
npm run typecheck
npm run test:run
npm run test:coverage
npm run test:rules
npm run build:minimum
```

Resultado:

- Lint: pasa con 8 warnings preexistentes.
- Typecheck: pasa.
- Unit tests: 81 passed, 20 skipped de rules fuera de emulator normal.
- Coverage: pasa; umbrales críticos siguen verdes.
- Firebase Rules emulator: 20 passed.
- Build frontend + functions: pasa.

## Notas técnicas

- Persisten warnings preexistentes de SSR/useLayoutEffect en tests legacy y chunks circulares durante build.
- El portal queda funcional sin login interno, pero sujeto a token revocable y scope validado server-side.

## Siguiente fase

Fase 4 — IA contextual.

Primer punto de arranque:

1. Esperar merge/checks de Fase 3 en `develop`.
2. Crear/usar branch `phase/4-contextual-ai` desde `develop` actualizado.
3. Ejecutar F4-T01: contrato de sugerencias IA.
