# UI/UX Audit Plan — Urbly v2

## Objetivo

Elevar Urbly v2 desde una base funcional a una interfaz más consistente, clara y rápida de operar en escritorio y móvil.

## Hallazgos principales

### 1. Jerarquía visual inconsistente
- Algunas pantallas ya usan cards y badges claros, pero otras todavía mezclan bloques densos con prioridad visual débil.
- Falta una capa consistente de encabezado secundario, métricas de contexto y callouts operativos.

### 2. Localización incompleta
- Varias vistas nuevas seguían con textos hardcodeados.
- La deuda principal es asegurar que todo texto visible nuevo viva en `public/locales/es.yaml`.

### 3. Experiencia por rol todavía desigual
- Dashboard, services, portal, detalle y cierre ya están mejor encaminados.
- Aún faltan ajustes en:
  - `AiWorkspacePage`
  - `TechnicianHomePage`
  - consistencia transversal de labels, badges y bloques de resumen

### 4. Densidad y escaneo
- La app necesita mejorar lectura rápida:
  - tarjetas más estructuradas
  - métricas cortas arriba
  - agrupación por contexto
  - mejor separación entre contenido principal y acciones IA

### 5. Responsive y consistencia
- La base ya responde, pero falta pulido de spacing, columnas y agrupación en móvil.

## Principios de actualización

1. Mobile-first
2. Jerarquía visual clara
3. Cards con padding consistente
4. Badges y estados semánticos
5. Lectura rápida en vistas operativas
6. Todo texto visible nuevo pasa por i18n

## Plan de implementación

### Fase 1. Cierre de consistencia base
- [x] `ServicesPage`
- [x] `DashboardPage`
- [x] `ServiceDetailPage`
- [x] `ServiceCloseoutPage`
- [x] `ClientSummaryPage`
- [x] labels/i18n faltantes

### Fase 2. Auditoría e implementación sobre vistas faltantes
- [ ] `AiWorkspacePage`
- [ ] `TechnicianHomePage`
- [ ] revisión de `HomeRouterPage` y navegación contextual

### Fase 3. Sistema visual transversal
- [ ] normalizar badges semánticos
- [ ] normalizar bloques de resumen/contexto
- [ ] normalizar spacing entre secciones
- [ ] revisar estados vacíos y cargas

### Fase 4. QA visual
- [ ] pasada por desktop
- [ ] pasada por móvil
- [ ] revisión final de labels y consistencia de tono

## Entregable esperado

Una rama dedicada con:
- auditoría documentada
- mejoras visuales implementadas
- labels corregidos
- validación con `npm run lint` y `npm run build`
