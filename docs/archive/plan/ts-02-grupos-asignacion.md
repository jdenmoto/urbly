# TS-02 — Especificación técnica

# Diseñar modelo de grupos de asignación y sugerencia por rutas

## Estado

Draft técnico inicial, aterrizado contra la implementación actual del proyecto.

## Objetivo

Diseñar el modelo técnico y la estrategia de evolución para que los grupos de asignación pasen de ser una configuración visual simple a una capacidad operativa real del sistema.

TS-02 debe dejar resuelto:

- qué es un grupo de asignación
- cómo se relaciona con edificios
- cómo se usa en agenda
- cómo se configura
- cómo se sugiere automáticamente a partir de dirección y rutas
- cómo se audita

---

## 1. Hallazgo actual en el código

Hoy los grupos ya existen, pero en una forma muy limitada.

### Estado actual detectado

#### Fuente de datos
Documento Firestore:
- `settings/building_groups`

#### Estructura actual
Usada en `src/features/settings/GroupsSettingsPage.tsx` y `src/features/scheduling/SchedulingPage.tsx`

```ts
type BuildingGroup = {
  id: string;
  name: string;
  color: string;
};
```

#### Uso actual

1. configuración manual desde settings
2. validación de nombre y color duplicados
3. uso visual de color en calendario
4. vinculación indirecta a `building.group`

### Limitaciones del estado actual

1. no existe entidad operativa fuerte
2. el grupo vive como texto en `Building.group`, no como foreign key clara
3. no hay reglas
4. no hay relación formal grupo-edificio
5. no hay trazabilidad
6. no hay sugerencia automática
7. no hay permisos finos
8. no hay capacidad de reporting por grupo más allá del color

---

## 2. Decisión de modelado

## Recomendación fuerte

El grupo de asignación debe pasar de configuración embebida a **entidad propia canónica**.

### Justificación

El grupo ya no es solo color de calendario.
Ahora afecta:

- organización operativa
- optimización de rutas
- lectura visual del calendario
- clasificación territorial
- sugerencias automáticas
- reporting futuro

Por lo tanto, debe modelarse como agregado propio.

---

## 3. Modelo técnico propuesto

## 3.1 Entidad `AssignmentGroup`

```ts
export type AssignmentGroupRuleType = 'geographic' | 'route' | 'manual';

export type AssignmentGroupRule = {
  id: string;
  type: AssignmentGroupRuleType;
  enabled: boolean;
  config?: Record<string, unknown>;
  description?: string;
};

export type AssignmentGroup = {
  id: string;
  name: string;
  color: string;
  active: boolean;

  buildingIds?: string[];
  rules?: AssignmentGroupRule[];

  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
```

### Campo mínimo obligatorio

- `id`
- `name`
- `color`
- `active`

### Campo importante en V1

- `buildingIds`
- `rules`

Aunque `buildingIds` puede duplicar relación, en V1 puede ser útil para lectura rápida y paneles de settings. Si genera riesgo de inconsistencia, la relación fuente de verdad debe seguir siendo `Building.assignmentGroupId`.

---

## 3.2 Cambio en `Building`

Actualmente:

```ts
group: string;
```

Debe evolucionar a:

```ts
assignmentGroupId?: string | null;
```

### Compatibilidad temporal recomendada

Durante migración:

```ts
group?: string;
assignmentGroupId?: string | null;
```

### Regla

- `assignmentGroupId` será la fuente de verdad nueva
- `group` quedará solo para compatibilidad temporal hasta migración completa

---

## 3.3 Relación entre grupo y edificio

## Regla funcional confirmada

- el grupo se gestiona por edificio
- un edificio pertenece a un solo grupo activo a la vez
- el cambio aplica inmediatamente

### Implicación técnica

No hace falta versionado completo del grupo-edificio en V1.

Sí hace falta:

- auditoría de cambio
- timestamp de modificación
- actor que cambió

---

## 4. Casos de uso que TS-02 debe soportar

## 4.1 Caso de uso 1, administración de grupos

Roles permitidos:

- `admin`
- `supervisor`

Capacidades:

- crear grupo
- editar nombre
- editar color
- activar o desactivar
- asignar edificios
- revisar sugerencias automáticas

## 4.2 Caso de uso 2, lectura operativa en agenda

La agenda debe usar el grupo para:

- color principal del evento
- filtros por grupo en el futuro
- agregación operativa por zona o cercanía

## 4.3 Caso de uso 3, sugerencia automática

El sistema debe poder sugerir un grupo según:

- dirección
- ubicación geográfica
- posibles rutas

### Regla confirmada

La sugerencia:

- solo sugiere
- no asigna automáticamente

---

## 5. Estrategia de sugerencia automática

## 5.1 Alcance V1 recomendado

No conviene arrancar con optimización de rutas compleja real.

### En V1, la sugerencia puede basarse en heurísticas simples

Opciones recomendadas:

1. proximidad geográfica por lat/lng a edificios ya clasificados
2. cluster por distancia
3. agrupación manual asistida con propuesta

## 5.2 Estrategia técnica recomendada

### Paso 1
Tomar coordenadas del edificio candidato.

### Paso 2
Buscar edificios activos con `assignmentGroupId` ya definido.

### Paso 3
Calcular cercanía por distancia simple.

### Paso 4
Proponer el grupo con mayor afinidad, por ejemplo:

- grupo más cercano por centroide
- grupo con más edificios cercanos en radio dado

### Paso 5
Presentar sugerencia al usuario.

### No entra en V1

- optimización real de rutas en tiempo real
- consumo de APIs de rutas con costo por cada edición
- reasignación automática masiva

---

## 6. Diseño de datos para sugerencia

## 6.1 Opción simple recomendada para V1

Guardar configuración de sugerencia en el mismo grupo.

```ts
export type AssignmentGroupRule = {
  id: string;
  type: 'geographic' | 'route' | 'manual';
  enabled: boolean;
  config?: {
    maxRadiusKm?: number;
    referenceCenter?: { lat: number; lng: number };
  };
  description?: string;
};
```

## 6.2 Opción avanzada futura

Separar motor de agrupación en otra entidad o servicio.

No hace falta en esta etapa.

---

## 7. Firestore shape recomendada

## 7.1 Estado actual

Documento único:

- `settings/building_groups`

## Problema

Ese shape sirve para catálogo pequeño, pero no escala bien para:

- auditoría
- relaciones
- filtros
- crecimiento del dominio

## Recomendación

Migrar a colección propia:

- `assignment_groups/{groupId}`

### Shape recomendado

```json
{
  "name": "Zona Norte",
  "color": "#4f46e5",
  "active": true,
  "rules": [
    {
      "id": "geo-default",
      "type": "geographic",
      "enabled": true,
      "config": {
        "maxRadiusKm": 5
      }
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Compatibilidad temporal

Mientras migra la UI existente:

- puede mantenerse lectura espejo desde `settings/building_groups`
- pero nuevas capas deberían orientarse a colección propia

---

## 8. Cambios requeridos en UI

## 8.1 Settings de grupos

La pantalla actual `GroupsSettingsPage.tsx` debe evolucionar desde CRUD simple a CRUD operativo.

### Debe soportar en futuro inmediato

- nombre
- color
- estado activo
- edificios asignados
- reglas básicas
- sugerencia propuesta para nuevos edificios
- auditoría de cambios

## 8.2 Scheduling

La agenda hoy resuelve color con:

- `building.group`
- `groupSettings.groups`

Eso debe cambiar a:

- `building.assignmentGroupId`
- `assignment_groups`

Y mapear:

- `assignmentGroupId -> AssignmentGroup.color`

## 8.3 Buildings

La pantalla de edificios debe permitir:

- ver grupo actual
- aplicar sugerencia
- cambiar grupo manualmente
- ver si el grupo fue sugerido o asignado manualmente en el futuro si se decide auditar ese detalle

---

## 9. Auditoría requerida

Cada cambio de grupo debe generar `AuditEvent`.

### Eventos mínimos

- grupo creado
- grupo editado
- grupo activado/desactivado
- edificio reasignado a grupo
- sugerencia generada
- sugerencia aceptada
- sugerencia rechazada

### Campos mínimos de auditoría

- actor
- entidad afectada
- valor anterior
- valor nuevo
- timestamp
- origen manual o sugerido

---

## 10. Permisos

## Confirmado

Pueden editar grupos:

- `admin`
- `supervisor`

## Regla sugerida

### Admin

- CRUD completo
- activación/desactivación
- parámetros de reglas

### Supervisor

- edición operativa
- asignación de edificios
- aceptación de sugerencias

### Programador

- solo lectura en V1

---

## 11. Estrategia de migración

## 11.1 Paso 1
Crear entidad `AssignmentGroup` y colección nueva.

## 11.2 Paso 2
Migrar catálogo actual desde `settings/building_groups`.

## 11.3 Paso 3
Agregar `assignmentGroupId` a edificios.

## 11.4 Paso 4
Resolver compatibilidad temporal de calendario.

## 11.5 Paso 5
Deprecar uso directo de `building.group`.

---

## 12. Riesgos técnicos

1. inconsistencia si se mantiene doble fuente `building.group` y `assignmentGroupId`
2. color roto en agenda durante migración
3. sugerencias pobres si la calidad geográfica de edificios es mala
4. diseño prematuro de rutas si se intenta optimizar demasiado pronto

## Mitigación

- una sola fuente de verdad nueva
- adaptador de compatibilidad temporal
- heurística simple primero
- auditoría completa de cambios

---

## 13. Criterios de aceptación refinados para TS-02

- existe entidad `AssignmentGroup` definida
- existe estrategia de migración desde `settings/building_groups`
- existe cambio propuesto de `Building.group` a `assignmentGroupId`
- existe definición explícita de permisos
- existe definición de sugerencia automática no vinculante
- existe definición de auditoría mínima
- existe impacto documentado en settings, buildings y scheduling

---

## 14. Dependencias

TS-02 depende conceptualmente de TS-01.

TS-02 desbloquea directamente:

- TS-03 calendario multirol
- TS-06 ficha de edificio
- TS-17 IA o heurística de sugerencia de grupos

---

## 15. Recomendación de implementación posterior

Después de cerrar TS-02, el mejor siguiente paso es TS-06.

Motivo:

La ficha de edificio será el punto natural para:

- visualizar grupo actual
- aplicar sugerencias
- centralizar ubicación y contacto
- conectar agenda, edificio y operación en una sola vista
