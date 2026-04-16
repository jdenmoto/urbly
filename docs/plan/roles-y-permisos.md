# Roles y permisos

## Objetivo

Definir el alcance funcional por rol y las herencias principales.

---

## Roles confirmados

- admin
- comercial
- programador
- operador
- supervisor
- auditoria
- cliente

## Reglas globales

- un usuario puede tener múltiples roles
- `admin` hereda todos los permisos
- `programador` es el rol operativo habilitado para programar servicios
- `comercial` participa en creación de cotizaciones
- `supervisor` solo participa en flujo de cotizaciones y revisión de reportes, no en programación
- `cliente` accede mediante experiencia controlada para agenda, cotizaciones y reportes

---

## Matriz inicial de permisos

| Acción | Admin | Comercial | Programador | Operador | Supervisor | Auditoria | Cliente |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ver agenda operativa | Sí | Limitado | Sí | Sí | Sí | Limitado | Limitado |
| Programar servicios | Sí | No | Sí | No | No | No | No |
| Reprogramar servicios | Sí | No | Sí | No | No | No | No |
| Asignar operador principal | Sí | No | Sí | No | No | No | No |
| Asignar acompañantes | Sí | No | Sí | No | No | No | No |
| Ver servicios pendientes de asignar | Sí | No | Sí | Limitado | Sí | Limitado | No |
| Ejecutar servicio en campo | Sí | No | No | Sí | No | No | No |
| Crear reporte de servicio | Sí | No | No | Sí | No | No | No |
| Guardar reporte en borrador | Sí | No | No | Sí | No | No | No |
| Cerrar reporte con firma y geolocalización | Sí | No | No | Sí | No | No | No |
| Revisar reporte de servicio | Sí | No | No | No | Sí | No | No |
| Crear cotización | Sí | Sí | No | No | No | No | No |
| Revisar cotización | Sí | No | No | No | Sí | No | No |
| Aprobar / rechazar / editar cotización en revisión interna | Sí | No | No | No | Sí | No | No |
| Ver cotización | Sí | Sí | Limitado | Limitado | Sí | Limitado | Sí |
| Aprobar cotización como cliente | No | No | No | No | No | No | Sí |
| Pedir cambios como cliente | No | No | No | No | No | No | Sí |
| Ver reportes de servicio | Sí | Limitado | Sí | Propios | Sí | Limitado | Sí |
| Ver auditoría completa | Sí | No | No | No | No | Sí | No |
| Recibir asistencia IA | Sí | Sí | Sí | Sí | Sí | Pendiente | Pendiente |
| Aceptar sugerencias IA | Sí | Sí | Sí | Sí | Sí | Pendiente | Pendiente |

---

## Observaciones

### Cliente

El cliente puede:

- ver agenda de sus servicios
- aprobar cotizaciones
- pedir cambios sobre cotizaciones
- ver reportes de servicio
- descargar PDF de cotización desde el enlace seguro mientras esté vigente

Reglas adicionales:

- el enlace seguro muestra solo la cotización
- la interacción del cliente usa lenguaje comercial
- la solicitud de cambios se hace con texto libre

### Supervisor

El supervisor puede:

- revisar cotizaciones
- aprobar, rechazar o editar cotizaciones
- revisar reportes de servicio

No programa servicios.

Pendiente por definir:

- si puede devolver reportes al operador con correcciones
- si puede escalar hallazgos críticos

### Programador

El programador puede:

- crear servicios
- programar y reprogramar
- asignar operadores
- gestionar recurrencias
- resolver conflictos de agenda
- confirmar reprogramación de servicios desplazados por emergencia

### Comercial

El comercial puede:

- crear cotizaciones
- consultar cotizaciones propias o habilitadas por negocio
- entregar insumos al flujo de revisión interna

No programa servicios ni revisa cotizaciones.

### Admin

Además de heredar todos los permisos, el admin es el único rol habilitado para:

- crear nuevos tipos de servicio
- administrar el catálogo estructural del sistema cuando aplique

### Auditoria

El rol `auditoria` existe para consultar trazabilidad completa en UI.

Puede ver:

- historial de cambios
- movimientos de estados
- devoluciones
- reprogramaciones
- intervenciones de IA

No crea, no aprueba y no modifica operación.
---

## Regla estructural

La creación de cotizaciones queda separada del rol operativo de programación.

Esto reduce mezcla entre:

- operación diaria
- control de agenda
- elaboración comercial o contractual

## Recomendación

Mantener esta separación en la V1 del producto, salvo que aparezca una necesidad operativa fuerte de simplificación.