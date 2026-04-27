# TS-11 — Especificación técnica

# Implementar flujo de cotización versionada y revisión interna

## Estado

Draft técnico inicial, aterrizado contra la situación actual del proyecto.

## Objetivo

Diseñar la capa de cotizaciones del sistema como flujo comercial y contractual formal, con versionado, revisión interna, entrega controlada y respuesta del cliente.

TS-11 debe definir:

- modelo de cotización
- estados internos y externos
- versionado
- edición auditable
- roles involucrados
- enlace seguro para cliente
- relación con contratos y activación operativa posterior

---

## 1. Hallazgo principal sobre el estado actual

Hoy no existe una capa real de cotizaciones implementada en frontend o modelos principales del repo.

### Lo que sí existe

- contratos
- administraciones
- edificios
- capacidades de PDF en backend para agenda
- portal cliente parcial

### Lo que no existe aún

- entidad `Quotation`
- flujo de revisión supervisor
- versionado
- diff auditable
- enlace seguro del cliente
- estados de cotización
- regeneración de enlace
- integración formal con aprobación cliente

### Conclusión

TS-11 es fundacional, no incremental.

---

## 2. Decisión estructural

## Recomendación fuerte

La cotización debe ser una entidad propia y no un apéndice del contrato.

### Razón

El contrato es consecuencia o capa posterior.
La cotización tiene su propio lifecycle:

- creación
- revisión
- entrega
- respuesta del cliente
- versionado
- aprobación o rechazo

---

## 3. Roles involucrados

## Confirmado

### Admin

- crea cotizaciones
- ve todo
- puede intervenir en todo

### Comercial

- crea cotizaciones
- ve cotizaciones de su equipo
- regenera enlace seguro

### Supervisor

- revisa cotizaciones
- aprueba, rechaza o edita internamente

### Cliente

- aprueba cotización completa
- rechaza
- pide cambios
- interactúa vía enlace seguro

---

## 4. Estados de cotización

## Estado final confirmado

```ts
export type QuotationStatus =
  | 'borrador'
  | 'generado'
  | 'en_revision_supervisor'
  | 'rechazado_interno'
  | 'aprobado_interno'
  | 'listo_para_entrega'
  | 'entregado_al_cliente'
  | 'en_revision_cliente'
  | 'cambios_solicitados_por_cliente'
  | 'aprobado_por_cliente'
  | 'rechazado_por_cliente'
  | 'vencido'
  | 'anulado';
```

## Comentario

Esto elimina la ambigüedad de `revisado` y `entregado` heredada del planteamiento inicial.

---

## 5. Modelo técnico base

```ts
export type Quotation = {
  id: string;
  version: number;
  status: QuotationStatus;

  createdBy: string;
  createdByRole: 'admin' | 'comercial';
  reviewerId?: string | null;

  customerId?: string | null;
  administrationId?: string | null;
  buildingIds?: string[];
  contractDraftId?: string | null;

  title?: string;
  summary?: string;
  lineItems?: QuotationLineItem[];
  totals?: QuotationTotals;
  notes?: string;

  customerRequestMessage?: string | null;
  internalReviewNotes?: string | null;

  secureTokenId?: string | null;

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
```

### Submodelos sugeridos

```ts
export type QuotationLineItem = {
  id: string;
  code?: string;
  label: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  metadata?: Record<string, unknown>;
};

export type QuotationTotals = {
  subtotal: number;
  taxes?: number;
  discounts?: number;
  total: number;
  currency?: string;
};
```

---

## 6. Versionado

## Confirmado por negocio

- versión 1, 2, 3...
- diff auditable
- motivo obligatorio en cambios internos relevantes

## Recomendación técnica

No sobreescribir silenciosamente la misma versión.

### Opción recomendada

Nueva versión lógica sobre el mismo expediente de cotización.

#### Dos caminos posibles

### Opción A
`quotation` + `quotation_versions`

### Opción B
cada versión como documento independiente ligado por `quotationRootId`

## Recomendación V1

Usar expediente raíz + versiones asociadas.

```ts
export type QuotationVersion = {
  id: string;
  quotationId: string;
  version: number;
  snapshot: Record<string, unknown>;
  changedBy: string;
  changeReason: string;
  diff?: Record<string, unknown>;
  createdAt: string;
};
```

---

## 7. Revisión interna

## Confirmado

El supervisor puede:

- aprobar
- rechazar
- editar

## Reglas

### Si aprueba

- pasa a `aprobado_interno`
- queda lista para entrega

### Si rechaza

- pasa a `rechazado_interno`
- vuelve a quien la generó

### Si edita

- debe quedar auditoría completa
- debe registrarse qué cambió
- debe quedar motivo
- debe crear nueva versión

---

## 8. Entrega al cliente

## Confirmado

- se puede entregar por enlace seguro
- el enlace expira
- configurable a nivel sistema
- default de 15 días hábiles

## Regla importante

Hay que distinguir:

- `listo_para_entrega`
- `entregado_al_cliente`

### Porque

No siempre entregar es equivalente a haberlo enviado efectivamente.

---

## 9. Enlace seguro

## Modelo recomendado

```ts
export type QuotationSecureToken = {
  id: string;
  quotationId: string;
  version: number;
  tokenHash: string;
  expiresAt: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  invalidatedAt?: string | null;
};
```

## Reglas confirmadas

- el cliente pide nuevo enlace al comercial
- el comercial puede regenerarlo directamente
- la regeneración crea token nuevo sobre la misma versión
- el anterior debe invalidarse
- la acción queda auditada
- el motivo es opcional

---

## 10. Interacción del cliente

## Confirmado

El cliente puede:

- aprobar la cotización completa
- rechazar
- pedir cambios
- escribir texto libre

## No permitido

- aprobación parcial por ítems

## Reglas adicionales

- interfaz en lenguaje comercial
- descarga PDF mientras el enlace esté vigente

---

## 11. Rechazo o cambios del cliente

## Confirmado

Si el cliente rechaza:

- vuelve a revisión interna
- genera nueva versión editable

Si pide cambios:

- debe quedar mensaje del cliente
- debe reingresar a circuito interno

---

## 12. Relación con contrato y operación

TS-11 no implementa todo TS-08, pero debe dejar bien atado el vínculo.

## Regla confirmada

Cuando la cotización es aprobada por cliente:

- puede activar la operación
- si aplica servicios periódicos, después se generan agendamientos
- si hay fecha futura específica, no puede agendarse antes de esa fecha

### Recomendación técnica

Guardar en cotización:

- flags de activación futura
- fecha mínima de inicio
- referencia a servicios periódicos asociados

---

## 13. PDF y salida documental

Hoy ya existe capacidad de PDF para agenda, no para cotizaciones.

TS-11 debe definir que la cotización tendrá:

- render PDF propio
- versión imprimible
- separación entre contenido interno y contenido cliente

---

## 14. Auditoría mínima requerida

Eventos mínimos:

- cotización creada
- cotización enviada a revisión
- cotización aprobada internamente
- cotización rechazada internamente
- cotización editada
- versión creada
- enlace generado
- enlace regenerado
- enlace invalidado
- cliente aprobó
- cliente rechazó
- cliente pidió cambios

---

## 15. Riesgos técnicos

1. mezclar cotización y contrato desde el primer día
2. no separar expediente y versión
3. exponer estado interno al cliente tal cual
4. regenerar enlaces sin invalidar el anterior
5. no auditar cambios del supervisor

## Mitigación

- entidad propia de cotización
- versionado explícito
- lenguaje comercial para cliente
- token seguro independiente
- auditoría desde el diseño

---

## 16. Criterios de aceptación refinados para TS-11

- existe entidad `Quotation` definida
- existe modelo de versiones definido
- existen estados internos y externos definidos
- existe modelo de enlace seguro definido
- existe flujo de revisión supervisor definido
- existe comportamiento de rechazo o cambio del cliente definido
- existe relación conceptual con contrato y activación operativa
- existe auditoría mínima definida

---

## 17. Dependencias

TS-11 depende de:

- definición global de roles
- modelo de auditoría propuesto en TS-01

TS-11 desbloquea directamente:

- TS-12 portal seguro del cliente
- generación operativa posterior a aprobación

---

## 18. Recomendación de ejecución posterior

Una vez cerrado TS-11, la siguiente fase natural ya no es seguir con las tarjetas originales de To Do, sino:

1. revisar las historias producidas
2. partir las más grandes en subtareas de implementación
3. decidir si el siguiente frente es portal cliente, reportes o auditoría