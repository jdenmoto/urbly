# TS-16 — Especificación técnica

# Implementar IA para calidad de reportes y hallazgos críticos

## Estado

Draft técnico inicial, apoyado en TS-07, TS-09 y TS-15.

## Objetivo

Aterrizar el uso de IA en reportes de servicio como una capa de asistencia controlada, enfocada en calidad documental, consistencia, criticidad y apoyo en hallazgos críticos.

TS-16 debe resolver:

- qué hace la IA sobre reportes
- qué puede autoaplicarse
- qué requiere confirmación humana
- cómo se integra al reporte y al flujo de revisión
- cómo se trazan sugerencias y resultados

---

## 1. Reglas confirmadas por negocio

## Autoaplicable

- corrección gramatical
- normalización menor de texto
- resumen preliminar interno

## Requiere confirmación humana

- reescritura técnica
- prioridad/riesgo
- alertas de mantenimiento

## Conducta al detectar inconsistencia

- sugerir
- advertir
- dejar continuar
- no bloquear automáticamente

## Otros casos confirmados

- detectar reporte demasiado corto
- detectar fotos insuficientes
- detectar componente en `mala` sin observación
- detectar inconsistencias entre calificaciones y observaciones
- cuando algo está en `mala`, sugerir texto base de observación
- si hay varios `mala`, generar resumen, sugerir criticidad y sugerir mantenimiento
- resumen IA e indicadores de riesgo son solo internos

---

## 2. Decisión estructural

## Recomendación fuerte

La IA no modifica el reporte de forma invisible.

Debe operar como capa de sugerencias y enriquecimiento alrededor de `ServiceReport`.

---

## 3. Casos de uso principales

## 3.1 Calidad textual

- corrección gramatical
- normalización menor
- reescritura técnica asistida

## 3.2 Consistencia

- texto vs calificación
- evidencia insuficiente
- reporte demasiado corto
- componente malo sin observación

## 3.3 Análisis de criticidad

- sugerencia de riesgo
- sugerencia de mantenimiento
- resumen de hallazgos críticos

## 3.4 Ayuda contextual

- sugerir texto genérico contextual cuando un componente está en `mala`

---

## 4. Modelo de sugerencia recomendado

```ts
export type AiSuggestionType =
  | 'grammar_correction'
  | 'text_normalization'
  | 'internal_summary'
  | 'technical_rewrite'
  | 'consistency_warning'
  | 'risk_suggestion'
  | 'maintenance_suggestion'
  | 'observation_draft'
  | 'critical_findings_summary';

export type AiSuggestion = {
  id: string;
  entityType: 'service_report';
  entityId: string;
  tenantId?: string | null;
  module: 'service_reports';
  type: AiSuggestionType;
  mode: 'auto_applied' | 'suggested';
  inputSnapshot?: Record<string, unknown>;
  outputSnapshot?: Record<string, unknown>;
  acceptedBy?: string | null;
  rejectedBy?: string | null;
  editedBy?: string | null;
  status: 'generated' | 'accepted' | 'rejected' | 'edited' | 'applied_automatically';
  createdAt: string;
};
```

---

## 5. Autoaplicación permitida

## Confirmado

### Permitido automático

- corrección gramatical
- normalización menor de texto
- resumen preliminar interno

## Recomendación

Incluso en autoaplicación, debe quedar:

- badge visible de contenido asistido por IA
- diff o rastro del cambio
- auditoría mínima

---

## 6. Sugerencias con confirmación humana

## Confirmado

- reescritura técnica
- prioridad o riesgo
- alertas de mantenimiento

## Recomendación

Estas deben aparecer como panel o bloque de sugerencias, nunca aplicarse en silencio.

---

## 7. Hallazgos críticos

## Confirmado

Si hay varios ítems en `mala`:

- generar resumen automático
- sugerir criticidad
- sugerir mantenimiento

## Recomendación técnica

Separar:

- generación del resumen IA
- decisión humana de usarlo o no
- proyección cliente futura si algún día se habilita

En esta fase:

- solo interno

---

## 8. Integración con TS-07 y TS-09

## En reporte

La IA debe poder trabajar sobre:

- observaciones libres
- observaciones estructuradas
- checklist
- evidencia mínima

## En revisión supervisor

El supervisor debería ver:

- advertencias generadas por IA
- resumen interno
- inconsistencias detectadas

Pero conservando el control humano final.

---

## 9. No bloqueo automático

## Confirmado

La IA no debe bloquear cierre automáticamente.

## Implicación

Las alertas IA son ayudas, no reglas duras.

Las reglas duras deben seguir siendo determinísticas.

---

## 10. Integración con tenant policy

TS-16 depende de TS-15.

### La disponibilidad de capacidades debe respetar

- plan
- tenant
- módulo
- rol

---

## 11. Auditoría mínima requerida

Eventos mínimos:

- sugerencia generada
- autoaplicación de corrección gramatical
- sugerencia aceptada
- sugerencia rechazada
- sugerencia editada
- warning de inconsistencia generado
- resumen crítico generado

---

## 12. Riesgos técnicos

1. dejar que IA reescriba significado técnico sin control
2. mezclar reglas duras con sugerencias IA
3. no separar bien interno vs cliente
4. no dejar rastro de cambios autoaplicados

## Mitigación

- reglas determinísticas primero
- IA como segunda capa
- solo interno en esta fase
- trazabilidad completa

---

## 13. Criterios de aceptación refinados para TS-16

- existen casos de uso IA de reportes definidos
- existe separación clara entre autoaplicación y sugerencia
- existe modelo de `AiSuggestion` orientado a reportes
- existe integración conceptual con revisión supervisor
- existe regla explícita de no bloqueo automático
- existe auditoría mínima definida

---

## 14. Dependencias

TS-16 depende de:

- TS-07
- TS-09
- TS-15
- TS-29 idealmente para trazabilidad detallada

TS-16 alimenta:

- calidad de reportes
- hallazgos críticos internos
- futura capa IA más avanzada del producto

---

## 15. Recomendación de ejecución posterior

Después de TS-16, el siguiente paso natural es TS-17, porque completa el segundo frente importante de IA: agenda y sugerencia operativa.