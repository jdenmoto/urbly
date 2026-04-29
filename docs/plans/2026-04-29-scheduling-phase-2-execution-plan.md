# Plan detallado de ejecución — Fase 2 Agendamiento

Fecha: 2026-04-29
Rama objetivo: `feat/scheduling-phase-2`

## Secuencia de ejecución

## Bloque 1 — Riesgo crítico operativo

### Tarea 1.1 — Validar rutas reales de evidencia
- Revisar rutas usadas por:
  - adjuntos de servicio
  - fotos de cierre
  - fotos de novedades
- Salida: inventario de paths reales usados en código y en reglas.

### Tarea 1.2 — Ajustar `storage.rules`
- Alinear reglas con los paths reales de `service-orders`.
- Mantener restricciones de tipo de archivo y tamaño.
- Salida: reglas desplegables sin ambigüedad.

### Tarea 1.3 — Prueba de subida de adjuntos
- Caso: subir adjuntos desde closeout.
- Criterio: sin `storage/unauthorized`, URL persistida en `service_orders`.

### Tarea 1.4 — Prueba de subida de fotos de novedad
- Caso: novedad con mínimo 2 fotos.
- Criterio: fotos suben, issue se guarda, timeline consistente.

### Tarea 1.5 — Prueba de fotos de cierre
- Caso: cierre con evidencia.
- Criterio: fotos guardadas y visibles en detalle/reporte.

### Tarea 1.6 — Asignación usable desde listado
- Agregar/validar CTA explícito `Asignar/Reasignar técnico`.
- Criterio: servicio sin técnico queda asignado en <=3 clics.

### Tarea 1.7 — Asignación usable desde detalle
- Exponer la misma acción desde `ServiceDetailPage` (si falta).
- Criterio: no depender de una sola pantalla para asignar.

### Tarea 1.8 — Consolidar transición al asignar
- Validar estatus resultante según técnico asignado.
- Criterio: `unassigned -> scheduled` (o `confirmed` según flujo definido).

### Tarea 1.9 — Corregir visibilidad técnico
- Normalizar matching identidad técnico (`employee.id`, `user.uid`, fallback controlado).
- Criterio: técnico ve exactamente sus servicios asignados.

### Tarea 1.10 — Checklist de cierre completo
- Verificar obligatoriedad de campos críticos y persistencia.
- Criterio: cierre inválido bloquea guardado; cierre válido persiste completo.

---

## Bloque 2 — Flujo completo de producto

### Tarea 2.1 — Crear servicio con catálogo real
- Input `type` solo por select desde `settings/service_types`.
- Criterio: no input libre en flujo operativo principal.

### Tarea 2.2 — Manejo de tipos inactivos/legacy
- Si un servicio histórico usa tipo no activo, mostrar fallback legible sin romper edición.
- Criterio: editar no destruye datos legacy.

### Tarea 2.3 — Edición completa operativa
- Definir y consolidar punto único de edición completa.
- Criterio: link funcional desde scheduling/services/buildings.

### Tarea 2.4 — Confirmación explícita
- Validar acción de confirmación en UI + dominio.
- Criterio: `scheduled -> confirmed` usable y auditado.

### Tarea 2.5 — Reprogramación usable
- Validar flujo con/sin técnico asignado.
- Criterio: resultado consistente en estado y horarios.

### Tarea 2.6 — Cancelación con razón
- Exigir razón + nota opcional; guardar en timeline/metadata.
- Criterio: trazabilidad completa de cancelación.

### Tarea 2.7 — Cierre y reporte conectados
- Verificar continuidad: closeout -> print -> PDF.
- Criterio: misma historia en las tres salidas.

---

## Bloque 3 — UX/UI y coherencia

### Tarea 3.1 — Unificar header por vista
- Remover duplicación en páginas afectadas.
- Criterio: un solo header semántico por pantalla.

### Tarea 3.2 — Afinar estados vacíos/cargas/errores
- Revisar mensajes y CTA en scheduling/services/closeout.
- Criterio: el usuario siempre tiene siguiente paso claro.

### Tarea 3.3 — Navegación operativa coherente
- Revisar links entre agenda, services, detalle y cierre.
- Criterio: no hay rutas muertas ni redirecciones confusas.

### Tarea 3.4 — Validar favicon/branding en deploy
- Criterio: icono visible en ambiente desplegado.

---

## Bloque 4 — CI/Seed develop

### Tarea 4.1 — Hardening de limpieza de datos
- Ajustar `firestore:clear` para evitar residuos y errores intermitentes.
- Criterio: corrida repetible sin intervención manual.

### Tarea 4.2 — Hardening de seed base
- Asegurar seed mínimo completo: settings, usuarios, técnicos, servicios de ejemplo.
- Criterio: app usable al terminar seed.

### Tarea 4.3 — Integración en workflow develop
- Ejecutar clear+seed tras deploy correspondiente.
- Criterio: ambiente develop siempre actualizado.

### Tarea 4.4 — Smoke checks automáticos
- Verificar colecciones y mínimos de datos críticos.
- Criterio: pipeline falla si faltan datos mínimos.

### Tarea 4.5 — Documentación operativa corta
- Actualizar guía de seed/CI para operación diaria.
- Criterio: reproducible por cualquier colaborador.

---

## Validación final

### Pruebas funcionales mínimas
1. Crear servicio rápido con tipo del catálogo.
2. Dejarlo sin técnico y asignarlo después.
3. Confirmar/reprogramar/cancelar.
4. Ejecutar cierre con checklist + fotos + novedad.
5. Verificar aparición correcta en vista técnico.
6. Generar/revisar reporte imprimible y PDF.

### Gates técnicos
- `npm run test` (subset crítico + dominio)
- `npm run typecheck`
- `npm run build:minimum`

## Entregables
- PR por bloque o sub-bloque (scope pequeño, validable).
- Changelog operativo del flujo final.
- Estado final de deuda residual (si queda algo fuera de fase 2).
