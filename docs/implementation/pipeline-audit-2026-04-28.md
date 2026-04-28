# Auditoría rápida del pipeline actual

Fecha: 2026-04-28  
Tarea: S4-T1

## Alcance auditado
- `.github/workflows/ci.yml`
- `.github/workflows/preview.yml`
- `.github/workflows/deploy-develop.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/rollback.yml`
- scripts referenciados desde `package.json`

## Veredicto corto
El pipeline ya valida lo esencial de **web + functions** antes de deploy, pero todavía tiene **duplicación alta** y **supuestos operativos implícitos** que pueden dejar huecos de confianza, sobre todo en preview y rollback.

## Qué valida hoy cada workflow

### `ci.yml`
Valida el baseline principal:
- instala dependencias web y functions
- genera `.env.local` desde secrets
- corre `lint:ci`
- corre `lint` completo en PRs y ramas `develop`/`main`
- corre `typecheck` de web y functions
- corre `build` de web y functions

### `preview.yml`
Valida y publica preview manual:
- instala dependencias web y functions
- genera `.env.local`
- corre `typecheck` y `build` de web + functions
- despliega **solo Hosting preview**

### `deploy-develop.yml`
Se dispara tras CI verde en `develop`:
- vuelve a instalar dependencias
- vuelve a generar `.env.local`
- vuelve a correr `typecheck` y `build` de web + functions
- despliega canal `develop` en Hosting
- intenta whitelistear la URL staging para la API key web

### `deploy.yml`
Se dispara tras CI verde en `main`:
- vuelve a instalar dependencias
- vuelve a generar `.env.local`
- vuelve a correr `lint`, `typecheck` y `build` de web + functions
- despliega Hosting + Functions + Firestore rules/indexes

### `rollback.yml`
Rollback manual de Hosting:
- clona una versión/canal de Hosting hacia otro canal objetivo
- **no** revierte Functions ni Firestore rules/indexes

## Duplicidades reales
1. **Instalación + `.env.local` + typecheck/build** repetidos en CI, preview, staging y producción.
2. `deploy-develop.yml` y `deploy.yml` recompilan el mismo SHA ya validado por CI en vez de reutilizar artefactos.
3. La lógica de preparar entorno está copiada casi literal en cuatro workflows.

## Huecos y supuestos implícitos

### 1. Preview no replica el release real completo
`preview.yml` valida functions, pero despliega solo Hosting.  
Supuesto implícito: para previews alcanza con frontend y cualquier cambio en functions se valida solo por build/typecheck.

**Impacto:** una rama puede tener preview web compartible sin probar integración real de functions desplegadas.

### 2. Preview no exige lint
`preview.yml` corre typecheck + build, pero no `lint`.

**Impacto:** un branch puede tener preview desplegable aunque no pase el baseline de estilo/calidad que sí se exige en CI/producción.

### 3. El rollback es parcial frente al deploy real
Producción despliega Hosting + Functions + Firestore rules/indexes, pero `rollback.yml` solo revierte Hosting.

**Impacto:** ante un incidente en functions o reglas, el workflow llamado “rollback” no devuelve el sistema completo al estado anterior.

### 4. CI depende de secrets para compilar web
Todos los workflows que construyen web generan `.env.local` desde secrets.

**Impacto:** el pipeline asume disponibilidad de secrets incluso para validar cambios que no tocan infraestructura. En PRs desde forks o contextos restringidos esto puede volverse frágil.

### 5. El whitelist de staging tiene dependencia opcional poco visible
`deploy-develop.yml` intenta agregar la URL staging a referrers usando `FIREBASE_BROWSER_KEY_ID`, pero si falta solo informa y sigue.

**Impacto:** staging puede quedar desplegado pero no necesariamente usable con la API key web si ese paso opcional era necesario.

## Diagnóstico accionable

### Prioridad alta
1. **Hacer explícita la validación mínima común** entre CI, preview y deploy: web build + functions build, y decidir si `lint` también entra en preview.
2. **Documentar que `rollback.yml` es solo de Hosting** o ampliarlo después para no sugerir una reversión total que hoy no existe.

### Prioridad media
3. **Reducir duplicación** extrayendo setup/build común o reutilizando artefactos del SHA validado por CI.
4. **Aclarar el alcance de preview**: si seguirá siendo frontend-only, dejarlo explícito en docs para no asumir que prueba functions desplegadas.
5. **Dejar visibles los secrets críticos y opcionales** para distinguir qué rompe builds y qué solo degrada staging.

## Decisión de esta tarea
No toqué workflows.

Motivo: la auditoría encontró decisiones de pipeline y alcance de deploy que conviene resolver primero en S4-T2/S4-T4, pero no apareció un fix trivial, inocuo y claramente aislado que valiera la pena aplicar en esta tarea.