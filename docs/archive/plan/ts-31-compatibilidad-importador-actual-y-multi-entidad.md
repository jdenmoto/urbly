# TS-31 — Especificación técnica

# Resolver estrategia de compatibilidad entre importación actual de edificios y modelo de importación multi-entidad

## Estado

Draft técnico inicial surgido como deuda real al ejecutar TS-18 y TS-30.

## Objetivo

Definir cómo migrar desde el importador actual de edificios hacia un sistema de importación multi-entidad, incremental y con validación previa, sin romper la operación existente ni la base de seeds y geocoding ya disponible.

TS-31 debe resolver:

- qué se conserva del importador actual
- qué debe cambiar
- cómo convivir temporalmente ambos modelos
- cómo retirar la creación implícita de administraciones
- cómo evolucionar sin romper UX ni datos existentes

---

## 1. Hallazgo principal

La implementación actual detectada en `functions/src/imports.ts`:

- importa edificios desde CSV/XLSX
- geocodifica direcciones
- crea edificios válidos
- crea automáticamente una administración si no existe

Esto fue útil como MVP, pero entra en tensión con el modelo nuevo que exige:

- importación por entidad
- preview obligatorio
- validación previa
- control explícito de relaciones
- estrategia incremental

---

## 2. Problema real a resolver

Hoy existe una mezcla de dos filosofías:

### Filosofía A, MVP actual

- flujo simple
- importación directa
- magia útil pero implícita
- acoplamiento fuerte a edificios

### Filosofía B, modelo objetivo

- importaciones explícitas por entidad
- preview antes de ejecutar
- validación global y por fila
- relaciones controladas
- menor ambigüedad operativa

TS-31 debe cerrar esa transición.

---

## 3. Decisión estructural

## Recomendación fuerte

No reemplazar de golpe el importador actual.

Hacer migración por fases.

---

## 4. Estrategia recomendada por fases

## Fase 1, compatibilidad controlada

Mantener el importador actual operativo, pero marcarlo como flujo legacy de edificios.

### Ajustes mínimos sugeridos

- etiquetar funcionalmente como `legacy_buildings_import`
- registrar auditoría de uso
- empezar a devolver preview más estructurado cuando sea posible

## Fase 2, nuevo flujo por entidad

Crear nuevo pipeline con:

- preview
- validación previa
- importación por entidad
- reglas explícitas de matching

## Fase 3, endurecer relaciones

Retirar creación implícita de administraciones en el flujo nuevo.

### Nueva regla

Si la administración no existe:

- warning o error según modo
- no creación mágica silenciosa por defecto

## Fase 4, retiro progresivo del legacy

Cuando el nuevo flujo cubra edificios correctamente:

- deprecar importador actual
- dejar compatibilidad temporal si aún hace falta
- luego removerlo

---

## 5. Qué conservar del importador actual

Sí conviene conservar:

- soporte CSV/XLSX
- geocoding
- manejo parcial de errores por fila
- patrón de procesamiento por lote

---

## 6. Qué debe cambiar

Debe cambiar:

- ausencia de preview
- creación automática de administración
- falta de separación entre validar y ejecutar
- acoplamiento a una sola entidad

---

## 7. Relación con TS-18 y TS-30

## TS-18

Definió el marco general multi-entidad.

## TS-30

Definió el modo incremental y validación previa.

## TS-31

Resuelve la transición real desde el código ya existente hacia ese modelo destino.

---

## 8. Compatibilidad de UX

## Recomendación

Evitar romper a usuarios internos que ya usan importación de edificios.

### Mejor enfoque

- exponer nuevo flujo claramente como importación avanzada o por entidad
- mantener legacy por un tiempo limitado
- comunicar internamente la deprecación futura

---

## 9. Riesgos técnicos

1. romper onboarding actual por reemplazo brusco
2. dejar dos flujos inconsistentes demasiado tiempo
3. seguir creando administraciones implícitamente y contaminar datos
4. mover geocoding a un lugar incorrecto y perder validación útil

## Mitigación

- migración por fases
- reglas explícitas por flujo
- deprecación planificada
- reutilización de piezas útiles del importador actual

---

## 10. Criterios de aceptación refinados para TS-31

- existe estrategia por fases definida
- existe decisión explícita sobre qué conservar del importador actual
- existe decisión explícita sobre qué cambiar
- existe estrategia para retirar la creación implícita de administraciones
- existe compatibilidad temporal de UX definida
- existe vínculo claro con TS-18 y TS-30

---

## 11. Dependencias

TS-31 depende de:

- TS-18
- TS-30
- implementación actual en `functions/src/imports.ts`

TS-31 alimenta:

- futura refactorización del importador
- onboarding multi-entidad real
- consistencia del modelo de datos importado

---

## 12. Recomendación de ejecución posterior

Con TS-31 cerrado, la fase documental de tarjetas generadas para completar el producto queda efectivamente liquidada.

El siguiente frente ya sería una nueva fase:

- consolidación de documentos índice
- priorización de implementación funcional
- o apertura de nuevas tarjetas si aparecen huecos adicionales.