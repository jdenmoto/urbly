# Urbly — Tareas atómicas listas para subagentes

Fecha: 2026-04-28
Estado: plan atómico de ejecución
Propósito: convertir los sprints vigentes en unidades de trabajo pequeñas, secuenciales y delegables a agentes especialistas en código.

---

## Cómo usar este documento
Cada tarea de este documento está pensada para un subagente de implementación.

### Regla de tamaño
- una tarea debe tocar un solo problema coherente
- si una tarea descubre un problema mayor, debe documentarlo y detenerse
- no mezclar cleanup incidental con cambios estructurales profundos si no son necesarios para cerrar la tarea

### Estructura esperada de ejecución por subagente
Cada subagente debe recibir:
- objetivo
- contexto
- archivos foco
- cambios esperados
- restricciones
- validación

### Validación mínima
- `npm run build`
- cuando toque functions: `npm --prefix functions run build`
- walkthrough manual si cambia navegación o UX operativa

### Regla de secuencia
No ejecutar tareas fuera de orden salvo que una dependencia técnica obligue a intercambiar dos tareas adyacentes del mismo sprint.

---

# Sprint 1 — Navegación operativa y placeholders

## S1-T1 — Inventariar rutas visibles y placeholders

### Objetivo
Construir un inventario confiable de rutas visibles, rutas protegidas y placeholders expuestos al usuario.

### Descripción
El subagente debe revisar la navegación actual y clasificar cada ruta visible en una de estas categorías:
- operativa y conservar
- operativa pero secundaria
- placeholder ocultable
- ruta legacy que debe salir del flujo principal

Debe documentar decisiones concretas, no observaciones vagas.

### Archivos foco
- `src/app/nav.ts`
- `src/app/App.tsx`
- `src/app/layouts/AppLayout.tsx`
- `src/components/Sidebar.tsx`
- `src/features/shared/ComingSoonPage.tsx`
- `src/features/customers/CustomersPage.tsx`
- `src/features/assets/AssetsPage.tsx`

### Cambios esperados
- inventario escrito en doc interna o deuda actualizada
- sin cambios de comportamiento todavía, salvo ajustes mínimos para poder completar el inventario si fueran indispensables

### Restricciones
- no rediseñar navegación en esta tarea
- no borrar rutas todavía

### Validación
- documentación consistente con el árbol real de rutas

---

## S1-T2 — Limpiar entradas del menú principal de empresa

### Objetivo
Dejar la navegación de empresa enfocada solo en módulos útiles para la ola actual.

### Descripción
El subagente debe aplicar el inventario anterior para ocultar, relegar o sacar del menú principal aquellas entradas que hoy no aportan valor operativo.

Debe priorizar claridad de acceso a:
- servicios
- agenda
- edificios
- reportes
- módulos internos realmente útiles

### Archivos foco
- `src/app/nav.ts`
- `src/components/Sidebar.tsx`
- `src/app/layouts/AppLayout.tsx`

### Cambios esperados
- menú empresa más corto y claro
- placeholders o módulos dudosos fuera del camino principal

### Restricciones
- no romper guards por rol
- no cambiar copy ni diseño fuera de lo necesario

### Validación
- walkthrough empresa: inicio → servicios → detalle → reportes
- `npm run build`

---

## S1-T3 — Alinear navegación técnica con el flujo diario

### Objetivo
Hacer que el técnico vea una navegación mínima, directa y orientada a trabajo.

### Descripción
El subagente debe revisar la navegación técnica y reducirla a accesos que realmente ayuden al trabajo diario. Debe evitar exponer módulos administrativos o rutas que no encajan con la experiencia de campo.

### Archivos foco
- `src/app/nav.ts`
- `src/app/App.tsx`
- `src/features/technician/TechnicianHomePage.tsx`
- componentes de navegación que dependan del rol técnico

### Cambios esperados
- navegación técnica corta y coherente
- acceso directo a servicios propios, detalle y cierre

### Restricciones
- no abrir nuevas pantallas técnicas
- no meter redesign visual amplio

### Validación
- walkthrough técnico: inicio → mis servicios → detalle → cierre
- `npm run build`

---

## S1-T4 — Depurar acceso cliente y placeholders residuales

### Objetivo
Quitar del flujo cliente cualquier elemento que se sienta interno, fantasma o accidental.

### Descripción
El subagente debe revisar la experiencia cliente y ocultar o aislar rutas placeholder o administrativas que hoy generen ruido. Si una ruta debe quedar viva por compatibilidad, debe quedar fuera del camino principal.

### Archivos foco
- `src/app/nav.ts`
- `src/app/App.tsx`
- `src/features/shared/ComingSoonPage.tsx`
- rutas cliente relevantes

### Cambios esperados
- acceso cliente más limpio
- placeholders residuales escondidos o justificados

### Restricciones
- no implementar el portal completo
- no cambiar permisos sin necesidad

### Validación
- walkthrough cliente: resumen → servicios → informes
- `npm run build`

---

## S1-T5 — Verificación final de navegación

### Objetivo
Comprobar que la navegación ya refleja el producto realmente usable.

### Descripción
El subagente debe ejecutar una validación transversal de navegación por rol y corregir fricciones pequeñas que hayan quedado abiertas tras las tareas anteriores.

### Archivos foco
- los tocados en S1-T2, S1-T3 y S1-T4

### Cambios esperados
- ajustes finales menores
- evidencia de walkthrough por rol

### Restricciones
- no abrir cambios estructurales nuevos

### Validación
- walkthroughs completos por rol
- `npm run build`

---

# Sprint 2 — `services` como centro operativo

## S2-T1 — Auditar el flujo actual de `services`

### Objetivo
Mapear exactamente qué cubre `services` y qué huecos siguen obligando a pensar en scheduling.

### Descripción
El subagente debe revisar la relación entre listado, detalle, cierre y reporte, identificando huecos funcionales, duplicaciones y responsabilidades mal ubicadas.

### Archivos foco
- `src/features/services/ServicesPage.tsx`
- `src/features/services/ServiceDetailPage.tsx`
- `src/features/services/ServiceCloseoutPage.tsx`
- `src/features/services/ServiceReportPrintPage.tsx`
- `src/features/services/useOperationalServiceOrders.ts`

### Cambios esperados
- auditoría concreta de huecos
- si hay microajustes obvios y seguros, puede aplicarlos; si no, solo documenta para las siguientes tareas del sprint

### Restricciones
- no convertir esta tarea en refactor grande

### Validación
- auditoría coherente con el código real

---

## S2-T2 — Cerrar el flujo lista → detalle

### Objetivo
Asegurar que la lista de servicios lleva al detalle correcto con el contexto suficiente.

### Descripción
El subagente debe revisar el paso desde el listado al detalle y corregir problemas de descubribilidad, contexto, labels, accesos o información crítica faltante que rompan el flujo operativo.

### Archivos foco
- `src/features/services/ServicesPage.tsx`
- `src/features/services/ServiceDetailPage.tsx`
- presentation helpers vinculados

### Cambios esperados
- transición clara entre listado y detalle
- contexto del servicio suficiente al aterrizar en detalle

### Restricciones
- no abrir módulos nuevos
- no mezclar con cierre técnico todavía

### Validación
- walkthrough lista → detalle
- `npm run build`

---

## S2-T3 — Cerrar el flujo detalle → cierre técnico

### Objetivo
Hacer que desde el detalle se pueda pasar al cierre sin ambigüedad ni dependencia accidental de scheduling.

### Descripción
El subagente debe revisar el acceso al cierre técnico, el contexto mostrado y la claridad de las acciones primarias para que el usuario pueda ejecutar el cierre desde `services` como flujo natural.

### Archivos foco
- `src/features/services/ServiceDetailPage.tsx`
- `src/features/services/ServiceCloseoutPage.tsx`
- componentes de acción relacionados

### Cambios esperados
- acciones claras de cierre desde el detalle
- continuidad razonable entre detalle y cierre

### Restricciones
- no meter nueva lógica de negocio fuera del flujo actual

### Validación
- walkthrough detalle → cierre
- `npm run build`

---

## S2-T4 — Consolidar reporte e imprimible dentro del flujo principal

### Objetivo
Asegurar que el reporte o vista imprimible forman parte del flujo operativo y no son una pieza aislada.

### Descripción
El subagente debe revisar cómo se accede al reporte del servicio y ajustar su integración con detalle/cierre para que no se sienta separado del flujo principal.

### Archivos foco
- `src/features/services/ServiceReportPrintPage.tsx`
- `src/features/services/ServiceDetailPage.tsx`
- `src/features/services/ServiceCloseoutPage.tsx`

### Cambios esperados
- acceso más coherente al reporte
- narrativa operativa continua entre servicio, cierre y evidencia

### Restricciones
- no rehacer el sistema de reportes

### Validación
- walkthrough detalle/cierre → reporte
- `npm run build`

---

## S2-T5 — Reubicar helpers y responsabilidades residuales

### Objetivo
Mover al lugar correcto cualquier helper o responsabilidad crítica que todavía esté conceptualmente fuera de `services`.

### Descripción
El subagente debe revisar helpers operativos ligados al progreso, calidad del reporte y comportamiento asociado para decidir si deben vivir en `services`, en shared o quedarse donde están. Debe mover solo lo necesario para que el flujo principal quede limpio.

### Archivos foco
- `src/features/services/serviceProgress.ts`
- `src/features/services/reportQuality.ts`
- `src/features/services/serviceOrderAi.ts`
- dependencias cruzadas detectadas con scheduling

### Cambios esperados
- menos dispersión conceptual
- menos dependencia accidental de scheduling

### Restricciones
- no abrir nuevas capacidades de IA
- no renombrar por cosmética sin impacto real

### Validación
- `npm run build`
- walkthrough funcional completo de `services`

---

# Sprint 3 — Walkthrough mínimo por actor

## S3-T1 — Revisar home y accesos de empresa

### Objetivo
Dejar al rol empresa con una entrada útil y orientada a operación.

### Descripción
El subagente debe revisar dashboard y accesos principales para que empresa entienda rápidamente el estado operativo y pueda navegar a sus flujos clave sin ruido.

### Archivos foco
- `src/features/dashboard/DashboardPage.tsx`
- `src/features/dashboard/HomeRouterPage.tsx`
- `src/app/nav.ts`

### Cambios esperados
- home empresa más accionable
- accesos más lógicos a servicios, agenda, edificios y reportes

### Restricciones
- no convertir dashboard en rediseño total

### Validación
- walkthrough empresa completo
- `npm run build`

---

## S3-T2 — Revisar experiencia diaria del técnico

### Objetivo
Asegurar que el técnico puede completar su flujo sin cargar con UI administrativa.

### Descripción
El subagente debe ajustar la experiencia técnica para que el usuario vea lo importante primero y tenga un camino corto hacia detalle y cierre.

### Archivos foco
- `src/features/technician/TechnicianHomePage.tsx`
- pantallas de services usadas por técnico
- navegación técnica

### Cambios esperados
- home técnica útil
- menos fricción para llegar a la acción principal

### Restricciones
- no crear nuevas secciones complejas

### Validación
- walkthrough técnico completo
- `npm run build`

---

## S3-T3 — Revisar resumen y trazabilidad del cliente

### Objetivo
Dar al cliente una experiencia mínima que transmita estado, control y acceso a informes.

### Descripción
El subagente debe revisar las pantallas cliente para mejorar claridad, jerarquía de información y acceso a lo importante, sin intentar construir la visión completa futura del portal.

### Archivos foco
- `src/features/portal/ClientSummaryPage.tsx`
- `src/features/portal/ClientSecurePortalPage.tsx`
- `src/features/buildingAdmin/BuildingAdminPage.tsx`

### Cambios esperados
- resumen más legible
- acceso más claro a servicios e informes

### Restricciones
- no abrir módulos nuevos de cliente

### Validación
- walkthrough cliente completo
- `npm run build`

---

## S3-T4 — Ajuste final transversal por actor

### Objetivo
Corregir los huecos pequeños que aparezcan al probar los tres walkthroughs completos.

### Descripción
El subagente debe ejecutar una pasada de verificación transversal y corregir problemas pequeños de continuidad, labels, CTA, navegación o contexto entre pantallas.

### Archivos foco
- los tocados en S3-T1, S3-T2 y S3-T3

### Cambios esperados
- correcciones puntuales de continuidad
- evidencia final de walkthrough por actor

### Restricciones
- no abrir un refactor nuevo escondido en esta tarea

### Validación
- walkthroughs finales de empresa, técnico y cliente
- `npm run build`

---

# Sprint 4 — Foundations operativas y CI

## S4-T1 — Auditar el pipeline actual

### Objetivo
Entender qué valida cada workflow y dónde están los huecos reales.

### Descripción
El subagente debe revisar los workflows actuales y dejar un diagnóstico corto y accionable sobre builds, checks, duplicidades y supuestos implícitos.

### Archivos foco
- `.github/workflows/ci.yml`
- `.github/workflows/preview.yml`
- `.github/workflows/deploy-develop.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/rollback.yml`

### Cambios esperados
- diagnóstico documentado
- sin tocar pipeline todavía salvo que exista una corrección trivial e inocua

### Restricciones
- no rediseñar todo el pipeline en esta tarea

### Validación
- diagnóstico consistente con workflows reales

---

## S4-T2 — Endurecer build mínimo de web y functions

### Objetivo
Hacer explícita la validación mínima necesaria para la ola.

### Descripción
El subagente debe ajustar scripts o workflows para que el build de web y functions forme parte clara de la validación requerida donde corresponda.

### Archivos foco
- `.github/workflows/ci.yml`
- workflows asociados si aplica
- `package.json`
- `functions/package.json`

### Cambios esperados
- build mínimo consistente
- menos ambigüedad sobre qué valida el pipeline

### Restricciones
- no intentar resolver toda la estrategia de release aquí

### Validación
- `npm run build`
- `npm --prefix functions run build`

---

## S4-T3 — Alinear preview y deploy con la validación real

### Objetivo
Reducir divergencia entre CI, preview y deploy.

### Descripción
El subagente debe revisar preview y deploy para que no vivan con supuestos distintos a CI cuando no haga falta.

### Archivos foco
- `.github/workflows/preview.yml`
- `.github/workflows/deploy-develop.yml`
- `.github/workflows/deploy.yml`

### Cambios esperados
- mayor coherencia operativa entre workflows
- menos riesgo de que algo despliegue sin la validación adecuada

### Restricciones
- no rehacer branching strategy completa salvo que sea imprescindible

### Validación
- consistencia documental y técnica razonable
- builds verdes

---

## S4-T4 — Documentar pipeline y supuestos críticos

### Objetivo
Dejar el pipeline entendible para la siguiente persona que opere el repo.

### Descripción
El subagente debe actualizar la documentación del pipeline para explicar qué valida cada workflow, qué secretos usa y qué condiciones deben cumplirse antes de merge o deploy.

### Archivos foco
- `.github/workflows/README.md`
- referencias complementarias si hacen falta

### Cambios esperados
- documentación operativa clara y breve

### Restricciones
- no convertir la documentación en teoría extensa

### Validación
- docs alineadas con workflows reales

---

# Sprint 5 — Limpieza final y cierre

## S5-T1 — Identificar y eliminar código muerto legacy

### Objetivo
Quitar residuos legacy que ya no participan en el flujo operativo.

### Descripción
El subagente debe localizar tipos, helpers, componentes o archivos huérfanos que quedaron tras la migración y eliminarlos de forma segura.

### Archivos foco
- residuos ligados a `appointments`
- componentes legacy sin uso
- helpers muertos detectados por búsqueda o imports huérfanos

### Cambios esperados
- árbol más limpio
- menos ruido conceptual en el código

### Restricciones
- no borrar algo si todavía existe duda razonable de uso

### Validación
- `npm run build`
- `npm --prefix functions run build` si toca functions

---

## S5-T2 — Limpiar naming residual no operativo

### Objetivo
Reducir naming legacy que ya no refleja la realidad del producto.

### Descripción
El subagente debe revisar nombres que todavía inducen a pensar en el modelo viejo y corregir los que tengan impacto conceptual real. Lo puramente cosmético debe documentarse si no vale el costo del cambio.

### Archivos foco
- constantes y helpers legacy restantes
- nombres de presentation helpers o modelos residuales

### Cambios esperados
- código más coherente con `service_orders`
- menos confusión conceptual para futuras implementaciones

### Restricciones
- no hacer una campaña masiva de renombres sin valor operativo

### Validación
- build verde
- barrido de naming legacy más acotado

---

## S5-T3 — Actualizar deuda y estado final del producto

### Objetivo
Dejar documentación alineada con el estado real después de ejecutar la ola.

### Descripción
El subagente debe actualizar la deuda y el estado actual del producto para reflejar exactamente qué se cerró, qué quedó pendiente y cuál sería el siguiente frente si se continuara.

### Archivos foco
- `docs/implementation/current-implementation-debt.md`
- `docs/getting-started/current-status.md`
- referencias documentales relacionadas

### Cambios esperados
- deuda y estado final coherentes con el código real

### Restricciones
- no reescribir toda la documentación del proyecto

### Validación
- referencias cruzadas consistentes

---

## S5-T4 — Preparar el PR final del bloque

### Objetivo
Dejar el branch listo para revisión sin reconstrucción manual de contexto.

### Descripción
El subagente debe revisar el diff global y preparar un resumen estructurado de cambios, validaciones y deuda remanente, de modo que otra persona pueda revisar el cierre de la ola con contexto suficiente.

### Archivos foco
- diff completo del branch
- docs de implementación y deuda

### Cambios esperados
- branch explicable
- relato de cierre claro

### Restricciones
- no seguir metiendo cambios funcionales salvo fix menor de último momento

### Validación
- builds verdes
- resumen final consistente con el estado real del árbol

---

# Orden obligatorio de delegación
1. S1-T1
2. S1-T2
3. S1-T3
4. S1-T4
5. S1-T5
6. S2-T1
7. S2-T2
8. S2-T3
9. S2-T4
10. S2-T5
11. S3-T1
12. S3-T2
13. S3-T3
14. S3-T4
15. S4-T1
16. S4-T2
17. S4-T3
18. S4-T4
19. S5-T1
20. S5-T2
21. S5-T3
22. S5-T4

# Nota final
Este documento no reemplaza el plan vigente ni el documento de sprints. Los aterriza a unidades atómicas delegables para subagentes de implementación.