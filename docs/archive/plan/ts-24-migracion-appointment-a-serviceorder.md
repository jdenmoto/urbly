# TS-24 — Especificación técnica

# Diseñar estrategia de migración desde Appointment hacia ServiceOrder canónico

## Estado

Draft técnico inicial, alineado con la decisión ya tomada de usar `ServiceOrder` como entidad canónica.

## Objetivo

Definir la estrategia de migración desde el modelo híbrido o legado que aún usa `Appointment` hacia un dominio donde `ServiceOrder` es la entidad primaria del servicio y `Appointment` queda reducido a legado o proyección temporal.

TS-24 debe resolver:

- rol final de `Appointment`
- rol final de `ServiceOrder`
- estrategia de transición
- impacto en UI y queries
- compatibilidad temporal

---

## 1. Decisión ya consolidada

- `ServiceOrder` es la entidad canónica del servicio
- `Appointment` no debe crecer como modelo primario
- `Appointment` queda como legado o proyección temporal

---

## 2. Estado actual esperado

El sistema aún conserva piezas de agenda y compatibilidad que usan `Appointment`.

Eso implica una transición gradual, no un corte brusco.

---

## 3. Estrategia recomendada

## Fase 1

Congelar crecimiento funcional de `Appointment`.

## Fase 2

Hacer que nuevas capacidades operativas lean y escriban sobre `ServiceOrder`.

## Fase 3

Mantener adaptadores o proyecciones para vistas que aún dependan de `Appointment`.

## Fase 4

Eliminar dependencias críticas restantes y dejar `Appointment` como compatibilidad mínima o retirarlo.

---

## 4. Rol final de `Appointment`

## Recomendación

Debe quedar como una de estas dos opciones, explícitamente:

- proyección derivada de agenda
- compatibilidad temporal legacy

No debe seguir siendo fuente de verdad.

---

## 5. Impactos esperados

- queries de agenda
- mutaciones de calendar
- creación y reprogramación
- series recurrentes
- reportes ligados a servicio
- auditoría

---

## 6. Riesgos técnicos

1. duplicidad de verdad entre `Appointment` y `ServiceOrder`
2. side effects inconsistentes al reprogramar
3. vistas antiguas leyendo datos divergentes

## Mitigación

- `ServiceOrder` como source of truth única
- adaptadores claros
- plan explícito de retiro de dependencias legacy

---

## 7. Criterios de aceptación refinados para TS-24

- existe definición explícita del rol final de `Appointment`
- existe definición explícita de `ServiceOrder` como canónico
- existe estrategia de transición por fases
- existen impactos principales identificados
- existe enfoque de compatibilidad temporal definido

---

## 8. Dependencias

TS-24 alimenta directamente:

- TS-03
- TS-04
- TS-05
- TS-08

---

## 9. Recomendación de ejecución posterior

Después de TS-24, seguir con TS-25.