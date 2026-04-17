# TS-03 — Especificación técnica

# Implementar calendario operativo multirol con panel lateral

## Estado

Draft técnico inicial, aterrizado contra la implementación actual del proyecto.

## Objetivo

Diseñar e implementar el calendario operativo multirol como interfaz principal de programación, consulta y operación sobre servicios.

TS-03 debe definir:

- vistas por rol
- estructura de la UI del calendario
- uso de panel lateral
- eventos y capas visuales
- interacción drag and drop y resize
- separación entre calendario, detalle y flujo de edición
- transición desde el modelo actual basado en `Appointment`

---

## 1. Hallazgo principal sobre el código actual

La base del calendario ya existe y usa FullCalendar de forma relativamente avanzada.

### Capacidades actuales detectadas

- vistas semana, día, mes y multimes
- drag and drop
- resize
- lista
- filtros básicos
- color por grupo del edificio
- click en fecha para crear
- click en evento para ver detalle
- modal de creación/edición
- panel de detalle modal amplio
- lógica de recurrencias
- lógica de días restringidos

### Problemas actuales

1. `SchedulingPage.tsx` concentra demasiada responsabilidad
2. el modelo sigue basado en `Appointment`
3. no existe separación fuerte por rol
4. la experiencia principal aún usa modal, no panel lateral como patrón dominante
5. el flujo de creación no está claramente estructurado por pasos reutilizables
6. el calendario mezcla dominio, reglas, presentación y detalle técnico en un solo archivo

---

## 2. Decisión de producto para TS-03

## Recomendación fuerte

TS-03 no debe ser una mejora incremental del archivo actual solamente.

Debe ser una **reestructuración del calendario como módulo**, manteniendo FullCalendar como base pero separando responsabilidades.

### Principios

- calendario como shell visual principal
- panel lateral como patrón dominante de detalle
- flujos de creación y edición desacoplados del canvas principal
- soporte multirol desde el diseño, no solo desde condicionales sueltos

---

## 3. Modelo de vistas por rol

## 3.1 Operador

Vista principal:

- agenda diaria

Necesidades:

- ver servicios asignados
- ver horario y edificio
- ver estado
- ver observaciones resumidas
- entrar a ejecución o detalle

## 3.2 Supervisor

Vista principal:

- dashboard operativo con calendario

Debe incluir:

- vista mensual
- tablero por operador
- agenda tipo calendario
- lectura de conflictos y carga operativa

## 3.3 Programador

Vista principal:

- calendario operativo completo

Necesidades:

- crear
- reprogramar
- reasignar
- resolver conflictos
- gestionar pendientes de asignación

## 3.4 Cliente

Vista principal:

- lista de agenda

No requiere edición.
Sí requiere:

- fecha
- hora
- tipo de servicio
- estado
- observaciones resumidas

---

## 4. Arquitectura UI recomendada

## 4.1 Shell principal

El calendario debe dividirse en cuatro zonas.

### Zona A, toolbar superior

- selector de vista
- rango visible
- acción principal de crear
- exportaciones si aplica
- filtros rápidos

### Zona B, superficie calendario o lista

- FullCalendar en modo principal para roles internos
- lista optimizada para cliente y contextos específicos

### Zona C, panel lateral contextual

Patrón central de TS-03.

Debe servir para:

- ver detalle del servicio
- mostrar contexto del edificio
- mostrar asignación
- mostrar estado
- abrir acciones permitidas

### Zona D, overlays puntuales

Solo usar modales para:

- confirmaciones destructivas
- wizard de creación o reprogramación si no cabe razonablemente en panel lateral

---

## 5. Panel lateral como patrón dominante

## 5.1 Comportamiento esperado

Al seleccionar un evento:

- no debe abrir un modal grande por defecto
- debe abrirse un panel lateral

## 5.2 Contenido mínimo

- título del servicio
- edificio
- operador principal
- acompañantes
- fecha/hora
- tipo
- estado
- recurrencia si aplica
- accesos a editar, ejecutar, reprogramar o revisar según rol

## 5.3 Acciones contextuales

### Programador

- editar
- reprogramar
- reasignar
- cancelar

### Supervisor

- ver detalle operativo
- revisar estado
- navegar a reportes

### Operador

- ver detalle del día
- iniciar o continuar ejecución

---

## 6. Sistema visual del evento

## 6.1 Color principal

Confirmado:

- el color principal representa el grupo de asignación

## 6.2 Indicadores secundarios recomendados

Como el color principal ya queda ocupado, otros estados deben ir con señales secundarias:

- badge de tipo de servicio
- icono de emergencia
- icono de recurrencia
- icono o badge de conflicto
- icono de pendiente de asignación

## 6.3 Regla clave

No sobrecargar el bloque de calendario con demasiada semántica textual.
La mayor parte del detalle debe vivir en el panel lateral.

---

## 7. Interacciones obligatorias

## 7.1 Drag and drop

Debe mantenerse.

Aplica a:

- mover servicio a otra fecha u hora

Condiciones:

- solo roles autorizados
- respetar reglas de negocio
- disparar auditoría
- registrar motivo si luego se consolida en flujo de reprogramación

## 7.2 Resize

Debe mantenerse.

Aplica a:

- cambio de duración

Condiciones:

- solo roles autorizados
- validación de restricciones
- auditoría

## 7.3 Click en fecha

Debe abrir creación guiada desde contexto de fecha/hora.

## 7.4 Click en evento

Debe abrir panel lateral.

---

## 8. Estructura técnica recomendada del módulo

La página actual está demasiado cargada. Debe partirse.

## 8.1 Componentes sugeridos

### `SchedulingPage`
Responsable de orquestación general.

### `SchedulingToolbar`
Filtros, vista, acciones principales.

### `SchedulingCalendarView`
Wrapper de FullCalendar.

### `SchedulingListView`
Vista lista reutilizable.

### `SchedulingEventPanel`
Panel lateral de detalle.

### `SchedulingCreateFlow`
Wizard de creación o edición.

### `SchedulingFilters`
Bloque de filtros desacoplado.

### `SchedulingEventBadges`
Capa de semántica visual de evento.

---

## 9. Dependencia del modelo actual

## Estado actual

El calendario usa `Appointment` como fuente de datos.

## Recomendación

TS-03 debe prever transición a fuente canónica futura basada en `ServiceOrder`.

### Estrategia V1

Se puede mantener FullCalendar alimentado con datos derivados, pero la capa del calendario no debe acoplarse más al shape legado.

## Propuesta

Definir un view model específico:

```ts
export type SchedulingEventViewModel = {
  id: string;
  sourceId: string;
  title: string;
  buildingId: string;
  buildingName?: string;
  assignmentGroupId?: string | null;
  assignmentGroupColor?: string;
  operatorIds?: string[];
  primaryOperatorId?: string | null;
  startAt: string;
  endAt: string;
  status: string;
  type: string;
  recurrence?: string | null;
  hasConflict?: boolean;
  isEmergency?: boolean;
  pendingAssignment?: boolean;
};
```

Esto desacopla UI de dominio legado.

---

## 10. Reglas de negocio que TS-03 debe respetar

Aunque TS-05 profundizará más, TS-03 debe ya integrar el soporte visual para:

- conflicto por operador
- conflicto por acompañante
- emergencia
- restricción en festivos y no laborales
- servicios sin asignación
- recurrencias

### Importante

TS-03 no necesita resolver todas las reglas complejas, pero sí debe dejar puntos de extensión claros.

---

## 11. Vistas específicas recomendadas

## 11.1 Vista calendario interna

Para roles internos.

Debe soportar:

- día
- semana
- mes
- multimes opcional

## 11.2 Vista por operador

Puede ser calendario filtrado o tablero derivado.

No requiere implementarse como canvas completamente distinto en V1 si puede resolverse con filtros y agrupación.

## 11.3 Vista lista cliente

Debe ser distinta a la vista interna.

Más simple, más comercial, menos ruido técnico.

---

## 12. Integración con grupos de asignación

TS-03 depende directamente de TS-02.

### Reglas

- el calendario ya no debe depender de `building.group` a largo plazo
- debe consumir `assignmentGroupId` + catálogo de grupos
- color del evento se resuelve desde `AssignmentGroup.color`

### Compatibilidad temporal

Mientras migra:

- puede usarse adaptador `group` -> color
- pero no debe consolidarse como modelo final

---

## 13. Integración con ficha de edificio

TS-03 depende también de TS-06.

Desde el panel lateral debe poder mostrarse:

- nombre del edificio
- contacto o resumen útil
- grupo de asignación
- link a ficha del edificio en el futuro

---

## 14. Auditoría mínima requerida

Eventos mínimos a auditar desde el calendario:

- evento creado
- evento movido
- duración cambiada
- evento editado
- evento cancelado
- evento eliminado
- apertura de flujo de emergencia si luego se decide relevante

---

## 15. Riesgos técnicos

1. seguir ampliando `SchedulingPage.tsx`
2. dejar el panel lateral como parche en vez de patrón
3. acoplar la UI a `Appointment` más de lo necesario
4. mezclar creación, detalle y ejecución en la misma superficie

## Mitigación

- componentizar
- crear view model específico
- separar calendario y flujo de edición
- usar panel lateral como contrato de interacción

---

## 16. Criterios de aceptación refinados para TS-03

- existe arquitectura modular propuesta del calendario
- existe definición clara de vistas por rol
- existe definición clara del panel lateral
- existe definición del sistema visual de eventos
- existe definición del view model del calendario
- existe estrategia de transición desde `Appointment`
- existe definición de auditoría mínima
- existe integración conceptual con TS-02 y TS-06

---

## 17. Dependencias

TS-03 depende de:

- TS-01
- TS-02
- TS-06

TS-03 desbloquea directamente:

- TS-04 flujo de creación y reprogramación
- TS-05 reglas complejas de conflicto y recurrencia

---

## 18. Recomendación de ejecución posterior

El siguiente paso natural después de TS-03 es TS-04.

Motivo:

Una vez el calendario y el panel lateral están definidos, el flujo paso a paso de creación y reprogramación ya puede aterrizarse con contexto real y menos ambigüedad.