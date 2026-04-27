# TS-09 — Especificación técnica

# Implementar revisión de reportes y transición a con_novedad

## Estado

Draft técnico inicial, alineado con TS-07 y TS-08.

## Objetivo

Diseñar el flujo de revisión supervisor para reportes de servicio, incluyendo devolución para ajustes, aprobación y transición del servicio a `con_novedad` cuando aplique.

TS-09 debe resolver:

- cola de revisión
- acciones del supervisor
- estados del reporte
- impacto sobre el estado del servicio
- comentarios y devolución
- trazabilidad de revisión

---

## 1. Reglas confirmadas por negocio

- el reporte debe pasar por revisión de supervisor
- el supervisor puede devolver el reporte al operador con correcciones
- cuando el supervisor devuelve el reporte, el servicio pasa a `con_novedad` directamente
- `con_novedad` puede dispararse opcionalmente por:
  - hallazgo crítico
  - devolución de reporte
  - incidente operativo
  - imposibilidad de ejecución

---

## 2. Decisión estructural

## Recomendación fuerte

La revisión no debe ser un simple cambio de estado manual.

Debe ser un subflujo formal del ciclo de vida del reporte y del servicio.

---

## 3. Estados involucrados

## Reporte

- `completado_por_operador`
- `en_revision_supervisor`
- `devuelto_para_ajustes`
- `aprobado`

## Servicio

- `reportado`
- `en_revision`
- `con_novedad`
- `cerrado`

---

## 4. Flujo propuesto

## 4.1 Operador completa

- reporte pasa a `completado_por_operador`
- servicio pasa a `reportado`

## 4.2 Supervisor toma revisión

- reporte pasa a `en_revision_supervisor`
- servicio pasa a `en_revision`

## 4.3 Supervisor devuelve

- reporte pasa a `devuelto_para_ajustes`
- servicio pasa a `con_novedad`
- se registra comentario o comentarios de devolución

## 4.4 Supervisor aprueba

- reporte pasa a `aprobado`
- servicio pasa a `cerrado` salvo otra regla superior

---

## 5. Comentarios de revisión

## Recomendación

Cada devolución debe registrar comentarios estructurados.

```ts
export type ReportReviewComment = {
  id: string;
  reportId: string;
  authorId: string;
  authorRole: 'supervisor' | 'admin';
  message: string;
  createdAt: string;
};
```

---

## 6. Modelo de revisión sugerido

```ts
export type ReportReviewDecision = 'approve' | 'return_for_changes';

export type ReportReviewEvent = {
  id: string;
  reportId: string;
  serviceOrderId: string;
  reviewerId: string;
  decision: ReportReviewDecision;
  comments?: string;
  createdAt: string;
};
```

---

## 7. Cola de revisión

La UI debe soportar una cola de reportes por revisar.

### Criterios recomendados de entrada a la cola

- estado `completado_por_operador`
- estado `en_revision_supervisor`

### Vista mínima

- servicio
- edificio
- operador
- fecha de cierre
- estado
- indicadores de criticidad

---

## 8. Integración con TS-07

TS-09 depende directamente de `ServiceReport` como entidad propia.

La devolución no debe editar directamente el reporte por detrás.
Debe abrir nuevamente el flujo del operador con contexto claro de ajustes pendientes.

---

## 9. Regla de trazabilidad

Cada revisión debe dejar claro:

- quién revisó
- cuándo
- qué decidió
- qué comentó
- cómo cambió el estado del reporte
- cómo cambió el estado del servicio

---

## 10. Auditoría mínima requerida

Eventos mínimos:

- reporte enviado a revisión
- reporte tomado por supervisor
- reporte devuelto
- comentario de devolución agregado
- reporte aprobado
- servicio pasado a `con_novedad`
- servicio cerrado por aprobación de reporte

---

## 11. Riesgos técnicos

1. aprobar reportes sin comentario suficiente
2. devolver reportes sin contexto claro para el operador
3. mezclar comentarios de revisión con observaciones técnicas del reporte
4. no alinear el estado del servicio con el estado del reporte

## Mitigación

- comentarios de revisión separados
- flujo de devolución explícito
- reglas de transición definidas
- auditoría obligatoria

---

## 12. Criterios de aceptación refinados para TS-09

- existe subflujo de revisión formal definido
- existe cola de revisión definida
- existe modelo de comentarios de revisión
- existe modelo de decisión de revisión
- existe transición explícita a `con_novedad`
- existe trazabilidad de revisión definida

---

## 13. Dependencias

TS-09 depende de:

- TS-07
- TS-08 en casos de servicios largos

TS-09 alimenta:

- calidad operativa
- auditoría
- IA de revisión futura si se desea

---

## 14. Recomendación de ejecución posterior

Después de TS-09, el siguiente paso correcto es TS-10 porque el sistema ya necesita pensar más seriamente en variabilidad de reportes por tenant y por tipo de servicio.