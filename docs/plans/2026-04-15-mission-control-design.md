# Mission Control Design — Urbly

## Decisiones confirmadas

- Enfoque: operación diaria primero
- Alcance: Mission Control + sistema visual base
- Estética: ultra premium, glass sin glow ni gradientes, esquinas redondeadas, motion con Framer Motion, mobile-first, no cookie-cutter

## Objetivo

Crear un nuevo centro de control operativo para Urbly que permita:
- monitorear operación diaria
- hacer asignaciones y agendamientos
- controlar cotizaciones y contratos
- visualizar servicios activos e historial operativo
- ejecutar acciones rápidas desde un solo hub

## Principios UI/UX

### 1. Claridad de uso primero
Cada bloque debe responder una pregunta operativa clara:
- ¿qué urge?
- ¿qué está activo?
- ¿qué está bloqueado?
- ¿qué técnico está libre o saturado?
- ¿qué sigue?

### 2. Premium sobrio
- vidrio mate, no glossy
- sin glow
- sin gradientes
- contraste elegante
- neutros fríos + acentos funcionales
- bordes suaves y spacing amplio

### 3. Mobile-first real
- stack vertical por defecto
- densidad controlada
- cards que se expanden a grid solo cuando hay espacio
- acciones rápidas accesibles sin hover

### 4. Motion funcional
- transiciones de página con Framer Motion
- stagger en grids
- springs suaves en hover/tap/open
- motion solo para reforzar jerarquía y feedback

## Arquitectura propuesta

## A. Sistema visual base
Crear una capa reusable para Urbly v2 premium:

### Tokens
- superficies `glass-1`, `glass-2`, `glass-3`
- bordes suaves
- radios consistentes
- sombras mínimas y limpias
- escala tipográfica refinada
- spacing 8px system

### Componentes nuevos
- `MissionShell`
- `GlassPanel`
- `MetricCard`
- `SectionHeader`
- `StatusPill`
- `QuickActionCard`
- `TimelineRail`
- `CommandBar`

## B. Nueva pantalla principal
### `MissionControlPage`
Bloques:

1. Hero operativo
- fecha
- estado general
- resumen corto del día
- command bar

2. KPIs vivos
- servicios activos
- pendientes de asignación
- urgentes
- bloqueados

3. Agenda y asignaciones
- agenda del día
- próximas ventanas
- huecos críticos
- técnicos disponibles/saturados

4. Alertas operativas
- vencidos
- sin técnico
- cotizaciones pendientes
- contratos por implementar

5. Acciones rápidas
- crear agendamiento
- asignar técnico
- crear cotización
- abrir contrato
- ver servicio

6. Pipeline operativo extendido
- cotizaciones
- contratos
- servicios implementados
- usuarios y administración

## C. Routing y rollout
- mantener compatibilidad con `DashboardPage`
- hacer que el dashboard apunte al nuevo `MissionControlPage`
- dejar el resto del sistema migrando progresivamente al nuevo visual system

## Implementación por fases

### Fase 1
Sistema visual base + Mission Control real

### Fase 2
Conectar quick actions y bloques operativos con datos reales

### Fase 3
Propagar visual system a páginas clave
- services
- detail
- closeout
- portal
- technician

## Recomendación
Proceder con:
1. sistema visual base reusable
2. `MissionControlPage`
3. reemplazo del dashboard por el nuevo mission control
4. validación con lint/build

## Riesgos
- scope alto si intentamos rediseñar todo en un solo salto
- motion excesivo puede degradar claridad si no se controla
- hay que mantener i18n y accesibilidad visibles en el rediseño

## Aprobación pendiente
Si apruebas este diseño, paso a escribir el plan de implementación y después lo ejecuto en esta rama.
