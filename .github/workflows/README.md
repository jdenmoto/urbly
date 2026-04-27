# CI/CD Workflows

Este proyecto sigue flujo feature -> develop -> main:

- `ci.yml`
  - Corre en PR/push (`feature/**`, `develop`, `main`)
  - Instala deps web/functions, genera `.env.local` desde secrets, hace lint incremental (`lint:ci` sobre archivos cambiados) y además lint completo en PRs y ramas protegidas, luego typecheck web/functions, build web y build functions.

- `preview.yml`
  - Manual (`workflow_dispatch`)
  - Instala dependencias web/functions, genera `.env.local`, hace typecheck web/functions, build web/functions y publica un preview channel bajo demanda.
  - Sirve para validar una rama manualmente con el mismo baseline mínimo del pipeline antes de compartir una URL temporal.

- `deploy-develop.yml`
  - Corre **solo cuando `CI` termina exitoso** para la rama `develop` (`workflow_run`).
  - Repite instalación + typecheck/build de web/functions sobre el commit validado por CI antes de desplegar.
  - Despliega a canal `develop` (staging) en Firebase Hosting.
  - Extrae la URL del canal y la agrega automáticamente a referrers permitidos de la API key web (gcloud).

- `deploy.yml`
  - Corre **solo cuando `CI` termina exitoso** para la rama `main` (`workflow_run`).
  - Repite instalación + lint/typecheck/build de web/functions sobre el commit validado por CI antes de desplegar.
  - Despliega a producción (hosting + functions + firestore rules/indexes).

- `rollback.yml`
  - Manual (`workflow_dispatch`)
  - Permite rollback de Hosting usando `firebase hosting:clone`.

## Pipeline mínimo confiable

1. `ci.yml` debe quedar verde en el SHA a desplegar.
2. `deploy-develop.yml` y `deploy.yml` solo arrancan después de ese verde y vuelven a correr builds explícitos de web y functions.
3. `preview.yml` mantiene el mismo baseline mínimo aunque el deploy sea manual.
4. Ningún deploy debe depender de artefactos implícitos ni asumir que solo Hosting importa si el repo completo está roto.

## Secrets requeridos

### Deploy / Rollback
- `FIREBASE_SERVICE_ACCOUNT` (JSON completo de service account)
- `FIREBASE_PROJECT_ID` (ej: `urbly-2bae2`)
- `FIREBASE_HOSTING_SITE` (opcional; si no existe usa `FIREBASE_PROJECT_ID`)

### Build web (.env.local en CI)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_GOOGLE_MAPS_MAP_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`

### Secrets opcionales / comportamiento adicional
- `FIREBASE_BROWSER_KEY_ID` (opcional, útil para scripts de preview/referrer)
  - si falta, el deploy a `develop` no falla, pero omite el whitelist automático de la URL staging

## Checks mínimos esperados
- lint incremental en CI para ramas activas
- lint completo en PRs y ramas protegidas
- typecheck web
- typecheck functions
- build web
- build functions

## Supuestos operativos

- `deploy-develop.yml` y `deploy.yml` usan el `head_sha` del `workflow_run`, no el estado más reciente de la rama.
- Los workflows generan `.env.local` en runtime; no se versionan secretos.
- Preview y staging publican Hosting, pero igual validan functions para evitar divergencia con producción.

> Nota: los workflows generan `.env.local` dinámicamente en tiempo de ejecución; no se versionan secretos en el repositorio.
