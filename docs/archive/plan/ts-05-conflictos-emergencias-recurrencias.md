# TS-05 — Especificación técnica

# Implementar validación de conflictos, emergencias y recurrencias

## Estado

Draft técnico inicial, aterrizado contra la implementación actual del proyecto y apoyado en TS-04.

## Objetivo

Definir la capa de reglas operativas que controla:

- conflictos de agenda
- manejo de emergencias
- generación de recurrencias
- tratamiento de festivos y días no laborales
- corrimientos automáticos y alertas

TS-05 es el endurecimiento del motor operativo del calendario.

---

## 1. Hallazgo principal sobre el estado actual

Ya existe una base funcional, pero es incompleta respecto al producto definido.

### Lo que ya existe

- validación de horario hábil
- bloqueo de fechas restringidas
- excepción parcial para emergencias
- recurrencias básicas
- corrimiento a siguiente día hábil
- move/resize en calendario

### Lo que falta

1. conflicto por acompañantes
2. conflicto explícito por operador como regla estructurada
3. manejo formal de servicio desplazado por emergencia
4. persistencia clara de alertas o conflictos
5. soporte completo de recurrencias pedidas por negocio
6. búsqueda del siguiente horario libre al colisionar después de un corrimiento
7. formalización del resultado de generación de recurrencias

---

## 2. Tipos de validación que TS-05 debe cubrir

## 2.1 Validaciones duras

Deben impedir guardado o cambio.

Ejemplos:

- operador principal en dos servicios al mismo tiempo
- acompañante en dos servicios al mismo tiempo
- rango horario inválido
- recurrencia incompatible con contrato o fecha mínima

## 2.2 Validaciones blandas

Deben advertir, registrar y dejar decisión humana o regla adicional.

Ejemplos:

- carga operativa alta
- reacomodo sugerido
- conflictos posteriores derivados del corrimiento

## 2.3 Excepciones controladas

Aplican a emergencias.

Ejemplos:

- permitir romper agenda existente
- no bloquear por fecha restringida igual que otros tipos

---

## 3. Conflictos de agenda

## 3.1 Conflicto principal confirmado

- mismo operador asignado en dos servicios en el mismo rango de tiempo

## 3.2 Conflicto adicional confirmado

- acompañantes también deben validar conflicto horario

## 3.3 Regla técnica recomendada

Dos servicios colisionan si:

```text
serviceA.start < serviceB.end
AND
serviceB.start < serviceA.end
```

Y comparten alguno de estos actores:

- `primaryOperatorId`
- cualquier `companionOperatorIds`

## 3.4 Resultado esperado

- detectar conflicto
- impedir guardar combinación inválida
- mostrar resolución posible

---

## 4. Emergencias

## Reglas confirmadas

- pueden romper la agenda existente
- no requieren justificación obligatoria
- sí deben permitir texto opcional de contexto
- cuando desplazan un servicio, ese servicio queda pendiente de reprogramación
- debe generarse aviso para confirmación humana del programador

## 4.1 Modelo recomendado

```ts
export type EmergencyDisplacement = {
  displacedServiceOrderId: string;
  emergencyServiceOrderId: string;
  previousStartAt: string;
  previousEndAt: string;
  resultingStatus: 'pendiente_de_reprogramacion';
  notifiedProgrammer: boolean;
  createdAt: string;
};
```

## 4.2 Decisión clave

La emergencia no debe reprogramar automáticamente el servicio desplazado.

Debe:

- marcarlo pendiente
- disparar notificación
- dejar intervención humana posterior

---

## 5. Recurrencias

## 5.1 Reglas confirmadas

Debe soportar:

- semanal
- quincenal
- mensual
- bimensual
- trimestral
- cada X días
- fin por fecha
- fin por número de ocurrencias
- exclusión manual de fechas

## 5.2 Gap actual

Hoy el código soporta menos variantes y usa string simplificada.

### Problemas actuales

- `semestral` aparece hoy pero no fue la definición final
- falta `trimestral`
- falta `cada X días` formal
- falta end condition estructurada
- falta exclusión manual de fechas como capacidad real

## 5.3 Entidad recomendada

Depender de `RecurrenceRule` definida en TS-01.

---

## 6. Festivos y días no laborales

## Reglas confirmadas

- aplican globalmente a toda la empresa
- si la ocurrencia cae en festivo o día no laboral, se mueve al siguiente día hábil
- si cae varias veces seguidas en festivos, siempre sigue moviendo al siguiente hábil
- si el corrimiento genera colisión, debe buscar el siguiente horario libre automáticamente

## 6.1 Función conceptual recomendada

```ts
resolveNextValidSchedule(candidateDate, recurrenceRule, calendarRestrictions, existingAssignments)
```

Debe resolver en orden:

1. día hábil válido
2. fecha mínima de inicio
3. no colisión
4. siguiente horario libre si colisiona

---

## 7. Resultado de generación de recurrencias

Ya se había propuesto en el plan, y aquí debe consolidarse.

```ts
export type RecurrenceGenerationResult = {
  id: string;
  recurrenceRuleId: string;
  sourceServiceOrderId: string;
  status: 'generado_exitosamente' | 'generado_con_alertas' | 'fallido';
  createdCount: number;
  skippedCount: number;
  movedCount: number;
  collisionsResolvedCount: number;
  warnings?: string[];
  createdAt: string;
};
```

### Utilidad

- trazabilidad
- feedback al usuario
- auditoría
- debugging

---

## 8. Siguiente horario libre automático

## Regla confirmada

Si el corrimiento por festivo genera colisión:

- buscar siguiente horario libre automático

## Recomendación técnica V1

No intentar resolver optimización global compleja.

### Estrategia simple

- mantener misma duración
- avanzar por slots razonables, por ejemplo 30 o 60 minutos
- verificar disponibilidad del operador principal y acompañantes
- detenerse al encontrar primer slot válido

### Importante

Esto aplica al corrimiento automático de recurrencias.
No implica reprogramación automática general de cualquier servicio manual.

---

## 9. Integración con TS-04

TS-05 debe integrarse al wizard, no solo al save final.

### Recomendación

Mostrar conflictos en dos momentos:

1. validación previa del paso de asignación
2. confirmación final con alertas resumidas

---

## 10. Integración con calendario existente

Hoy `moveAppointmentOnCalendar` solo valida:

- business hours
- fechas restringidas

Debe evolucionar para incluir:

- conflicto por operador principal
- conflicto por acompañantes
- excepción explícita por emergencia
- auditoría estructurada del movimiento

---

## 11. Auditoría mínima requerida

Eventos mínimos:

- conflicto detectado
- guardado bloqueado por conflicto
- emergencia creada
- servicio desplazado por emergencia
- recurrencia generada
- recurrencia con alertas
- recurrencia fallida
- corrimiento por festivo
- colisión resuelta por siguiente horario libre

---

## 12. Riesgos técnicos

1. dejar reglas repartidas entre UI, utilidades y mutaciones
2. no separar validación de guardado y validación de sugerencia
3. duplicar lógica entre creación, edición y move/resize
4. volver demasiado complejo el motor desde la primera versión

## Mitigación

- centralizar en un módulo de reglas de agenda
- usar funciones puras donde sea posible
- distinguir error bloqueante de warning
- implementar heurística simple primero

---

## 13. Arquitectura sugerida

Módulos recomendados:

- `schedulingRules.ts`
- `schedulingConflicts.ts`
- `schedulingRecurrenceEngine.ts`
- `schedulingEmergencyHandling.ts`
- `schedulingAvailability.ts`

---

## 14. Criterios de aceptación refinados para TS-05

- conflicto por operador principal definido e implementable
- conflicto por acompañantes definido e implementable
- manejo de emergencia con desplazamiento y aviso definido
- recurrencias extendidas formalmente soportadas en diseño
- corrimiento por festivo y no laboral definido
- búsqueda de siguiente horario libre definida
- resultado de generación de recurrencia modelado
- integración con wizard y calendario prevista

---

## 15. Dependencias

TS-05 depende de:

- TS-01
- TS-03
- TS-04

TS-05 desbloquea y endurece:

- TS-07 reporte operativo coherente con estados reales
- futura automatización IA en agenda

---

## 16. Recomendación de ejecución posterior

El siguiente paso natural después de TS-05 es TS-07.

Motivo:

Una vez el motor operativo de agenda está sólido, la siguiente capa natural es la captura del servicio ejecutado y su reporte técnico.