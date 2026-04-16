# UX, datos y validaciones finas

## Objetivo

Consolidar decisiones de experiencia, estructura de datos visible y reglas finas de validación para llevar el plan desde una definición funcional sólida hacia una especificación de producto más ejecutable.

---

## 1. Agenda y experiencia visual

## 1.1 Interacción del calendario

La agenda debe soportar:

- drag and drop para mover servicios
- resize visual del bloque para cambiar duración
- apertura de detalle en panel lateral

## 1.2 Flujos de creación permitidos

Se aceptan múltiples caminos de entrada a la programación, dependiendo del contexto desde el que ingrese el usuario:

- tipo de servicio → fecha/hora → asignación → confirmación
- fecha/hora → tipo → edificio → asignación → confirmación
- edificio → tipo → edificio → fecha/hora → asignación → confirmación

Criterio de producto:

- el sistema debe permitir distintos puntos de entrada
- el flujo siempre debe converger a una confirmación final clara
- debe mantenerse la regla de máximo dos acciones principales por pantalla o panel cuando aplique

## 1.3 Sistema visual de color

La codificación de color será combinada.

Regla principal:

- el color principal representa el grupo de asignación

Reglas complementarias:

- el grupo de asignación es una entidad propia con nombre, color, edificios y reglas
- el grupo de asignación se gestiona por edificio
- los grupos de asignación existen para agrupar por cercanía geográfica
- su objetivo es optimizar rutas y operación
- el cambio de grupo aplica de forma inmediata
- puede ser editado por `admin` y `supervisor`
- el cálculo automático basado en dirección y rutas solo sugiere grupo, no asigna automáticamente

Implicación de diseño:

- tipo de servicio y estado no deben competir con el color principal
- conviene representarlos con badges, iconos o indicadores secundarios

---

## 2. Reprogramación y control operativo

## 2.1 Historial obligatorio

Toda reprogramación debe guardar:

- fecha anterior
- fecha nueva
- usuario que realizó el cambio
- motivo del cambio
- tipo de reprogramación

## 2.2 Motivo obligatorio

El motivo de reprogramación es obligatorio.

## 2.3 Tipos de reprogramación

Deben diferenciarse al menos:

- reprogramación operativa normal
- reprogramación por emergencia
- reprogramación por solicitud del cliente

## 2.4 Restricciones operativas

- no se definen restricciones extra por cercanía temporal en esta etapa
- el operador solo recibe asignaciones, no las rechaza
- en servicios largos debe existir avance diario
- el servicio largo puede cerrarse aunque falten avances de uno o más días
- el reporte final consolida automáticamente los avances diarios

---

## 3. Datos maestros visibles

## 3.1 Ficha de edificio

Cada edificio debe tener una ficha propia con al menos:

- administración
- dirección
- teléfono
- persona de contacto
- contrato activo
- equipos
- bombas
- historial de servicios
- documentos

## 3.2 Bombas

En esta etapa las bombas no se modelan como entidad maestra persistente separada.

Regla actual:

- se manejan como dato dentro del reporte
- su identificación visible será simple: `bomba 1`, `bomba 2`, etc.

## 3.3 Tipos de servicio

La creación de nuevos tipos de servicio queda restringida a:

- solo `admin`

---

## 4. Reporte técnico, estructura fina

## 4.1 Observaciones estructuradas

El sistema debe soportar campos separados para:

- hallazgo
- impacto
- acción recomendada
- prioridad

## 4.2 Vinculación de observaciones

Cada observación estructurada puede vincularse a:

- componente
- evidencia fotográfica

## 4.3 Hallazgos críticos

Si hay varios ítems en estado `mala`, el sistema debe generar automáticamente una sección de hallazgos críticos.

## 4.4 Reglas actuales

- `regular` no requiere observación obligatoria en esta etapa
- más adelante se quieren plantillas distintas de reporte según tipo de servicio
- la variabilidad de plantillas depende del tenant
- cada tenant podrá activar o desactivar campos, escoger plantilla por tipo de servicio, definir campos obligatorios y definir bloques propios
- la configuración será administrada por el admin del tenant
- se desea editor visual de plantillas

---

## 5. Fotos y evidencia

## 5.1 Captura y carga

El sistema debe permitir:

- compresión automática de fotos en móvil
- tomar foto desde cámara
- subir archivo existente

## 5.2 Reglas mínimas

- debe existir al menos una foto general
- no basta cualquier foto sin contexto general

## 5.3 Gestión de galería

Las fotos deben poder:

- ordenarse
- marcar una como principal

## 5.4 Evolución prevista

- video no entra en esta fase
- video queda contemplado como evolución futura

---

## 6. Cliente y portal seguro

## 6.1 Alcance del enlace seguro

El enlace seguro del cliente mostrará solo la cotización.

No mostrará en esta fase:

- resumen del servicio
- edificio
- fechas tentativas
- historial de versiones

## 6.2 Interacción del cliente

El cliente podrá:

- aprobar la cotización completa
- rechazar
- pedir cambios mediante caja de texto libre
- descargar PDF mientras el enlace siga vigente
- descargar también el reporte completo en PDF

Reglas adicionales:

- si el enlace vence, el cliente debe pedir un nuevo enlace al comercial
- cuando se reenvíe un enlace, el anterior debe invalidarse
- el reenvío genera token nuevo sobre la misma versión

## 6.3 Lenguaje de interfaz

El portal del cliente debe usar lenguaje comercial, no lenguaje interno operacional.

## 6.4 Visibilidad cliente

En agenda, el cliente debe ver:

- fecha
- hora
- tipo de servicio
- estado
- observaciones resumidas

En reportes, el cliente debe ver:

- versión resumida con opción de ver el reporte completo
- hallazgos críticos destacados

Reglas adicionales:

- la versión resumida puede ser generada automáticamente y editable por supervisor
- el lenguaje de hallazgos críticos puede ser técnico o comercial según tenant
---

## 7. IA y validaciones finas

## 7.1 Inconsistencias en reportes

Cuando la IA detecta inconsistencias:

- debe sugerir
- debe advertir
- debe permitir continuar

No debe bloquear el cierre automáticamente en esta fase.

## 7.2 Reportes con múltiples estados `mala`

La IA debe:

- generar resumen automático
- sugerir criticidad
- sugerir mantenimiento

## 7.3 Ayuda de redacción contextual

Cuando el operador marque algo como `mala`, la IA puede sugerir texto base de observación.

## 7.4 Agenda inteligente

La IA debe proponer:

- varias alternativas de horario

No hace falta exponer nivel de confianza en UI en esta fase.

---

## 8. Reglas de negocio finas

## 8.1 Festivos consecutivos

Si una recurrencia cae varias veces en festivos seguidos:

- siempre se mueve al siguiente día hábil

## 8.2 Colisión posterior al corrimiento

Si una recurrencia movida al siguiente día hábil colisiona:

- debe buscar el siguiente horario libre automáticamente

## 8.3 Historial y borrado

- los servicios cancelados deben seguir visibles en historial
- el sistema debe trabajar con soft delete
- no debe haber borrado real para servicios, reportes ni cotizaciones en operación normal

## 8.4 Auditoría

La auditoría completa debe ser visible en UI.

Esto incluye, idealmente:

- cambios de programación
- cambios de cotización
- devoluciones de reporte
- intervenciones IA
- estados y transiciones relevantes

Regla de acceso:

- solo `admin` y usuarios con rol `auditoria`

Patrón de visualización recomendado:

- combinación de pestaña secundaria
- timeline lateral
- vista completa de historial según el contexto
---

## 9. Implicaciones de diseño

1. el calendario necesitará capas visuales múltiples: color principal por grupo de asignación y señales secundarias por tipo o estado.
2. la ficha de edificio pasa a ser un nodo central del sistema.
3. aunque las bombas hoy viven dentro del reporte, la ficha de edificio ya anticipa una futura relación más estructurada.
4. el sistema de auditoría debe diseñarse como capacidad transversal, no como parche por módulo.
5. la IA queda bien posicionada como asistente fuerte, pero no como autoridad de bloqueo o decisión final.