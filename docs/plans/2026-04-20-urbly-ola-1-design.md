# Urbly Ola 1 — Design Doc

## 1. Objetivo

Cerrar la deuda principal de Urbly v2 y completar una experiencia mínima coherente por actor, sin intentar empujar todavía toda la visión final del producto.

Esta ola debe dejar el sistema en un estado donde:
- `serviceOrder` sea el núcleo operativo real
- el flujo principal ya no dependa conceptualmente de `appointment`
- el core de servicios esté separado del legacy más pesado
- empresa, técnico y cliente tengan una experiencia mínima usable
- CI/CD permita iterar con confianza

---

## 2. Alcance aprobado

### Entra en esta ola
- foundations mínimas de CI/CD
- consolidación de dominio `serviceOrder`
- extracción final del core operativo desde el flujo legacy
- experiencia mínima coherente por actor
- cierre de deuda operativa más visible

### No entra todavía
- rediseño visual premium completo
- IA avanzada con telemetría profunda
- portal cliente full vision
- expansión grande de módulos periféricos
- reescritura total de datos legacy en una sola pasada

---

## 3. Decisión de diseño

La estrategia será **balanced slice**:
1. foundations mínimas
2. consolidación del dominio y compatibilidad
3. core operativo usable
4. experiencia mínima por actor

Esto evita dos errores:
- construir más producto sobre una base frágil
- caer en semanas de trabajo interno sin avance visible

---

## 4. Resultado esperado

Al cerrar esta ola:
- el repo valida mejor en CI
- `serviceOrder` domina el flujo operativo
- `SchedulingPage` deja de ser el centro real del negocio
- la navegación v2 queda más coherente
- empresa, técnico y cliente pueden operar una versión mínima creíble de Urbly v2
- las funciones clave de cada actor cubiertas en la ola pueden ejecutarse realmente desde la UI

---

## 5. Fases de trabajo

## Fase A — Foundations mínimas
Objetivo: reducir riesgo técnico inmediato.

### Incluye
- auditar workflows actuales
- asegurar instalación y build de web + functions en los flujos correctos
- definir checks mínimos requeridos
- documentar secretos y supuestos críticos
- agregar smoke checks ligeros donde tenga sentido

### Criterio de done
- CI valida web y functions de forma consistente
- preview/deploy no dependen de supuestos ocultos
- la documentación operativa del pipeline queda clara

---

## Fase B — Consolidación del dominio
Objetivo: hacer que `serviceOrder` sea la entidad primaria real.

### Incluye
- identificar rutas aún dependientes de `appointment`
- formalizar adapter legacy → canónico
- centralizar mapeo y compatibilidad temporal
- definir estrategia de eliminación progresiva del fallback legacy
- alinear queries, mutaciones y presentación con `serviceOrder`

### Criterio de done
- el flujo principal usa `serviceOrder` como contrato primario
- el legacy queda encapsulado y explícito
- la deuda de compatibilidad queda reducida y localizada

---

## Fase C — Core operativo usable
Objetivo: terminar de sacar peso del legacy operativo.

### Incluye
- revisar responsabilidades residuales de scheduling legacy
- extraer o eliminar dependencias innecesarias
- consolidar agenda, detalle y cierre como flujo principal
- asegurar que servicios sea el punto central de operación
- limpiar adapters, selectors y acciones duplicadas

### Criterio de done
- el flujo de servicios puede evolucionar sin depender de `SchedulingPage`
- detalle y cierre viven en módulos dedicados con responsabilidades claras

---

## Fase D — Experiencia mínima por actor
Objetivo: cerrar una primera experiencia usable para empresa, técnico y cliente.

### Empresa
- home operativa clara
- navegación coherente
- acceso claro a servicios, reportes y operación

### Técnico
- home útil para trabajo diario
- lista mínima de servicios propios
- acceso simple a detalle y cierre

### Cliente
- resumen claro
- acceso a servicios e informes
- mejor jerarquía de estado actual

### Criterio de done
- cada actor tiene una experiencia mínima coherente
- cada función clave de cada actor incluida en esta ola puede ejecutarse realmente desde la UI
- no todo está completo, pero ya se siente como producto y no como mezcla de módulos

---

## 6. Riesgos

### Riesgo 1
Scope creep hacia visión v2 completa.

Mitigación:
- bloquear trabajo fuera de esta ola
- priorizar mínimo usable por actor

### Riesgo 2
Romper compatibilidad entre `appointment` y `serviceOrder`.

Mitigación:
- mantener adapter explícito
- migrar por capas
- verificar build y rutas críticas en cada bloque

### Riesgo 3
Resolver UI visible sin cerrar deuda estructural.

Mitigación:
- ejecutar en orden por fases
- no saltar foundations ni dominio

---

## 7. Recomendación de ejecución

La implementación debe ejecutarse con subagentes por bloques pequeños, con validación al final de cada tarea.

Cada tarea debe:
- tener alcance acotado
- tocar pocos archivos
- incluir verificación explícita
- dejar el repo en estado verde antes de seguir

---

## 8. Siguiente paso

Traducir este diseño a un plan técnico ejecutable por tareas de 2 a 5 minutos, agrupadas por bloque, para ejecución secuencial con subagentes.
