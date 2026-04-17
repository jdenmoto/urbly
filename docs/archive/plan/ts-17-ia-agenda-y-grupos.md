# TS-17 — Especificación técnica

# Implementar IA para agenda y sugerencia de grupos/asignación

## Estado

Draft técnico inicial, apoyado en TS-02, TS-05 y TS-15.

## Objetivo

Definir la capa de IA o heurística asistida para mejorar agenda, proponer alternativas y sugerir grupos de asignación sin ejecutar decisiones sensibles automáticamente.

TS-17 debe resolver:

- sugerencia de horarios alternativos
- detección de sobrecarga por operador
- detección de recurrencias mal generadas
- sugerencia de grupo por dirección y rutas
- límites de autonomía
- trazabilidad

---

## 1. Reglas confirmadas por negocio

## IA en agenda

- detectar choques de agenda
- proponer reprogramaciones
- detectar sobrecarga de agenda por operador
- sugerir varias alternativas
- sugerir grupo por dirección y rutas
- no reasignar operadores automáticamente

## Regla estructural

- la sugerencia de grupo solo sugiere, no asigna automáticamente

---

## 2. Decisión estructural

## Recomendación fuerte

En agenda, muchas capacidades pueden resolverse primero con heurística y reglas antes que con IA generativa.

TS-17 debe contemplar ambas, pero bajo una misma capa de sugerencia operativa.

---

## 3. Casos de uso principales

## 3.1 Alternativas horarias

Cuando hay conflicto o se requiere reprogramar:

- proponer varias alternativas
- mantener duración
- respetar reglas duras del sistema

## 3.2 Sobrecarga por operador

Detectar patrones como:

- demasiados servicios en ventana corta
- acumulación por zona o tiempo
- jornadas demasiado densas

## 3.3 Recurrencias problemáticas

Identificar:

- series generadas con muchas alertas
- corrimientos excesivos
- recurrencias con colisiones frecuentes

## 3.4 Grupo de asignación sugerido

Usar:

- dirección
- coordenadas
- edificios vecinos ya clasificados
- reglas de grupo existentes

---

## 4. Modelo de sugerencia recomendado

```ts
export type SchedulingAiSuggestionType =
  | 'schedule_alternatives'
  | 'overload_warning'
  | 'recurrence_issue_warning'
  | 'assignment_group_suggestion';

export type SchedulingAiSuggestion = {
  id: string;
  entityType: 'service_order' | 'building' | 'recurrence_rule';
  entityId: string;
  tenantId?: string | null;
  module: 'scheduling';
  type: SchedulingAiSuggestionType;
  outputSnapshot?: Record<string, unknown>;
  status: 'generated' | 'accepted' | 'rejected' | 'edited';
  createdAt: string;
};
```

---

## 5. Alternativas horarias

## Recomendación técnica

Esto debe apoyarse primero en disponibilidad calculada, no en texto libre generado.

### Estrategia V1

- generar 3 a 5 alternativas válidas
- respetar duración original
- evitar conflictos con operador principal y acompañantes
- respetar festivos y días no laborales
- mantener fecha cercana si es posible

---

## 6. Sobrecarga operativa

## Recomendación V1

Calcular sobrecarga con heurísticas simples, por ejemplo:

- número de servicios por franja
- tiempo total asignado en día
- densidad de servicios urgentes

La IA puede traducir eso a sugerencia legible, pero la detección base puede ser determinística.

---

## 7. Recurrencias problemáticas

La capa debe poder señalar cuando una serie:

- genera demasiados corrimientos
- genera demasiadas colisiones
- genera demasiadas alertas

## Recomendación

Guardar un resumen de salud de la serie, consumible por UI y por revisión operativa.

---

## 8. Sugerencia de grupo de asignación

TS-02 ya definió que la sugerencia automática no asigna automáticamente.

## Recomendación técnica

La sugerencia puede basarse en heurística geográfica más explicación útil.

Ejemplo de explicación:

- “Se sugiere Zona Norte por cercanía con 4 edificios ya agrupados en ese cluster”

---

## 9. Integración con política IA

TS-17 depende de TS-15.

Estas capacidades deben poder activarse o desactivarse por:

- tenant
- módulo
- rol

---

## 10. Trazabilidad mínima requerida

Eventos mínimos:

- alternativa horaria generada
- advertencia de sobrecarga generada
- advertencia de recurrencia generada
- sugerencia de grupo generada
- sugerencia aceptada
- sugerencia rechazada

---

## 11. Riesgos técnicos

1. llamar IA para resolver cosas que una heurística basta
2. proponer alternativas inviables
3. confundir sugerencia con acción aplicada
4. no explicar por qué se sugiere un grupo u horario

## Mitigación

- reglas duras primero
- IA o capa heurística como ayuda secundaria
- explicación operativa breve
- trazabilidad explícita

---

## 12. Criterios de aceptación refinados para TS-17

- existen casos de uso de agenda definidos
- existe modelo de sugerencia de agenda definido
- existen alternativas horarias modeladas como sugerencias, no acción automática
- existe enfoque para sobrecarga operativa
- existe enfoque para recurrencias problemáticas
- existe enfoque de sugerencia de grupo con explicación
- existe trazabilidad mínima definida

---

## 13. Dependencias

TS-17 depende de:

- TS-02
- TS-05
- TS-15
- TS-29 idealmente para trazabilidad detallada

TS-17 alimenta:

- optimización operativa futura
- calidad de agenda
- coordinación del programador

---

## 14. Recomendación de ejecución posterior

Después de TS-17, el siguiente paso natural es TS-18 o ya pasar a la capa transversal restante: auditoría, multi-tenant, importaciones y migración.