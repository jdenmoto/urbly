# Deuda de implementación actual

## Núcleo operativo
1. `SchedulingPage` sigue siendo un módulo grande con responsabilidades mezcladas.
2. La migración de `appointments` a `service_orders` sigue incompleta en algunas rutas de compatibilidad.
3. El flujo de series y cierre técnico aún conserva partes apoyadas en shape legacy.

## Datos y modelo
4. Persisten rutas y compatibilidades temporales para no romper datos legacy.
5. Falta terminar la consolidación del modelo canónico de servicio en todas las mutaciones y queries.

## Producto / UX
6. La navegación v2 todavía convive con partes del shell anterior.
7. Quedan textos y decisiones UX por homogenizar fuera del tramo ya limpiado.

## Infra / setup
8. La documentación histórica estaba dispersa; esta reorganización la simplifica, pero conviene seguir manteniéndola viva.
9. El build aislado de `functions` mantiene deuda previa del proyecto y no debe tomarse todavía como criterio único de cierre.

## Recomendación de ejecución
Atacar esta deuda en cortes pequeños y verticales, priorizando:
- extracción adicional de `SchedulingPage`
- eliminación progresiva de compatibilidad legacy
- consolidación de flujo `service-order-first`
