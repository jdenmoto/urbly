# U1-T01 — Auditoría de Copy Hardcodeado (alcance `es`)

Fecha: 2026-05-29
Estado: done
Rama: `feat/u1-t01-hardcoded-copy-audit-20260529`

## Método

- Barrido de texto visible en JSX: `rg` sobre nodos markup.
- Barrido de literales: `rg` sobre strings en `features` y `components`.
- Filtrado manual de falsos positivos (clases CSS, imports, keys técnicas).

## Métricas de barrido

- Coincidencias markup candidatas: **158**
- Coincidencias literales candidatas (incluye ruido técnico): **2970**

## Hallazgos priorizados (copy visible)

## P0 — Rutas críticas de operación (migrar primero)

1. `src/features/dashboard/DashboardPage.tsx`
- CTAs y descripciones visibles hardcodeadas en tarjetas principales.

2. `src/features/services/ServiceCloseoutPage.tsx`
- Labels y narrativa de cierre/reporte con texto directo.

3. `src/features/services/ServiceDetailPage.tsx`
- Bloques de contexto y etiquetas operativas con texto directo.

## P1 — Portal cliente

1. `src/features/portal/ClientSummaryPage.tsx`
- Títulos, subtítulos y labels de trazabilidad/cobertura hardcodeados.

2. `src/features/portal/ClientSecurePortalPage.tsx`
- Mensajes de acceso, bloques de servicio/solicitud/cotización hardcodeados.

3. `src/features/portal/ClientReportsPage.tsx`
- Labels puntuales hardcodeados (`PDFs`, etc.).

## P1 — IA y autenticación

1. `src/features/ai/AiSuggestionCard.tsx`
- Mensajes de bloqueo y disclaimers hardcodeados.

2. `src/features/auth/LoginPage.tsx`
- Bloque QA local en texto directo (no productivo pero visible en entorno dev).

## P2 — Módulos administrativos

1. `src/features/buildings/BuildingsPage.tsx`
2. `src/features/management/ManagementPage.tsx`
3. `src/features/buildingAdmin/BuildingAdminPage.tsx`

Contienen múltiples labels operativos hardcodeados.

## P3 — Copy técnico/no crítico

- `src/components/Modal.tsx` (`Workspace modal`) y etiquetas internas menores.

## Reglas de migración aprobadas para U1

1. Alcance idioma: **solo `es`**.
2. Toda cadena visible nueva o migrada debe usar `t('...')`.
3. No mezclar namespaces internos y cliente en el mismo bloque semántico.
4. Mantener compatibilidad con tests de i18n existentes.

## Orden de ejecución sugerido (siguientes tareas)

1. U1-T02: Dashboard i18n.
2. U1-T03: Services i18n (detail + closeout + print).
3. U1-T04: Portal i18n.
4. U1-T05: Technician + AI + auth QA copy.
5. U1-T06: tests i18n y barrido final.

## Evidencia de comandos

- `/tmp/u1_t01_markup_strings.txt`
- `/tmp/u1_t01_literal_strings.txt`
