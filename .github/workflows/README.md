# CI/CD Workflows

Este proyecto sigue flujo feature -> develop -> main:

- `ci.yml`
  - Corre en PR/push (`feature/**`, `develop`, `main`)
  - Instala deps, genera `.env.local` desde secrets, lint incremental (`lint:ci` sobre archivos cambiados), build web y build functions.

- `preview.yml`
  - Manual (`workflow_dispatch`)
  - Hace build y publica un preview channel bajo demanda.

- `deploy-develop.yml`
  - Corre **solo cuando CI termina exitoso** para la rama `develop` (post-merge/push).
  - Despliega a canal `develop` (staging) en Firebase Hosting.
  - Extrae la URL del canal y la agrega automáticamente a referrers permitidos de la API key web (gcloud).

- `deploy.yml`
  - Corre **solo cuando CI termina exitoso** para la rama `main`.
  - Despliega a producción (hosting + functions + firestore rules/indexes).

- `rollback.yml`
  - Manual (`workflow_dispatch`)
  - Permite rollback de Hosting usando `firebase hosting:clone`.

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
- `FIREBASE_BROWSER_KEY_ID` (opcional, útil para scripts de preview/referrer)

> Nota: los workflows generan `.env.local` dinámicamente en tiempo de ejecución; no se versionan secretos en el repositorio.
