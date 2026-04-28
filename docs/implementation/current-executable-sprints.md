# Urbly — Sprints y tareas ejecutables

Fecha: 2026-04-28
Estado: plan detallado de ejecución
Propósito: servir como documento operativo para que agentes especialistas en código implementen la siguiente ola sin improvisación y sin abrir scope nuevo.

---

## Regla general de ejecución
- cada tarea debe tocar un bloque coherente, no varios frentes a la vez
- no mezclar rediseño visual grande con cambios estructurales profundos en el mismo bloque
- cada tarea debe cerrar con evidencia verificable
- si una tarea descubre más riesgo del esperado, se corta, se documenta y no se contamina el sprint siguiente
- prioridad: operación real > consistencia del dominio > navegación > polish

## Validación mínima por tarea
- `npm run build`
- cuando toque functions: `npm --prefix functions run build`
- walkthrough manual del flujo afectado si la tarea modifica navegación o UX operativa

## Criterio de cierre de la ola
La ola queda cerrada cuando:
- `service_orders` domina el flujo principal
- `services` concentra la operación diaria
- la navegación principal expone solo rutas útiles
- empresa, técnico y cliente completan su flujo básico desde la UI
- web y functions validan en verde
- la deuda restante queda explícita y acotada

---

# Sprint 1 — Navegación operativa y eliminación de placeholders

## Objetivo del sprint
Limpiar la navegación principal para que la aplicación deje de exponer módulos fantasma y empiece a reflejar el flujo real del producto.

## Resultado esperado
- navegación principal enfocada en operación real
- placeholders fuera del camino principal
- rutas y menús alineados con roles y capacidad real del producto

---

## Tarea 1.1 — Inventario de rutas visibles y placeholders

### Objetivo
Detectar todas las rutas visibles hoy en la app que no aportan valor operativo o que siguen siendo placeholders.

### Descripción de implementación
El agente debe revisar la navegación, el árbol de rutas y los componentes de páginas placeholder para producir un inventario claro de:
- rutas visibles en sidebar o navegación secundaria
- rutas protegidas pero no visibles
- pantallas que hoy muestran estado incompleto o placeholder
- módulos que siguen pareciendo “promesa futura” y no producto usable

No debe cambiar comportamiento todavía. Esta tarea es de clasificación, no de refactor.

### Archivos foco
- `src/app/nav.ts`
- `src/app/App.tsx`
- `src/app/layouts/AppLayout.tsx`
- `src/components/Sidebar.tsx`
- `src/features/shared/ComingSoonPage.tsx`
- `src/features/customers/CustomersPage.tsx`
- `src/features/assets/AssetsPage.tsx`

### Entregable esperado
- lista corta de rutas: conservar, ocultar, relegar o sacar del flujo principal
- criterio documentado en deuda o nota interna si aparece alguna ambigüedad

### Done cuando
- existe un inventario claro y accionable
- no quedan dudas sobre qué rutas viven o salen del camino principal

---

## Tarea 1.2 — Limpiar navegación principal por rol

### Objetivo
Actualizar navegación y shell para que solo muestren módulos útiles para esta ola.

### Descripción de implementación
El agente debe modificar la navegación principal para:
- ocultar entradas placeholder o de valor muy bajo
- mantener visibles solo los accesos operativos necesarios
- asegurar coherencia entre rutas disponibles y menú mostrado
- respetar el modelo por rol sin romper guards existentes

No debe aprovechar esta tarea para rediseñar la UI completa. El foco es orden y claridad operacional.

### Archivos foco
- `src/app/nav.ts`
- `src/app/App.tsx`
- `src/app/layouts/AppLayout.tsx`
- `src/components/Sidebar.tsx`
- `src/features/dashboard/HomeRouterPage.tsx`

### Entregable esperado
- navegación empresa más limpia
- navegación técnico consistente con su flujo diario
- navegación cliente sin módulos internos irrelevantes

### Done cuando
- el menú principal ya no expone módulos fantasma
- la navegación por actor refleja el producto realmente usable

---

## Tarea 1.3 — Ajustar placeholders residuales sin romper rutas

### Objetivo
Decidir qué placeholders deben seguir existiendo como fallback técnico y cuáles deben desaparecer del flujo.

### Descripción de implementación
El agente debe revisar cada pantalla placeholder detectada y aplicar una decisión concreta:
- ocultarla del menú pero dejar la ruta viva si todavía hace falta por compatibilidad
- degradarla a acceso secundario
- o mantenerla solo si aporta algo real a la operación actual

Esta tarea no busca implementar módulos faltantes, solo dejar de depender visualmente de ellos.

### Archivos foco
- `src/features/shared/ComingSoonPage.tsx`
- páginas placeholder detectadas en el inventario
- rutas asociadas en `App.tsx` y `nav.ts`

### Done cuando
- ningún placeholder importante interrumpe la percepción del flujo principal
- las rutas residuales quedan justificadas o escondidas

---

## Tarea 1.4 — Verificación de walkthrough de navegación

### Objetivo
Confirmar que cada actor llega a sus módulos clave sin fricción innecesaria.

### Descripción de implementación
El agente debe ejecutar un walkthrough manual por rol:
- empresa: inicio → servicios → detalle → reportes
- técnico: inicio → mis servicios → detalle → cierre
- cliente: resumen → servicios → informes

Si detecta fricción grave, debe corregirla dentro del mismo sprint siempre que siga dentro del alcance de navegación.

### Done cuando
- los tres walkthroughs básicos son posibles
- `npm run build` queda verde

---

# Sprint 2 — Consolidar `services` como centro operativo real

## Objetivo del sprint
Hacer que el flujo principal del negocio viva de forma clara en `services`, reduciendo dependencia conceptual de scheduling.

## Resultado esperado
- `services` funciona como lista, detalle, cierre y reporte del flujo operativo principal
- scheduling deja de sentirse como el lugar “real” del negocio

---

## Tarea 2.1 — Auditar el flujo actual de `services`

### Objetivo
Mapear qué cubre realmente `services` hoy y qué responsabilidades siguen repartidas o mal ubicadas.

### Descripción de implementación
El agente debe revisar la experiencia actual de:
- listado de servicios
- detalle operativo
- cierre técnico
- reporte/imprimible

Debe identificar:
- dependencias innecesarias con scheduling
- estados o acciones que viven en el lugar equivocado
- vacíos que rompen el flujo diario

### Archivos foco
- `src/features/services/ServicesPage.tsx`
- `src/features/services/ServiceDetailPage.tsx`
- `src/features/services/ServiceCloseoutPage.tsx`
- `src/features/services/ServiceReportPrintPage.tsx`
- `src/features/services/useOperationalServiceOrders.ts`

### Done cuando
- queda clara la lista exacta de huecos funcionales a cerrar en este sprint

---

## Tarea 2.2 — Cerrar huecos entre lista, detalle y cierre

### Objetivo
Asegurar que el flujo diario pueda completarse desde `services` sin depender de atajos accidentales.

### Descripción de implementación
El agente debe ajustar el flujo para que desde la lista de servicios se pueda:
- entrar al detalle correcto
- ver contexto operativo suficiente
- pasar al cierre técnico sin ambigüedad
- regresar al flujo sin perder claridad

No debe abrir nuevas features. Solo consolidar el flujo base.

### Archivos foco
- `src/features/services/ServicesPage.tsx`
- `src/features/services/ServiceDetailPage.tsx`
- `src/features/services/ServiceCloseoutPage.tsx`
- componentes auxiliares de services asociados

### Done cuando
- el flujo lista → detalle → cierre se siente continuo y usable
- las acciones principales están donde el usuario esperaría encontrarlas

---

## Tarea 2.3 — Reubicar responsabilidades operativas mal distribuidas

### Objetivo
Sacar de scheduling o de helpers dispersos cualquier responsabilidad que conceptualmente pertenezca al flujo principal de `services`.

### Descripción de implementación
El agente debe revisar si todavía hay lógica reutilizable o comportamiento operativo que debería vivir en `services` o en un helper compartido y no en scheduling.

Debe priorizar:
- presentación operativa
- progreso del servicio
- calidad/reporte
- integración con IA operativa si ya está presente

### Archivos foco
- `src/features/services/serviceProgress.ts`
- `src/features/services/reportQuality.ts`
- `src/features/services/serviceOrderAi.ts`
- helpers compartidos afectados
- cualquier dependencia residual con scheduling detectada en la auditoría

### Done cuando
- el flujo principal depende de `services` como centro narrativo y operativo
- no quedan responsabilidades críticas mal ubicadas por accidente

---

## Tarea 2.4 — Validación funcional de `services`

### Objetivo
Verificar que `services` ya cubre el camino diario principal.

### Descripción de implementación
El agente debe validar manualmente y dejar evidencia de estos caminos:
- ver servicios
- abrir detalle
- interpretar estado y contexto
- cerrar servicio
- abrir o imprimir reporte si aplica

### Done cuando
- el flujo principal queda usable desde `services`
- `npm run build` sigue verde

---

# Sprint 3 — Walkthrough mínimo por actor

## Objetivo del sprint
Traducir la consolidación técnica en experiencias mínimas creíbles para empresa, técnico y cliente.

## Resultado esperado
- cada actor tiene una entrada razonable al sistema
- cada actor puede completar su flujo básico sin sentirse en una UI interna ajena

---

## Tarea 3.1 — Empresa: home y acceso operativo coherente

### Objetivo
Asegurar que el rol empresa entra a una experiencia útil y clara.

### Descripción de implementación
El agente debe revisar la home y navegación de empresa para garantizar que el usuario interno pueda:
- entender rápidamente el estado operativo
- acceder a servicios, agenda, edificios y reportes
- encontrar sus acciones principales sin ruido excesivo

### Archivos foco
- `src/features/dashboard/DashboardPage.tsx`
- `src/features/dashboard/HomeRouterPage.tsx`
- `src/app/nav.ts`
- módulos internos principales conectados al flujo empresa

### Done cuando
- empresa tiene una home mínimamente accionable
- el acceso a los módulos operativos es claro

---

## Tarea 3.2 — Técnico: flujo diario mínimo usable

### Objetivo
Dejar al técnico con una experiencia simple, orientada a trabajo diario.

### Descripción de implementación
El agente debe revisar la experiencia técnica para que el usuario pueda:
- ver sus servicios del día o pendientes
- entrar rápido al contexto del trabajo
- completar el cierre sin perderse en pantallas administrativas

Debe priorizar economía de pasos y claridad de acción.

### Archivos foco
- `src/features/technician/TechnicianHomePage.tsx`
- pantallas de `services` consumidas por técnico
- rutas y navegación técnica

### Done cuando
- el técnico puede resolver su flujo principal con pocas transiciones
- la experiencia no depende de conocimiento administrativo interno

---

## Tarea 3.3 — Cliente: resumen e informes mínimos creíbles

### Objetivo
Dar al cliente una experiencia entendible, con foco en estado e informes.

### Descripción de implementación
El agente debe revisar la experiencia cliente para asegurar que el usuario pueda:
- ver un resumen claro
- entender estado actual de servicios
- acceder a informes o historial relevante
- percibir control y trazabilidad

No debe convertir el portal en visión completa futura. Solo dejarlo creíble y usable.

### Archivos foco
- `src/features/portal/ClientSummaryPage.tsx`
- `src/features/portal/ClientSecurePortalPage.tsx`
- `src/features/buildingAdmin/BuildingAdminPage.tsx`

### Done cuando
- cliente entiende qué está pasando
- el acceso a información relevante no se siente accidental

---

## Tarea 3.4 — Walkthrough transversal por actor

### Objetivo
Verificar que los tres actores completan su flujo básico de extremo a extremo.

### Descripción de implementación
El agente debe ejecutar y documentar walkthroughs mínimos:
- empresa: inicio → servicios → detalle → reporte
- técnico: inicio → servicio asignado → detalle → cierre
- cliente: resumen → servicios → informe

Si detecta huecos pequeños y corregibles dentro del sprint, debe cerrarlos antes de dar el bloque por terminado.

### Done cuando
- los tres walkthroughs básicos funcionan
- los huecos restantes, si existen, están explicitados

---

# Sprint 4 — Foundations operativas y CI

## Objetivo del sprint
Reducir fragilidad técnica para que la ola cierre con validación consistente y deploy menos incierto.

## Resultado esperado
- CI valida web y functions con criterio claro
- preview/deploy no dependen de supuestos ocultos
- documentación operativa suficiente para continuar

---

## Tarea 4.1 — Auditoría de workflows actuales

### Objetivo
Entender el estado real del pipeline antes de modificarlo.

### Descripción de implementación
El agente debe revisar los workflows activos y documentar:
- qué valida cada uno
- qué duplicidad existe
- qué build/check falta
- qué secretos o supuestos están implícitos

### Archivos foco
- `.github/workflows/ci.yml`
- `.github/workflows/preview.yml`
- `.github/workflows/deploy-develop.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/rollback.yml`

### Done cuando
- existe un diagnóstico concreto del pipeline actual

---

## Tarea 4.2 — Endurecer validación mínima

### Objetivo
Asegurar que web y functions se validan de forma consistente en el pipeline correcto.

### Descripción de implementación
El agente debe ajustar workflows y scripts para que la validación mínima requerida sea explícita y consistente.

Debe incluir, donde corresponda:
- build de web
- build de functions
- checks mínimos obligatorios antes de merge o deploy

No debe convertir esta tarea en una reingeniería completa del pipeline.

### Archivos foco
- workflows afectados
- `package.json`
- `functions/package.json`

### Done cuando
- el pipeline ya valida lo esencial sin ambigüedad
- la lógica de validación es coherente entre CI y deploy

---

## Tarea 4.3 — Documentar pipeline y supuestos críticos

### Objetivo
Dejar explícita la operación mínima de CI/deploy.

### Descripción de implementación
El agente debe actualizar la documentación de workflows para explicar:
- qué valida CI
- qué validan preview y deploy
- qué secretos se esperan
- qué condiciones deben cumplirse antes de merge o release

### Archivos foco
- `.github/workflows/README.md`
- docs de getting started o implementación si hace falta referenciarlo

### Done cuando
- una persona nueva puede entender el pipeline sin adivinar supuestos

---

## Tarea 4.4 — Verificación final de foundations

### Objetivo
Confirmar que la base técnica ya acompaña el cierre de la ola.

### Descripción de implementación
El agente debe dejar evidencia verificable de:
- `npm run build`
- `npm --prefix functions run build`
- consistencia razonable entre CI, preview y deploy

### Done cuando
- las validaciones mínimas de la ola están cubiertas y documentadas

---

# Sprint 5 — Limpieza final, deuda restante y cierre de branch

## Objetivo del sprint
Cerrar la ola con un árbol entendible, documentación alineada y deuda residual explícita.

## Resultado esperado
- residuos legacy no operativos eliminados o documentados
- branch listo para revisión
- deuda restante acotada y visible

---

## Tarea 5.1 — Eliminar código muerto legacy

### Objetivo
Borrar archivos, tipos y helpers legacy que ya no participan en el flujo operativo.

### Descripción de implementación
El agente debe identificar y eliminar residuos muertos relacionados con el modelo legacy, especialmente los que quedaron después de la migración de `appointments`.

Debe hacerlo con cuidado para no romper referencias indirectas o documentación viva.

### Archivos foco
- residuos huérfanos ligados a `appointments`
- componentes o mapas legacy ya fuera del flujo
- modelos o helpers no usados

### Done cuando
- el árbol queda más limpio
- no se elimina nada que siga siendo dependencia activa

---

## Tarea 5.2 — Limpiar naming residual no operativo

### Objetivo
Reducir naming engañoso que ya no representa el comportamiento real del producto.

### Descripción de implementación
El agente debe revisar nombres legacy que todavía permanezcan en constantes, helpers o archivos, y decidir:
- qué conviene renombrar ahora
- qué conviene dejar documentado para otra pasada por ser cosmético

El foco es claridad del dominio, no renombrar por deporte.

### Done cuando
- el naming residual importante deja de inducir errores conceptuales
- lo cosmético pendiente queda explicitado

---

## Tarea 5.3 — Actualizar deuda y estado final de implementación

### Objetivo
Cerrar la ola con documentación alineada al estado real del código.

### Descripción de implementación
El agente debe actualizar la documentación operativa para dejar claro:
- qué se cerró en esta ola
- qué deuda quedó realmente pendiente
- qué ya no es problema
- qué sería el siguiente frente si se continuara

### Archivos foco
- `docs/implementation/current-implementation-debt.md`
- `docs/getting-started/current-status.md`
- cualquier referencia breve adicional necesaria

### Done cuando
- la documentación refleja el estado real y no planes viejos

---

## Tarea 5.4 — Preparación de PR final

### Objetivo
Dejar el branch listo para revisión y cierre.

### Descripción de implementación
El agente debe preparar el cierre final del trabajo:
- revisar diff global
- agrupar el relato de cambios por bloques coherentes
- dejar evidencia de validación
- resumir riesgos o deuda remanente para revisión

### Done cuando
- el branch queda explicable
- la revisión puede hacerse sin reconstruir contexto desde cero

---

# Orden obligatorio de ejecución
1. Sprint 1 — Navegación operativa y placeholders
2. Sprint 2 — `services` como centro operativo
3. Sprint 3 — Walkthrough mínimo por actor
4. Sprint 4 — Foundations operativas y CI
5. Sprint 5 — Limpieza final y cierre de branch

# Qué no entra en este plan
- rediseño visual premium completo
- expansión grande de IA
- expansión de módulos periféricos
- reescritura total del portal cliente
- nuevos dominios fuera del flujo central de servicios
