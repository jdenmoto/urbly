# CI/CD Workflows

Flujo esperado: `feature/**` -> `develop` -> `main`.

## Qué hace cada workflow

| Workflow | Cuándo corre | Qué valida | Qué despliega | Secrets que usa |
| --- | --- | --- | --- | --- |
| `ci.yml` | PR a `develop/main` y push a `feature/**`, `develop`, `main` | `lint:ci`, `lint` completo en PR/protegidas, `typecheck` web/functions, `build:minimum` | Nada | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_MAP_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `FIREBASE_PROJECT_ID`, `FIREBASE_BROWSER_KEY_ID`* |
| `preview.yml` | Manual (`workflow_dispatch`) | `validate:release` = lint web + build web + build functions | Hosting preview channel | mismos secrets de build + `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, `GITHUB_TOKEN` |
| `deploy-develop.yml` | `workflow_run` de `CI` verde sobre `develop` | `validate:release` sobre el `head_sha` validado por CI | Hosting channel `develop` | mismos secrets de build + `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, `FIREBASE_BROWSER_KEY_ID`* |
| `deploy.yml` | `workflow_run` de `CI` verde sobre `main` | `validate:release` sobre el `head_sha` validado por CI | Hosting + Functions + Firestore rules/indexes | mismos secrets de build + `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID` |
| `rollback.yml` | Manual (`workflow_dispatch`) | No recompila ni revalida | Solo Hosting (`firebase hosting:clone`) | `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, `FIREBASE_HOSTING_SITE`* |

\* opcional o con fallback.

## Condiciones antes de merge o deploy

### Antes de merge a `develop` o `main`
- `ci.yml` debe quedar verde en el SHA a mergear.
- Ese verde implica baseline mínimo real: lint web + typecheck web/functions + build web/functions.
- Si faltan secrets de build, CI no es confiable aunque el cambio parezca solo frontend.

### Antes de usar `preview.yml`
- Es un deploy manual para compartir una URL temporal.
- Valida el mismo baseline de release (`validate:release`), pero **solo publica Hosting**.
- No tomar un preview como prueba de deploy real de Functions o Firestore.

### Antes de staging (`deploy-develop.yml`)
- Solo corre si `CI` terminó en `success` para `develop`.
- Revalida el mismo `head_sha`; no despliega el estado más reciente de la rama si ese SHA cambió después.
- Si falta `FIREBASE_BROWSER_KEY_ID`, staging despliega igual pero se omite el whitelist automático de la URL.

### Antes de producción (`deploy.yml`)
- Solo corre si `CI` terminó en `success` para `main`.
- Revalida el mismo `head_sha` antes de desplegar.
- Producción sí publica `hosting`, `functions`, `firestore:rules` y `firestore:indexes`; el repo debe estar sano completo, no solo el frontend.

### Antes de rollback (`rollback.yml`)
- Confirmar que el incidente está en Hosting.
- Este workflow **no revierte Functions ni Firestore**.
- Si el problema vive en backend o reglas, hace falta otro procedimiento.

## Supuestos críticos

- Los workflows generan `.env.local` en runtime; los secrets no se versionan.
- `deploy-develop.yml` y `deploy.yml` usan `github.event.workflow_run.head_sha` para fijar exactamente el commit ya validado.
- Preview y staging publican Hosting, pero validan Functions para no divergir del baseline de producción.
- El nombre `rollback.yml` puede inducir a pensar en reversión total, pero hoy el alcance real es solo Hosting.

## Secrets por grupo

### Build de web / baseline de release
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_GOOGLE_MAPS_MAP_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_BROWSER_KEY_ID` *(opcional para whitelist de staging)*

### Deploy y rollback en Firebase
- `FIREBASE_SERVICE_ACCOUNT`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_HOSTING_SITE` *(solo rollback; si falta, usa `FIREBASE_PROJECT_ID` como fallback)*
