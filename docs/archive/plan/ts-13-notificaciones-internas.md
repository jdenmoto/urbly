# TS-13 — Especificación técnica

# Implementar notificaciones internas y centro de alertas

## Estado

Draft técnico inicial, aterrizado contra el estado actual del proyecto.

## Objetivo

Diseñar e implementar el sistema interno de notificaciones del producto, incluyendo inbox, centro de notificaciones, badge, labels y prioridades, desacoplado de los toasts efímeros actuales.

TS-13 debe resolver:

- modelo de notificación persistente
- centro de notificaciones con historial
- badge e indicadores de no leídas
- labels de clasificación
- prioridades
- marcado automático al abrir el objeto relacionado
- eventos disparadores iniciales

---

## 1. Hallazgo principal sobre el código actual

Hoy el sistema tiene dos cosas cercanas, pero insuficientes:

### A. `ToastProvider`

- mensajes efímeros
- no persistentes
- útiles para feedback inmediato
- no sirven como bandeja de trabajo

### B. bloques de alertas en `DashboardPage`

- calculados en runtime
- no persistidos como entidad propia
- útiles como visualización, no como sistema de notificación formal

## Conclusión

TS-13 debe crear una **capa nueva**.

---

## 2. Reglas confirmadas por negocio

La solución debe incluir combinación de:

- inbox interno
- centro de notificaciones con historial
- badge
- labels

Además:

- marcado automático al abrir el objeto relacionado
- niveles de prioridad
- emergencias con notificación crítica destacada
- inicialmente solo dentro del sistema

Eventos iniciales confirmados:

- asignación
- reprogramación
- cancelación
- emergencia
- cierre de reporte
- reporte devuelto
- cotización aprobada

Regla temporal:

- solo notificar automáticamente cuando el servicio cambie el día anterior o el mismo día de ejecución

Destinatarios definidos:

- operador principal
- acompañantes
- supervisor
- programador
- cliente

---

## 3. Decisión estructural

## Recomendación fuerte

Las notificaciones deben modelarse como entidad persistente, no como cálculo visual ni como logs embebidos.

### Entidad recomendada

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

## 4. Capas de UX

## 4.1 Toast

Sigue existiendo para feedback inmediato.

Ejemplo:

- guardado exitoso
- error simple

## 4.2 Badge

Muestra conteo de no leídas.

## 4.3 Centro de notificaciones

Vista persistente con:

- listado
- historial
- filtros futuros
- acceso al objeto relacionado

## 4.4 Inbox interno

Puede ser la misma vista del centro o una variante de lectura más orientada a tareas.

### Recomendación V1

Unificar inbox y centro en una sola capa visual persistente, con distintas secciones si hace falta.

---

## 5. Labels y clasificación

## Confirmado

Las notificaciones deben estar catalogadas con labels.

## Recomendación

No limitar labels a color fijo en V1.
Basta con array de strings o catálogo simple.

Ejemplos:

- `agenda`
- `emergencia`
- `reporte`
- `cotizacion`
- `cliente`
- `urgente`

---

## 6. Prioridades

## Confirmado

Debe haber prioridad.

### Recomendación inicial

- `low`
- `medium`
- `high`
- `critical`

## Regla especial

Emergencias deben disparar notificación `critical` destacada.

---

## 7. Marcado como leído

## Confirmado

Debe marcarse automáticamente al abrir el objeto relacionado.

## Recomendación técnica

Cuando el usuario navega correctamente al `route` o abre el entity panel asociado:

- marcar `read`
- guardar `readAt`

No exigir acción manual como mecanismo principal.

---

## 8. Eventos disparadores iniciales

## Confirmados

- asignación
- reprogramación
- cancelación
- emergencia
- cierre de reporte
- reporte devuelto
- cotización aprobada

## Recomendación

Modelarlos como producers desacoplados por dominio, no como lógica directa de UI.

---

## 9. Regla temporal de disparo

## Confirmada

Solo debe notificarse automáticamente cuando el servicio fue cambiado:

- el día anterior
- o el mismo día de ejecución

## Implicación técnica

El productor de notificaciones debe evaluar contexto temporal antes de crear la notificación.

---

## 10. Destinatarios

## Confirmados

- operador principal
- acompañantes
- supervisor
- programador
- cliente

## Recomendación técnica

En V1 interna, empezar con usuarios internos autenticados.

Para cliente:

- puede mapearse luego a portal o a capa de acceso externo, no necesariamente a la misma mecánica de usuario interno clásica

---

## 11. Arquitectura sugerida

## 11.1 Backend o capa de dominio

Productores de notificación por evento.

## 11.2 Persistencia

Colección recomendada:

- `notifications/{notificationId}`

## 11.3 Frontend

- hook de lectura de notificaciones
- badge global
- panel o página de centro de notificaciones
- marcado automático al abrir objeto

---

## 12. Integración con auditoría

Cada notificación relevante debe dejar rastro auditable cuando importe.

No hace falta auditar absolutamente toda lectura en V1, pero sí al menos:

- creación
- cambio a leída
- archivo si existe

---

## 13. Riesgos técnicos

1. confundir toast con notificación persistente
2. mezclar notificaciones con timeline de entidad
3. meter demasiada lógica en frontend
4. no resolver bien destinatarios externos

## Mitigación

- separar feedback UI vs notificación persistente
- separar timeline de dominio vs inbox del usuario
- productores desacoplados
- V1 centrada en internos con puente posterior a cliente

---

## 14. Criterios de aceptación refinados para TS-13

- existe entidad `Notification` definida
- existe separación clara entre toast y notificación persistente
- existe diseño de badge, inbox y centro de notificaciones
- existen prioridades y labels definidos
- existe regla de marcado automático al abrir objeto
- existen disparadores iniciales definidos
- existe regla temporal de disparo definida
- existe estrategia de destinatarios definida

---

## 15. Dependencias

TS-13 depende de:

- TS-19 en la parte de auditoría refinada, aunque puede arrancar antes

TS-13 alimenta:

- experiencia operativa diaria
- alertas críticas
- coordinación interna

---

## 16. Recomendación de ejecución posterior

Después de TS-13, el siguiente paso lógico es TS-14 o TS-20.

Mi recomendación: TS-20 si quieres cerrar primero el modelo técnico más puro, o TS-14 si quieres seguir por una capacidad transversal visible.