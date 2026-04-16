# Proceso operativo del sistema

## Objetivo

Definir el flujo de negocio canónico del sistema, incluyendo variantes por tipo de servicio y puntos donde la IA puede asistir sin sustituir el control humano.

---

## 1. Flujo macro del negocio

Existen dos macroflujos principales.

### Flujo A: servicios que requieren cotización

1. creación de cotización
2. revisión por supervisor
3. resultado de revisión:
   - aprobada
   - rechazada
   - editada
4. entrega al cliente o envío automático
5. respuesta del cliente por enlace seguro:
   - aprobar
   - rechazar
   - pedir cambios
6. si el cliente aprueba:
   - se activa contrato o servicio correspondiente
   - se generan los agendamientos periódicos de forma inmediata cuando aplique
7. programación operativa
8. ejecución presencial
9. diligenciamiento del reporte por operador
10. revisión del reporte por supervisor
11. cierre operativo

### Flujo B: servicios que no requieren cotización

Aplica especialmente a emergencias o ciertos servicios operativos.

1. creación directa del servicio
2. programación o asignación inmediata
3. ejecución presencial
4. diligenciamiento del reporte por operador
5. revisión del reporte por supervisor
6. cierre operativo

---

## 2. Flujo de programación de servicios

## 2.1 Creación

Un servicio puede crearse como:

- evento único
- evento repetitivo
- evento de emergencia

Cada servicio debe incluir como mínimo:

- tipo de evento
- tipo de servicio
- fecha
- hora
- duración
- edificio
- detalles del servicio
- operador principal o estado pendiente de asignación
- acompañantes, si aplica

## 2.2 Tipología base

Tipos de servicio mencionados inicialmente:

- servicios contratados periódicos
- servicios de emergencia
- operativos
- inspección
- otros

El sistema debe ser extensible para soportar nuevos tipos sin rediseño estructural.

## 2.3 Reglas de programación

- solo usuarios con rol `programador` pueden programar servicios
- el rol `admin` hereda este permiso automáticamente
- un servicio puede quedar inicialmente sin operador asignado
- los servicios sin operador asignado deben quedar visibles como pendientes de asignar
- un servicio puede tener operador principal y acompañantes
- un servicio puede durar horas o días
- un servicio puede reprogramarse
- debe existir detección visual de conflictos

## 2.4 Colisiones

Colisión confirmada actual:

- mismo operador asignado en dos servicios en el mismo rango de tiempo

Comportamiento esperado:

- advertir conflicto
- impedir mantener esa combinación inválida
- permitir resolver mediante cambio de operador o cambio de horario

## 2.5 Emergencias

Los eventos de emergencia:

- pueden romper la agenda existente
- requieren reglas especiales de priorización
- pueden exigir reasignación o desplazamiento de otros servicios
- no requieren justificación obligatoria
- deben permitir un campo opcional de texto para contexto

Cuando una emergencia desplaza un servicio:

- el servicio desplazado queda pendiente de reprogramación
- debe generarse un aviso para confirmación humana por parte del programador

Pendiente por definir:

- si deben quedar marcados como sobrescritura operativa crítica

## 2.6 Recurrencia

Reglas requeridas:

- semanal
- quincenal
- mensual
- bimensual
- trimestral
- cada X días
- fin por fecha
- fin por número de ocurrencias
- exclusión manual de fechas

Regla empresarial:

- si una ocurrencia cae en festivo o día no laboral, debe moverse al siguiente día hábil
- festivos y días no laborales aplican globalmente a toda la empresa

## 2.7 Vistas por rol

### Operador

- vista diaria

### Supervisor

- dashboard operativo
- vista mensual
- tablero por operador
- agenda tipo calendario

### Cliente

- lista de agenda

## 2.8 Interacción y visualización de agenda

La agenda debe soportar:

- drag and drop
- resize visual de duración
- apertura de detalle en panel lateral
- múltiples puntos de entrada al flujo de programación según contexto

Regla visual principal:

- el color principal del evento representa el grupo de asignación

Los grupos de asignación:

- se gestionan por edificio
- agrupan por cercanía geográfica
- buscan optimizar rutas

---

## 3. Flujo de ejecución y reporte

## 3.1 Ejecución

Una vez el operador realiza el servicio presencialmente, debe completar el reporte técnico.

## 3.2 Estructura general del reporte

El reporte debe soportar:

- checklist técnico fijo en esta etapa
- evaluación por bomba asociada
- secciones con presencia sí/no
- secciones con estado técnico buena, regular, mala
- observaciones estructuradas
- observaciones libres
- adjuntos fotográficos
- firma del operador
- geolocalización al cierre
- guardado en borrador

## 3.3 Componentes técnicos evaluados por bomba

Incluyen, entre otros:

- red de distribución
- alternador contactos auxiliares
- alternador de logo
- anclaje base estructural
- cargador automático aire
- contactor
- guardamotor
- lámpara de señalización
- manómetros
- membrana
- diafragma
- trasductor
- organización cableado en tanque
- presostatos
- regulador de nivel
- relé bilimetálico
- rodamientos
- selector
- sello mecánico
- tanque hidroacumulador
- temporizador
- terminales bornera motor
- tornillería base motor
- variador
- voltaje

Calificación:

- buena
- regular
- mala

## 3.4 Componentes generales con calificación

- bornera de control
- bornera de fuerza
- breaker totalizador
- coraza cableado control
- coraza cableado motores
- tablero de control

Calificación:

- buena
- regular
- mala

## 3.5 Componentes con presencia y estado

- válvula flotadora
- alarma
- equipo
- demarcación de registros
- instalación hidráulica
- instrucciones de manejo
- pintura

Reglas:

- primero debe registrarse presencia sí/no
- si la presencia es sí, se habilita estado
- el estado se califica como buena, regular o mala
- válvula flotadora también requiere diámetro
- debe permitir diámetro estándar y valor manual `otro`

## 3.6 Evidencia y cierre

- mínimo una foto por reporte
- las fotos pueden etiquetarse opcionalmente por componente, bomba o como evidencia general
- el reporte puede guardarse como borrador
- al cierre se exige firma manuscrita del operador
- al cierre se exige geolocalización
- si la geolocalización falla, se permite cierre con justificación auditada
- cuando un componente queda en estado `mala`, debe existir observación obligatoria
- tras el diligenciamiento, el reporte pasa a revisión del supervisor

---

## 4. Flujo de cotización

## 4.1 Creación

La cotización se genera desde UI por usuarios autorizados. No puede ser creada por operadores ni clientes.

## 4.2 Estados base refinados

- borrador
- generado
- en_revision_supervisor
- rechazado_interno
- aprobado_interno
- listo_para_entrega
- entregado_al_cliente
- en_revision_cliente
- cambios_solicitados_por_cliente
- aprobado_por_cliente
- rechazado_por_cliente

## 4.3 Revisión de supervisor

El supervisor puede:

- aprobar
- rechazar
- editar

Si edita:

- debe quedar auditoría completa
- debe registrarse qué cambió
- quién cambió
- cuándo cambió
- motivo obligatorio
- versión incremental obligatoria

## 4.4 Interacción del cliente

El cliente interactúa desde enlace seguro y puede:

- aprobar
- rechazar
- pedir cambios
- dejar comentario libre

Reglas adicionales:

- el enlace seguro debe expirar
- la expiración debe ser configurable a nivel del sistema
- el valor por defecto inicial será 15 días hábiles
- si el cliente rechaza, la cotización vuelve a revisión interna y se genera nueva versión editable

## 4.5 Activación operativa

Cuando la cotización es aprobada:

- se generan inmediatamente los agendamientos periódicos cuando corresponda
- si existe fecha de inicio futura específica, los servicios solo pueden programarse a partir de esa fecha

La generación inmediata debe estar protegida con validación fuerte de:

- reglas de recurrencia
- festivos
- días no laborales
- colisiones de agenda
- fecha mínima de inicio

Reglas finas adicionales:

- si una recurrencia cae varias veces en festivos seguidos, siempre se mueve al siguiente día hábil
- si el corrimiento genera colisión, debe buscarse automáticamente el siguiente horario libre

---

## 5. Rol de la IA en el proceso

La IA no sustituye decisiones de negocio ni autorizaciones.

## 5.1 IA como asistente de calidad

Usos confirmados:

- corregir gramática de observaciones
- reescribir para mayor claridad técnica
- resumir hallazgos
- detectar inconsistencias entre calificaciones y observaciones
- sugerir alertas o mantenimiento
- sugerir prioridad o riesgo del hallazgo
- proponer reprogramaciones
- detectar choques de agenda
- generar borradores de cotización
- redactar correos o PDFs para cliente

## 5.2 Principio operativo

La IA opera como copiloto controlado:

- asistencia automática en tareas de redacción o enriquecimiento de bajo riesgo
- sugerencia en tareas operativas o analíticas
- confirmación humana obligatoria en acciones sensibles o con impacto externo

Autoaplicación permitida en esta fase:

- corrección gramatical
- normalización menor de texto
- resumen preliminar interno

Siempre con confirmación humana:

- reescritura técnica
- prioridad o riesgo
- alertas de mantenimiento
- reprogramaciones
- borradores de cotización listos para revisión
- redacción al cliente

Prohibido para autoejecución IA:

- aprobar cotización
- enviar al cliente
- cerrar reporte
- cerrar servicio
- cambiar calificaciones técnicas
- reasignar operador

## 5.3 Trazabilidad

Toda intervención de IA debe permitir registrar:

- contexto de entrada relevante
- sugerencia generada
- usuario que aceptó, rechazó o editó
- resultado final guardado
- momento de ejecución

---

## 6. Reglas de notificación iniciales

Las notificaciones iniciales serán solo dentro del sistema.

Deben dispararse en estos eventos:

- asignación
- reprogramación
- cancelación
- emergencia
- cierre de reporte
- reporte devuelto
- cotización aprobada

Regla temporal:

- solo debe notificarse automáticamente cuando el servicio fue cambiado el día anterior o el mismo día en que debía ejecutarse

Destinatarios:

- operador principal
- acompañantes
- supervisor
- programador
- cliente

Canales internos de UX:

- inbox interno
- centro de notificaciones con historial
- badge
- labels para clasificación

Comportamiento adicional:

- las notificaciones se marcan automáticamente como leídas al abrir el objeto relacionado
- deben existir niveles de prioridad
- las emergencias deben generar notificación crítica destacada

## 7. Puntos críticos pendientes

1. detalle fino de reglas de visibilidad por rol en cada estado
2. diseño exacto del flujo de devolución de reporte dentro de la UI
3. modelado exacto del grupo de asignación y su historial
4. política tenant-aware para plantillas de reporte
5. nivel de exposición futura de salidas IA hacia cliente