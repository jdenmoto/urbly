# Urbly — Master Implementation Plan

Estado: draft pendiente de cierre de decisiones críticas  
Base branch: `develop`  
Modelo ejecutor: `ollama/qwen2.5-coder:3b`  
Estrategia: tareas atómicas, concisas, autónomas, con PR grande por fase

## 0. Reglas operativas

1. Toda ejecución parte de `develop` actualizado.
2. Cada tarea debe ejecutarse en una rama propia:
   - `fix/<short-name>`
   - `feat/<short-name>`
   - `refactor/<short-name>`
   - `test/<short-name>`
3. Los agentes pueden:
   - modificar código frontend
   - modificar Cloud Functions
   - modificar Firebase Rules
   - modificar CI
   - modificar rutas/navegación
   - borrar código legacy reemplazado y validado
   - hacer commits automáticos
   - hacer push automático
4. No desplegar producción salvo instrucción explícita.
5. Se crea una PR grande por fase.
6. Revisión humana/supervisor al final de cada fase.
7. Si un agente se bloquea o necesita escalar, debe notificar por Telegram.
8. Este archivo maestro debe actualizarse cada vez que una tarea quede completamente terminada.
9. La actualización del archivo maestro debe indicar exactamente cuál es la siguiente tarea pendiente y desde dónde debe empezar el siguiente agente.

## 1. Restricciones por modelo local

Como la implementación será ejecutada por `ollama/qwen2.5-coder:3b`, cada tarea debe ser:

- atómica
- pequeña
- con contexto mínimo suficiente
- sin ambigüedad
- con archivos objetivo explícitos
- con validación clara
- idealmente ejecutable en 20–45 minutos

Prohibido crear tareas grandes tipo “implementar multitenancy completo”.  
Cada tarea debe modificar un área concreta y verificable.

## 2. Prioridad de producto confirmada

Orden confirmado:

1. seguridad Firebase/Functions
2. unificación Services/Scheduling
3. portal cliente
4. IA contextual
5. UX/mobile/i18n
6. reportes/PDF
7. tests/CI
8. cierre técnico

Nota: aunque tests/CI aparece después en prioridad de producto, cada tarea funcional debe incluir pruebas y validaciones. No se permite avanzar con cambios críticos sin gate mínimo.

## 3. Decisiones confirmadas

### Git / ejecución

- Base branch: `develop`
- Ramas por tarea: sí
- PR: una PR grande por fase
- Commits automáticos: sí
- Push automático: sí
- Supervisor/reviewer: al final de cada fase

### Autonomía

Los agentes pueden modificar:

- Firebase Rules
- Cloud Functions
- GitHub Actions CI
- rutas/navegación
- código legacy, incluyendo borrado si queda reemplazado y validado

### Producto

- `/services` será la verdad central.
- `/scheduling` debe desaparecer como módulo visible.
- Agregar rol `owner`.
- El rol técnico debe ser `technician`, no `emergency_scheduler` como nombre final.
- `view` debe ser solo lectura estricta y no ve evidencias/fotos sensibles por defecto.
- `auditoria` puede ver evidencias/fotos y exportar datos/reportes.
- `operator` puede operar y cerrar servicios dentro de su `account`.
- `scheduler` puede agendar, asignar y reprogramar, pero no cerrar servicios.
- `technician` puede crear incidencias y subir evidencias solo en servicios asignados.
- `admin` ve todo y gestiona usuarios/roles dentro de su `account`.
- `editor` ve y edita todo dentro de su `account`.
- `owner`, `admin`, `editor` y `supervisor` pueden reabrir servicios cerrados.
- `supervisor`, `admin` y `editor` pueden aprobar reportes y cotizaciones.
- Mantener `client` y `building_admin` con diferencias:
  - `building_admin`: administra la cuenta/administración cliente.
  - `client`: usuario consultivo del portal.
- Permisos se manejan como combinación de `role + permissions[]`.

### Multitenancy

- Urbly debe ser multi-tenant real por `account`.
- `account` es el tenant raíz.
- `management_companies` representa clientes/administraciones dentro de una cuenta.
- Una cuenta puede tener múltiples administraciones/clientes.
- Un usuario puede pertenecer a múltiples cuentas.
- Un técnico puede trabajar para múltiples cuentas.
- Cada cuenta maneja sus propios empleados con `accountId` obligatorio.
- Memberships se modelan en `accounts/{accountId}/members/{uid}`.
- Custom claims deben incluir `activeAccountId`, `role` y `permissions`.
- El usuario puede cambiar cuenta activa en UI si tiene múltiples memberships.
- Los datos existentes sin `accountId` deben migrarse a un `defaultAccountId` inicial.

### Portal cliente

- Portal tokenizado debe abrir sin login.
- Token con duración: 7 días.
- Debe existir revocación inmediata.
- Cliente puede ver:
  - estado del servicio
  - evidencia
  - PDF
  - historial
  - próximos servicios
  - solicitudes
- Cliente puede crear solicitudes.

### Cierre técnico

- Checklist obligatorio para cerrar.
- Fotos obligatorias para cerrar.
- Observaciones obligatorias para cerrar.
- No hay offline mode por ahora.
- Falta definir rol específico para reabrir servicios cerrados. Ver sección 9.

### IA

Acciones IA objetivo:

- resumen técnico
- borrador de reporte
- mensaje al cliente
- detección de faltantes
- follow-up automático

Reglas IA:

- IA solo sugiere.
- IA no guarda contenido automáticamente sin acción explícita del usuario.
- IA puede generar mensajes al cliente, pero nunca enviarlos sin aprobación humana.

### Calidad

Gate mínimo por tarea:

- lint
- typecheck
- tests relacionados
- build completo cuando el cambio toque rutas, build config, Firebase client, funciones, reglas o dependencias

TDD obligatorio para cambios funcionales.
Cobertura objetivo es fundamental.

## 4. Definición de terminado global

Urbly v2 se considera implementado cuando:

1. `service_orders` tiene reglas explícitas y tenant-aware.
2. Cloud Functions privilegiadas validan rol, tenant y scope.
3. Storage Rules validan tenant, service order y permisos de escritura/lectura.
4. `/services` reemplaza completamente `/scheduling` como flujo visible.
5. Portal cliente tokenizado funciona sin login y con revocación.
6. Cliente puede crear solicitudes.
7. IA contextual aparece dentro del flujo operativo y solo sugiere.
8. UX móvil del técnico permite ejecutar y cerrar servicios sin flujo legacy.
9. Reporte/PDF/print usan fuente canónica compartida.
10. Tests pasan en CI.
11. Cobertura objetivo definida y cumplida.
12. Código legacy eliminado o aislado sin impacto operativo.

## 5. Fases finales de ejecución

Orden operativo confirmado para maximizar autonomía con `ollama/qwen2.5-coder:3b`:

0. Fase 0 — estabilizar tests/CI base mínima
1. Fase 1 — multitenancy + seguridad
2. Fase 2 — unificación Services/Scheduling
3. Fase 3 — portal cliente
4. Fase 4 — IA contextual
5. Fase 5 — UX/mobile/i18n
6. Fase 6 — reportes/PDF
7. Fase 7 — cierre técnico canónico

Cada fase usa branch de integración `phase/<n>-<slug>`.
Cada tarea atómica puede usar rama propia y luego integrarse al branch de fase.

### Fase 0 — Estabilizar tests/CI base mínima

Objetivo: permitir ejecución autónoma confiable antes de cambios profundos.

Tareas atómicas candidatas:

1. Configurar env/mocks Firebase en Vitest para eliminar `auth/invalid-api-key`.
2. Reparar suites fallidas de scheduling sin tocar lógica funcional.
3. Agregar `npm run test:run` al CI.
4. Configurar cobertura global inicial 70%.
5. Configurar cobertura crítica 90% para dominio seleccionable.
6. Agregar comando/script para tests de reglas Firebase si no existe.
7. Documentar gates de CI y cobertura en README/dev docs.

### Fase 1 — Modelo multi-tenant y seguridad base

Objetivo: crear la base de permisos, datos y reglas para que todo lo demás se construya sin fuga entre empresas.

Tareas atómicas candidatas:

1. Definir tipos `Account`, `Membership`, roles y permisos.
2. Agregar `accountId` al modelo `ServiceOrder` y entidades críticas.
3. Crear helpers de permisos frontend para account/role.
4. Crear helpers de reglas Firestore tenant-aware.
5. Crear reglas explícitas read-only para `service_orders`.
6. Crear reglas explícitas write para `service_orders` por acción.
7. Crear reglas Storage tenant-aware para evidencias.
8. Proteger `generateServiceReportPdf` por account/rol/técnico/cliente.
9. Proteger `importBuildings` por permiso específico.
10. Agregar tests de reglas/permissions.

### Fase 2 — Unificación Services/Scheduling

Objetivo: `/services` como única verdad operativa.

Tareas atómicas candidatas:

1. Quitar `/scheduling` del sidebar/bottom nav.
2. Convertir ruta `/scheduling` en redirect a `/services`.
3. Migrar labels `scheduling.*` usados por services a `services.*`.
4. Reemplazar `SchedulingItem` en cierre por tipo nativo de services.
5. Reemplazar `CompleteServiceModal` legacy por componente services.
6. Mover hooks útiles de scheduling a services.
7. Eliminar código legacy no usado.
8. Agregar tests de navegación y redirects.

### Fase 3 — Portal cliente real

Objetivo: portal público tokenizado, seguro y útil.

Tareas atómicas candidatas:

1. Mover `/portal/access` fuera de `ProtectedRoute`.
2. Crear layout público minimal para portal tokenizado.
3. Agregar `jti`/tokenVersion a JWT.
4. Validar revocación en `validateClientPortalToken`.
5. Validar relación token-service-customer-account.
6. Crear `ClientServicesPage`.
7. Crear `ClientReportsPage`.
8. Crear flujo de solicitud de servicio desde portal.
9. Agregar reglas/functions para solicitudes del cliente.
10. Tests de portal tokenizado.

### Fase 4 — IA contextual

Objetivo: IA dentro del flujo, no como módulo aislado.

Tareas atómicas candidatas:

1. Definir contrato de sugerencias IA.
2. Crear componente `AiSuggestionCard` reutilizable.
3. Agregar resumen técnico sugerido en detalle de servicio.
4. Agregar borrador de reporte en cierre.
5. Agregar mensaje cliente sugerido.
6. Agregar detección de faltantes antes de cerrar.
7. Agregar follow-up sugerido.
8. Asegurar que IA no persista ni envíe sin acción explícita.

### Fase 5 — UX/mobile/i18n

Objetivo: experiencia clara por rol, mobile-first y copy consistente.

Tareas atómicas candidatas:

1. Bottom nav dinámico según cantidad de ítems.
2. CTA móvil principal para técnico.
3. Mejorar pantalla home del técnico.
4. Revisar estados vacíos de services.
5. Migrar hardcoded copy a `es.yaml` por namespace.
6. Separar copy interno vs cliente.
7. Ajustar navegación cliente.
8. QA visual móvil/desktop.

### Fase 6 — Reportes/PDF

Objetivo: una fuente única para reportes.

Tareas atómicas candidatas:

1. Crear `buildServiceReportSnapshot`.
2. Migrar print frontend a snapshot.
3. Migrar PDF function a snapshot.
4. Alinear narrativa IA al snapshot.
5. Agregar tests de contrato del snapshot.
6. Validar PDF con datos reales seed.

### Fase 7 — Cierre técnico canónico

Objetivo: cierre con checklist/fotos/observaciones obligatorias y state machine real.

Tareas atómicas candidatas:

1. Crear comando `completeServiceOrderWithReport`.
2. Validar checklist requerido.
3. Validar fotos requeridas.
4. Validar observaciones requeridas.
5. Agregar timeline `completed`.
6. Implementar rol de reapertura.
7. Tests de cierre válido/inválido.
8. Eliminar bypasses directos a `status: completed`.

## 6. Formato obligatorio de tarea atómica

Cada tarea debe escribirse así:

```md
## TASK <id> — <title>

Status: pending | in_progress | done | blocked
Branch: <branch-name>
Model: ollama/qwen2.5-coder:3b

### Objective
<one sentence>

### Context
<minimum context required>

### Files allowed
- <path>

### Files forbidden
- <path>

### Steps
1. <small step>
2. <small step>
3. <small step>

### Tests first
- <test file to create/update first>

### Validation
- <command>

### Done when
- <observable criteria>

### Master plan update
When done, update this file:
- mark task as done
- add changed branch/commit
- set next task as pending/in_progress
- write exact starting point for the next agent
```

## 7. Estado actual de ejecución

Current phase: Fase 1 — Multitenancy + seguridad

Last completed task: F1-T04 — Firestore Rules helpers tenant-aware

- Status: done
- Branch: `fix/firestore-account-rule-helpers`
- Commit: HEAD de `fix/firestore-account-rule-helpers` — `fix: agregar helpers tenant-aware en reglas firestore`
- Files changed:
  - `firestore.rules`
  - `src/test/rules/firebaseRules.test.ts`
  - `docs/plans/urbly-atomic-task-list.md`
  - `docs/plans/urbly-master-implementation-plan.md`
  - `project/runs/2026-05-13-f1-t04-firestore-account-rule-helpers.md`
- Validations executed:
  - `npm run test:rules`
  - `npm run typecheck`
- Notes: Se agregaron helpers tenant-aware `activeAccountId()`, `isAccountMember(accountId)`, `accountRole(accountId)`, `accountPermissions(accountId)` e `isActiveAccountMember(accountId)` en `firestore.rules`. Se agregó un match mínimo para `accounts/{accountId}` y `accounts/{accountId}/members/{memberId}` para probar lectura de membresía propia/admin del account activo sin convertir todavía todos los matches legacy. No se habilitaron escrituras de accounts/members. El fallback legacy `/{document=**}` queda intacto y debe ir cerrándose en las siguientes reglas explícitas.

Next required step:

F1-T05 — Reglas explícitas read para service_orders.

Primer punto de arranque para el siguiente agente:

1. Abrir `docs/plans/urbly-atomic-task-list.md`.
2. Cambiar a `phase/1-multitenancy-security` y crear branch `fix/service-orders-read-rules`.
3. Implementar F1-T05 en `firestore.rules` con reglas explícitas de lectura tenant-aware para `service_orders`.
4. Validar con `npm run test:rules`.

## 8. Archivos relacionados

- Auditoría sobre develop: `/home/syalar/.openclaw/workspace/docs/plans/2026-05-13-urbly-develop-audit-update.md`
- Instrucciones de agentes: `docs/plans/urbly-agent-execution-instructions.md` pendiente

## 9. Decisiones finales confirmadas y pendientes menores

### Multitenancy

Decisiones confirmadas:

1. Tenant root: `account`.
2. `management_companies` representa clientes/administraciones dentro de una cuenta.
3. Una cuenta puede tener múltiples administraciones/clientes.
4. Un usuario puede pertenecer a múltiples cuentas.
5. Un técnico puede trabajar para múltiples cuentas.
6. Datos existentes sin `accountId` se migran a un `defaultAccountId` inicial.
7. `accountId` debe ser obligatorio en colecciones críticas.
8. Memberships viven en `accounts/{accountId}/members/{uid}`.
9. Custom claims incluyen `activeAccountId`, `role`, `permissions`.
10. El usuario puede cambiar cuenta activa en UI.
11. Cada cuenta maneja sus propios empleados con `accountId` obligatorio.

Decisiones adicionales confirmadas:

1. `settings` debe ser por cuenta: `accounts/{accountId}/settings/...`.
2. `feature_flags` serán globales por defecto.
3. `service_types`, `issues`, `building_groups`, calendario y contratos settings migran a settings por cuenta.
4. Account inicial para migrar datos existentes: `urbly-default`.
5. `accountId` debe ser slug legible: ejemplos `urbly-default`, `acme-co`.
6. `users/{uid}` debe guardar `accountIds[]` además de memberships para UI rápida.
7. Un usuario puede tener roles distintos por cuenta.
8. El cambio de cuenta activa debe hacerse con callable server-side que actualiza custom claims.
9. Técnicos multi-cuenta aparecen como empleados separados por cuenta.
10. `client`/`building_admin` pertenecen a una `management_company` dentro de una cuenta.

Colecciones críticas con `accountId` obligatorio:

- `users` con `accountIds[]` y metadata global mínima
- `employees`
- `service_orders`
- `buildings`
- `management_companies`
- `contracts`
- `customers`
- `assets`
- `internal_notifications`
- `tenant_templates`
- `tenant_ai_policies`
- `reports`
- `client_requests`

Colecciones/subcolecciones por cuenta:

- `accounts/{accountId}`
- `accounts/{accountId}/members/{uid}`
- `accounts/{accountId}/settings/{settingId}`

Colecciones globales:

- `accounts`
- `feature_flags`

Pendiente menor para diseño técnico:

1. Evaluar si se requiere colección global auxiliar `account_memberships` para queries administrativas cross-account. Default: no crear hasta que una query lo requiera.
2. `accountId` slug debe cumplir formato `^[a-z0-9-]+$`.

### Roles y permisos

Decisiones confirmadas:

1. Agregar rol `owner`.
2. `admin` puede gestionar usuarios y roles dentro de su `account`.
3. Pueden reabrir servicios cerrados: `owner`, `admin`, `editor`, `supervisor`.
4. Pueden aprobar reportes: `supervisor`, `admin`, `editor`.
5. Pueden aprobar cotizaciones: `supervisor`, `admin`, `editor`.
6. `operator` puede cerrar servicios dentro de su `account`.
7. `scheduler` no debe cerrar servicios; solo agenda, asigna y reprograma.
8. `technician` puede crear incidencias y subir evidencias solo en servicios asignados.
9. `view` no puede ver evidencias/fotos sensibles por defecto; solo datos básicos.
10. `auditoria` puede ver evidencias/fotos y exportar datos/reportes.
11. Mantener `client` y `building_admin`:
    - `building_admin`: administra la cuenta/administración cliente.
    - `client`: usuario consultivo del portal.
12. Permisos se manejan como combinación de `role + permissions[]`.

Matriz detallada pendiente de generar en task list final.

### Cobertura, gates y ejecución autónoma

Decisiones confirmadas:

1. Cobertura global mínima inicial: 70%.
2. Cobertura para dominio crítico (`serviceOrders`, permisos, transitions, reports): 90%.
3. Firebase Rules deben tener tests con emulator.
4. CI debe fallar si baja la cobertura mínima.
5. Se permiten excepciones de cobertura por tarea solo si quedan documentadas en el plan maestro.
6. Cada fase cierra con PR grande y checklist manual de supervisor.
7. Cada fase debe crear/actualizar changelog: `docs/plans/phase-<n>-changelog.md`.
8. Si un agente queda bloqueado, debe notificar por Telegram y dejar el bloqueo documentado en el plan maestro.
9. Los agentes pueden abrir PR automáticamente al final de la fase.
10. Cada fase tendrá branch de integración: `phase/<n>-<slug>`.
11. Las tareas atómicas pueden usar ramas propias y luego integrarse en el branch de fase.

Gates obligatorios de fase:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build:minimum
npm audit
npm --prefix functions audit
```

Gates adicionales cuando aplique:

```bash
firebase emulators:exec --only firestore,storage "npm run test:rules"
```

Ninguna fase puede pasar a revisión si estos gates fallan, salvo excepción explícita documentada.

### Telegram escalation

Pendiente confirmar target/canal operativo para notificaciones de agentes.

Default conocido:

- channel: `telegram`
- target: `129362677`

### Migración multi-tenant

Decisiones confirmadas:

1. La migración a `accountId` debe ser script idempotente.
2. El script debe crear `accounts/urbly-default` automáticamente.
3. Debe asignar todos los datos actuales a `urbly-default`.
4. Debe crear memberships para usuarios existentes.
5. Debe fallar si encuentra datos ambiguos.

### PRs y supervisión

Decisiones confirmadas:

1. El agente que termina la última tarea de una fase crea el PR grande de fase.
2. El PR debe incluir checklist automático en la descripción.
3. El PR puede quedar abierto esperando aprobación humana.
4. No hacer merge sin aprobación explícita.

### Telegram escalation

Decisión confirmada:

- channel: `telegram`
- target: `129362677`

Mensaje obligatorio cuando una tarea quede bloqueada:

```txt
Urbly bloqueado en <TASK-ID>: <causa>. Necesito decisión: <pregunta concreta>.
```
