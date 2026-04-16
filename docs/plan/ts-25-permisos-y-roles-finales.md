# TS-25 — Especificación técnica

# Diseñar modelo de permisos y roles finales del producto

## Estado

Draft técnico inicial, consolidando roles, permisos y capacidades especiales del producto.

## Objetivo

Definir el modelo final de roles y permisos del producto, incluyendo acceso a módulos, permisos especiales, rol auditoría y compatibilidad con entornos multi-tenant.

TS-25 debe resolver:

- roles base
- permisos por módulo
- permisos especiales
- rol auditoría
- estrategia de autorización

---

## 1. Roles base sugeridos

- admin
- supervisor
- programador
- operador
- auditoria
- cliente

---

## 2. Capacidades esperadas

### admin

- acceso completo

### supervisor

- revisión de reportes
- visibilidad operativa alta

### programador

- agenda
- asignación
- reprogramación

### operador

- ejecución de servicio
- carga de reporte

### auditoria

- lectura completa de auditoría
- exportación

### cliente

- acceso restringido al portal seguro

---

## 3. Estrategia de autorización

## Recomendación

Separar:

- rol principal del usuario
- permisos especiales o claims complementarios

Eso evita explosionar el número de roles.

---

## 4. Permisos especiales sugeridos

- export_audit
- manage_templates
- manage_ai_policy
- regenerate_secure_tokens
- review_reports
- approve_quotations_internal

---

## 5. Multi-tenant

Los permisos deben resolverse dentro del contexto del tenant.

---

## 6. Riesgos técnicos

1. usar solo roles rígidos sin permisos complementarios
2. mezclar cliente con usuario interno tradicional
3. no contemplar alcance tenant-aware

## Mitigación

- roles + permisos especiales
- separación cliente vs interno
- evaluación por tenant

---

## 7. Criterios de aceptación refinados para TS-25

- existen roles base definidos
- existe rol auditoría definido
- existe separación entre rol y permisos especiales
- existe enfoque multi-tenant definido
- existe estrategia de autorización definida

---

## 8. Dependencias

TS-25 alimenta directamente:

- TS-12
- TS-13
- TS-14
- TS-15
- TS-21

---

## 9. Recomendación de ejecución posterior

Después de TS-25, seguir con TS-26.