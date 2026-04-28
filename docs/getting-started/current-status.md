# Estado actual del proyecto

## Qué está sólido
- `service_orders` ya gobierna el flujo operativo visible
- `services` concentra lista, detalle, cierre y salida de reporte del día a día
- la navegación principal por rol quedó enfocada en operación real
- empresa, técnico y cliente ya tienen walkthrough mínimo usable
- CI/build mínimo quedó explícito para web y functions con `npm run build:minimum`

## Qué quedó recientemente cerrado
- salida de `SchedulingPage` del flujo principal; `/scheduling` ahora solo redirige a `/services`
- migración operativa de agenda y reportes base al modelo `service_orders`
- limpieza fuerte de código muerto y naming legacy más engañoso
- cierre técnico accesible desde `services` sin volver al módulo histórico
- documentación operativa y de pipeline alineada a la ola ejecutada

## Qué sigue pendiente a alto nivel
- convertir en nativas de `services` las piezas de cierre que todavía usan puente con `scheduling`
- unificar la representación final del reporte entre closeout, imprimible y PDF
- hacer una pasada corta de limpieza residual sobre helpers/modelos legacy ya fuera del flujo
- decidir si el portal cliente se queda mínimo o merece una separación más clara entre servicios e informes

## Validación operativa actual
- criterio mínimo real del repo: `npm run build:minimum`
- la validación de esta ola exige web y functions en verde, no solo frontend
- la deuda restante ya no bloquea la operación principal; está concentrada en cierre/reporte y cleanup residual
