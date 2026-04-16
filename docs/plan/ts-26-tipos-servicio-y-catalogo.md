# TS-26 — Especificación técnica

# Diseñar modelo de tipos de servicio y catálogo administrable

## Estado

Draft técnico inicial para formalizar catálogo de servicios.

## Objetivo

Definir el modelo de tipos de servicio del producto, separando la ejecución operativa concreta del catálogo administrable que usa el sistema para programación, reportes, plantillas y cotizaciones.

TS-26 debe resolver:

- entidad de tipo de servicio
- catálogo administrable
- relación con plantillas
- relación con periodicidades
- activación/desactivación

---

## 1. Necesidad

Hoy parte del sistema parece resolver servicios de manera implícita o distribuida. El producto necesita un catálogo explícito administrable.

---

## 2. Modelo recomendado

```ts
export type ServiceType = {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  defaultDurationMinutes?: number | null;
  defaultTemplateId?: string | null;
  category?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
```

---

## 3. Relaciones esperadas

- `ServiceOrder.serviceTypeId`
- plantillas por tipo de servicio
- periodicidades sugeridas por tipo
- catálogo usado en cotización

---

## 4. Operación

El catálogo debe permitir:

- crear
- editar
- activar
- desactivar

No borrar físicamente tipos ya usados.

---

## 5. Riesgos técnicos

1. seguir usando nombres libres sin catálogo
2. romper históricos al renombrar o borrar
3. no enlazar con plantillas y periodicidades

## Mitigación

- id estable
- soft deactivation
- relaciones explícitas

---

## 6. Criterios de aceptación refinados para TS-26

- existe entidad `ServiceType` definida
- existe catálogo administrable definido
- existen relaciones con plantillas y periodicidades definidas
- existe estrategia de activación/desactivación definida

---

## 7. Dependencias

TS-26 alimenta directamente:

- TS-04
- TS-07
- TS-10
- TS-11

---

## 8. Recomendación de ejecución posterior

Después de TS-26, seguir con TS-27.