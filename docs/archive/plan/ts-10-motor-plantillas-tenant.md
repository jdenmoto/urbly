# TS-10 — Especificación técnica

# Diseñar motor de plantillas de reporte por tenant

## Estado

Draft técnico inicial, alineado con la variabilidad multi-tenant definida en el plan.

## Objetivo

Definir la arquitectura del motor de plantillas de reporte para soportar variabilidad por tenant y por tipo de servicio sin romper el núcleo operativo común.

TS-10 debe resolver:

- núcleo obligatorio común
- bloques variables
- campos obligatorios configurables
- plantillas por tipo de servicio
- editor visual
- alcance de configuración por tenant

---

## 1. Reglas confirmadas por negocio

- esto depende del tenant
- un tenant puede:
  - activar/desactivar campos
  - escoger plantilla por tipo de servicio
  - definir campos obligatorios
  - definir bloques propios
- debe existir editor visual
- hay un núcleo común obligatorio, pero las plantillas también pueden divergir según tenant

---

## 2. Decisión estructural

## Recomendación fuerte

No modelar la plantilla como un formulario libre totalmente dinámico desde el día uno.

Conviene usar un enfoque híbrido:

- núcleo operativo fijo
- bloques configurables
- metadata de obligatoriedad y visibilidad
- extensión controlada por tenant

---

## 3. Núcleo común obligatorio

Confirmado como común siempre:

- fotos
- observaciones
- firma
- geolocalización
- datos del edificio
- operador
- fecha/hora
- número serial consecutivo

## Recomendación

Ese núcleo no debe poder eliminarse por tenant.

---

## 4. Modelo conceptual recomendado

```ts
export type ReportTemplate = {
  id: string;
  tenantId: string;
  serviceTypeId?: string | null;
  name: string;
  active: boolean;
  version: number;
  schema: ReportTemplateSchema;
  createdAt?: string;
  updatedAt?: string;
};

export type ReportTemplateSchema = {
  core: ReportTemplateCoreConfig;
  blocks: ReportTemplateBlock[];
};

export type ReportTemplateCoreConfig = {
  photos: { enabled: true; required: boolean };
  observations: { enabled: true; required: boolean };
  signature: { enabled: true; required: boolean };
  geolocation: { enabled: true; required: boolean };
  buildingContext: { enabled: true };
  operatorContext: { enabled: true };
  datetimeContext: { enabled: true };
  serialNumber: { enabled: true };
};

export type ReportTemplateBlock = {
  id: string;
  type: 'checklist' | 'presence_state' | 'text' | 'structured_observation' | 'custom_group';
  title: string;
  enabled: boolean;
  required?: boolean;
  config?: Record<string, unknown>;
};
```

---

## 5. Asignación por tenant y tipo de servicio

## Reglas

- una plantilla puede ser global al tenant
- o específica para un tipo de servicio

## Resolución sugerida

1. buscar plantilla específica por tenant + tipo de servicio
2. si no existe, usar plantilla default del tenant
3. si no existe, usar plantilla base del sistema

---

## 6. Editor visual

## Confirmado

Debe existir editor visual.

## Recomendación V1

No construir un form builder arbitrario de baja estructura.

### Mejor enfoque

Editor estructurado por bloques configurables:

- activar/desactivar
- reordenar
- marcar obligatorio
- parametrizar opciones conocidas
- agregar bloques custom controlados

---

## 7. Variabilidad permitida

## Debe permitirse por tenant

- cambiar obligatoriedad
- activar o desactivar bloques opcionales
- seleccionar plantilla por tipo de servicio
- definir bloques propios

## No debe permitirse quitar

- núcleo común obligatorio

---

## 8. Relación con TS-07

TS-07 define el reporte base.
TS-10 define cómo ese reporte base se vuelve configurable sin perder integridad.

### Regla clave

La plantilla determina la UI y validaciones del reporte, no el lifecycle del reporte.

---

## 9. Auditoría mínima requerida

Eventos mínimos:

- plantilla creada
- plantilla editada
- plantilla activada o desactivada
- plantilla asignada a tipo de servicio
- bloque agregado, reordenado o eliminado

---

## 10. Riesgos técnicos

1. construir un editor demasiado libre y difícil de mantener
2. dejar que tenants rompan el núcleo común
3. mezclar configuración visual con lifecycle de negocio
4. no versionar plantillas

## Mitigación

- esquema híbrido
- núcleo fijo
- versionado de plantilla
- bloques controlados

---

## 11. Criterios de aceptación refinados para TS-10

- existe modelo de plantilla por tenant definido
- existe núcleo común obligatorio definido
- existe mecanismo por tipo de servicio definido
- existe estrategia de editor visual definida
- existe diferenciación entre bloques fijos y configurables
- existe auditoría mínima de plantillas definida

---

## 12. Dependencias

TS-10 depende de:

- TS-07
- TS-22

TS-10 alimenta:

- reportes por tenant
- experiencia multi-tenant real

---

## 13. Recomendación de ejecución posterior

Después de TS-10, conviene atacar las capas transversales: auditoría, notificaciones, portal y multi-tenant, porque ya son el siguiente cuello de botella del sistema.