# Épicas y features

## Objetivo

Traducir el proceso definido en un backlog de producto claro, secuenciable y orientado a valor.

---

# Fase 1. Programación de servicios

## Épica 1. Calendario operativo multirol

### Resultado esperado

El sistema permite programar, visualizar y gestionar servicios desde distintas vistas según el rol, con experiencia premium y control operativo.

### Features

#### F1.1 Vistas de agenda por rol
- vista diaria para operador
- dashboard operativo para supervisor
- vista mensual
- calendario general
- tablero por operador
- lista de agenda para cliente
- apertura de detalle en panel lateral

#### F1.2 Creación de eventos
- crear evento único
- crear evento repetitivo
- crear evento de emergencia
- tipificar el evento
- permitir servicios sin operador asignado

#### F1.3 Asignación operativa
- asignar operador principal
- asignar acompañantes
- visualizar pendientes de asignar
- reasignar operador

#### F1.4 Gestión temporal
- definir fecha, hora y duración
- soportar servicios de varias horas o varios días
- reprogramar fecha u hora
- resize de duración

#### F1.5 Recurrencias empresariales
- semanal
- quincenal
- mensual
- bimensual
- trimestral
- cada X días
- fin por fecha
- fin por número de ocurrencias
- exclusión manual de fechas
- mover al siguiente día hábil si cae en festivo o día no laboral

#### F1.6 Validaciones y conflictos
- detectar colisión por operador
- impedir programación inválida
- proponer resolución por cambio de hora u operador
- marcar conflictos visualmente
- destacar servicios de emergencia
- validar conflicto también para acompañantes

#### F1.7 Gestión de emergencias
- permitir romper agenda existente
- mover servicios desplazados a pendiente de reprogramación
- generar aviso para confirmación humana del programador
- permitir texto opcional de contexto

#### F1.8 UX premium guiada
- flujo paso a paso
- máximo dos acciones principales por pantalla o modal
- transiciones limpias y orientadas
- creación y edición rápida sin perder contexto
- soportar múltiples puntos de entrada al flujo de programación
- drag and drop para mover eventos
- resize visual para duración

#### F1.9 Grupos de asignación y optimización visual
- color principal por grupo de asignación
- gestión de grupos por edificio
- agrupación por cercanía geográfica
- soporte para optimización de rutas

---

## Épica 2. Modelo flexible de tipos de servicio

#### F1.7 UX premium guiada
- flujo paso a paso
- máximo dos acciones principales por pantalla o modal
- transiciones limpias y orientadas
- creación y edición rápida sin perder contexto

---

## Épica 2. Modelo flexible de tipos de servicio

### Resultado esperado

El sistema soporta nuevos tipos de eventos y servicios sin rediseño estructural.

### Features

#### F2.1 Catálogo de tipos de servicio
- tipos base configurables
- color e identidad visual por tipo
- comportamiento extensible

#### F2.2 Reglas por tipo
- duración sugerida
- criticidad
- elegibilidad para recurrencia
- elegibilidad para emergencia

---

# Fase 2. Reportes de servicio

## Épica 3. Captura técnica estructurada en campo

### Resultado esperado

El operador puede registrar evidencia técnica completa desde terreno con estructura, trazabilidad y calidad mínima garantizada.

### Features

#### F3.1 Reporte con borrador
- iniciar reporte
- guardar borrador
- continuar luego

#### F3.2 Componentes evaluados por bomba
- selección o determinación del número de bombas
- evaluación por bomba asociada
- calificación buena, regular o mala por componente

#### F3.3 Componentes generales
- evaluación de tablero y elementos generales
- calificación buena, regular o mala

#### F3.4 Presencia + estado
- registrar presencia sí/no
- mostrar estado solo si presencia es sí
- incluir válvula flotadora con diámetro estándar y valor manual

#### F3.5 Observaciones
- observaciones estructuradas
- observaciones libres
- espacio para hallazgos relevantes
- campos separados de hallazgo, impacto, acción recomendada y prioridad
- vinculación opcional a componente o evidencia fotográfica
- generación automática de sección de hallazgos críticos si hay varios ítems en `mala`

#### F3.6 Evidencia y cierre
- mínimo una foto
- mínimo una foto general
- etiquetado opcional por bomba, componente o general
- compresión automática de fotos en móvil
- captura directa desde cámara o subida de archivo
- ordenamiento de fotos
- foto principal
- firma manuscrita del operador
- geolocalización al cierre
- permitir cierre con justificación si falla geolocalización
- obligar observación cuando un componente esté en `mala`

---

## Épica 4. Revisión y cierre del reporte

### Resultado esperado

Los reportes no se consideran cerrados operativamente hasta pasar por una revisión controlada.

### Features

#### F4.1 Flujo de revisión supervisor
- cola de reportes por revisar
- aprobación
- observación
- devolución para ajustes

#### F4.2 Estado operativo posterior
- cambio de estado del servicio según revisión
- marcación de novedad si corresponde

#### F4.3 Auditoría del reporte
- historial de cambios
- evidencia de quién cerró
- evidencia de quién revisó

---

## Épica 5. IA para calidad técnica del reporte

### Resultado esperado

La IA mejora calidad documental y detección de inconsistencias sin reemplazar criterio técnico humano.

### Features

#### F5.1 Asistencia de redacción
- corrección gramatical
- reescritura para claridad técnica
- resumen de hallazgos

#### F5.2 Validaciones inteligentes
- detectar reporte demasiado corto
- detectar fotos insuficientes
- detectar componente malo sin observación
- detectar inconsistencias entre texto y calificación

#### F5.3 Asistencia diagnóstica
- sugerir alertas
- sugerir mantenimiento
- sugerir prioridad o riesgo

#### F5.4 Trazabilidad IA
- guardar sugerencia
- guardar aceptación, edición o rechazo
- registrar diff entre original y resultado final

---

# Fase 3. Integración comercial y operativa

## Épica 6. Carga inicial del sistema por CSV

### Resultado esperado

La operación puede poblar el sistema rápidamente a través de importaciones controladas por UI.

### Features

#### F6.1 Importaciones por CSV
- administraciones
- contratos
- edificios
- clientes/contactos
- periodicidades de servicio
- ficha enriquecida de edificio con datos operativos base

#### F6.2 Experiencia de importación
- plantillas oficiales
- validación previa
- preview
- reporte de errores

---

## Épica 7. Flujo de cotización versionado

### Resultado esperado

La cotización tiene un flujo auditable, revisable y listo para interacción formal con cliente.

### Features

#### F7.1 Creación de cotización
- creación desde UI por `admin` o `comercial`
- datos base del servicio o contrato
- estado inicial controlado

#### F7.2 Revisión interna
- aprobación por supervisor
- rechazo por supervisor
- edición por supervisor
- motivo obligatorio en cambios
- versionado incremental
- diff auditable

#### F7.3 Entrega al cliente
- generación de PDF
- envío por correo o entrega por enlace seguro
- distinción entre listo para enviar y enviado
- expiración configurable del enlace seguro, con valor por defecto de 15 días hábiles

#### F7.4 Respuesta del cliente
- aprobar
- rechazar
- pedir cambios
- comentario libre
- rechazo que devuelve a revisión interna y crea nueva versión editable

---

## Épica 8. Activación automática post-aprobación

### Resultado esperado

Cuando el cliente aprueba, el sistema activa la operación sin reprocesos manuales innecesarios.

### Features

#### F8.1 Generación inmediata de recurrencias
- crear servicios periódicos automáticamente
- respetar fecha mínima de inicio
- respetar festivos y días no laborales
- evitar colisiones obvias

#### F8.2 Alertas y excepciones
- informar generación con alertas
- registrar conflictos evitados o pendientes
- permitir intervención manual posterior
- respetar fecha mínima de inicio cuando el cliente aprueba para una fecha futura específica
- mover siempre al siguiente día hábil cuando caiga en festivo
- buscar automáticamente el siguiente horario libre si el corrimiento genera colisión

---

## Épica 9. IA para apoyo comercial y operativo

### Resultado esperado

La IA acelera la preparación de materiales y decisiones sin asumir control contractual ni operativo final.

### Features

#### F9.1 Borradores de cotización
- generación asistida de texto y estructura

#### F9.2 Comunicación al cliente
- redacción asistida de correos
- apoyo textual para PDFs
- siempre con confirmación humana antes de salida externa

#### F9.3 Agenda inteligente
- detección de sobrecarga por operador
- sugerencia de reprogramación
- detección de recurrencias mal generadas
- propuesta de varias alternativas horarias
- sin reasignación automática de operadores

---

# Dependencias estratégicas

1. cerrar modelo de estados
2. cerrar matriz final de permisos
3. definir rol creador de cotización
4. cerrar reglas de revisión de reportes
5. cerrar semántica de interacción cliente
6. cerrar límites exactos de IA por flujo

# Recomendación de implementación

Orden sugerido:

1. calendario operativo base
2. asignación y conflictos
3. recurrencias y reglas calendario
4. reporte técnico con borradores
5. revisión supervisor
6. IA en reportes
7. cotizaciones versionadas
8. aprobación cliente
9. generación automática post-aprobación
10. importación CSV