# Checklist ejecutable — Fase 2 Agendamiento

Estado: en ejecución

## Bloque 1 — Riesgo crítico operativo
- [x] B1.1 Inventario de rutas reales de evidencia en código
- [x] B1.2 Ajuste base de `storage.rules` para `service-orders/*`
- [ ] B1.3 Validar upload de adjuntos en flujo real (deployed)
- [ ] B1.4 Validar upload de fotos de novedad (mínimo 2)
- [ ] B1.5 Validar upload de fotos de cierre
- [x] B1.6 Habilitar asignación/reasignación usable desde listado
- [x] B1.7 Habilitar asignación/reasignación usable desde detalle
- [x] B1.8 Validar transición de estado al asignar
- [x] B1.9 Robustecer visibilidad del técnico por identidad
- [x] B1.10 Checklist de cierre habilitado en flujo de closeout

## Bloque 2 — Flujo completo de producto
- [x] B2.1 Tipos de servicio desde catálogo en creación rápida
- [x] B2.2 Fallback para tipos legacy/inactivos en catálogo
- [x] B2.3 Habilitar edición completa operativa desde services
- [x] B2.4 Habilitar edición desde scheduling sidebar (`/services?edit=...`)
- [x] B2.5 Confirmación explícita en dominio (scheduled -> confirmed)
- [x] B2.6 Exponer confirmación/reprogramación/cancelación en UI operativa
- [ ] B2.7 Unificar closeout -> print -> PDF (misma narrativa)

## Bloque 3 — UX/UI
- [x] B3.1 Evitar header duplicado detectado en services
- [ ] B3.2 Revisar consistencia de headers en scheduling/detalle/closeout
- [ ] B3.3 Revisar estados vacíos, errores y CTA principales
- [x] B3.4 Agregar favicon y referencia en `index.html`

## Bloque 4 — CI/Seed develop
- [x] B4.1 Integrar deploy backend + clear + seed en `deploy-develop.yml`
- [x] B4.2 Endurecer scripts de clear/seed para idempotencia completa
- [x] B4.3 Agregar smoke checks automáticos post-seed en CI/deploy
- [ ] B4.4 Validar pipeline en ejecución real de GitHub Actions

## Cierre
- [x] C1 `npm run typecheck`
- [x] C2 `npm run build:minimum`
- [ ] C3 PR final de fase 2 con changelog de cierre
