# Urbly — Plan de implementación vigente

Fecha: 2026-04-28
Estado: ola actual ejecutada

## Resultado de la ola
La implementación actual ya quedó en el estado buscado para este bloque:
- `service_orders` domina el flujo principal
- `services` concentra la operación diaria
- `SchedulingPage` salió del flujo principal
- la navegación principal expone rutas usables por rol
- empresa, técnico y cliente completan un walkthrough mínimo creíble
- web y functions validan con el mínimo explícito del repo

## Qué se cerró en esta ola
1. limpieza de navegación y placeholders visibles
2. consolidación de `services` como centro operativo
3. walkthrough mínimo por actor
4. foundations operativas de CI/build para web y functions
5. limpieza principal de residuos legacy y actualización de deuda

## Qué queda fuera de esta ola y pasa a siguiente frente
1. volver completamente nativo de `services` el cierre todavía puenteado por `scheduling`
2. unificar la representación del reporte entre closeout, imprimible y PDF
3. limpiar residuos menores de naming/modelos legacy ya sin presión funcional
4. decidir si el portal cliente sigue mínimo o se separa mejor por experiencias

## Referencia operativa
- estado actual del producto: `docs/getting-started/current-status.md`
- deuda remanente: `docs/implementation/current-implementation-debt.md`
- tareas atómicas ejecutadas: `docs/implementation/current-atomic-subagent-tasks.md`
