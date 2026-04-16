# Plan de producto y hardening de implementación IA

## Estado

Documento de planificación inicial para definir:

- proceso operativo del sistema
- alcance funcional por fases
- reglas de roles y permisos
- modelo de estados
- uso controlado de IA
- decisiones abiertas que deben cerrarse antes de implementación detallada

## Objetivo del producto

Prioridad de valor definida:

1. ordenar la operación
2. asegurar la calidad técnica
3. mejorar la experiencia del cliente
4. acelerar la cotización y contratación
5. mejorar la trazabilidad

## KPIs prioritarios

Orden de prioridad confirmado:

1. menos errores operativos
2. más velocidad de programación
3. mejor calidad de reportes
4. más cumplimiento de servicios
5. más conversión de cotización a contrato

## Estructura documental

- `README.md`: visión general del plan
- `proceso-operativo.md`: flujo de negocio end-to-end
- `roles-y-permisos.md`: alcance por actor
- `modelo-de-estados.md`: estados y transiciones
- `ia-en-el-sistema.md`: usos permitidos de IA y guardrails
- `epicas-y-features.md`: backlog estructurado de producto
- `ux-y-validaciones.md`: decisiones finas de UX, datos y reglas
- `preguntas-abiertas.md`: definiciones pendientes

## Principios de diseño

### Operación primero

El sistema debe priorizar control operativo, visibilidad y reducción de errores antes que sofisticación superficial.

### IA con supervisión y trazabilidad

La IA debe operar en nivel 3 controlado:

- puede sugerir
- puede autopreparar borradores o mejoras en ciertos casos
- debe requerir confirmación humana en acciones sensibles
- toda intervención debe ser auditable

### Premium UX con disciplina operativa

La experiencia debe sentirse moderna y fluida, pero sin sacrificar:

- claridad
- validaciones
- auditabilidad
- control por rol
- previsibilidad del flujo

### Paso a paso

La programación y captura de información deben dividirse en pasos cortos, con máximo dos acciones principales por pantalla o modal cuando sea posible.

## Alcance por fases

### Fase 1

Sistema de programación de servicios:

- eventos únicos
- eventos repetitivos
- eventos de emergencia
- asignación de operador principal y acompañantes
- detección visual de conflictos
- reprogramación
- vistas por rol
- control por permisos

### Fase 2

Sistema de reportes de servicio:

- checklist técnico estructurado
- evaluación por bomba
- observaciones estructuradas y libres
- fotos obligatorias
- firma y geolocalización
- borradores
- asistencia IA para calidad del reporte

### Fase 3

Acople del resto del sistema:

- carga inicial por CSV
- flujo completo de cotización
- revisión y versionado
- aprobación por enlace seguro
- activación de programación posterior a aprobación
- integración de contratos, edificios y clientes

## Decisiones ya confirmadas

- un usuario puede tener múltiples roles
- admin hereda todos los permisos
- existe un nuevo rol `comercial` para creación de cotizaciones
- supervisor revisa cotizaciones, no programa
- cliente puede ver agenda, aprobar cotizaciones y ver reportes
- hay casos de emergencia que no requieren cotización
- el reporte del operador debe pasar por revisión de supervisor
- deben existir estados formales del servicio
- la agenda necesita múltiples vistas según rol
- puede haber servicios sin operador asignado
- una colisión se define por operador asignado en el mismo tiempo
- las emergencias pueden romper agenda existente
- cuando una emergencia desplaza un servicio, este queda pendiente de reprogramación con aviso para confirmación humana del programador
- las emergencias no requieren justificación obligatoria, pero sí campo opcional de texto
- acompañantes también validan conflicto horario
- si una recurrencia cae en día no hábil o festivo, debe moverse al siguiente día hábil
- en esta etapa los ítems del reporte son fijos
- la calificación técnica por componente es por bomba asociada
- fotos mínimas: 1
- el reporte permite borrador
- el cierre del reporte requiere firma manuscrita y geolocalización
- si falla la geolocalización, se permite cierre con justificación
- cuando un componente queda en estado `mala`, la observación es obligatoria
- la IA debe tener trazabilidad completa
- las cotizaciones serán aprobadas por enlace seguro
- el enlace seguro expira y debe ser configurable a nivel de sistema, con valor por defecto de 15 días hábiles
- las cotizaciones se versionan con diff auditable y motivo obligatorio
- el rechazo del cliente devuelve la cotización a revisión interna y genera una nueva versión editable
- la generación de agendamientos periódicos ocurre inmediatamente al aprobar la cotización
- la carga inicial por CSV será por UI
- las notificaciones iniciales serán solo dentro del sistema
- solo debe notificarse automáticamente cuando el servicio cambie el día anterior o el mismo día de ejecución

## Riesgos de diseño detectados

1. la generación inmediata de servicios periódicos al aprobar cotización puede producir errores si no existe una capa fuerte de validación previa.
2. el uso de IA en reprogramación y cotización debe acotarse con reglas explícitas para evitar automatismos riesgosos.
3. el modelo del reporte combina presencia, estado, evidencia, observación y evaluación por bomba, por lo que requiere un diseño de datos claro desde antes de construir UI.
4. el flujo de notificaciones depende de contexto temporal y debe resolverse con reglas de negocio explícitas para evitar ruido.
5. la introducción del rol `comercial` obliga a cerrar bien el alcance de creación, edición y visibilidad de cotizaciones.

## Recomendación base

La V2 del plan ya queda con base estructural sólida y con un primer nivel de definición fina para UX, datos y validaciones.

Quedan pendientes principalmente decisiones de detalle incremental, no vacíos estructurales del producto.

## Siguiente paso

Convertir este plan en historias técnicas, criterios de aceptación y secuencia de implementación.