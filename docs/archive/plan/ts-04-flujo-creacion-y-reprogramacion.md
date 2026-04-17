# TS-04 — Especificación técnica

# Construir flujo de creación y reprogramación paso a paso

## Estado

Draft técnico inicial, aterrizado contra la implementación actual del proyecto y apoyado en TS-03.

## Objetivo

Diseñar el flujo guiado de creación y reprogramación de servicios con máximo dos acciones principales por pantalla o panel, múltiples puntos de entrada y trazabilidad completa.

TS-04 debe resolver:

- cómo se crea un servicio desde distintos contextos
- cómo se reprograma sin romper control operativo
- cómo se registran motivos y tipos de reprogramación
- cómo se soportan servicios pendientes de asignación
- cómo se conecta este flujo con el calendario multirol y el panel lateral

---

## 1. Hallazgo principal sobre el estado actual

Hoy la creación y edición viven dentro de un único modal en `SchedulingPage.tsx`.

### Estado actual detectado

El formulario actual mezcla en una sola superficie:

- edificio
- título
- descripción
- fecha inicio
- fecha fin
- estado
- tipo
- operador
- recurrencia

### Problemas actuales

1. no existe experiencia guiada por pasos
2. el flujo no cambia realmente según contexto de entrada
3. crear y editar comparten la misma mecánica plana
4. la reprogramación no exige motivo en el flujo visual actual
5. el historial de reprogramación no está modelado como capacidad explícita
6. la asignación de acompañantes no existe aún en la UI actual

---

## 2. Decisión de UX

## Recomendación fuerte

TS-04 debe implementarse como **wizard contextual** desacoplado del calendario y del detalle.

### Patrón recomendado

- apertura desde calendario o panel lateral
- flujo en panel lateral expandido o drawer/wizard
- confirmación final clara
- persistencia parcial de estado en cliente mientras el usuario avanza

### Regla de producto

Máximo dos acciones principales por paso.

---

## 3. Puntos de entrada confirmados

El flujo debe soportar múltiples caminos.

## 3.1 Desde tipo de servicio

```text
Tipo de servicio -> fecha/hora -> asignación -> confirmación
```

## 3.2 Desde fecha/hora

```text
Fecha/hora -> tipo -> edificio -> asignación -> confirmación
```

## 3.3 Desde edificio

```text
Edificio -> tipo -> fecha/hora -> asignación -> confirmación
```

### Decisión técnica

No conviene construir tres flujos distintos.

Conviene construir un solo wizard con:

- contexto inicial variable
- pasos dinámicos u ordenables
- validación por etapa

---

## 4. Estructura recomendada del wizard

## Paso 1. Contexto inicial

Dependiendo del origen, se precargan uno o más de estos campos:

- edificio
- fecha/hora
- tipo

### Objetivo del paso

Cerrar el contexto mínimo del servicio.

## Paso 2. Programación

Campos:

- fecha inicio
- hora inicio
- fecha fin o duración
- tipo de agenda: único, recurrente, emergencia
- recurrencia si aplica

### Reglas

- si es emergencia, se restringen ciertos campos o se deshabilita recurrencia
- si cae en fecha restringida, se aplican reglas de negocio

## Paso 3. Asignación

Campos:

- operador principal
- acompañantes
- opción de dejar pendiente de asignación

### Reglas

- validar conflictos conocidos
- permitir continuar pendiente de asignación si negocio lo permite

## Paso 4. Confirmación

Resumen compacto:

- edificio
- tipo
- fecha/hora
- recurrencia
- asignación
- alertas o conflictos detectados

Acciones:

- confirmar creación
- volver a editar paso anterior

---

## 5. Modelo de datos mínimo para el flujo

TS-04 depende de estructuras propuestas en TS-01.

## 5.1 Draft del wizard

```ts
export type SchedulingDraft = {
  sourceContext?: 'calendar_date' | 'building' | 'service_type' | 'event_panel';

  buildingId?: string | null;
  serviceTypeId?: string | null;
  title?: string;
  description?: string;

  startAt?: string | null;
  endAt?: string | null;
  durationMinutes?: number | null;

  scheduleType?: 'unico' | 'recurrente' | 'emergencia';
  recurrenceRuleId?: string | null;
  recurrencePreset?: string | null;

  primaryOperatorId?: string | null;
  companionOperatorIds?: string[];
  pendingAssignment?: boolean;

  rescheduleType?: 'operativa' | 'emergencia' | 'solicitud_cliente' | null;
  rescheduleReason?: string | null;
};
```

---

## 6. Reprogramación como flujo distinto pero emparentado

La reprogramación no debe sentirse como crear desde cero.

## Recomendación

Usar el mismo wizard con modo:

- `create`
- `reschedule`
- `edit`

## En modo `reschedule`

Debe precargar:

- servicio actual
- fecha/hora actual
- operador actual
- contexto de impacto

Y debe exigir:

- tipo de reprogramación
- motivo obligatorio

### Tipos confirmados

- operativa
- emergencia
- solicitud del cliente

---

## 7. Historial de reprogramación

TS-04 debe dejar modelado esto explícitamente.

```ts
export type ServiceOrderRescheduleLog = {
  id: string;
  serviceOrderId: string;
  previousStartAt: string;
  previousEndAt: string;
  newStartAt: string;
  newEndAt: string;
  rescheduleType: 'operativa' | 'emergencia' | 'solicitud_cliente';
  reason: string;
  changedBy: string;
  createdAt: string;
};
```

### Confirmado por negocio

Debe guardarse historial completo de:

- fecha anterior
- fecha nueva
- usuario que cambió
- motivo del cambio
- tipo de reprogramación

---

## 8. Servicios pendientes de asignación

El wizard debe soportar esta posibilidad de forma explícita.

## Regla

Si el usuario marca pendiente de asignación:

- no exige operador principal
- el servicio debe quedar con estado coherente
- el resumen final debe mostrar que queda pendiente

### Recomendación técnica

Usar:

```ts
assignment: {
  primaryOperatorId: null,
  companionOperatorIds: [],
  pendingAssignment: true
}
```

---

## 9. Validaciones por paso

## Paso 1

- edificio válido si aplica
- tipo válido si aplica

## Paso 2

- rango horario válido
- reglas de emergencia
- reglas de festivos y días no laborales
- reglas de recurrencia

## Paso 3

- operador principal requerido salvo pendiente de asignación
- acompañantes sin conflicto
- conflictos visibles

## Paso 4

- resumen completo
- confirmación explícita

---

## 10. Relación con TS-03

TS-04 no vive aislado.

### Integración recomendada

Desde `SchedulingEventPanel` o toolbar del calendario debe abrirse `SchedulingCreateFlow`.

### Reglas

- click en fecha: abre wizard precargado con fecha
- click en edificio desde ficha: abre wizard precargado con edificio
- acción rápida por tipo: abre wizard precargado con tipo
- evento existente: abre wizard en modo edición o reprogramación

---

## 11. Auditoría mínima requerida

Cada ejecución del flujo debe auditar:

- servicio creado
- servicio editado
- servicio reprogramado
- motivo registrado
- asignación pendiente definida
- operador cambiado

---

## 12. Riesgos técnicos

1. intentar mantener el modal actual y solo partirlo visualmente
2. no separar creación, edición y reprogramación por modo
3. guardar motivo de reprogramación como nota libre sin estructura
4. no dejar trazabilidad suficiente

## Mitigación

- wizard desacoplado
- modos explícitos
- log estructurado de reprogramación
- validación paso a paso

---

## 13. Criterios de aceptación refinados para TS-04

- existe wizard contextual definido
- existen múltiples puntos de entrada soportados por el mismo flujo
- existe modo explícito de reprogramación
- motivo de reprogramación es obligatorio
- tipos de reprogramación están modelados
- servicios pendientes de asignación están soportados
- historial de reprogramación tiene estructura definida
- el flujo se integra conceptualmente con TS-03

---

## 14. Dependencias

TS-04 depende de:

- TS-01
- TS-03

TS-04 desbloquea y alimenta:

- TS-05 validaciones complejas
- TS-07 captura operativa posterior

---

## 15. Recomendación de ejecución posterior

El siguiente paso correcto después de TS-04 es TS-05.

Motivo:

Una vez el flujo guiado existe, ya tiene sentido endurecer validaciones, conflictos, emergencias y reglas de recurrencia sobre un proceso bien definido.