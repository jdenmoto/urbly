# TS-30 — Especificación técnica

# Diseñar estrategia de importación incremental y validación previa por entidad

## Estado

Draft técnico inicial, complementando TS-18 desde el enfoque incremental.

## Objetivo

Definir la estrategia de importación incremental por entidad con validación previa, útil tanto para poblamiento inicial como para cargas posteriores controladas.

TS-30 debe resolver:

- importación incremental
- validación previa por entidad
- detección de duplicados
- modo crear vs actualizar futuro
- control de errores por lote

---

## 1. Relación con TS-18

TS-18 definió el marco general de importación por UI y multi-entidad.

TS-30 aterriza el modo incremental y la validación por entidad.

---

## 2. Principio recomendado

Cada importación debe ejecutarse sobre una entidad clara y con intención clara.

Ejemplos:

- solo crear
- crear o actualizar
- solo validar

---

## 3. Preview obligatorio

Antes de ejecutar:

- parsear
- validar
- detectar duplicados
- advertir conflictos

---

## 4. Estrategia incremental

## Recomendación

Cada entidad debería tener:

- clave de matching
- reglas de duplicado
- reglas de actualización futura

---

## 5. Resultado de lote

Debe devolver:

- creados
- actualizados
- fallidos
- warnings
- errores por fila

---

## 6. Riesgos técnicos

1. importar sin preview
2. no definir matching por entidad
3. mezclar cargas iniciales con actualizaciones futuras sin reglas

## Mitigación

- validación previa obligatoria
- estrategia por entidad
- modos explícitos de importación

---

## 7. Criterios de aceptación refinados para TS-30

- existe estrategia incremental definida
- existe validación previa por entidad definida
- existe enfoque de duplicados definido
- existe noción de modos crear/actualizar/validar definida
- existe resultado de lote definido

---

## 8. Dependencias

TS-30 depende de:

- TS-18
- TS-31 parcialmente como deuda de compatibilidad

---

## 9. Recomendación de ejecución posterior

Después de TS-30, la lista To Do de esta fase queda vacía y el siguiente frente natural es el backlog nuevo TS-31.