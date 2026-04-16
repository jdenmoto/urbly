# Preguntas abiertas

## Objetivo

Concentrar las decisiones que aún deben cerrarse antes de congelar una especificación V1 sólida.

---

## 1. Roles y permisos

1. ¿qué visibilidad exacta debe tener el rol `comercial` sobre cotizaciones ajenas?

2. ¿el rol `auditoria` puede exportar historial o solo visualizarlo?

---

## 2. Estados y operación

3. ¿qué eventos llevan un servicio a `con_novedad`?

4. ¿el operador puede marcar un servicio como `en_curso` manualmente?

---

## 3. Programación

5. ¿cómo debe modelarse exactamente el grupo de asignación, como atributo fijo del edificio o como relación configurable por periodos?

6. ¿qué reglas exactas debe usar el cálculo automático del grupo basándose en dirección y rutas?

---

## 4. Reporte técnico

7. si el edificio ya tiene bombas registradas, ¿el operador puede editar esa cantidad o solo seleccionarlas?

8. ¿debe existir mínimo de fotos por tipo de servicio además del mínimo global?

9. ¿cómo se configurará exactamente la variabilidad de plantillas por tenant?

---

## 5. Cotizaciones

10. ¿el cliente debe ver versión o numeración de cotización en lenguaje interno o formato más comercial?

11. ¿el comercial puede regenerar el enlace directamente o requiere flujo de aprobación?

---

## 6. IA y hardening

12. ¿la IA puede generar el primer borrador de cotización completo o solo ayudar en secciones?

13. ¿se permitirá apagar IA por módulo, por cliente o por rol?

14. ¿qué nivel de evidencia mínima necesita la IA para sugerir mantenimiento o criticidad?

15. ¿debe existir configuración tenant-aware para exponer o no capacidades IA según cliente?

---

## Recomendación

La base estructural ya está cerrada.
La siguiente iteración puede enfocarse en definiciones de detalle UX, reglas finas y diseño de datos.