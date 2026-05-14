# Urbly — Atomic Task List for Qwen Execution

Modelo ejecutor: `ollama/qwen2.5-coder:3b`  
Base branch: `develop`  
Regla: una tarea = cambio pequeño, verificable, con contexto mínimo.

Este archivo es la cola operativa. Cada agente debe ejecutar solo una tarea atómica salvo que el supervisor indique lo contrario.

## Estado global

Current phase: Fase 4 — IA contextual
Current task: F4-T07 — Follow-up sugerido
Next agent start: partir de `phase/4-contextual-ai` actualizado e implementar F4-T07 agregando follow-up sugerido con `AiSuggestion` y `AiSuggestionCard`, sin guardar, enviar ni mutar automáticamente.

---

# Fase 0 — Tests/CI base mínima

Branch de fase: `phase/0-tests-ci-base`

## TASK F0-T01 — Mock/env Firebase para Vitest

Status: done
Branch: `test/vitest-firebase-mock`  
Model: `ollama/qwen2.5-coder:3b`

### Objective
Eliminar el fallo `Firebase: auth/invalid-api-key` en Vitest sin cambiar lógica funcional.

### Context
`npm run test:run` falla porque `src/lib/firebase/client.ts` inicializa Firebase en import y los tests no tienen config válida.

### Files allowed
- `src/test/setup.ts`
- `vitest.config.ts`
- tests bajo `src/features/operations/scheduling/__tests__/`
- archivos mínimos de test utilities si hace falta

### Files forbidden
- `src/lib/firebase/client.ts` salvo que sea estrictamente necesario
- lógica funcional de scheduling/services

### Steps
1. Revisar `vitest.config.ts` y confirmar que `src/test/setup.ts` se carga.
2. Agregar mock de Firebase Auth/Firestore/Storage en setup o env dummy seguro para test.
3. Ejecutar solo las suites fallidas.
4. Ajustar mocks mínimos hasta que importen sin error.

### Tests first
- No aplica test-first puro: esta tarea estabiliza infraestructura de tests existente.

### Validation
```bash
npm run test:run -- src/features/operations/scheduling/__tests__/schedulingSelectors.test.ts src/features/operations/scheduling/__tests__/useSchedulingPageData.test.ts src/features/operations/scheduling/__tests__/schedulingPageShell.test.tsx
npm run test:run
```

### Done when
- Las 3 suites que fallaban ya no fallan por Firebase config.
- `npm run test:run` termina exitosamente o solo falla por errores funcionales reales documentados.
- Plan maestro y esta task list quedan actualizados.

### Completion notes
- Env dummy de Firebase configurado en `src/test/setup.ts` con `vi.stubEnv`.
- Commit: ver HEAD de `test/vitest-firebase-mock` (`test: configurar env firebase para vitest`).
- Validaciones: suites scheduling objetivo, `npm run test:run`, `npm run lint`, `npm run typecheck`.
- Siguiente agente: empezar F0-T02 agregando `npm run test:run` al CI.

### Master plan update
Al terminar:
- marcar F0-T01 done
- registrar branch/commit
- cambiar Current task a F0-T02
- indicar que el siguiente agente empieza agregando tests al CI.

## TASK F0-T02 — Agregar test:run al CI

Status: done
Branch: `test/add-vitest-to-ci`  
Model: `openai-codex/gpt-5.5`

### Objective
Hacer que CI ejecute Vitest.

### Context
`.github/workflows/ci.yml` actualmente ejecuta lint/typecheck/build pero no `npm run test:run`.

### Files allowed
- `.github/workflows/ci.yml`
- documentación mínima si aplica

### Files forbidden
- código funcional

### Steps
1. Agregar step `Run tests` después de typecheck.
2. Asegurar env dummy si los tests lo requieren.
3. Mantener build mínimo después de tests.

### Tests first
No aplica.

### Validation
```bash
npm run test:run
npm run typecheck
```

### Done when
- CI incluye `npm run test:run`.
- Validaciones locales pasan.

### Completion notes
- Agregado step `Run tests` con `npm run test:run` en `.github/workflows/ci.yml`, después de typecheck y antes de `build:minimum`.
- No se agregó env dummy al CI: Vitest ya usa setup de test con env dummy y el workflow conserva `.env.local` desde secrets.
- Commit: HEAD de `test/add-vitest-to-ci` (`chore: agregar vitest al ci`).
- Validaciones: `npm run test:run`, `npm run typecheck`, `npm run build:minimum`, `npm run lint` (pasa con 8 warnings preexistentes/no relacionados).
- Siguiente agente: empezar F0-T03 configurando cobertura Vitest 70/90.

### Master plan update
Al terminar:
- marcar F0-T02 done
- registrar branch/commit
- cambiar Current task a F0-T03
- indicar que el siguiente agente empieza configurando cobertura Vitest 70/90.

## TASK F0-T03 — Configurar cobertura Vitest 70/90

Status: done
Branch: `test/configure-coverage-thresholds`

### Objective
Configurar cobertura global 70% y cobertura crítica 90% donde sea viable.

### Context
Cobertura objetivo es obligatoria. Dominio crítico: service orders, permisos, transitions, reports.

### Files allowed
- `vitest.config.ts`
- `package.json`
- tests/config de coverage
- docs si aplica

### Files forbidden
- lógica funcional no relacionada

### Steps
1. Revisar soporte de coverage en Vitest.
2. Agregar script `test:coverage` si falta.
3. Configurar umbral global 70%.
4. Configurar umbral crítico 90% para paths críticos si Vitest lo permite de forma estable.
5. Si el umbral crítico no es viable todavía, documentar excepción en plan maestro.

### Validation
```bash
npm run test:coverage
```

### Done when
- Existe comando de coverage.
- CI puede usar coverage o queda preparado para fase.

### Completion notes
- Agregado `test:coverage` con `vitest run --coverage`.
- Agregado `@vitest/coverage-v8@4.1.5` como dev dependency.
- Configurado coverage con provider `v8`, threshold global 70% y threshold crítico 90% para `serviceOrderPermissions.ts` y `serviceOrderTransitions.ts`.
- Coverage inicial queda limitado a archivos de dominio crítico ya estables/cubiertos: `serviceOrder`, `serviceOrderOptions`, `serviceOrderPermissions` y `serviceOrderTransitions`.
- Excepción documentada: reports aún no tiene threshold crítico 90% porque no existe suite estable dedicada de reportes; debe cubrirse antes de habilitar ese threshold.
- Commit: HEAD de `test/configure-coverage-thresholds` (`test: configurar umbrales de cobertura vitest`).
- Validaciones: `npm run test:coverage`, `npm run test:run`, `npm run typecheck`, `npm run lint` (pasa con 8 warnings preexistentes), `npm audit`, `npm --prefix functions audit`.
- Siguiente agente: empezar F0-T04 preparando harness para Firebase Rules.

### Master plan update
Al terminar:
- marcar F0-T03 done
- registrar branch/commit
- cambiar Current task a F0-T04
- indicar que el siguiente agente empieza preparando test harness para Firebase Rules.

## TASK F0-T04 — Preparar test harness para Firebase Rules

Status: done
Branch: `test/firebase-rules-harness`

### Objective
Crear base para tests de Firestore/Storage Rules con emulator.

### Context
Las reglas tenant-aware serán críticas en Fase 1. Antes debe existir harness.

### Files allowed
- `package.json`
- `firebase.json`
- `test/rules/**` o `src/test/rules/**`
- docs de test rules

### Files forbidden
- reglas de producción salvo ajuste mínimo requerido para correr tests

### Steps
1. Revisar si existe Firebase Rules testing dependency.
2. Agregar dependencia si hace falta.
3. Crear un test placeholder que cargue reglas actuales y valide caso simple.
4. Agregar script `test:rules`.

### Validation
```bash
npm run test:rules
```

### Done when
- Hay script `test:rules` ejecutable.
- Hay al menos un test de reglas pasando.

### Completion notes
- Agregado harness mínimo con `@firebase/rules-unit-testing` y `firebase-tools` como dev dependencies.
- Agregado script `test:rules` que ejecuta emuladores Firestore/Storage con proyecto demo y corre `src/test/rules/firebaseRules.test.ts`.
- El test carga las reglas actuales de `firestore.rules` y `storage.rules`, valida bloqueo anónimo en Firestore, lectura staff en Firestore y subida de imagen staff en Storage.
- El suite queda omitido automáticamente en `npm run test:run` cuando no está activo el Emulator Suite, para no romper el gate unitario normal.
- No se modificaron reglas de producción.
- Commit: HEAD de `test/firebase-rules-harness` (`test: agregar harness de reglas firebase`).
- Validaciones: `npm run test:rules`, `npm run test:run`, `npm run typecheck`, `npm run lint` (pasa con 8 warnings preexistentes), `npm run build:minimum`, `npm audit`, `npm --prefix functions audit`.
- Fase 0 queda lista para gate final y PR contra `develop`.

### Master plan update
Al terminar:
- marcar F0-T04 done
- registrar branch/commit
- indicar que Fase 0 queda lista para gate final/PR.

---

# Fase 1 — Multitenancy + seguridad

Branch de fase: `phase/1-multitenancy-security`

## TASK F1-T01 — Definir tipos Account y Membership

Status: done
Branch: `feat/account-membership-types`

### Objective
Agregar modelos TypeScript mínimos para `Account` y `AccountMember`.

### Context
Tenant root confirmado: `account`. Memberships viven en `accounts/{accountId}/members/{uid}`.

### Files allowed
- `src/core/models/account.ts`
- `src/core/models/appUser.ts`
- tests relacionados

### Steps
1. Crear tipos `Account`, `AccountMember`, `AccountRole`.
2. Incluir roles confirmados: owner, admin, editor, supervisor, scheduler, operator, technician, auditoria, view, client, building_admin.
3. Modelar `permissions[]`, `activeAccountId`, `accountIds[]`.
4. Agregar tests de tipos/helpers si aplica.

### Validation
```bash
npm run typecheck
npm run test:run -- account appUser
```

### Completion notes
- Agregado `src/core/models/account.ts` con `Account`, `AccountMember`, `AccountRole`, `AccountPermission` y roles confirmados: owner, admin, editor, supervisor, scheduler, operator, technician, auditoria, view, client, building_admin.
- Actualizado `src/core/models/appUser.ts` para reutilizar `AccountPermission` y agregar `activeAccountId` + `accountIds`, preservando `tenantId` y `emergency_scheduler` como compatibilidad legacy mientras las rutas/permissions se migran en tareas posteriores.
- Agregado test mínimo en `src/core/models/__tests__/account.test.ts`.
- Commit: HEAD de `feat/account-membership-types` (`feat: agregar modelos de cuenta y membresia`).
- Validaciones: `npm run typecheck`, `npm run test:run -- account appUser`, `npm run lint` (pasa con 8 warnings preexistentes/no relacionados).
- Siguiente agente: empezar F1-T02 creando helpers de permisos por account en `src/lib/permissions/**` y tests de permisos.

## TASK F1-T02 — Crear helpers de permisos por account

Status: done
Branch: `feat/account-permission-helpers`

### Objective
Centralizar permisos por rol + permissions[].

### Files allowed
- `src/lib/permissions/**`
- `src/features/services/serviceOrderPermissions.ts`
- tests de permisos

### Steps
1. Crear helpers `hasAccountRole`, `hasPermission`, `canReadEvidence`, `canCloseService`, `canReopenService`.
2. Cubrir matriz confirmada.
3. Tests unitarios para cada rol crítico.

### Validation
```bash
npm run test:run -- permissions serviceOrderPermissions
npm run typecheck
```

### Completion notes
- Agregado `src/lib/permissions/accountPermissions.ts` con helpers activos por membership: `hasAccountRole`, `hasPermission`, `canReadEvidence`, `canCloseService` y `canReopenService`.
- Actualizado `src/features/services/serviceOrderPermissions.ts` para usar `AccountRole`, mantener compatibilidad legacy con `emergency_scheduler` como `technician` y aplicar la matriz confirmada: scheduler agenda/asigna/reprograma sin cerrar, operator/technician ejecutan y cierran, view/auditoria quedan sin mutaciones de servicio, owner/admin/editor/supervisor conservan acciones completas.
- Agregados tests unitarios para roles críticos en `src/lib/permissions/__tests__/accountPermissions.test.ts` y actualizado `src/features/services/__tests__/serviceOrderPermissions.test.ts`.
- Commits: `e06e893` (`test: cubrir helpers de permisos por cuenta`), `fdb460f` (`feat: centralizar permisos por cuenta`).
- Validaciones: `npm run test:run -- permissions serviceOrderPermissions`, `npm run typecheck`, `npm run lint` (pasa con 8 warnings preexistentes/no relacionados).
- Siguiente agente: empezar F1-T03 creando el script idempotente `scripts/migrate-default-account.mjs` desde branch `feat/default-account-migration-script`.

## TASK F1-T03 — Script idempotente default account

Status: done
Branch: `feat/default-account-migration-script`

### Objective
Crear script idempotente que cree `accounts/urbly-default` y asigne datos actuales.

### Files allowed
- `scripts/**`
- `package.json`
- docs seed/migration

### Steps
1. Crear script `scripts/migrate-default-account.mjs`.
2. Crear `accounts/urbly-default` si no existe.
3. Añadir `accountId: urbly-default` a colecciones críticas.
4. Crear memberships para usuarios existentes.
5. Fallar si encuentra datos ambiguos.

### Validation
```bash
node scripts/migrate-default-account.mjs --dry-run
npm run lint
```

### Completion notes
- Agregado `scripts/migrate-default-account.mjs` con modo dry-run por defecto, `--commit` explícito y bloqueo adicional `--confirm-production` para escrituras fuera de emulator.
- El script crea `accounts/urbly-default`, asigna `accountId` a colecciones críticas existentes, actualiza `users` con `accountIds[]`/`activeAccountId`, crea `accounts/urbly-default/members/{uid}` y copia `settings` raíz a settings por cuenta si faltan.
- Falla antes de escribir si detecta `accountId`, `activeAccountId` o `accountIds[]` que apunten a otra cuenta.
- Agregado script npm `firestore:migrate:default-account` y documentación de uso seguro en `docs/getting-started/seed.md`.
- No se creó test automatizado por ser script operativo contra Firestore; la validación objetivo fue dry-run + lint y el script permite dry-run estático sin credenciales locales.
- Commit: HEAD de `feat/default-account-migration-script` (`feat: agregar migracion default account`).
- Validaciones: `node scripts/migrate-default-account.mjs --dry-run`, `npm run lint` (pasa con 8 warnings preexistentes/no relacionados).
- Siguiente agente: empezar F1-T04 agregando helpers tenant-aware en `firestore.rules` y tests mínimos de reglas desde branch `fix/firestore-account-rule-helpers`.

## TASK F1-T04 — Firestore Rules helpers tenant-aware

Status: done
Branch: `fix/firestore-account-rule-helpers`

### Objective
Agregar helpers de reglas para membership/account sin cambiar todavía todos los matches.

### Files allowed
- `firestore.rules`
- tests rules

### Steps
1. Crear helper `activeAccountId()`.
2. Crear helper `isAccountMember(accountId)`.
3. Crear helper `accountRole(accountId)` si viable.
4. Agregar tests de helpers con casos mínimos.

### Validation
```bash
npm run test:rules
```

### Completion notes
- Agregados helpers tenant-aware en `firestore.rules`: `activeAccountId()`, `isAccountMember(accountId)`, `accountRole(accountId)`, `accountPermissions(accountId)` e `isActiveAccountMember(accountId)`.
- Agregado match mínimo para `accounts/{accountId}` y `accounts/{accountId}/members/{memberId}` para ejercitar helpers: miembros del account activo leen su membresía y `owner/admin` del account activo leen otras membresías; no habilita escrituras. El fallback legacy `/{document=**}` queda intacto para no ampliar el scope.
- Extendidos tests de reglas para lectura de membresía propia, bloqueo a no-miembro/account inactivo y lectura admin de otra membresía.
- Commit: HEAD de `fix/firestore-account-rule-helpers` (`fix: agregar helpers tenant-aware en reglas firestore`).
- Validaciones: `npm run test:rules`, `npm run typecheck`, `npm run lint` (pasa con 8 warnings preexistentes).
- Siguiente agente: empezar F1-T05 agregando reglas explícitas de lectura tenant-aware para `service_orders` desde branch `fix/service-orders-read-rules`.

## TASK F1-T05 — Reglas explícitas read para service_orders

Status: done
Branch: `fix/service-orders-read-rules`

### Objective
Agregar `match /service_orders/{serviceOrderId}` con lectura tenant-aware.

### Steps
1. Permitir admin/editor/supervisor/scheduler/operator/auditoria dentro del account.
2. Permitir technician solo si asignado.
3. Permitir client/building_admin solo si relacionado.
4. View lee datos básicos, no evidencias sensibles si se separan campos.
5. Tests rules.

### Validation
```bash
npm run test:rules
```

### Completion notes
- Agregado `match /service_orders/{serviceOrderId}` explícito en `firestore.rules` con lectura tenant-aware basada en `accountId` y membership del account activo.
- Roles internos permitidos dentro del account: `owner`, `admin`, `editor`, `supervisor`, `scheduler`, `operator`, `auditoria`.
- `technician` solo lee órdenes asignadas por `assignedTechnicianId == uid` o por empleado vinculado en `employees/{assignedTechnicianId}` vía `uid`/`userId`/`authUid`/`email`.
- `client` y `building_admin` leen solo si su membership está relacionada por `customerId`, `managementCompanyId`/`administrationId` o `buildingId` presentes en la orden.
- No se habilitaron escrituras en el match explícito; el comportamiento write legacy queda limitado al fallback existente hasta F1-T06.
- Limitación documentada: Firestore Rules no puede proyectar campos en un document read; por eso `view` de account no recibe lectura básica separada mientras evidencias sensibles vivan en el mismo documento. El fallback legacy `/{document=**}` todavía puede conceder lectura por claims staff legacy hasta que se cierre en una tarea posterior.
- Tests de reglas agregados para roles operativos, account activo incorrecto, técnico asignado/no asignado, client/building_admin relacionados y bloqueo de `view` account.
- Validación: `npm run test:rules`.
- Siguiente agente: empezar F1-T06 agregando reglas explícitas write para `service_orders` desde branch `fix/service-orders-write-rules`.

## TASK F1-T06 — Reglas explícitas write para service_orders

Status: done
Branch: `fix/service-orders-write-rules`

### Objective
Separar permisos de create/update por rol y acción.

### Steps
1. Crear validaciones mínimas de campos requeridos.
2. Scheduler puede agenda/asigna/reprograma, no cerrar.
3. Operator puede cerrar dentro de account.
4. Technician solo actualiza progreso/evidencia/incidencias asignadas.
5. Owner/admin/editor/supervisor según matriz.
6. Tests rules por acción.

### Validation
```bash
npm run test:rules
npm run typecheck
```

### Completion notes
- Agregadas reglas explícitas `create`, `update` y `delete: false` para `service_orders` en `firestore.rules`.
- Create valida `accountId` activo, membership tenant-aware y campos mínimos (`accountId`, `buildingId`, `title`, `type`, `priority`, `status`, `scheduledStartAt`, `scheduledEndAt`).
- `scheduler` puede crear/agendar/asignar/reprogramar sin cerrar; `operator` puede cerrar dentro del account; `technician` solo actualiza progreso/evidencia/incidencias si está asignado; `owner/admin/editor/supervisor` pueden editar y reabrir; `view/auditoria` no escriben.
- Tests de reglas agregados para acciones permitidas/denegadas por rol, account activo incorrecto, campos mínimos y bloqueo del fallback legacy admin/editor sobre `service_orders`.
- Commit: HEAD de `fix/service-orders-write-rules` (`fix: proteger escrituras de service orders`).
- Validaciones: `npm run test:rules`, `npm run typecheck`, `npm run lint` (pasa con 8 warnings preexistentes).
- Siguiente agente: empezar F1-T07 agregando Storage Rules tenant-aware para evidencias desde branch `fix/storage-evidence-account-rules`.

## TASK F1-T07 — Storage Rules tenant-aware para evidencias

Status: done
Branch: `fix/storage-evidence-account-rules`

### Objective
Restringir evidencias por account/serviceOrder/rol.

### Steps
1. Separar read/write.
2. Quitar write a view/auditoria.
3. Technician escribe solo servicio asignado.
4. Auditoria puede leer evidencias.
5. Tests rules storage.

### Validation
```bash
npm run test:rules
```

### Completion notes
- `storage.rules` ahora valida evidencias de `service-orders/{serviceOrderId}` contra `service_orders/{serviceOrderId}` en Firestore, exige `accountId` activo y membership tenant-aware en `accounts/{accountId}/members/{uid}`.
- Lectura separada: `owner/admin/editor/supervisor/scheduler/operator/auditoria` leen evidencias del account activo; `technician` lee solo si está asignado; `view` queda bloqueado para evidencias.
- Escritura separada: `owner/admin/editor/supervisor/operator` y `technician` asignado pueden subir imágenes bajo límite; `view`, `auditoria`, `scheduler` y técnicos no asignados no escriben.
- Agregados matches tenant-aware alternativos bajo `accounts/{accountId}/service-orders/{serviceOrderId}/...` para rutas nuevas, manteniendo rutas actuales de `service-orders/...`.
- Tests de emulator agregados para lectura/escritura permitida y denegada por rol/account/asignación.
- Commit: HEAD de `fix/storage-evidence-account-rules` (`fix: proteger evidencias storage por cuenta`).
- Validaciones: `npm run test:rules`, `npm run typecheck`, `npm run lint` (pasa con 8 warnings preexistentes), `npm run build:minimum`.
- Siguiente agente: empezar F1-T08 protegiendo `generateServiceReportPdf` desde branch `fix/authorize-service-report-pdf`.

## TASK F1-T08 — Proteger generateServiceReportPdf

Status: done
Branch: `fix/authorize-service-report-pdf`

### Objective
Agregar autorización granular a PDF de reporte.

### Files allowed
- `functions/src/serviceReports.ts`
- tests functions si existen o nuevos

### Steps
1. Cargar serviceOrder.
2. Validar account/role/technician/client.
3. Rechazar acceso cruzado.
4. Tests unitarios si viable.

### Validation
```bash
npm --prefix functions run build
npm run test:run -- serviceReports
```

### Completion notes
- `generateServiceReportPdf` ahora exige `activeAccountId` igual al `accountId` de la orden y membresía activa en `accounts/{accountId}/members/{uid}` antes de generar el PDF.
- Roles internos `owner/admin/editor/supervisor/scheduler/operator/auditoria` pueden generar reportes dentro de su cuenta.
- `technician` solo puede generar si está asignado directamente o vinculado al empleado asignado por uid/userId/authUid/email.
- `client` y `building_admin` solo pueden generar si su membership coincide por `customerId`, `managementCompanyId`/`administrationId` o `buildingId`.
- Agregada suite `src/serviceReports.authorization.test.ts` para cubrir roles internos, técnico asignado, clientes relacionados y rechazos.
- Validaciones: `npm --prefix functions run build`, `npm run test:run -- serviceReports`.
- Siguiente agente: empezar F1-T09 protegiendo `importBuildings` desde branch `fix/authorize-import-buildings`.

## TASK F1-T09 — Proteger importBuildings

Status: done
Branch: `fix/authorize-import-buildings`

### Objective
Exigir permiso específico para importación.

### Steps
1. Crear permiso `import_buildings`.
2. Requerir owner/admin/editor o permission explícita.
3. Validar que archivo venga de path controlado si viable.
4. Tests/build.

### Validation
```bash
npm --prefix functions run build
```

### Completion notes
- `importBuildings` ahora rechaza llamadas sin auth, sin `activeAccountId`, sin membership activa en `accounts/{accountId}/members/{uid}` o sin rol `owner/admin/editor` ni permiso explícito `import_buildings`.
- La URL de descarga se limita a Firebase Storage bajo el prefijo controlado `imports/`, compatible con el flujo actual de `src/lib/api/functions.ts`.
- La importación persistida propaga `accountId` a `buildings` y `management_companies`, y busca administraciones existentes dentro del account activo.
- Agregado permiso `import_buildings` al modelo de permisos y suite `src/imports.authorization.test.ts` para roles, permiso explícito, membresía inactiva y URL controlada.
- Validaciones: `npm run test:run -- imports.authorization`, `npm --prefix functions run build`, `npm run lint` (pasa con 8 warnings preexistentes), `npm run typecheck`.
- Fase 1 queda lista para gate final y PR contra `develop`.

## TASK F1-C01 — Corrección de cobertura serviceOrderPermissions

Status: done
Branch: `test/service-order-permissions-coverage`

### Objective
Cubrir ramas defensivas faltantes en `src/features/services/serviceOrderPermissions.ts` para que el gate de cobertura de Fase 1 pueda reanudarse.

### Completion notes
- Agregado test focalizado para roles legacy vacíos en `src/features/services/__tests__/serviceOrderPermissions.test.ts`.
- `serviceOrderPermissions.ts` queda en 100% de branches bajo `npm run test:coverage`.
- No se cambió comportamiento de producción.
- Validaciones: `npm run test:coverage`, `npm run test:run -- serviceOrderPermissions`, `npm run typecheck`.
- Fase 1 puede reanudar gate final/PR contra `develop`.

---

# Fase 2 — Unificación Services/Scheduling

Branch de fase: `phase/2-services-only`

## TASK F2-T01 — Quitar Scheduling del nav

Status: done
Branch: `refactor/remove-scheduling-nav`

### Objective
Eliminar `/scheduling` de navegación visible.

### Files allowed
- `src/app/nav.ts`
- tests nav si existen

### Validation
```bash
npm run test:run -- nav
npm run typecheck
```

### Completion notes
- Removido `/scheduling` de la navegación visible interna en `src/app/nav.ts`.
- `/services` queda como entrada operativa visible y toma el orden móvil de operaciones.
- La ruta `/scheduling` no se eliminó ni redirigió; queda para F2-T02.
- Commit: HEAD de `refactor/remove-scheduling-nav` (`refactor: remover scheduling del nav`).
- Validaciones: `npm run test:run -- nav` no encontró tests nav existentes y terminó con code 1 por ausencia de archivos; `npm run typecheck`; `npm run lint` pasa con 8 warnings preexistentes.
- Siguiente agente: empezar F2-T02 en `src/app/App.tsx`, redirigiendo `/scheduling` a `/services`.

## TASK F2-T02 — Redirigir /scheduling a /services

Status: done
Branch: `refactor/redirect-scheduling-route`

### Files allowed
- `src/app/App.tsx`
- tests routing si existen

### Steps
1. Reemplazar `SchedulingPage` route por `<Navigate to="/services" replace />`.
2. Remover lazy import si queda sin uso.

### Validation
```bash
npm run lint
npm run typecheck
```

### Completion notes
- Redirigida la ruta protegida `/scheduling` hacia `/services` con `replace` en `src/app/App.tsx`.
- Removido el lazy import de `SchedulingPage` porque ya no se usa desde rutas principales.
- No se agregó test de routing: no existen tests de routing/App cercanos en el proyecto y el scope se mantuvo mínimo.
- Commit: HEAD de `refactor/redirect-scheduling-route` (`refactor: redirigir scheduling a services`).
- Validaciones: `npm run lint` pasa con 8 warnings preexistentes/no relacionados; `npm run typecheck`; `npm run build:minimum`.
- Siguiente agente: empezar F2-T03 en `public/locales/es.yaml` y archivos services que usen `scheduling.*`.

## TASK F2-T03 — Migrar labels scheduling usados por services

Status: done
Branch: `refactor/services-i18n-labels`

### Files allowed
- `public/locales/es.yaml`
- archivos services que usen `scheduling.*`

### Validation
```bash
npm run lint
npm run typecheck
```

### Completion notes
- Agregadas labels propias bajo `services.types`, `services.issue.types` y `services.issue.categories` en `public/locales/es.yaml`.
- Migrados helpers de presentación de services para resolver tipos y novedades desde `services.*`.
- `ServiceCloseoutPage` dejó de referenciar labels `scheduling.*`; el bridge de cierre resuelve labels de novedades desde namespace services mientras el modal legacy sigue aislado para F2-T04.
- Commit: HEAD de `refactor/services-i18n-labels` (`refactor: migrar labels de services`)
- Validaciones: `npm run lint` pasa con 8 warnings preexistentes/no relacionados; `npm run typecheck`.
- Siguiente agente: empezar F2-T04 aislando imports legacy de scheduling usados por services.

## TASK F2-T04 — Aislar legacy scheduling no visible

Status: done
Branch: `refactor/isolate-scheduling-legacy`

### Objective
Mover/renombrar imports necesarios para que services no dependa mentalmente de scheduling.

### Validation
```bash
npm run test:run
npm run build:minimum
```

### Completion notes
- Aislados los imports legacy de scheduling usados por Services en `src/features/services/legacySchedulingAdapter.tsx`.
- `ServicesPage` y `ServiceCloseoutPage` ya no importan directamente desde `src/features/operations/scheduling` ni `src/features/scheduling`.
- `ServiceCloseoutPage` usa `ServiceCloseoutItem` nativo de Services; se dejó el modal/hook legacy detrás del adapter temporal hasta reemplazarlos por componentes nativos.
- Agregado test `legacySchedulingAdapter.test.ts` para cubrir el mapeo de `ServiceOrder` a closeout item.
- Se preservó el redirect `/scheduling` → `/services` de F2-T02.
- Commit: HEAD de `refactor/isolate-scheduling-legacy` (`refactor: aislar scheduling legacy en services`).
- Validaciones: `npm run lint` pasa con 8 warnings preexistentes/no relacionados; `npm run typecheck`; `npm run test:run` — 70 passed, 20 skipped; `npm run build:minimum` pasa con warnings preexistentes de `useLayoutEffect` SSR y chunks circulares.
- Fase 2 queda lista para gate final, changelog y PR contra `develop`.

---

# Fase 3 — Portal cliente

Branch de fase: `phase/3-client-portal`

## TASK F3-T01 — Sacar portal/access de ProtectedRoute

Status: done
Branch: `feat/public-portal-access-route`

### Objective
Permitir portal tokenizado sin login interno.

### Files allowed
- `src/app/App.tsx`
- `src/features/portal/**`

### Validation
```bash
npm run typecheck
npm run build
```

### Completion notes
- `/portal/access` quedó como ruta pública de primer nivel, fuera del `ProtectedRoute` y del `AppLayout` interno.
- Se preservaron las rutas internas `/portal`, `/portal/services` y `/portal/reports` bajo `RoleGuard`.
- Commit: HEAD de `feat/public-portal-access-route` (`feat: publicar acceso tokenizado al portal`).
- Validaciones: `npm run typecheck`, `npm run build` pasan. Build mantiene warnings preexistentes de chunks circulares.
- Siguiente agente: empezar F3-T02 en `functions/src/clientPortal.ts` desde branch `fix/revocable-client-portal-token`.

## TASK F3-T02 — JWT con jti/tokenVersion revocable

Status: done
Branch: `fix/revocable-client-portal-token`

### Files allowed
- `functions/src/clientPortal.ts`

### Validation
```bash
npm --prefix functions run build
```

### Completion notes
- `generateClientPortalToken` ahora emite JWT con `jti`, `tokenVersion` y `version`, con expiración de 7 días e issuer validado.
- La generación incrementa `clientPortalAccess.tokenVersion` en transacción y guarda `activeTokenJti`, `active`, `revoked`, `revokedAt`, `customerId` y `tokenIssuedAt` en `service_orders/{serviceOrderId}`.
- `validateClientPortalToken` rechaza tokens sin `jti`/versión, revocados, inactivos, con `revokedAt`, incluidos en `revokedTokenIds`, con `activeTokenJti` distinto o con `tokenVersion` desactualizado.
- Tests automáticos dedicados no se agregaron porque no existe harness de Functions/callable para `clientPortal.ts` en esta fase; se validó con build TypeScript.
- Commit: HEAD de `fix/revocable-client-portal-token` (`fix: hacer revocable token del portal cliente`).
- Validación: `npm --prefix functions run build`.
- Siguiente agente: empezar F3-T03 validando relación token-service-customer-account en `functions/src/clientPortal.ts` desde branch `fix/client-portal-token-scope`.

## TASK F3-T03 — Validar relación token-service-customer-account

Status: done
Branch: `fix/client-portal-token-scope`

### Validation
```bash
npm run test:run -- src/test/clientPortalScope.test.ts
npm --prefix functions run build
```

### Completion notes
- `generateClientPortalToken` valida que el servicio pertenece al `activeAccountId` del operador antes de emitir el JWT.
- El JWT y `clientPortalAccess` guardan `accountId`, `buildingId`, `customerId` y `managementCompanyId` para fijar el alcance del portal.
- `validateClientPortalToken` recalcula la relación servicio/edificio/cliente/administración/cuenta y rechaza tokens cross-account, de otro cliente, de otro edificio o con versión/JTI fuera de alcance.
- Agregado test unitario `src/test/clientPortalScope.test.ts` para scope válido, cliente incorrecto, building cross-account y cliente fuera de administración.
- Commit: HEAD de `fix/client-portal-token-scope` (`fix: validar alcance del token del portal cliente`).
- Validaciones: `npm run test:run -- src/test/clientPortalScope.test.ts`, `npm --prefix functions run build`.
- Siguiente agente: empezar F3-T04 creando `ClientServicesPage` desde branch `feat/client-services-page`.

## TASK F3-T04 — Crear ClientServicesPage

Status: done
Branch: `feat/client-services-page`

### Validation
```bash
npm run test:run -- src/features/portal/__tests__/clientServices.test.ts
npm run typecheck
npm run build
```

### Completion notes
- Creada `ClientServicesPage` para `/portal/services` con estadísticas, filtros por todos/activos/completados y tarjetas de seguimiento visible para cliente.
- Agregado helper `src/features/portal/clientServices.ts` para scope por administración, edificios visibles y servicios publicados al cliente, excluyendo borradores/cancelados.
- `/portal/services` ahora carga la nueva página dedicada en lugar de reutilizar `BuildingAdminPage`; `/portal/reports` se mantiene sin cambios para F3-T05.
- Agregados tests unitarios de selectores en `src/features/portal/__tests__/clientServices.test.ts`.
- Commit: HEAD de `feat/client-services-page` (`feat: crear vista de servicios del portal cliente`).
- Validaciones: `npm run test:run -- src/features/portal/__tests__/clientServices.test.ts`, `npm run typecheck`, `npm run build`.
- Siguiente agente: empezar F3-T05 creando `ClientReportsPage` desde branch `feat/client-reports-page`.

## TASK F3-T05 — Crear ClientReportsPage

Status: done
Branch: `feat/client-reports-page`

### Validation
```bash
npm run typecheck
npm run build
```

### Completion notes
- Creada `ClientReportsPage` para `/portal/reports` con estadísticas, lista de informes visibles, resumen técnico y PDFs adjuntos publicados dentro del alcance del cliente.
- Agregado helper `src/features/portal/clientReports.ts` para derivar reportes visibles desde los servicios ya filtrados por portal y detectar adjuntos PDF.
- `/portal/reports` ahora carga la nueva página dedicada en lugar de reutilizar `BuildingAdminPage`.
- Ampliados tests unitarios de portal para cobertura de reportes visibles y detección de PDFs.
- Commit: HEAD de `feat/client-reports-page` (`feat: crear vista de reportes del portal cliente`).
- Validaciones: `npm run test:run -- src/features/portal/__tests__/clientServices.test.ts`, `npm run typecheck`, `npm run build`, `npm run lint` (pasa con 8 warnings preexistentes).
- Siguiente agente: empezar F3-T06 creando solicitudes desde portal desde branch `feat/client-service-requests`.

## TASK F3-T06 — Crear solicitudes desde portal

Status: done
Branch: `feat/client-service-requests`

### Validation
```bash
npm run test:run -- client portal requests
npm run build:minimum
```

### Completion notes
- Agregada callable pública `createClientPortalServiceRequest` que valida el JWT revocable del portal antes de crear una solicitud en `service_orders`.
- La solicitud queda ligada al `accountId`, `customerId`, `managementCompanyId` y `buildingId` resueltos desde el token; no acepta scope enviado por el cliente.
- El portal seguro tokenizado permite crear una solicitud con título, detalle, prioridad y fecha sugerida.
- Agregados tests unitarios `src/test/clientPortalRequests.test.ts` para payload seguro y saneamiento de entrada.
- Commit: HEAD de `feat/client-service-requests` (`feat: crear solicitudes desde portal cliente`).
- Validaciones: `npm run test:run -- client portal requests`, `npm run test:run -- src/test/clientPortalRequests.test.ts src/test/clientPortalScope.test.ts`, `npm run typecheck`, `npm --prefix functions run build`, `npm run build:minimum`, `npm run lint` (pasa con 8 warnings preexistentes).
- Fase 3 queda lista para gate final, changelog y PR contra `develop`.

---

# Fase 4 — IA contextual

Branch de fase: `phase/4-contextual-ai`

## TASK F4-T01 — Contrato de sugerencias IA
Status: done
Branch: `feat/ai-suggestion-contract`

### Objective
Definir un contrato reutilizable y seguro para sugerencias IA contextuales.

### Context
La IA solo puede sugerir; no puede guardar, enviar ni mutar estado sin acción humana explícita.

### Files changed
- `src/core/models/aiSuggestion.ts`
- `src/core/models/__tests__/aiSuggestion.test.ts`
- `src/features/services/serviceSuggestions.ts`

### Completion notes
- Agregado contrato `AiSuggestion` con `kind`, `title`, `trace` y `safety`.
- Agregada política obligatoria `suggestion_only` con aprobación humana y acciones prohibidas `auto_save`, `auto_send`, `auto_mutate`.
- Agregados guards `isAiSuggestion`, `isSuggestionOnlyPolicy`, `hasForbiddenAiSystemAction` y factory `createAiSuggestion`.
- `serviceSuggestions` ahora crea sugerencias mediante el contrato seguro manteniendo compatibilidad temporal con `type`.
- Commit: HEAD de `feat/ai-suggestion-contract` (`feat: definir contrato seguro de sugerencias ia`).
- Validaciones: `npm run test:run -- src/core/models/__tests__/aiSuggestion.test.ts src/features/services/__tests__`, `npm run test:run`, `npm run typecheck`, `npm run lint`.
- Siguiente agente: empezar F4-T02 creando `AiSuggestionCard` reutilizable basado en `src/core/models/aiSuggestion.ts`.

## TASK F4-T02 — AiSuggestionCard reutilizable
Status: done
Branch: `feat/ai-suggestion-card`

### Completion notes
- Creado `AiSuggestionCard` reutilizable para renderizar contratos `AiSuggestion` con validación runtime mediante `isAiSuggestion`.
- El componente marca explícitamente `Solo sugerencia` y `Requiere aprobación humana`.
- Las acciones visibles se limitan a acciones humanas permitidas por `safety.allowedUserActions` y handlers explícitos; no muestra ni ejecuta guardado/envío/mutación automática.
- Payloads malformados o inseguros se bloquean sin renderizar contenido sugerido.
- `AiWorkspacePage` ahora usa `buildServiceSuggestions` + `AiSuggestionCard` para mostrar sugerencias con el contrato seguro.
- Commit: HEAD de `feat/ai-suggestion-card` (`feat: agregar tarjeta segura de sugerencias ia`).
- Validaciones: `npm run test:run -- src/features/ai/__tests__/AiSuggestionCard.test.tsx`, `npm run test:run`, `npm run typecheck`, `npm run lint` (pasa con 8 warnings preexistentes).
- Siguiente agente: empezar F4-T03 agregando resumen técnico sugerido en el detalle de servicio con `AiSuggestionCard`.

## TASK F4-T03 — Resumen técnico en detalle de servicio
Status: done
Branch: `feat/service-technical-summary-suggestion`

### Completion notes
- Agregado helper `buildServiceTechnicalSummarySuggestion` que genera un contrato `AiSuggestion` `technical_summary` para `services.detail` con política `suggestion_only`.
- `ServiceDetailPage` ahora renderiza el resumen técnico sugerido con `AiSuggestionCard`, mostrando trazabilidad y aprobación humana requerida.
- La UI no guarda, envía ni muta el servicio automáticamente; solo muestra la sugerencia contextual.
- Agregado test unitario `src/features/services/__tests__/serviceSuggestions.test.ts` para el contrato seguro del resumen técnico.
- Commit: HEAD de `feat/service-technical-summary-suggestion` (`feat: agregar resumen tecnico sugerido en servicio`).
- Validaciones: `npm run test:run -- src/features/services/__tests__/serviceSuggestions.test.ts`, `npm run test:run`, `npm run typecheck`, `npm run lint` (pasa con 8 warnings preexistentes).
- Siguiente agente: empezar F4-T04 agregando borrador de reporte en cierre con `AiSuggestionCard` en `src/features/services/ServiceCloseoutPage.tsx`.

## TASK F4-T04 — Borrador de reporte en cierre
Status: done
Branch: `feat/service-report-draft-suggestion`

### Completion notes
- Agregado helper `buildServiceReportDraftSuggestion` que genera un contrato `AiSuggestion` `report_draft` para `services.closeout` con política `suggestion_only`, trazabilidad y plantilla `service-report-draft-v1`.
- `ServiceCloseoutPage` ahora renderiza el borrador de reporte con `AiSuggestionCard` dentro del contexto de cierre.
- La sugerencia no recibe handlers de acción: no guarda, no envía y no muta automáticamente; solo muestra contenido para aprobación humana.
- Agregado test unitario en `src/features/services/__tests__/serviceSuggestions.test.ts` para validar contrato seguro del borrador de reporte.
- Commit: HEAD de `feat/service-report-draft-suggestion` (`feat: agregar borrador de reporte sugerido`)
- Validaciones: `npm run test:run -- src/features/services/__tests__/serviceSuggestions.test.ts`, `npm run test:run`, `npm run typecheck`, `npm run lint` (pasa con 8 warnings preexistentes).
- Siguiente agente: empezar F4-T05 agregando mensaje cliente sugerido sin envío automático con `AiSuggestionCard`.

## TASK F4-T05 — Mensaje cliente sugerido sin envío automático
Status: done
Branch: `feat/client-message-suggestion`

### Completion notes
- Agregado helper `buildServiceCustomerMessageSuggestion` que genera un contrato `AiSuggestion` `customer_message` para `services.closeout` con política `suggestion_only`, trazabilidad y plantilla `customer-message-closeout-v1`.
- `ServiceCloseoutPage` ahora renderiza el mensaje cliente sugerido con `AiSuggestionCard` dentro del bloque de comunicación de cierre.
- La acción disponible es copiar para revisión/aprobación humana; no existe envío automático, guardado automático ni mutación del servicio.
- Agregado test unitario en `src/features/services/__tests__/serviceSuggestions.test.ts` para validar contrato seguro, trazabilidad y ausencia de acción de envío.
- Commit: HEAD de `feat/client-message-suggestion` (`feat: agregar mensaje cliente sugerido`)
- Validaciones: `npm run test:run -- src/features/services/__tests__/serviceSuggestions.test.ts`, `npm run test:run`, `npm run typecheck`, `npm run lint` (pasa con 8 warnings preexistentes).
- Siguiente agente: empezar F4-T06 agregando detección de faltantes antes de cerrar con `AiSuggestionCard`.

## TASK F4-T06 — Detección de faltantes antes de cerrar
Status: done
Branch: `feat/closeout-missing-items-suggestion`

### Completion notes
- Agregado helper `buildServiceMissingRequirementsSuggestion` que genera un contrato `AiSuggestion` `missing_requirements` para `services.closeout` con política `suggestion_only`, trazabilidad y plantilla `missing-requirements-closeout-v1`.
- La detección revisa faltantes de observaciones de cierre, evidencia fotográfica final y checklist técnico desde el snapshot del reporte.
- `ServiceCloseoutPage` renderiza la sugerencia con `AiSuggestionCard` antes de completar el cierre cuando el servicio aún no está completado.
- No se agregó bloqueo automático, guardado automático, envío automático ni mutación automática; las validaciones existentes siguen siendo las únicas que pueden impedir cerrar.
- Agregado test unitario en `src/features/services/__tests__/serviceSuggestions.test.ts` para validar contrato seguro, trazabilidad y acciones permitidas.
- Commit: HEAD de `feat/closeout-missing-items-suggestion` (`feat: sugerir faltantes antes del cierre`)
- Validaciones: `npm run test:run -- src/features/services/__tests__/serviceSuggestions.test.ts`, `npm run test:run`, `npm run typecheck`, `npm run lint` (pasa con 8 warnings preexistentes).
- Siguiente agente: empezar F4-T07 agregando follow-up sugerido con `AiSuggestionCard` sin guardado, envío ni mutación automática.

## TASK F4-T07 — Follow-up sugerido
Status: pending

---

# Fase 5 — UX/mobile/i18n

Branch de fase: `phase/5-ux-mobile-i18n`

## TASK F5-T01 — Bottom nav dinámico
Status: pending

## TASK F5-T02 — CTA móvil principal para técnico
Status: pending

## TASK F5-T03 — Mejorar TechnicianHomePage
Status: pending

## TASK F5-T04 — Estados vacíos de Services
Status: pending

## TASK F5-T05 — Migrar copy hardcoded a es.yaml
Status: pending

## TASK F5-T06 — Separar copy interno vs cliente
Status: pending

## TASK F5-T07 — Ajustar navegación cliente
Status: pending

---

# Fase 6 — Reportes/PDF

Branch de fase: `phase/6-reports-pdf`

## TASK F6-T01 — Crear buildServiceReportSnapshot
Status: pending

## TASK F6-T02 — Migrar print frontend a snapshot
Status: pending

## TASK F6-T03 — Migrar PDF function a snapshot
Status: pending

## TASK F6-T04 — Alinear narrativa IA al snapshot
Status: pending

## TASK F6-T05 — Tests de contrato del snapshot
Status: pending

---

# Fase 7 — Cierre técnico canónico

Branch de fase: `phase/7-technician-closeout`

## TASK F7-T01 — Crear completeServiceOrderWithReport
Status: pending

## TASK F7-T02 — Validar checklist obligatorio
Status: pending

## TASK F7-T03 — Validar fotos obligatorias
Status: pending

## TASK F7-T04 — Validar observaciones obligatorias
Status: pending

## TASK F7-T05 — Timeline completed y auditoría
Status: pending

## TASK F7-T06 — Implementar reapertura por roles permitidos
Status: pending

## TASK F7-T07 — Eliminar bypasses status completed
Status: pending

## TASK F7-T08 — Tests cierre válido/inválido
Status: pending
