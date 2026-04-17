# TS-08 — Especificación técnica

# Agregar soporte para servicios largos y avances diarios

## Estado

Draft técnico inicial, alineado con TS-07 y el modelo operativo definido.

## Objetivo

Definir cómo el sistema soporta servicios que duran varios días, permitiendo registrar avances diarios y consolidarlos en un reporte final sin romper la trazabilidad operativa.

TS-08 debe resolver:

- lifecycle de servicios largos
- estructura del avance diario
- relación entre avance diario y reporte final
- reglas de cierre
- visualización en agenda y detalle del servicio

---

## 1. Reglas confirmadas por negocio

- los servicios largos deben visualizarse de ambas formas según vista
- el operador debe registrar avance diario
- el avance diario incluye combinación de:
  - texto libre
  - checklist diario
  - fotos diarias
  - estado diario
- el reporte final consolida automáticamente los avances diarios
- el servicio puede cerrarse incluso si faltan avances de uno o más días

---

## 2. Decisión estructural

## Recomendación fuerte

El avance diario no debe ser un campo embebido informal dentro del reporte principal.

Debe existir como entidad propia ligada al servicio y consolidable en el reporte final.

### Entidad recomendada

`ServiceReportDailyProgress`

```ts
export type ServiceReportDailyProgress = {
  id: string;
  serviceOrderId: string;
  reportId?: string | null;
  date: string;
  notes?: string;
  checklist?: Record<string, unknown>;
  photoIds?: string[];
  dayStatus?: 'pendiente' | 'en_progreso' | 'completado';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
```

---

## 3. Relación con el servicio

Un servicio largo debe seguir siendo una sola entidad operativa principal.

No se recomienda partirlo en múltiples servicios independientes por día.

### Razón

- complica la trazabilidad
- fragmenta el cierre
- distorsiona la auditoría
- rompe la semántica del servicio completo

## Enfoque correcto

- un `ServiceOrder` largo
- múltiples `DailyProgress`
- un `ServiceReport` final consolidado

---

## 4. Visualización en agenda

## Confirmado

Debe verse de ambas maneras según vista.

## Recomendación

### Vista calendario tipo semana o mes

- mostrar bloque continuo multiday cuando el calendario lo soporte bien

### Vista operativa o detalle diario

- mostrar jornadas o hitos diarios asociados

### Implicación técnica

La UI del calendario debe soportar:

- render continuo del servicio principal
- acceso lateral a avances diarios
- resumen de progreso

---

## 5. Estructura del avance diario

Cada avance diario debe permitir:

- nota libre
- checklist diario
- fotos diarias
- estado diario

## Recomendación de shape

```ts
export type DailyProgressStatus = 'pendiente' | 'en_progreso' | 'completado';

export type DailyProgress = {
  id: string;
  serviceOrderId: string;
  date: string;
  status: DailyProgressStatus;
  notes?: string;
  checklist?: Record<string, unknown>;
  photoIds?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
};
```

---

## 6. Consolidación al reporte final

## Regla confirmada

El reporte final consolida automáticamente los avances diarios.

## Recomendación técnica

El reporte final no debe duplicar ciegamente todos los datos, sino construir un resumen consolidado.

### Opciones de consolidación

- resumen cronológico de avances
- agregación de fotos relevantes
- resumen de checklist diario consolidado
- enlace a avances individuales si se requiere detalle

## Campo sugerido en `ServiceReport`

```ts
dailyProgressIds?: string[];
dailyProgressSummary?: string | null;
```

---

## 7. Regla de cierre

## Confirmado

El servicio puede cerrarse aunque falten avances de uno o más días.

## Implicación

Los avances diarios mejoran trazabilidad, pero no bloquean el cierre final.

## Recomendación

Si faltan avances:

- no bloquear cierre
- sí advertir
- sí auditar

---

## 8. Integración con reporte técnico

TS-08 depende de TS-07.

### Regla

El reporte técnico final debe poder:

- referenciar avances diarios
- consolidarlos
- mostrar si existen huecos o días sin registro

---

## 9. Auditoría mínima requerida

Eventos mínimos:

- avance diario creado
- avance diario editado
- avance diario eliminado lógicamente
- avance diario consolidado en reporte final
- cierre final con avances faltantes

---

## 10. Riesgos técnicos

1. duplicar información entre avance diario y reporte final
2. convertir avances en mini-reportes completos
3. bloquear el cierre por rigidez innecesaria
4. no dejar clara la vista por día frente a la vista consolidada

## Mitigación

- daily progress ligero
- consolidación resumida
- warnings en vez de bloqueo
- separación clara entre progreso diario y reporte final

---

## 11. Criterios de aceptación refinados para TS-08

- existe entidad `ServiceReportDailyProgress` definida
- existe relación clara entre servicio, avance diario y reporte final
- existe estrategia de visualización en agenda para servicios largos
- existe estructura diaria mínima definida
- existe regla explícita de cierre con avances faltantes
- existe auditoría mínima definida

---

## 12. Dependencias

TS-08 depende de:

- TS-07

TS-08 alimenta:

- futuras mejoras de ejecución operativa
- reportes más ricos
- seguimiento de trabajos extensos

---

## 13. Recomendación de ejecución posterior

Después de TS-08, el siguiente paso correcto es TS-09, porque ya toca cerrar la revisión supervisor y la transición a `con_novedad` sobre reportes más completos.