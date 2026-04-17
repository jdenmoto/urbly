# TS-19 — Especificación técnica

# Diseñar modelo de datos de auditoría transversal y exportación

## Estado

Draft técnico inicial, consolidando la necesidad transversal de trazabilidad del producto.

## Objetivo

Definir el modelo de datos canónico de auditoría que alimente la UI de auditoría, exportación, filtros avanzados y eventos de módulos como servicios, reportes, cotizaciones, grupos, notificaciones e IA.

TS-19 debe resolver:

- shape canónico del evento
- entidades auditables
- tipos de acción
- diff
- metadata
- exportación
- consulta filtrada

---

## 1. Alcance transversal

La auditoría debe servir al menos a:

- edificios
- grupos de asignación
- servicios
- reportes
- cotizaciones
- tokens seguros
- notificaciones
- sugerencias IA
- configuraciones tenant-aware

---

## 2. Modelo canónico recomendado

```ts
export type AuditEntityType =
  | 'building'
  | 'assignment_group'
  | 'service_order'
  | 'service_report'
  | 'service_report_daily_progress'
  | 'quotation'
  | 'quotation_version'
  | 'quotation_secure_token'
  | 'notification'
  | 'ai_suggestion'
  | 'tenant_policy';

export type AuditEvent = {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  actorId?: string;
  actorRole?: string;
  summary: string;
  diff?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
```

---

## 3. Campos mínimos

- `entityType`
- `entityId`
- `action`
- `summary`
- `createdAt`

## Muy recomendados

- `actorId`
- `actorRole`
- `diff`
- `metadata`

---

## 4. Tipos de acción sugeridos

Ejemplos:

- created
- updated
- deleted_soft
- activated
- deactivated
- assigned
- rescheduled
- returned_for_changes
- approved
- rejected
- token_generated
- token_invalidated
- notification_read
- ai_suggestion_generated
- ai_suggestion_accepted
- ai_suggestion_rejected

---

## 5. Diff

## Recomendación

El diff no debe ser obligatorio para todos los eventos, pero sí para los cambios estructurales importantes.

Especialmente:

- cotizaciones
- plantillas
- grupos
- configuración tenant

---

## 6. Metadata

Debe permitir contexto extra como:

- tenantId
- module
- route
- reason
- previousStatus
- newStatus
- tokenId
- aiCapability

---

## 7. Exportación

TS-19 define la base de exportación consumida por TS-14.

## Recomendación V1

- CSV
- JSON

Exportable desde filtros aplicados.

---

## 8. Consulta y filtros

Debe soportar al menos:

- entidad
- usuario
- fecha
- tipo de cambio
- uso de IA

---

## 9. Persistencia

## Recomendación

Colección global:

- `audit_events/{eventId}`

Ventajas:

- filtros globales más simples
- exportación transversal
- analytics y compliance más fáciles

---

## 10. Riesgos técnicos

1. demasiados formatos por módulo
2. diffs inconsistentes
3. metadata caótica
4. baja utilidad de exportación si el modelo no es consistente

## Mitigación

- contrato único
- helper común para generar eventos
- catálogo básico de acciones
- metadata acotada por convención

---

## 11. Criterios de aceptación refinados para TS-19

- existe modelo canónico de `AuditEvent`
- existen entidades auditables definidas
- existe catálogo inicial de acciones
- existe estrategia para diff y metadata
- existe base de exportación definida
- existe estrategia de filtros definida

---

## 12. Dependencias

TS-19 alimenta directamente:

- TS-14
- TS-13
- TS-15
- TS-16
- TS-17
- TS-21

---

## 13. Recomendación de ejecución posterior

Después de TS-19, conviene atacar TS-20 o TS-21 según si prefieres seguir por notificaciones o por el portal seguro.