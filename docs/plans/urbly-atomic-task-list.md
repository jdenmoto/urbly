# Urbly — Atomic Task List for Qwen Execution

Modelo ejecutor: `ollama/qwen2.5-coder:3b`  
Base branch: `develop`  
Regla: una tarea = cambio pequeño, verificable, con contexto mínimo.

Este archivo es la cola operativa. Cada agente debe ejecutar solo una tarea atómica salvo que el supervisor indique lo contrario.

## Estado global

Current phase: Fase 0 — Estabilizar tests/CI base mínima  
Current task: F0-T01  
Next agent start: abrir esta tarea y `docs/plans/urbly-agent-execution-instructions.md`.

---

# Fase 0 — Tests/CI base mínima

Branch de fase: `phase/0-tests-ci-base`

## TASK F0-T01 — Mock/env Firebase para Vitest

Status: pending  
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

### Master plan update
Al terminar:
- marcar F0-T01 done
- registrar branch/commit
- cambiar Current task a F0-T02
- indicar que el siguiente agente empieza agregando tests al CI.

## TASK F0-T02 — Agregar test:run al CI

Status: pending  
Branch: `test/add-vitest-to-ci`

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

## TASK F0-T03 — Configurar cobertura Vitest 70/90

Status: pending  
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

## TASK F0-T04 — Preparar test harness para Firebase Rules

Status: pending  
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

---

# Fase 1 — Multitenancy + seguridad

Branch de fase: `phase/1-multitenancy-security`

## TASK F1-T01 — Definir tipos Account y Membership

Status: pending  
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

## TASK F1-T02 — Crear helpers de permisos por account

Status: pending  
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

## TASK F1-T03 — Script idempotente default account

Status: pending  
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

## TASK F1-T04 — Firestore Rules helpers tenant-aware

Status: pending  
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

## TASK F1-T05 — Reglas explícitas read para service_orders

Status: pending  
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

## TASK F1-T06 — Reglas explícitas write para service_orders

Status: pending  
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

## TASK F1-T07 — Storage Rules tenant-aware para evidencias

Status: pending  
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

## TASK F1-T08 — Proteger generateServiceReportPdf

Status: pending  
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

## TASK F1-T09 — Proteger importBuildings

Status: pending  
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

---

# Fase 2 — Unificación Services/Scheduling

Branch de fase: `phase/2-services-only`

## TASK F2-T01 — Quitar Scheduling del nav

Status: pending  
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

## TASK F2-T02 — Redirigir /scheduling a /services

Status: pending  
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

## TASK F2-T03 — Migrar labels scheduling usados por services

Status: pending  
Branch: `refactor/services-i18n-labels`

### Files allowed
- `public/locales/es.yaml`
- archivos services que usen `scheduling.*`

### Validation
```bash
npm run lint
npm run typecheck
```

## TASK F2-T04 — Aislar legacy scheduling no visible

Status: pending  
Branch: `refactor/isolate-scheduling-legacy`

### Objective
Mover/renombrar imports necesarios para que services no dependa mentalmente de scheduling.

### Validation
```bash
npm run test:run
npm run build:minimum
```

---

# Fase 3 — Portal cliente

Branch de fase: `phase/3-client-portal`

## TASK F3-T01 — Sacar portal/access de ProtectedRoute

Status: pending  
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

## TASK F3-T02 — JWT con jti/tokenVersion revocable

Status: pending  
Branch: `fix/revocable-client-portal-token`

### Files allowed
- `functions/src/clientPortal.ts`

### Validation
```bash
npm --prefix functions run build
```

## TASK F3-T03 — Validar relación token-service-customer-account

Status: pending  
Branch: `fix/client-portal-token-scope`

### Validation
```bash
npm --prefix functions run build
```

## TASK F3-T04 — Crear ClientServicesPage

Status: pending  
Branch: `feat/client-services-page`

### Validation
```bash
npm run typecheck
npm run build
```

## TASK F3-T05 — Crear ClientReportsPage

Status: pending  
Branch: `feat/client-reports-page`

### Validation
```bash
npm run typecheck
npm run build
```

## TASK F3-T06 — Crear solicitudes desde portal

Status: pending  
Branch: `feat/client-service-requests`

### Validation
```bash
npm run test:run -- client portal requests
npm run build:minimum
```

---

# Fase 4 — IA contextual

Branch de fase: `phase/4-contextual-ai`

## TASK F4-T01 — Contrato de sugerencias IA
Status: pending

## TASK F4-T02 — AiSuggestionCard reutilizable
Status: pending

## TASK F4-T03 — Resumen técnico en detalle de servicio
Status: pending

## TASK F4-T04 — Borrador de reporte en cierre
Status: pending

## TASK F4-T05 — Mensaje cliente sugerido sin envío automático
Status: pending

## TASK F4-T06 — Detección de faltantes antes de cerrar
Status: pending

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
