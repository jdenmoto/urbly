# Urbly — Plan Detallado de Implementación UI/UX

Fecha: 2026-05-29
Estado: ready for execution
Owner recomendado: `designer` + `developer` + `verify`

## 0) Estrategia

- Modelo: fases incrementales, cada fase con tareas atómicas, validación y salida a verificación.
- Regla: no introducir features nuevas; solo calidad UI/UX y consistencia de experiencia.

## Fase U0 — Baseline y contrato visual

Objetivo: congelar criterios visuales y de interacción para evitar divergencia.

Tareas:
1. U0-T01 Definir contrato de superficies (`Card` vs `GlassPanel`) y declarar componente canónico.
2. U0-T02 Definir tokens de spacing, radius, shadow y motion (`durations`, `easing`) reutilizables.
3. U0-T03 Definir patrón único de `PageHeader`, `SectionHeader`, `MetricCard` y bloques de contexto.
4. U0-T04 Definir guía de estados canónicos (`loading`, `empty`, `error`, `success`).
5. U0-T05 Documentar checklist de QA visual desktop/móvil.

Validación:
- Documento de contrato en docs.
- Lint/typecheck/build sin regresiones.

## Fase U1 — i18n y copy hardening

Objetivo: eliminar textos hardcodeados en UI visible de rutas críticas.

Tareas:
1. U1-T01 Auditar strings hardcodeados por módulos críticos.
2. U1-T02 Migrar strings de `dashboard` a diccionario.
3. U1-T03 Migrar strings de `services` (detail/closeout/print) a diccionario.
4. U1-T04 Migrar strings de `portal` (summary/services/reports/secure) a diccionario.
5. U1-T05 Migrar strings de `technician` y `ai` a diccionario.
6. U1-T06 Asegurar tests de integridad de i18n en nuevas keys.

Validación:
- Tests de i18n en verde.
- 0 textos hardcodeados en módulos críticos (excepto debug/dev explícito).

## Fase U2 — Shell y navegación operativa

Objetivo: unificar shell y eliminar affordances falsas.

Tareas:
1. U2-T01 Convertir búsqueda global en estado “coming soon” explícito o funcionalidad mínima real.
2. U2-T02 Normalizar dropdown de notificaciones (scroll, vacío, acción principal, cierre por fuera/esc).
3. U2-T03 Revisar labels y descripciones de grupos de navegación por rol.
4. U2-T04 Ajustar jerarquía visual TopBar para móvil/tablet.
5. U2-T05 Definir política de iconografía por módulo.

Validación:
- Pruebas de navegación por rol.
- QA visual en breakpoints.

## Fase U3 — Flujo técnico mobile-first

Objetivo: reducir fricción operativa del técnico.

Tareas:
1. U3-T01 Optimizar `TechnicianHomePage` para lectura de 5 segundos (prioridad, estado, CTA).
2. U3-T02 Ajustar sticky CTA móvil para no tapar contenido crítico.
3. U3-T03 Homologar cards de cola técnica con patrón de estado.
4. U3-T04 Mejorar feedback de acciones clave (abrir/cerrar/reportar).
5. U3-T05 QA de densidad y tap targets en 320/360/390 px.

Validación:
- Tests existentes + smoke visual móvil.

## Fase U4 — Portal cliente de confianza

Objetivo: convertir portal en experiencia clara, trazable y orientada a confianza.

Tareas:
1. U4-T01 Homologar copy cliente (sin lenguaje interno/backoffice).
2. U4-T02 Reordenar bloques de resumen por prioridad de negocio.
3. U4-T03 Mejorar trazabilidad reciente con estados y timestamps legibles.
4. U4-T04 Normalizar tarjetas por edificio y reportes visibles.
5. U4-T05 Ajustar página segura (`ClientSecurePortalPage`) con narrativa de control y siguiente acción.

Validación:
- QA de comprensión con checklist cliente.

## Fase U5 — AI Workspace y consistencia semántica

Objetivo: integrar IA como capa operativa confiable, no aislada.

Tareas:
1. U5-T01 Homologar semántica visual de IA con sistema general (evitar tema aislado).
2. U5-T02 Normalizar aviso de “sugerencia” y “aprobación humana”.
3. U5-T03 Mejorar estructura de cards de sugerencias para escaneo rápido.
4. U5-T04 Alinear acciones IA con flujos de Services/Closeout.

Validación:
- Tests de contrato IA + QA visual.

## Fase U6 — Accesibilidad y robustez UI

Objetivo: elevar baseline de accesibilidad funcional.

Tareas:
1. U6-T01 Asegurar focus-visible consistente en botones/links/inputs.
2. U6-T02 Revisar semántica de botones interactivos dentro de listas/paneles.
3. U6-T03 Verificar contraste mínimo de pills/etiquetas críticas.
4. U6-T04 Definir skip logic para dropdowns/modales (escape, tab cycle).
5. U6-T05 QA teclado en rutas críticas.

Validación:
- Checklist a11y básico completado.

## Fase U7 — Cierre y verificación

Objetivo: dejar el frente UI/UX auditado, trazable y preparado para continuidad.

Tareas:
1. U7-T01 Corrida final lint/typecheck/build/test.
2. U7-T02 Registro de changelog UI/UX.
3. U7-T03 Evidencia visual antes/después (capturas por módulo).
4. U7-T04 Handoff a verificación con riesgos residuales.

Validación:
- Artefactos en `project/artifacts` + run log en `project/runs`.

## Dependencias sugeridas

- U0 bloquea U1-U6.
- U1 puede correr en paralelo con U2-U5 por frentes.
- U6 se ejecuta transversal durante U2-U5 y se cierra formalmente al final.
- U7 solo inicia cuando U1-U6 estén completos.

## Criterio de no-negociables de diseño

1. No introducir nuevas vistas sin contrato visual homologado.
2. No mergear copy hardcodeado en rutas críticas.
3. No cerrar tareas UX sin verificación explícita.
