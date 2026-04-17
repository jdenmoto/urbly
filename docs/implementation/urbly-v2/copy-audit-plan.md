# Copy & Labels Audit Plan — Urbly

## Objetivo
Cerrar la deuda restante de copy, labels e i18n en todo el producto para mantener un lenguaje claro, consistente y en español.

## Hallazgos

### 1. Deuda concentrada en legacy
La mayor parte de la deuda restante está en `SchedulingPage.tsx`, donde aún sobreviven bloques históricos con labels descriptivos y copy operacional sin la misma disciplina del resto de la app.

### 2. Inconsistencia de tono
Todavía existen mezclas entre lenguaje:
- técnico interno
- producto visible al usuario
- labels cortos sin patrón homogéneo

### 3. Localización parcial histórica
Aunque las pantallas nuevas ya están mejor, el sistema todavía tiene zonas donde algunos textos visibles siguen definidos inline o con convenciones distintas.

## Objetivos concretos

1. Revisar textos hardcodeados restantes en pantallas críticas.
2. Migrar copy visible faltante a `public/locales/es.yaml`.
3. Unificar naming y tono en:
   - estados
   - prioridades
   - reportes
   - checklist
   - botones de acción
   - labels operativos
4. Validar que las pantallas principales queden sin faltantes claros en `t(...)`.

## Prioridad de ataque

### Prioridad 1
- `SchedulingPage.tsx`
- `BuildingsPage.tsx`
- `EmployeesPage.tsx`

### Prioridad 2
- revisar labels transversales en dashboard / services / portal / technician / ai

### Prioridad 3
- barrido final de locales y consistencia

## Criterio de cierre
- sin faltantes obvios de i18n en pantallas críticas
- labels claros y consistentes
- copy visible en español
- `npm run lint` y `npm run build` pasando
