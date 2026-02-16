# CI/CD Workflows

Este proyecto sigue flujo feature -> develop -> main:

- `ci.yml`
  - Corre en PR/push (`feature/**`, `develop`, `main`)
  - Instala deps, lint, build web y build functions.

- `preview.yml`
  - En cada PR hacia `develop`
  - Hace build y publica un preview channel en Firebase (`pr-<numero>`).

- `deploy-develop.yml`
  - En push a `develop`
  - Despliega a canal `develop` (staging) en Firebase Hosting.

- `deploy.yml`
  - En push a `main`
  - Despliega a producción (hosting + functions + firestore rules/indexes).

- `rollback.yml`
  - Manual (`workflow_dispatch`)
  - Permite rollback de Hosting usando `firebase hosting:clone`.

## Secrets requeridos

- `FIREBASE_SERVICE_ACCOUNT` (JSON completo de service account)
- `FIREBASE_PROJECT_ID` (ej: `urbly-2bae2`)
- `FIREBASE_HOSTING_SITE` (opcional; si no existe usa `FIREBASE_PROJECT_ID`)
