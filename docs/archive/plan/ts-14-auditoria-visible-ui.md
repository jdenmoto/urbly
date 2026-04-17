# TS-14 — Especificación técnica

# Implementar auditoría visible en UI con rol dedicado

## Estado

Draft técnico inicial, alineado con el modelo de auditoría ya propuesto en el plan.

## Objetivo

Diseñar la experiencia visible de auditoría en la UI, con acceso restringido por rol, filtros, exportación y visualización de diffs relevantes.

TS-14 debe resolver:

- quién ve auditoría
- cómo se presenta en la UI
- qué eventos se muestran
- filtros
- exportación
- diffs visuales, especialmente en cotizaciones

---

## 1. Reglas confirmadas por negocio

- debe existir rol `auditoria`
- la auditoría completa debe ser visible en UI
- acceso: `admin` + usuarios con rol `auditoria`
- el rol `auditoria` es lectura + exportación
- la UI debe ser combinación de:
  - pestaña secundaria
  - timeline lateral
  - vista completa de historial
- debe poder filtrar por todo lo anterior:
  - entidad
  - usuario
  - fecha
  - tipo de cambio
  - uso de IA
- diff visual obligatorio al menos para cotizaciones

---

## 2. Decisión estructural

## Recomendación fuerte

TS-14 es la capa de experiencia de una capacidad transversal, no un módulo aislado.

La auditoría debe entrar en dos niveles:

### Nivel A, contexto de entidad

- timeline o pestaña dentro de una entidad específica

### Nivel B, centro de auditoría global

- vista de exploración y exportación con filtros

---

## 3. Modelo base asumido

TS-14 consume el modelo transversal sugerido desde TS-01 y TS-19.

```ts
export type AuditEvent = {
  id: string;
  entityType: string;
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

## 4. Acceso y permisos

## Confirmado

### Admin

- acceso completo

### Auditoria

- acceso completo en lectura
- exportación

### Resto de roles

- sin acceso a auditoría completa
- pueden tener timelines limitados solo si más adelante se define, pero no por defecto en TS-14

---

## 5. Patrones de visualización

## 5.1 Pestaña secundaria en entidad

Ejemplos:

- cotización
- servicio
- reporte
- edificio

Debe mostrar:

- eventos de auditoría de esa entidad
- orden cronológico
- resumen
- actor
- fecha

## 5.2 Timeline lateral

Útil para:

- panel de detalle de una entidad
- lectura rápida de cambios recientes

## 5.3 Vista global de auditoría

Debe permitir:

- buscar
- filtrar
- ordenar
- exportar
- abrir detalle del evento

---

## 6. Filtros requeridos

## Confirmados

- por entidad
- por usuario
- por fecha
- por tipo de cambio
- por uso de IA

## Recomendación adicional

Incluir también:

- por módulo
- por severidad o criticidad futura si aparece

---

## 7. Dif visual

## Confirmado

El diff visual debe existir al menos para cotizaciones.

## Recomendación

### V1 obligatoria

- cotizaciones

### Futuro deseable

- reportes
- programación
- grupos de asignación

### Forma sugerida

- vista before/after por campo
- resaltado de cambios
- resumen textual arriba

---

## 8. Exportación

## Confirmado

El rol `auditoria` puede exportar.

## Recomendación V1

Exportar:

- CSV
- JSON

### Alcance mínimo

- vista filtrada actual
- metadata básica del evento

---

## 9. Integración con IA

## Confirmado indirectamente

Debe poder filtrarse por uso de IA.

## Recomendación

El `AuditEvent` debe incluir en `metadata` o `entityType` suficiente señal para:

- evento asistido por IA
- sugerencia aceptada
- sugerencia rechazada
- contenido autoaplicado

---

## 10. Integración con módulos existentes

TS-14 debe ser transversal sobre:

- cotizaciones
- reportes
- servicios
- edificios
- assignment groups
- tokens seguros
- notificaciones si luego se desea

---

## 11. Riesgos técnicos

1. construir solo una tabla global sin contexto de entidad
2. no normalizar bien el shape de eventos
3. intentar diff genérico perfecto para todo desde el día uno
4. sobrecargar la UI con demasiada información cruda

## Mitigación

- dos niveles de visualización
- foco inicial en cotizaciones
- filtros claros
- resúmenes legibles

---

## 12. Criterios de aceptación refinados para TS-14

- existe definición clara de acceso por rol
- existe vista global de auditoría definida
- existe patrón de pestaña secundaria y timeline lateral definido
- existen filtros obligatorios definidos
- existe exportación definida
- existe diff visual obligatorio para cotizaciones
- existe integración prevista con eventos de IA

---

## 13. Dependencias

TS-14 depende de:

- TS-19
- TS-11 para primer caso fuerte de diff

TS-14 alimenta:

- trazabilidad visible
- compliance interno
- diagnóstico operativo

---

## 14. Recomendación de ejecución posterior

Después de TS-14, el siguiente paso correcto es TS-15 o TS-19.

Mi recomendación: TS-19 si quieres fortalecer primero el modelo transversal que alimenta esta UI, o TS-15 si prefieres seguir por el eje IA.