# TS-27 — Especificación técnica

# Diseñar modelo de equipos y contexto técnico futuro por edificio

## Estado

Draft técnico inicial para soportar memoria técnica por edificio.

## Objetivo

Definir el modelo futuro de equipos, componentes y contexto técnico por edificio para enriquecer reportes, diagnósticos, mantenimiento y trazabilidad histórica.

TS-27 debe resolver:

- entidad de equipo
- relación con edificio
- contexto técnico persistente
- uso futuro en reportes y mantenimiento

---

## 1. Necesidad

El producto hoy gira en servicios y reportes, pero a futuro necesita conservar mejor el contexto técnico del edificio y sus equipos.

---

## 2. Modelo recomendado

```ts
export type BuildingEquipment = {
  id: string;
  buildingId: string;
  name: string;
  category?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};
```

---

## 3. Contexto técnico adicional sugerido

Más allá del equipo puntual, puede existir contexto como:

- observaciones históricas relevantes
- riesgos recurrentes
- notas técnicas persistentes
- configuraciones particulares del edificio

---

## 4. Uso futuro

- reportes más contextualizados
- mantenimiento sugerido
- trazabilidad técnica acumulada
- historial por equipo o componente

---

## 5. Riesgos técnicos

1. meter demasiado detalle prematuramente
2. mezclar equipo con observación temporal
3. no separar contexto persistente de reporte puntual

## Mitigación

- modelo base simple
- crecimiento incremental
- separación entre entidad técnica y evento operativo

---

## 6. Criterios de aceptación refinados para TS-27

- existe entidad `BuildingEquipment` definida
- existe relación clara con edificio definida
- existe noción de contexto técnico persistente definida
- existen usos futuros principales identificados

---

## 7. Dependencias

TS-27 alimenta directamente:

- TS-06
- TS-07
- TS-16

---

## 8. Recomendación de ejecución posterior

Después de TS-27, seguir con TS-28.