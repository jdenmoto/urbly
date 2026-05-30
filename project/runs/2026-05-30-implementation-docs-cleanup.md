# Implementación docs cleanup

Fecha: 2026-05-30
Owner: developer

## Objetivo
Limpiar `docs/implementation` removiendo documentación obsoleta y dejando únicamente plan/deuda vigentes con pasos accionables de implementación.

## Cambios realizados
1. Actualizado `docs/implementation/README.md` para reflejar set mínimo vigente.
2. Reescrito `docs/implementation/current-implementation-plan.md` con fases activas:
   - Fase A: estabilidad CI/CD (incluye fix staging seed)
   - Fase B: cierre técnico nativo en `services`
   - Fase C: reporte único closeout/print/PDF
   - Fase D: limpieza legacy + guardrails
3. Reescrito `docs/implementation/current-implementation-debt.md` con deuda actualizada a 2026-05-30.
4. Eliminados documentos históricos obsoletos:
   - `docs/implementation/fase-2-cierre-changelog.md`
   - `docs/implementation/urbly-v2/*`

## Resultado
`docs/implementation` queda con solo 3 archivos activos:
- `README.md`
- `current-implementation-plan.md`
- `current-implementation-debt.md`

## Nota para verify
Verificar que no existan enlaces rotos hacia archivos eliminados desde otros docs.
