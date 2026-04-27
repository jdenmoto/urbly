# Roadmap maestro de implementación

## Estado

Documento maestro de consolidación posterior a la fase de especificación técnica.

Este documento traduce el paquete documental `TS-01` a `TS-31` en un plan de implementación real, ordenado por fases, prioridades, dependencias y entregables de producto.

---

## 1. Objetivo de esta fase nueva

Pasar de documentación a ejecución funcional sin perder coherencia del modelo.

La recomendación no es implementar por documentos aislados ni por temas sueltos.

La recomendación es implementar por **verticales operativas**, apoyadas por unas pocas fundaciones transversales indispensables.

---

## 2. Principios de implementación

### 2.1 `ServiceOrder` como fuente de verdad

Toda implementación nueva debe asumir que `ServiceOrder` es la entidad canónica del servicio.

### 2.2 Fundaciones antes que inteligencia

No conviene empezar por IA, notificaciones o auditoría visible si el flujo operativo base aún no está consolidado.

### 2.3 Primero operación, luego capa comercial, luego capa inteligente

Orden recomendado:

1. núcleo operativo
2. reporte y cierre técnico
3. cotización y portal cliente
4. capas transversales visibles
5. IA y optimización avanzada

### 2.4 Evitar implementación tema por tema

No implementar “todo lo de auditoría” o “todo lo de IA” de forma aislada si el núcleo operativo todavía se está moviendo.

---

## 3. Macropriorización

## Prioridad P0, Fundaciones críticas

Estas piezas habilitan casi todo lo demás:

- TS-24 migración de `Appointment` a `ServiceOrder`
- TS-26 catálogo administrable de tipos de servicio
- TS-25 modelo final de roles y permisos
- TS-22 modelo multi-tenant base

## Prioridad P1, MVP operativo fuerte

Estas piezas convierten el sistema en herramienta operativa seria:

- TS-03 calendario multirol
- TS-04 flujo de creación y reprogramación
- TS-05 reglas de conflictos, emergencias y recurrencias
- TS-06 ficha de edificio y datos maestros
- TS-07 reporte técnico base
- TS-08 servicios largos y avances diarios
- TS-09 revisión de reportes

## Prioridad P2, Capa comercial y cliente

- TS-10 motor de plantillas por tenant
- TS-11 cotización versionada
- TS-12 portal seguro cliente
- TS-21 tokens y validación de portal
- TS-28 PDF y vistas imprimibles
- TS-23 documentos y adjuntos

## Prioridad P3, Capas transversales visibles

- TS-19 modelo de auditoría transversal
- TS-14 auditoría visible en UI
- TS-20 modelo de notificaciones
- TS-13 centro de notificaciones

## Prioridad P4, Capa inteligente

- TS-15 política IA por tenant
- TS-29 modelo de suggestions y trazabilidad
- TS-16 IA en reportes
- TS-17 IA en agenda

## Prioridad P5, Datos y onboarding

- TS-18 importación CSV base
- TS-30 importación incremental
- TS-31 compatibilidad con importador actual
- TS-27 equipos y contexto técnico por edificio

---

## 4. Orden de fases recomendado

# Fase 1, Fundaciones del dominio

## Objetivo

Cerrar las piezas que estabilizan el modelo base y reducen deuda estructural.

## Incluye

- TS-24
- TS-26
- TS-25
- TS-22

## Resultado esperado

- dominio del servicio unificado
- catálogo de servicios estable
- base de autorización clara
- base tenant-aware usable

## Dependencias clave

- TS-24 afecta agenda, creación, reprogramación y reportes
- TS-26 alimenta plantillas, reportes, cotizaciones y programación
- TS-25 cruza portal, auditoría, notificaciones e IA
- TS-22 cruza plantillas, portal e IA

---

# Fase 2, Operación diaria del servicio

## Objetivo

Hacer que programar, ejecutar y cerrar servicios sea sólido de punta a punta.

## Incluye

- TS-03
- TS-04
- TS-05
- TS-06
- TS-07
- TS-08
- TS-09

## Resultado esperado

- agenda operativa fuerte
- wizard de creación y reprogramación
- reglas duras aplicadas consistentemente
- ficha de edificio como nodo operativo
- reporte técnico completo
- cierre supervisor usable

## Dependencias clave

- depende de Fase 1
- TS-07/08/09 comparten modelo y flujo de reporte
- TS-03/04/05 comparten reglas y mutaciones de agenda

---

# Fase 3, Capa comercial y experiencia cliente

## Objetivo

Transformar el sistema en herramienta comercial usable para cotizar, versionar y compartir con cliente de forma segura.

## Incluye

- TS-10
- TS-11
- TS-12
- TS-21
- TS-23
- TS-28

## Resultado esperado

- cotización versionada real
- plantillas por tenant
- documentos formales exportables
- portal cliente con enlace seguro

## Dependencias clave

- depende de Fase 1
- TS-10 alimenta TS-11 y TS-12
- TS-21 es subfundación de TS-12
- TS-23 y TS-28 son soporte transversal documental

---

# Fase 4, Observabilidad y coordinación interna

## Objetivo

Dar visibilidad, trazabilidad y coordinación sin alterar el núcleo funcional.

## Incluye

- TS-19
- TS-14
- TS-20
- TS-13

## Resultado esperado

- auditoría transversal consistente
- UI de auditoría visible
- notificaciones persistentes
- centro de alertas operativo

## Dependencias clave

- TS-19 debe entrar antes que TS-14
- TS-20 debe entrar antes que TS-13

---

# Fase 5, Inteligencia aplicada

## Objetivo

Agregar IA controlada cuando el producto ya tenga un flujo base estable.

## Incluye

- TS-15
- TS-29
- TS-16
- TS-17

## Resultado esperado

- política IA por tenant
- suggestions trazables
- IA útil en reportes
- IA/heurística útil en agenda

## Dependencias clave

- TS-15 antes de TS-16 y TS-17
- TS-29 fortalece trazabilidad de TS-16 y TS-17

---

# Fase 6, Onboarding de datos y expansión técnica

## Objetivo

Cerrar poblamiento inicial, cargas incrementales y memoria técnica extendida.

## Incluye

- TS-18
- TS-30
- TS-31
- TS-27

## Resultado esperado

- importación multi-entidad controlada
- convivencia y migración del importador actual
- soporte incremental de datos
- base para memoria técnica por edificio

---

## 5. Dependencias maestras

## Núcleo de dependencia

### TS-24
Bloquea o condiciona:
- TS-03
- TS-04
- TS-05
- TS-08

### TS-26
Alimenta:
- TS-04
- TS-07
- TS-10
- TS-11

### TS-22
Alimenta:
- TS-10
- TS-12
- TS-15

### TS-19
Alimenta:
- TS-14
- TS-13
- TS-15
- TS-16
- TS-17
- TS-21

### TS-20
Alimenta:
- TS-13

### TS-21
Alimenta:
- TS-12

### TS-15
Alimenta:
- TS-16
- TS-17

### TS-29
Fortalece:
- TS-16
- TS-17

### TS-18 + TS-30 + TS-31
Forman un mismo frente de onboarding y migración.

---

## 6. Recomendación de implementación real

## Secuencia concreta recomendada

### Bloque A
- TS-24
- TS-26
- TS-25
- TS-22

### Bloque B
- TS-03
- TS-04
- TS-05
- TS-06

### Bloque C
- TS-07
- TS-08
- TS-09

### Bloque D
- TS-10
- TS-11
- TS-21
- TS-12
- TS-23
- TS-28

### Bloque E
- TS-19
- TS-20
- TS-14
- TS-13

### Bloque F
- TS-15
- TS-29
- TS-16
- TS-17

### Bloque G
- TS-18
- TS-30
- TS-31
- TS-27

---

## 7. Qué no recomiendo hacer ahora

No recomiendo:

- arrancar por IA
- arrancar por notificaciones
- implementar auditoría visible antes de tener bien el modelo transversal
- mezclar migración de dominio con portal cliente en la misma tanda
- hacer una sola épica gigantesca de “implementar todo”

---

## 8. Traducción a tarjetas de implementación

La implementación real debe bajar a Trello como tarjetas ejecutables, no como replicado exacto de la documentación.

La recomendación es crear tarjetas agrupadas por entregable funcional.

### Tarjetas de implementación propuestas

#### Fase 1, Fundaciones
1. Implementar migración de `Appointment` a `ServiceOrder` como source of truth
2. Implementar catálogo administrable de tipos de servicio
3. Implementar modelo final de roles y permisos con soporte tenant-aware
4. Implementar configuración multi-tenant base para plantillas e IA

#### Fase 2, Operación diaria
5. Implementar calendario multirol sobre modelo canónico
6. Implementar wizard de creación y reprogramación de servicios
7. Implementar reglas duras de conflictos, emergencias y recurrencias
8. Implementar ficha operativa de edificio y datos maestros
9. Implementar reporte técnico base
10. Implementar servicios largos y avances diarios
11. Implementar revisión y devolución de reportes

#### Fase 3, Comercial y cliente
12. Implementar motor de plantillas por tenant
13. Implementar cotización versionada con revisión interna
14. Implementar tokens seguros y validación backend del portal cliente
15. Implementar portal seguro de cliente para cotizaciones y reportes
16. Implementar capa de documentos y adjuntos del sistema
17. Implementar generación de PDF y vistas imprimibles

#### Fase 4, Observabilidad y coordinación
18. Implementar modelo transversal de auditoría y eventos auditables
19. Implementar UI de auditoría visible con exportación
20. Implementar modelo persistente de notificaciones internas
21. Implementar centro de notificaciones y alertas en UI

#### Fase 5, Inteligencia aplicada
22. Implementar política IA por tenant, módulo y rol
23. Implementar modelo de IA suggestions y trazabilidad detallada
24. Implementar IA para calidad de reportes y hallazgos críticos
25. Implementar IA o heurística operativa para agenda y sugerencias de asignación

#### Fase 6, Onboarding y expansión técnica
26. Implementar importación multi-entidad con preview por UI
27. Implementar importación incremental con validación previa por entidad
28. Implementar migración del importador legacy de edificios al flujo nuevo
29. Implementar modelo de equipos y contexto técnico por edificio

---

## 9. Recomendación final

La mejor continuación no es abrir nuevas especificaciones.

La mejor continuación es:

- ejecutar las tarjetas de implementación por fases
- mantener PRs o ramas pequeñas por bloque coherente
- validar al final de cada fase antes de avanzar a la siguiente

Este documento debe ser la referencia principal para iniciar la fase de construcción.