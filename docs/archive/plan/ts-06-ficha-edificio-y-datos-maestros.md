# TS-06 — Especificación técnica

# Diseñar ficha de edificio y datos maestros operativos

## Estado

Draft técnico inicial, aterrizado contra la implementación actual del proyecto.

## Objetivo

Convertir la ficha de edificio en el nodo maestro operativo del sistema.

TS-06 debe definir:

- qué información vive realmente en el edificio
- qué información se hereda o se referencia desde administración y contrato
- cómo debe verse la ficha operativa
- qué relaciones necesita con agenda, servicios, reportes y grupos de asignación
- qué cambios requiere el modelo actual para soportar el producto definido

---

## 1. Hallazgo principal sobre el código actual

Hoy `Building` ya existe y tiene bastante información útil, pero mezcla varias capas y todavía no funciona como nodo operativo integral.

### Modelo actual
Archivo: `src/core/models/building.ts`

```ts
export type Building = {
  id: string;
  name: string;
  group: string;
  type: 'EDIFICIO' | 'CONJUNTO_RESIDENCIAL' | 'UNIDAD';
  delegateName: string;
  delegatePhone: string;
  nit: string;
  email: string;
  billingEmail: string;
  porterPhone: string;
  managementCompanyId: string;
  contractId?: string;
  addressText: string;
  location: { lat: number; lng: number };
  googlePlaceId: string;
  active?: boolean;
  createdAt?: string;
};
```

### Lo bueno

Ya resuelve:

- identidad básica
- ubicación
- vínculo con administración
- vínculo con contrato
- datos de contacto

### Lo que falta para la visión del producto

Falta que el edificio sea el punto donde convergen:

- grupo de asignación
- equipos
- bombas
- historial de servicios
- documentos
- contexto operativo y comercial resumido
- navegación hacia agenda y reportes

---

## 2. Decisión estructural

## Recomendación fuerte

El edificio debe ser la **unidad operativa principal de consulta**.

No necesariamente la fuente de verdad de todas las entidades, pero sí el punto desde el cual un usuario pueda entender y operar casi todo lo relacionado con ese cliente físico.

### Qué implica

La ficha de edificio no es solo un formulario CRUD.
Debe funcionar como:

- master record
- hub de operación
- hub de contexto
- punto de entrada a acciones futuras

---

## 3. Modelo de datos propuesto para Building

## 3.1 Propuesta refinada

```ts
export type Building = {
  id: string;
  name: string;
  type: 'EDIFICIO' | 'CONJUNTO_RESIDENCIAL' | 'UNIDAD';

  managementCompanyId: string;
  contractId?: string | null;
  assignmentGroupId?: string | null;

  addressText: string;
  location: { lat: number; lng: number };
  googlePlaceId?: string;

  contactName?: string;
  contactPhone?: string;
  porterPhone?: string;
  email?: string;
  billingEmail?: string;
  nit?: string;

  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
```

## 3.2 Normalización sugerida

### Mantener en Building

- nombre
- tipo
- ubicación
- contacto del edificio
- portería
- referencia a administración
- referencia a contrato
- referencia a grupo de asignación

### No embutir directamente como dato maestro cerrado en esta etapa

- bombas estructuradas
- equipos complejos
- historial operativo duplicado
- documentos binarios como payload dentro del documento

Eso debe resolverse por relaciones, no por inflar el documento.

---

## 4. Relaciones clave del edificio

## 4.1 Con administración

Relación actual:

- `managementCompanyId`

Debe mantenerse.

## 4.2 Con contrato

Relación actual:

- `contractId`

Debe mantenerse, pero contemplando que a futuro puede haber más de uno históricamente.

En V1 basta con:

- contrato activo principal

## 4.3 Con grupo de asignación

Debe migrar desde:

- `group: string`

a:

- `assignmentGroupId?: string | null`

## 4.4 Con servicios

No se guardan embebidos, pero la ficha debe consultar:

- servicios próximos
- servicios en curso
- historial reciente
- servicios con novedad

## 4.5 Con reportes

La ficha debe poder exponer:

- últimos reportes
- hallazgos críticos recientes
- acceso a reportes completos

## 4.6 Con documentos

La ficha debe listar documentos asociados, pero como relación o colección ligada.

---

## 5. Qué debe mostrar la ficha de edificio

## 5.1 Bloque identidad

- nombre
- tipo
- estado activo/inactivo
- administración
- contrato activo
- grupo de asignación

## 5.2 Bloque ubicación y contacto

- dirección
- mapa o preview geográfico
- persona de contacto
- teléfono de contacto
- teléfono de portería
- correo operativo
- correo de facturación
- NIT

## 5.3 Bloque operación

- próximos servicios
- último servicio ejecutado
- servicios con novedad
- estado del contrato relacionado
- grupo de asignación actual

## 5.4 Bloque técnico

- equipos asociados
- bombas asociadas o referencia a contexto técnico del edificio
- último reporte
- hallazgos críticos recientes

## 5.5 Bloque documental

- documentos
- archivos relevantes
- accesos a cotizaciones o contratos si aplica

---

## 6. Estado del código actual y gap real

## 6.1 BuildingsPage

La página actual ya permite:

- listar edificios
- crear
- editar
- importar
- ver mapa
- ver detalle básico

### Gap

Sigue siendo una pantalla principalmente administrativa.
No es todavía una ficha operativa profunda.

## 6.2 ClientSummaryPage

Ya usa edificio para derivar servicios por administración.

### Oportunidad

La ficha de edificio puede convertirse en el punto de navegación natural tanto para operación interna como para vistas filtradas de cliente.

## 6.3 Scheduling y Services

Ambas vistas ya dependen del `buildingId` como pivote.

### Conclusión

La ficha de edificio es la mejor capa para unificar:

- grupo
- agenda
- servicio
- reporte
- cliente

---

## 7. Decisión sobre bombas y equipos

## Confirmado por negocio

Hoy las bombas no son entidad maestra fuerte. Viven más como dato dentro del reporte.

## Recomendación técnica para TS-06

La ficha de edificio debe prever una zona de contexto técnico, pero sin forzar aún una entidad rígida completa para bombas.

### Propuesta V1

En ficha de edificio:

- mostrar resumen técnico liviano
- reservar espacio para configuración futura
- no sobrediseñar un modelo de activos si el negocio aún no lo cerró

### Implicación

TS-06 debe dejar preparada la UI y el modelo relacional para crecer, pero no obligar todavía a resolver toda la capa de activos.

---

## 8. Estructura recomendada en Firestore

## 8.1 Colección principal

- `buildings/{buildingId}`

## 8.2 Subcolecciones o colecciones relacionadas futuras

Opciones razonables:

- `buildings/{buildingId}/documents`
- `buildings/{buildingId}/notes`
- `buildings/{buildingId}/contacts`

O relaciones globales consultadas por `buildingId`:

- `service_orders`
- `service_reports`
- `quotations`
- `documents`

## Recomendación V1

No anidar demasiado pronto si el acceso principal será transversal.

Preferir relaciones globales por `buildingId` para:

- servicios
- reportes
- cotizaciones

Y subcolecciones solo cuando tengan sentido de encapsulación clara, por ejemplo documentos internos del edificio.

---

## 9. Permisos esperados sobre la ficha

## Admin

- ver
- crear
- editar
- activar/desactivar
- cambiar grupo
- cambiar contrato

## Supervisor

- ver
- editar datos operativos relevantes
- gestionar grupo de asignación

## Programador

- ver contexto operativo
- usar grupo y agenda relacionada

## Operador

- ver contexto necesario del edificio para ejecución

## Cliente

No debe ver la ficha interna completa.
Solo vistas derivadas y resumidas según portal.

---

## 10. Auditoría requerida

La ficha debe integrarse con auditoría visible en UI.

Eventos mínimos:

- edificio creado
- edificio editado
- edificio activado/inactivado
- contrato cambiado
- grupo cambiado
- contacto actualizado
- dirección actualizada

### Requisito

La auditoría debe ser consultable por `buildingId`.

---

## 11. Riesgos técnicos

1. seguir mezclando datos de administración con datos propios del edificio
2. dejar `group` como string demasiado tiempo
3. intentar modelar equipos y bombas demasiado pronto
4. crear una ficha solo visual, sin valor operativo real

## Mitigación

- separar campos propios del edificio de relaciones externas
- migrar a `assignmentGroupId`
- mantener capa técnica extensible pero ligera en V1
- orientar la ficha a consulta operativa real

---

## 12. Criterios de aceptación refinados para TS-06

- existe definición clara del edificio como nodo operativo
- existe modelo actualizado de `Building`
- existe relación clara con administración, contrato y grupo
- existe definición de bloques funcionales de la ficha
- existe definición de permisos por rol
- existe estrategia de auditoría por edificio
- existe postura explícita sobre bombas, equipos y documentos en V1

---

## 13. Dependencias

TS-06 depende directamente de:

- TS-01
- TS-02

TS-06 desbloquea y mejora:

- TS-03 calendario multirol
- TS-07 reporte técnico base
- TS-12 portal de cliente

---

## 14. Recomendación de implementación posterior

Después de TS-06, el siguiente paso correcto es TS-03.

Motivo:

Con modelo base, grupos y ficha de edificio definidos, ya existe suficiente estructura para aterrizar el calendario multirol con menos retrabajo.