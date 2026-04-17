# TS-20 — Especificación técnica

# Diseñar modelo de notificaciones internas y centro de alertas

## Estado

Draft técnico inicial, complementando TS-13 con el modelo técnico puro.

## Objetivo

Definir el modelo técnico de notificaciones internas, su persistencia, resolución de destinatarios y eventos generadores, como base para el centro de alertas e inbox interno.

TS-20 debe resolver:

- modelo Notification
- destinatarios
- labels
- prioridades
- estados
- productores
- lectura
n- archivo futuro

---

## 1. Modelo recomendado

```ts
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationStatus = 'unread' | 'read' | 'archived';

export type Notification = {
  id: string;
  recipientUserId?: string | null;
  recipientRole?: string | null;
  recipientExternalRef?: string | null;
  kind: string;
  title: string;
  message: string;
  labels?: string[];
  priority: NotificationPriority;
  status: NotificationStatus;
  entityType?: string;
  entityId?: string;
  route?: string | null;
  createdAt: string;
  readAt?: string | null;
  archivedAt?: string | null;
};
```

---

## 2. Destinatarios

Debe soportar:

- usuario interno directo
- rol
- referencia externa futura para cliente

---

## 3. Productores iniciales

- asignación
- reprogramación
- cancelación
- emergencia
- cierre de reporte
- reporte devuelto
- cotización aprobada

---

## 4. Reglas temporales

Solo disparar automáticamente cuando el servicio cambie:

- el día anterior
- o el mismo día de ejecución

---

## 5. Prioridades

- low
- medium
- high
- critical

Emergencias deben ir en `critical`.

---

## 6. Labels

Ejemplos sugeridos:

- agenda
- emergencia
- reporte
- cotizacion
- cliente
- urgente

---

## 7. Persistencia

Colección sugerida:

- `notifications/{notificationId}`

---

## 8. Riesgos técnicos

1. duplicar notificaciones por productor
2. no resolver bien destinatarios por rol
3. mezclar notificaciones persistentes con feedback efímero

## Mitigación

- helpers comunes
- convención de productores
- separación toast vs notification

---

## 9. Criterios de aceptación refinados para TS-20

- existe modelo `Notification` definido
- existen destinatarios soportados definidos
- existen productores iniciales definidos
- existen prioridades y labels definidos
- existe estrategia de persistencia definida

---

## 10. Dependencias

TS-20 alimenta directamente TS-13.

---

## 11. Recomendación de ejecución posterior

Después de TS-20, seguir con TS-21.