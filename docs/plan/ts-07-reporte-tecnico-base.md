# TS-07 — Especificación técnica

# Implementar reporte técnico base con borrador, evidencia y cierre

## Estado

Draft técnico inicial, aterrizado contra la implementación actual del proyecto.

## Objetivo

Diseñar e implementar el reporte técnico base como entidad y flujo formal del sistema, desacoplándolo del cierre embebido actual sobre `Appointment`.

TS-07 debe definir:

- estructura base del reporte
- manejo de borradores
- checklist técnico
- observaciones estructuradas y libres
- evidencia fotográfica
- firma manuscrita
- geolocalización o justificación
- cierre controlado del reporte

---

## 1. Hallazgo principal sobre el código actual

Hoy existe una implementación parcial dentro de `SchedulingPage.tsx` y `completionReport` embebido en `Appointment`.

### Lo que ya existe

- checklist técnico amplio
- múltiples bombas dinámicas
- observaciones
- fotos
- novedades
- cierre del servicio desde agenda

### Problemas actuales

1. el reporte vive mezclado con agenda
2. no existe entidad propia de reporte
3. no existe estado formal de borrador persistido del reporte
4. no existe separación fuerte entre ejecución y revisión
5. firma y geolocalización aún no aparecen como capacidad formal integrada
6. fotos y estructura técnica viven demasiado acopladas al formulario actual

---

## 2. Decisión estructural

## Recomendación fuerte

El reporte técnico debe existir como entidad propia `ServiceReport` ligada a `ServiceOrder`.

No debe seguir siendo solo `completionReport` embebido en `Appointment` o `ServiceOrder`.

### Justificación

El reporte ya tiene suficiente complejidad para requerir:

- lifecycle propio
- borrador
- revisión
- trazabilidad
- evidencia asociada
- evolución futura por tenant y tipo de servicio

---

## 3. Estructura del reporte

## 3.1 Estado del reporte

Confirmado:

- `borrador`
- `completado_por_operador`
- `en_revision_supervisor`
- `devuelto_para_ajustes`
- `aprobado`

## 3.2 Modelo base sugerido

```ts
export type ServiceReportStatus =
  | 'borrador'
  | 'completado_por_operador'
  | 'en_revision_supervisor'
  | 'devuelto_para_ajustes'
  | 'aprobado';

export type ServiceReport = {
  id: string;
  serviceOrderId: string;
  buildingId: string;
  operatorId: string;
  status: ServiceReportStatus;

  entryHour?: string;
  exitHour?: string;
  observations?: string;
  structuredObservations?: StructuredObservation[];

  checklist?: Record<string, unknown>;
  photoIds?: string[];
  signatureUrl?: string | null;
  geo?: { lat: number; lng: number } | null;
  geoJustification?: string | null;

  completedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
```

---

## 4. Checklist técnico

## 4.1 Confirmado por negocio

En esta etapa el checklist es fijo.

## 4.2 Estructura funcional

Hay tres grandes bloques:

### Grupo 1
Componentes evaluados por bomba.

Cada bomba puede tener:

- estado buena / regular / mala
- red de distribución buena / regular / mala

### Grupo 2
Componentes generales con estado.

### Grupo 3
Componentes con presencia y estado, incluyendo válvula flotadora con diámetro.

## 4.3 Recomendación técnica

No usar solo `Record<string, string>` a largo plazo como única fuente semántica.

### V1 pragmática

Puede mantenerse serialización flexible para rapidez.

### Pero documentar shape esperado

Ejemplo conceptual:

```ts
export type ChecklistValue = 'buena' | 'regular' | 'mala' | 'na';

export type PumpChecklistEntry = {
  itemKey: string;
  state: ChecklistValue;
  distributionNetworkState?: ChecklistValue;
};

export type GeneralChecklistEntry = {
  itemKey: string;
  presence?: boolean;
  state?: ChecklistValue;
  diameter?: string | null;
};
```

---

## 5. Observaciones

## 5.1 Tipos de observación

### Observación libre

Texto amplio del operador.

### Observaciones estructuradas

Confirmado por negocio:

- hallazgo
- impacto
- acción recomendada
- prioridad

### Vinculación permitida

- componente
- evidencia fotográfica

## 5.2 Modelo sugerido

```ts
export type StructuredObservation = {
  id: string;
  finding?: string;
  impact?: string;
  recommendedAction?: string;
  priority?: string;
  componentKey?: string;
  photoIds?: string[];
};
```

## Regla confirmada

Si un componente queda en `mala`, debe existir observación obligatoria.

---

## 6. Evidencia fotográfica

## Reglas confirmadas

- mínimo una foto
- mínimo una foto general
- compresión automática en móvil
- captura desde cámara o subida de archivo
- ordenamiento de fotos
- foto principal
- etiquetado opcional por bomba, componente o general

## Modelo sugerido

```ts
export type ReportPhoto = {
  id: string;
  reportId: string;
  kind: 'general' | 'component' | 'pump';
  componentKey?: string | null;
  pumpIndex?: number | null;
  url: string;
  isPrimary?: boolean;
  position?: number;
  createdAt?: string;
};
```

---

## 7. Firma y geolocalización

## Reglas confirmadas

- firma manuscrita obligatoria
- geolocalización al cierre
- si falla la geolocalización, permitir cierre con justificación

## Recomendación

El cierre del reporte no debe considerarse válido sin:

- firma
- geolocalización o justificación
- evidencia mínima

---

## 8. Borrador

## Regla confirmada

El reporte puede guardarse como borrador.

## Implicación técnica

Debe poder persistirse sin exigir todos los campos finales.

### Reglas sugeridas

En `borrador`:

- puede faltar evidencia final
- puede faltar firma
- puede faltar geolocalización
- puede faltar checklist completo

En `completado_por_operador`:

- todo lo mínimo obligatorio debe estar completo

---

## 9. Servicios largos

Confirmado:

- deben existir avances diarios
- el reporte final consolida los avances diarios

TS-07 debe dejar preparada la integración con:

- `ServiceReportDailyProgress`

No hace falta resolver todo aquí, pero sí dejar el vínculo previsto.

---

## 10. Hallazgos críticos

## Regla confirmada

Si hay varios ítems en `mala`, debe generarse sección de hallazgos críticos.

Además:

- con apoyo IA
- no solo por regla determinística

## Recomendación técnica

Guardar el resultado final en el reporte, aunque la construcción tenga ayuda IA.

---

## 11. Integración con estados del servicio

TS-07 debe empujar la transición operativa correcta.

Flujo esperado:

- operador completa -> `reportado`
- supervisor revisa -> `en_revision`
- si devuelve -> `con_novedad`
- si aprueba -> `cerrado`

---

## 12. Integración con la implementación actual

La lógica actual de `schedulingCompletion.ts` y el formulario embebido son útiles como insumo, pero no deberían seguir siendo el contrato final.

## Recomendación de migración

### Paso 1
Extraer shape y validaciones del reporte actual.

### Paso 2
Crear entidad `ServiceReport`.

### Paso 3
Mover el flujo de cierre desde agenda a módulo propio.

### Paso 4
Mantener adaptador temporal si se necesita compatibilidad.

---

## 13. Auditoría mínima requerida

Eventos mínimos:

- borrador creado
- borrador actualizado
- reporte completado por operador
- firma adjuntada
- geolocalización capturada
- geolocalización omitida con justificación
- foto agregada o removida
- reporte enviado a revisión

---

## 14. Riesgos técnicos

1. seguir embebiendo el reporte dentro del flujo de agenda
2. no separar borrador de cierre final
3. modelar checklist demasiado rígido demasiado pronto
4. no estructurar bien la evidencia fotográfica

## Mitigación

- entidad `ServiceReport`
- lifecycle explícito
- shape flexible pero documentado
- modelo de evidencia separado

---

## 15. Criterios de aceptación refinados para TS-07

- existe entidad `ServiceReport` definida
- existe lifecycle de borrador a aprobado
- existe estructura base de checklist documentada
- existen observaciones estructuradas y libres modeladas
- existe modelo de fotos y evidencia
- firma y geolocalización están contempladas formalmente
- borradores están soportados conceptualmente
- integración con estados del servicio está definida

---

## 16. Dependencias

TS-07 depende de:

- TS-01
- TS-05

TS-07 alimenta directamente:

- TS-09 revisión de reportes
- TS-16 IA para calidad de reportes

---

## 17. Recomendación de ejecución posterior

Después de TS-07, por secuencia del To Do restante, conviene ejecutar TS-11.

Motivo:

Cerrada la capa operativa principal, falta aterrizar la capa comercial y contractual para completar el núcleo del sistema.