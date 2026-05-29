# Urbly — Auditoría Total UI/UX

Fecha: 2026-05-29
Perfil: `designer`
Alcance: frontend web (`src/app`, `src/components`, `src/features`, `src/styles`) + consistencia con docs de producto.

## 1) Resumen ejecutivo

Urbly tiene una base funcional sólida y una dirección visual ya encaminada (cards, jerarquías, badges, motion). El principal problema no es ausencia de UI sino **consistencia sistémica** entre roles, copy, estados, accesibilidad y arquitectura de interacción.

Resultado de auditoría:
- Estado general: **B- (funcional, pero inconsistente)**
- Riesgo principal: **deuda transversal de UX e i18n que aumenta costo de cada nueva feature**
- Recomendación: consolidar **design system operativo v1** y ejecutar hardening por fases con gates.

## 2) Hallazgos por severidad

## Críticos (resolver primero)

1. **i18n incompleto y copy hardcodeado en vistas críticas**
- Evidencia: múltiples textos visibles en castellano directo en Dashboard, ClientSummary, ServiceCloseout, ServiceDetail, Building pages, Login QA panel, etc.
- Impacto: inconsistencia de tono, regresiones de localización, mayor costo de mantenimiento.

2. **Experiencia por rol parcialmente divergente**
- Técnico, cliente e interno usan patrones distintos de densidad y prioridades.
- Impacto: curva de aprendizaje y fricción operativa en cambio de contexto.

3. **Deuda de accesibilidad en componentes base**
- Falta de normalización explícita para focus-visible, navegación teclado y semántica consistente en ciertos bloques interactivos.
- Impacto: riesgo funcional para usuarios con navegación no mouse y cumplimiento básico.

## Altos

4. **Sistema visual híbrido (legacy + premium) sin contrato formal**
- Coexisten `Card/StatCard` y `GlassPanel/MetricCard` con reglas distintas.
- Impacto: UI variable entre módulos y dificultad de escalar.

5. **TopBar y navegación con affordances incompletas**
- Búsqueda global es placeholder visual, notificaciones en dropdown sin flujo de detalle.
- Impacto: expectativa rota en capa shell.

6. **Estados vacíos/carga/error no unificados**
- Hay buenos casos, pero sin guía obligatoria transversal.
- Impacto: experiencia irregular y más bugs de UX.

## Medios

7. **Paleta y tipografía base poco distintiva para posicionamiento premium-operativo**
- `system-ui` global y gradiente base correcto pero genérico.
- Impacto: marca percibida limitada.

8. **Motion sin presupuesto de interacción unificado**
- Animaciones de entrada bien implementadas, pero sin tokens de timing compartidos.
- Impacto: variabilidad de percepción.

9. **Densidad móvil no homogénea entre pantallas largas**
- Variación de spacing/composición entre flujos de técnico, portal y servicios.
- Impacto: fatiga de escaneo.

## 3) Evaluación por área

- Shell (Sidebar/TopBar/Layout): **7/10**
- Navegación y arquitectura por rol: **7/10**
- Dashboard interno: **7.5/10**
- Services (operación): **8/10**
- Cierre técnico/reportes: **7.5/10**
- Técnico móvil: **7/10**
- Portal cliente: **6.5/10**
- IA workspace: **6.5/10**
- i18n/copy consistency: **5.5/10**
- Accesibilidad base: **6/10**

## 4) Principios de corrección obligatoria

1. Una sola fuente de verdad para copy visible: i18n obligatorio.
2. Un solo contrato visual de superficies, títulos, métricas y estados.
3. Prioridad de flujo operativo por rol (interno/técnico/cliente).
4. Mobile-first real para técnico y portal cliente.
5. Gates de accesibilidad y calidad visual en cada fase.

## 5) Métricas de éxito (KPIs de implementación)

- 100% de copy visible nuevo en diccionario i18n.
- 0 pantallas críticas con componentes legacy no homologados.
- 100% de vistas críticas con estados `loading/empty/error` canónicos.
- 100% de acciones primarias accesibles por teclado.
- Reducción de tiempo de escaneo en servicios/closeout/portal (medición QA guiada).

## 6) Riesgos de ejecución

- Scope creep por intentar rediseñar todo simultáneamente.
- Regresiones por migración masiva de copy sin tests.
- Drift visual si no se bloquea el uso de patrones legacy.

## 7) Recomendación final

No hacer un “big redesign”. Ejecutar hardening por fases cortas, con contratos explícitos y control de salida por verificación.
