# Urbly v2 Execution Plan

## 1. Objetivo
Convertir el design doc y el implementation plan en una secuencia concreta de ejecución con alcance controlado, archivos probables, validaciones y criterios de done.

Este documento está pensado para trabajar sobre la rama feature sin improvisación y con entregables pequeños.

---

## 2. Estrategia general
La ejecución debe seguir este orden:
1. estabilizar foundations y CI/CD
2. introducir modelo `serviceOrder`
3. reorganizar navegación y shell
4. extraer el core operativo desde `SchedulingPage`
5. mejorar experiencias por actor
6. integrar IA
7. cerrar con refinamiento visual y release hardening

### Regla clave
No mezclar rediseño visual grande con cambios profundos de dominio en el mismo bloque si se puede evitar.

---

## 3. Bloques de ejecución

## Bloque 0, Foundations + CI/CD
### Objetivo
Dejar una base técnica estable para poder refactorar sin pelear contra el pipeline.

### Tareas
1. auditar workflows actuales
2. decidir checks mínimos obligatorios
3. agregar `typecheck` explícito si no existe como script separado
4. revisar si `lint:ci` basta o necesita complemento con `lint`
5. verificar builds web y functions en ramas feature
6. revisar secrets esperados por cada workflow
7. validar `preview`, `deploy-develop`, `deploy`, `rollback`
8. documentar branch strategy y required checks

### Archivos probables
- `.github/workflows/ci.yml`
- `.github/workflows/preview.yml`
- `.github/workflows/deploy-develop.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/rollback.yml`
- `.github/workflows/README.md`
- `package.json`
- `functions/package.json`
- `README.md`
- `docs/functions.md`

### Validaciones
- `npm ci`
- `npm --prefix functions ci` o equivalente validado
- `npm run lint`
- `npm run build`
- `npm --prefix functions run build`
- ejecución exitosa de workflow CI en la rama feature

### Commit sugerido
- `chore: endurecer pipeline de github actions`

### Done cuando
- el repo valida consistentemente en feature branches
- el check requerido queda claro
- preview/deploy no dependen de supuestos ocultos

---

## Bloque 1, Dominio `serviceOrder`
### Objetivo
Introducir el nuevo núcleo del producto sin romper el flujo actual.

### Tareas
1. definir modelo `serviceOrder`
2. mapear relación con `appointment`
3. decidir estrategia de compatibilidad temporal
4. crear tipos/modelos iniciales
5. definir estados, prioridad, timeline y estructura de reporte
6. identificar queries, adapters y serializers necesarios
7. documentar estrategia de migración de datos

### Archivos probables
- `src/core/models/appointment.ts`
- `src/core/models/` (nuevo `serviceOrder.ts`)
- `src/lib/api/queries.ts`
- `src/lib/api/firestore.ts`
- `functions/src/*` si hay generación de reportes o consultas acopladas
- `docs/urbly-v2/` para documentación técnica complementaria

### Validaciones
- typecheck limpio
- build limpio
- sin romper pantallas existentes que siguen usando `appointment`

### Commit sugerido
- `feat: introducir modelo base de service order`

### Done cuando
- existe un modelo claro de `serviceOrder`
- la coexistencia con `appointment` está documentada y controlada

---

## Bloque 2, Navegación v2 y shell de aplicación
### Objetivo
Hacer que el producto se vea y se comporte como Urbly v2 desde su estructura principal.

### Tareas
1. rediseñar rutas por rol
2. actualizar `App.tsx`
3. actualizar `nav.ts`
4. revisar `AppLayout`, `Sidebar`, `BottomNav`, `TopBar`
5. introducir placeholders funcionales donde aún no exista la vista final
6. asegurar guards correctos por rol

### Archivos probables
- `src/app/App.tsx`
- `src/app/nav.ts`
- `src/app/layouts/AppLayout.tsx`
- `src/components/Sidebar.tsx`
- `src/components/BottomNav.tsx`
- `src/components/TopBar.tsx`
- `src/app/Auth.tsx`

### Validaciones
- navegación funcional para empresa
- navegación funcional para técnico
- navegación funcional para cliente
- rutas protegidas coherentes

### Commit sugerido
- `feat: reorganizar navegación por rol`

### Done cuando
- la navegación ya refleja la nueva arquitectura del producto
- no hay mezcla innecesaria de rutas heredadas y nuevas

---

## Bloque 3, Extracción del core operativo
### Objetivo
Dividir `SchedulingPage` en piezas mantenibles.

### Tareas
1. crear `src/features/services/`
2. separar agenda, detalle y cierre
3. mover lógica reusable a hooks y componentes más pequeños
4. mantener compatibilidad temporal con flujo actual
5. preparar transición desde `SchedulingPage`

### Subtareas sugeridas
#### 3.1 Agenda
- calendario
- lista
- filtros
- asignación

#### 3.2 Detalle de servicio
- contexto de edificio y cliente
- técnico
- historial
- incidencias
- evidencias

#### 3.3 Cierre
- checklist
- fotos
- observaciones
- reporte
- PDF

### Archivos probables
- `src/features/scheduling/SchedulingPage.tsx`
- `src/features/services/ServicesPage.tsx`
- `src/features/services/ServiceDetailPage.tsx`
- `src/features/services/ServiceCloseoutPage.tsx`
- `src/features/services/components/*`
- `src/components/*` reutilizables

### Validaciones
- build limpio
- flujo actual no queda roto a mitad de migración
- agenda y cierre funcionan separados

### Commit sugerido por hitos
- `refactor: extraer agenda de servicios`
- `refactor: separar detalle operativo del servicio`
- `refactor: mover cierre técnico a flujo dedicado`

### Done cuando
- `SchedulingPage` deja de ser el monstruo central
- el flujo principal ya puede crecer sin multiplicar complejidad

---

## Bloque 4, Dashboard por actor
### Objetivo
Dar a cada actor una home útil.

### Tareas
1. rediseñar dashboard empresa
2. crear home técnico
3. crear home cliente
4. reutilizar tarjetas y summaries cuando convenga

### Archivos probables
- `src/features/dashboard/DashboardPage.tsx`
- nuevas vistas en `src/features/dashboard/` o módulos específicos por rol
- `src/components/StatCard.tsx`
- `src/components/Card.tsx`
- `src/components/PageHeader.tsx`

### Validaciones
- cada rol aterriza en una home coherente
- CTAs principales visibles
- lectura rápida de estado

### Commit sugerido
- `feat: crear dashboards por actor`

### Done cuando
- empresa, técnico y cliente ya no comparten el mismo home mental

---

## Bloque 5, Portal cliente serio
### Objetivo
Convertir el portal cliente en una experiencia de seguimiento real.

### Tareas
1. rediseñar `BuildingAdminPage`
2. separar resumen, historial, informes y solicitudes
3. mejorar presentación de evidencias
4. simplificar lectura del estado operativo

### Archivos probables
- `src/features/buildingAdmin/BuildingAdminPage.tsx`
- nuevos subcomponentes o subpáginas de portal
- componentes de timeline, evidencias, reportes

### Validaciones
- cliente puede entender estado actual sin navegar tablas pesadas
- informes y próximas acciones son fáciles de encontrar

### Commit sugerido
- `feat: rediseñar portal cliente`

### Done cuando
- el portal transmite trazabilidad y confianza

---

## Bloque 6, IA operativa
### Objetivo
Integrar IA en los puntos de mayor ROI.

### Tareas
1. definir primeras 2 o 3 acciones de IA
2. integrar botones/contexto en detalle y cierre de servicio
3. agregar capa backend si hace falta
4. dejar edición humana obligatoria antes de persistir o enviar

### Casos recomendados para arrancar
- generar informe técnico
- redactar mensaje al cliente
- resumir historial del caso

### Archivos probables
- `src/features/services/*`
- `functions/src/*` si parte de la lógica corre server-side
- `src/lib/api/functions.ts`
- componentes de acción contextual

### Validaciones
- salida útil, editable y clara
- no rompe flujo si la IA falla
- feedback de loading y error bien resuelto

### Commit sugerido
- `feat: integrar acciones de ia en el flujo operativo`

### Done cuando
- la IA ya ahorra trabajo real en al menos dos tareas operativas

---

## Bloque 7, Sistema visual y polish
### Objetivo
Cerrar consistencia visual y percepción premium-operativa.

### Tareas
1. revisar spacing y jerarquía visual
2. normalizar componentes base
3. mejorar login
4. mejorar estados vacíos, errores, loaders y confirmaciones
5. revisar responsive, sobre todo técnico en móvil

### Archivos probables
- `src/components/Button.tsx`
- `src/components/Card.tsx`
- `src/components/Input.tsx`
- `src/components/Modal.tsx`
- `src/components/EmptyState.tsx`
- `src/features/auth/LoginPage.tsx`
- estilos globales / theme si existen

### Validaciones
- contraste correcto
- mejor consistencia
- UI más limpia y confiable

### Commit sugerido
- `feat: unificar sistema visual de urbly v2`

### Done cuando
- el producto se siente consistente, moderno y más vendible

---

## 4. Secuencia recomendada de commits
Orden sugerido:
1. `chore: endurecer pipeline de github actions`
2. `feat: introducir modelo base de service order`
3. `feat: reorganizar navegación por rol`
4. `refactor: extraer agenda de servicios`
5. `refactor: separar detalle operativo del servicio`
6. `refactor: mover cierre técnico a flujo dedicado`
7. `feat: crear dashboards por actor`
8. `feat: rediseñar portal cliente`
9. `feat: integrar acciones de ia en el flujo operativo`
10. `feat: unificar sistema visual de urbly v2`

---

## 5. Estrategia de pruebas y verificación

## Checks mínimos locales por bloque
- `npm run lint`
- `npm run build`
- `npm --prefix functions run build`

## Checks deseables
- test unitario donde tenga sentido
- smoke walkthrough manual de rutas críticas
- verificación de roles
- verificación de móvil para técnico
- verificación del portal cliente

## Flujos críticos a revisar siempre
- login
- navegación por rol
- crear o editar servicio
- asignar técnico
- cerrar servicio
- ver informe
- acceso cliente al historial
- deploy preview y CI

---

## 6. Estrategia de rollout
### Recomendación
Usar rollout progresivo dentro de la rama feature y luego PR por bloques lógicos.

### Opción recomendada
- PR 1: docs + foundations + CI/CD
- PR 2: dominio + navegación
- PR 3: extracción del core operativo
- PR 4: dashboard + portal cliente
- PR 5: IA + polish final

Esto reduce riesgo y facilita review.

---

## 7. Riesgos de ejecución
- scope creep al intentar rehacer todo al mismo tiempo
- deuda temporal entre `appointment` y `serviceOrder`
- roturas de permisos por rol
- roturas en Firebase rules o Storage
- pipeline CI/CD quedando “casi bien” en vez de sólido

### Mitigación
- cambios pequeños
- validación frecuente
- revisar reglas y claims temprano
- PRs por bloques
- smoke tests manuales en cada fase importante

---

## 8. Criterio de éxito del execution plan
Este plan funciona si permite:
- avanzar sin perder control del scope
- dejar CI/CD realmente confiable
- mover el producto hacia la nueva arquitectura
- ejecutar por bloques revisables
- llegar a un Urbly más claro, más fuerte y mejor preparado para IA
