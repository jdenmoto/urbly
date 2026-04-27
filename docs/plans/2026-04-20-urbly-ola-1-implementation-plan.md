# Urbly Ola 1 — Implementation Plan

## 1. Objetivo

Ejecutar una primera ola balanceada de Urbly v2 que cierre deuda crítica y deje una experiencia mínima usable por actor.

Orden obligatorio:
1. foundations mínimas
2. consolidación de dominio
3. core operativo usable
4. experiencia mínima por actor

---

## 2. Reglas de ejecución

- cambios pequeños y reversibles
- TDD cuando el cambio justifique prueba automatizada
- no mezclar refactor profundo con rediseño visual grande
- validar al final de cada bloque
- usar subagentes para ejecutar tareas concretas

---

## 3. Bloque A — Foundations mínimas

### A1. Auditar y endurecer CI principal
**Objetivo:** asegurar que CI valide web y functions con criterio consistente.

**Tareas:**
1. revisar `.github/workflows/ci.yml`
2. verificar si instala y valida web + functions
3. decidir si `lint:ci` necesita complemento o ajuste
4. agregar validaciones faltantes si aplica
5. asegurar build de functions dentro del flujo correcto

**Archivos probables:**
- `.github/workflows/ci.yml`
- `package.json`
- `functions/package.json`

**Verificación:**
- workflow coherente
- `npm run build`
- `npm --prefix functions run build`

---

### A2. Endurecer preview y deploys
**Objetivo:** evitar divergencia entre CI, preview y deploy.

**Tareas:**
1. revisar `.github/workflows/preview.yml`
2. revisar `.github/workflows/deploy-develop.yml`
3. revisar `.github/workflows/deploy.yml`
4. hacer que validen también functions cuando corresponda
5. reducir duplicación operativa si es razonable
6. agregar checks ligeros o notas operativas necesarias

**Archivos probables:**
- `.github/workflows/preview.yml`
- `.github/workflows/deploy-develop.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/README.md`

**Verificación:**
- consistencia de pasos entre workflows
- builds explícitos antes de deploy

---

### A3. Documentar pipeline mínimo confiable
**Objetivo:** dejar explícitos secretos, supuestos y checks.

**Tareas:**
1. actualizar doc de workflows
2. listar secretos obligatorios/opcionales
3. dejar claro criterio de validación antes de merge/deploy

**Archivos probables:**
- `.github/workflows/README.md`
- `README.md` o docs relacionadas si aporta

**Verificación:**
- doc clara y alineada con workflows reales

---

## 4. Bloque B — Consolidación de dominio

### B1. Inventario de dependencias legacy
**Objetivo:** localizar dónde `appointment` sigue gobernando el flujo.

**Tareas:**
1. mapear uso de `appointment` en queries, mutaciones y features
2. separar uso legacy permitido de deuda real
3. registrar rutas críticas que aún dependen de fallback

**Archivos probables:**
- `src/core/models/appointment.ts`
- `src/lib/api/queries.ts`
- `src/lib/api/serviceOrders.ts`
- `src/features/scheduling/*`
- `src/features/services/*`

**Entregable:**
- lista priorizada de dependencias legacy restantes

---

### B2. Formalizar capa canónica de service orders
**Objetivo:** encapsular compatibilidad legacy en una capa clara.

**Tareas:**
1. revisar `src/lib/api/serviceOrders.ts`
2. centralizar mapping y enrich de `serviceOrder`
3. evitar que features consuman shape legacy directamente
4. preparar helpers/selectors canónicos si faltan

**Archivos probables:**
- `src/lib/api/serviceOrders.ts`
- `src/lib/api/queries.ts`
- `src/features/services/*`

**Verificación:**
- features principales consumen contrato canónico
- build verde

---

### B3. Reducir fallback implícito desde appointments
**Objetivo:** dejar el fallback legacy más explícito y controlado.

**Tareas:**
1. decidir regla de fallback actual
2. encapsularla en una función o estrategia visible
3. evitar lógica dispersa en queries/páginas
4. documentar límite temporal del fallback

**Archivos probables:**
- `src/lib/api/queries.ts`
- docs del plan o deuda técnica

**Verificación:**
- fallback explícito
- menos acoplamiento accidental

---

## 5. Bloque C — Core operativo usable

### C1. Auditar residuos de SchedulingPage
**Objetivo:** identificar qué sigue viviendo en scheduling legacy.

**Tareas:**
1. revisar `src/features/scheduling/SchedulingPage.tsx`
2. mapear responsabilidades todavía no migradas
3. separar deuda crítica vs deuda post-ola

**Entregable:**
- lista de extracciones necesarias en esta ola

---

### C2. Consolidar Servicios como centro operativo
**Objetivo:** asegurar que lista, detalle y cierre cubran el flujo principal.

**Tareas:**
1. revisar `ServicesPage.tsx`
2. revisar `ServiceDetailPage.tsx`
3. revisar `ServiceCloseoutPage.tsx`
4. cerrar huecos funcionales mínimos entre las tres
5. eliminar dependencias innecesarias con scheduling legacy

**Verificación:**
- flujo principal usable desde servicios
- build verde

---

### C3. Limpiar duplicación operativa y adapters
**Objetivo:** bajar complejidad accidental.

**Tareas:**
1. revisar selectors, presentation helpers y mutaciones relacionadas
2. unificar lógica duplicada entre scheduling/services
3. mover helpers al módulo correcto

**Archivos probables:**
- `src/features/scheduling/*`
- `src/features/services/*`
- `src/lib/api/*`

**Verificación:**
- menos duplicación
- responsabilidades mejor separadas

---

## 6. Bloque D — Experiencia mínima por actor

### D1. Empresa: navegación y home mínima coherente
**Objetivo:** dejar clara la operación para roles internos.

**Tareas:**
1. revisar `src/app/nav.ts`
2. revisar `DashboardPage.tsx` y `HomeRouterPage.tsx`
3. cerrar incoherencias entre navegación y rutas reales
4. asegurar quick actions y acceso claro al flujo principal

**Verificación:**
- experiencia empresa coherente
- las funciones clave de empresa previstas en la ola se pueden ejecutar desde la UI

---

### D2. Técnico: flujo mínimo de trabajo diario
**Objetivo:** permitir trabajo simple y directo desde la experiencia técnica.

**Tareas:**
1. revisar `TechnicianHomePage.tsx`
2. validar acceso a servicios propios y acciones clave
3. agregar o ajustar vista mínima faltante si hace falta
4. asegurar paso simple home → detalle → cierre

**Verificación:**
- técnico puede operar flujo diario mínimo
- las funciones clave del técnico previstas en la ola se pueden ejecutar desde la UI

---

### D3. Cliente: resumen y trazabilidad mínima
**Objetivo:** dejar una experiencia mínima creíble para cliente.

**Tareas:**
1. revisar `ClientSummaryPage.tsx`
2. revisar `ClientSecurePortalPage.tsx`
3. revisar `BuildingAdminPage.tsx`
4. mejorar jerarquía de estado, servicios e informes
5. quitar sensación de tabla administrativa donde estorbe

**Verificación:**
- cliente entiende estado actual y puede acceder a lo importante
- las funciones clave del cliente previstas en la ola se pueden ejecutar desde la UI

---

### D4. Ajuste final de navegación por actor
**Objetivo:** alinear shell y rutas con lo realmente soportado en esta ola.

**Tareas:**
1. ajustar rutas/placeholders
2. revisar guards por rol
3. asegurar consistencia entre sidebar, bottom nav y rutas reales

**Archivos probables:**
- `src/app/App.tsx`
- `src/app/nav.ts`
- `src/app/layouts/AppLayout.tsx`
- `src/components/Sidebar.tsx`
- `src/components/BottomNav.tsx`
- `src/components/TopBar.tsx`

**Verificación:**
- navegación coherente por actor

---

## 7. Secuencia recomendada de ejecución

1. A1 endurecer CI principal
2. A2 endurecer preview y deploys
3. A3 documentar pipeline
4. B1 inventario legacy
5. B2 capa canónica service orders
6. B3 fallback explícito
7. C1 auditoría residuos scheduling
8. C2 consolidar servicios
9. C3 limpiar duplicación
10. D1 empresa
11. D2 técnico
12. D3 cliente
13. D4 ajuste final de navegación

---

## 8. Verificación final mínima

Al terminar toda la ola:
- `npm run build`
- `npm --prefix functions run build`
- smoke walkthrough de rutas principales por actor
- validación rápida de servicios: lista, detalle, cierre
- comprobación manual de que las funciones clave de empresa, técnico y cliente incluidas en la ola son ejecutables desde la UI

---

## 9. Criterio de done global

La ola queda terminada cuando:
- foundations mínimas están endurecidas
- `serviceOrder` domina el flujo principal
- la dependencia residual de legacy queda encapsulada
- servicios es el centro operativo real
- empresa, técnico y cliente tienen experiencia mínima coherente
- cada función clave de cada actor incluida en la ola puede ejecutarse realmente desde la UI
