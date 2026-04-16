# Modelo de estados

## Objetivo

Proponer una base de estados y transiciones para servicios, reportes y cotizaciones.

---

## 1. Estados de servicio

El usuario confirmó que deben existir estados formales y que, tras diligenciar el reporte, el servicio llega al menos a `ejecutado`.

Sin embargo, si el reporte requiere revisión por supervisor, `ejecutado` no debería ser el último estado operativo.

## Propuesta V1 confirmada

- `pendiente_de_asignacion`
- `programado`
- `reprogramado`
- `en_curso`
- `ejecutado`
- `reportado`
- `en_revision`
- `cerrado`
- `con_novedad`
- `cancelado`

## Semántica sugerida

### pendiente_de_asignacion
Servicio creado sin operador principal asignado.

### programado
Servicio calendarizado correctamente con operador principal.

### reprogramado
Servicio modificado en fecha, hora o duración luego de haber sido programado.

### en_curso
Servicio marcado como iniciado en terreno o en ventana activa de ejecución.

### ejecutado
La ejecución presencial ocurrió.

### reportado
El operador terminó de diligenciar y cerrar el reporte.

### en_revision
El reporte está siendo revisado por supervisor.

### cerrado
El servicio y su reporte quedaron aprobados operativamente.

### con_novedad
Se detectó hallazgo, inconsistencia, incidente o necesidad de acción adicional.

### cancelado
El servicio no se ejecutará.

## Recomendación

Separar claramente `ejecutado`, `reportado` y `cerrado`.

---

## 2. Estados del reporte de servicio

## Propuesta V1 confirmada

- `borrador`
- `completado_por_operador`
- `en_revision_supervisor`
- `devuelto_para_ajustes`
- `aprobado`

## Semántica sugerida

### borrador
El operador ha iniciado el reporte, pero no lo ha cerrado.

### completado_por_operador
El reporte fue enviado con firma, geolocalización y evidencia mínima.

### en_revision_supervisor
El supervisor está revisando el contenido.

### devuelto_para_ajustes
El reporte necesita correcciones o evidencia adicional.

### aprobado
El reporte queda validado y puede considerarse parte del cierre del servicio.

## Recomendación

Permitir devolución del reporte. Evita aprobar información deficiente o incompleta por diseño.

---

## 3. Estados de cotización

Estados nombrados por el usuario:

- `generado`
- `revisado`
- `entregado`
- `aprobado`

## Problema detectado

`entregado` tiene doble significado actual:

- ya fue enviado automáticamente al cliente
- o ya quedó listo para ser enviado

Eso puede romper reporting, automatización y auditoría.

## Propuesta V1 confirmada

- `borrador`
- `generado`
- `en_revision_supervisor`
- `rechazado_interno`
- `aprobado_interno`
- `listo_para_entrega`
- `entregado_al_cliente`
- `en_revision_cliente`
- `cambios_solicitados_por_cliente`
- `aprobado_por_cliente`
- `rechazado_por_cliente`
- `vencido`
- `anulado`

## Recomendación fuerte

No usar `revisado` como estado final único. Es demasiado ambiguo.

Es mejor separar:

- revisión en curso
- aprobado internamente
- rechazado internamente

Y separar también:

- listo para entregar
- efectivamente entregado

## Versionado

Cada edición aprobada debe crear nueva versión:

- v1
- v2
- v3

Cada versión debe guardar:

- autor
- fecha
- motivo de cambio
- diff de campos

---

## 4. Estado de generación de recurrencias

Como la aprobación de cotización genera servicios periódicos inmediatamente, conviene modelar también el resultado de esa generación.

## Propuesta V1

- `pendiente_generacion`
- `generado_exitosamente`
- `generado_con_alertas`
- `fallido`

## Utilidad

Esto permite:

- detectar errores de reglas
- registrar conflictos evitados
- informar al usuario si hubo reubicaciones por día no hábil
- soportar intervención manual posterior

---

## 5. Estado de sugerencias IA

Dado que habrá trazabilidad completa, conviene modelar el ciclo de vida de las sugerencias IA.

## Propuesta V1

- `generada`
- `aplicada_automáticamente`
- `pendiente_confirmacion`
- `aceptada_por_usuario`
- `editada_por_usuario`
- `rechazada_por_usuario`
- `expirada`

## Recomendación

No mezclar el estado del negocio con el estado de la sugerencia IA. Son capas distintas.

---

## Decisiones ya cerradas

1. el supervisor puede devolver reportes para ajuste
2. cuando el supervisor encuentra problemas relevantes, el servicio puede pasar a `con_novedad`
3. una cotización rechazada por cliente vuelve a revisión interna y genera nueva versión editable

## Pendientes finos

1. ¿el operador puede marcar `en_curso` manualmente?
2. ¿qué condiciones exactas llevan un servicio a `con_novedad` y cuáles solo a devolución de reporte?
3. ¿qué SLA o tiempos aplican a revisión interna y revisión de reportes?
4. ¿cómo debe comportarse el estado `vencido` del enlace/cotización frente a reenvío o renovación?