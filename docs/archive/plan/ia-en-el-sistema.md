# IA en el sistema

## Objetivo

Definir cómo la IA agrega valor real al sistema sin comprometer control operativo, auditabilidad ni calidad de datos.

---

## Principio rector

La IA debe actuar como copiloto operativo, no como autoridad final.

Nivel objetivo confirmado: **nivel 3 controlado**.

Eso significa:

- puede asistir activamente
- puede preparar acciones o borradores
- puede aplicar mejoras automáticas en casos delimitados
- requiere confirmación humana para acciones sensibles o con impacto externo
- toda intervención debe quedar auditada

---

## 1. Casos de uso confirmados

## 1.1 Reportes de servicio

La IA puede:

- corregir gramática de observaciones
- reescribir observaciones para mayor claridad técnica
- resumir hallazgos
- detectar inconsistencias entre calificaciones y observaciones
- sugerir alertas o necesidades de mantenimiento
- sugerir prioridad o riesgo del hallazgo
- detectar reporte demasiado corto
- detectar fotos insuficientes
- detectar componente marcado como malo sin observación asociada

## 1.2 Programación operativa

La IA puede:

- detectar choques de agenda
- proponer reprogramaciones
- detectar generación defectuosa de recurrencias
- detectar sobrecarga de agenda por operador

## 1.3 Cotizaciones y salida al cliente

La IA puede:

- generar borradores de cotización
- redactar correos para cliente
- preparar contenido textual para PDFs o entregables

---

## 2. Niveles de autonomía por caso

## 2.1 Autoaplicable

Solo para cambios de bajo riesgo y alta reversibilidad.

Casos confirmados:

- corrección gramatical
- normalización menor de texto
- resumen preliminar interno

## 2.2 Con confirmación humana obligatoria

Para casos con impacto operativo, contractual, externo o interpretativo.

Casos confirmados:

- reescritura técnica
- prioridad o riesgo
- alertas de mantenimiento
- reprogramaciones
- borradores de cotización listos para revisión
- redacción al cliente

## 2.3 No delegable automáticamente en esta fase

No permitir ejecución autónoma de IA en:

- aprobación de cotizaciones
- envío al cliente
- reasignación definitiva de operador
- cierre de reporte
- cierre de servicio
- cambio de calificaciones técnicas

---

## 3. Guardrails funcionales

## 3.1 Trazabilidad obligatoria

Cada acción asistida por IA debe registrar:

- módulo de origen
- objetivo de la sugerencia
- datos de entrada relevantes
- versión del prompt o política aplicada
- salida generada
- tipo de acción: sugerencia o autoaplicación
- usuario que aprobó, rechazó o editó
- fecha y hora
- resultado final persistido

## 3.2 Separación entre dato humano y dato inferido

El sistema debe distinguir claramente:

- dato ingresado por operador o usuario
- dato inferido o sugerido por IA
- dato final aceptado

Esto evita confusión en auditoría y soporte.

## 3.3 Explicabilidad útil

No hace falta exponer razonamiento interno completo, pero sí una explicación operativa útil. Ejemplos:

- “se detectó inconsistencia porque el componente está calificado como bueno pero la observación menciona fuga severa”
- “se recomienda reprogramar porque el operador ya tiene un servicio en el mismo rango horario”

## 3.4 Validación antes de automatizar

Toda automatización IA que produzca acción operativa debe pasar por reglas determinísticas antes de ejecutarse.

Ejemplo:

Una reprogramación sugerida por IA no debe aplicarse si viola:

- disponibilidad del operador
- día no hábil
- festivo
- fecha mínima de inicio contractual

---

## 4. Diseño recomendado por módulo

## 4.1 Reporte de servicio

### Patrón recomendado

- el operador escribe
- la IA sugiere mejorar
- el operador decide aplicar o no
- el sistema valida consistencia mínima
- el supervisor revisa

Reglas adicionales:

- cuando un componente esté en `mala`, la IA puede sugerir texto genérico contextual para observación
- los hallazgos críticos deben construirse con apoyo IA, no solo por regla determinística

### Beneficio

Mejora calidad del reporte sin quitar responsabilidad técnica al operador.

## 4.2 Agenda

### Patrón recomendado

- el usuario crea o modifica programación
- el sistema aplica validaciones determinísticas
- la IA sugiere alternativas si detecta conflicto u optimización posible
- el usuario confirma

Reglas adicionales:

- la IA puede sugerir grupo de asignación según dirección y rutas
- la sugerencia no asigna automáticamente

### Beneficio

La IA ayuda a resolver, no a imponer.

## 4.3 Cotizaciones

### Patrón recomendado

- el usuario inicia borrador
- la IA ayuda a estructurar o redactar
- el responsable humano revisa
- el supervisor aprueba o corrige
- el sistema entrega al cliente

Reglas adicionales:

- el resumen IA de hallazgos es solo interno
- la prioridad o riesgo sugerida por IA es solo para equipo interno
- una futura versión comercial del reporte para cliente es posible, pero no entra en esta fase

### Beneficio

Acelera redacción sin soltar control contractual.
---

## 5. Riesgos a mitigar

1. que la IA cambie significado técnico de observaciones
2. que la IA sugiera reprogramaciones inviables
3. que la IA produzca texto contractual ambiguo
4. que usuarios confundan sugerencia con dato validado
5. que no exista evidencia suficiente para justificar recomendaciones IA

---

## 6. Recomendaciones de hardening

1. mostrar siempre badge visible cuando un contenido fue asistido por IA
2. exigir aceptación explícita en sugerencias con impacto operativo
3. bloquear autoaplicación en acciones externas o contractuales
4. conservar diff entre texto original y texto sugerido
5. auditar métricas de adopción y rechazo de sugerencias IA
6. permitir desactivar IA por módulo, rol o tenant si se detecta fricción
7. usar reglas determinísticas como primera capa y IA como segunda capa
8. permitir tenants completamente sin IA según plan comercial
9. contemplar IA como palanca futura de pricing o diferenciación comercial

---

## 7. Matriz inicial confirmada

| Caso | IA permitida | Autoaplicable | Requiere confirmación | No permitido automático |
|---|---|---:|---:|---:|
| Corrección gramatical | Sí | Sí | No | No |
| Normalización menor de texto | Sí | Sí | No | No |
| Resumen preliminar interno | Sí | Sí | No | No |
| Reescritura técnica | Sí | No | Sí | No |
| Detección de inconsistencia | Sí | No | Sí | No |
| Prioridad o riesgo | Sí | No | Sí | No |
| Alerta de mantenimiento | Sí | No | Sí | No |
| Detección de choque de agenda | Sí | No | Sí | No |
| Reprogramación propuesta | Sí | No | Sí | No |
| Generación de cotización borrador | Sí | No | Sí | No |
| Redacción de contenido al cliente | Sí | No | Sí | No |
| Envío al cliente | No | No | No | Sí |
| Aprobación de cotización | No | No | No | Sí |
| Cierre de reporte | No | No | No | Sí |
| Cierre de servicio | No | No | No | Sí |
| Cambio de calificaciones técnicas | No | No | No | Sí |
| Reasignación de operador | No | No | No | Sí |
