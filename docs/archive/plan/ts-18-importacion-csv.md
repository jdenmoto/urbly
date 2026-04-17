# TS-18 — Especificación técnica

# Diseñar importación CSV para poblamiento inicial del sistema

## Estado

Draft técnico inicial, aterrizado contra la implementación actual de importación.

## Objetivo

Definir la arquitectura de importación inicial del sistema por UI para poblar datos maestros y operativos base, con preview, validación, errores accionables y evolución desde la importación actual de solo edificios.

TS-18 debe resolver:

- qué entidades se importan
- cómo se hace preview
- cómo se validan errores
- cómo se particiona la importación por entidad
- cómo convivir con el importador actual de edificios

---

## 1. Hallazgo principal sobre el estado actual

Hoy ya existe una importación funcional, pero muy parcial.

### Implementación actual detectada

- frontend: `importBuildingsFile`
- backend: `functions/src/imports.ts`
- soporta CSV/XLSX
- valida dirección por geocoding
- crea edificios
- si no existe la administración, la crea automáticamente

## Problema

Eso no coincide aún con el modelo futuro definido, donde la importación debe cubrir varias entidades con mayor control.

---

## 2. Entidades confirmadas para importación

- administraciones
- contratos
- edificios
- clientes/contactos
- periodicidades de servicio

## Recomendación

No hacer una sola importación masiva genérica.

Conviene partir por entidad o por paquete bien tipado.

---

## 3. Experiencia esperada

## Confirmado

- plantillas oficiales
- validación previa
- preview
- reporte de errores
- por UI

## Recomendación V1

Flujo por etapas:

1. descargar plantilla
2. cargar archivo
3. parseo y preview
4. validación por fila y global
5. confirmación de importación
6. resultado y errores descargables

---

## 4. Estrategia de partición

## Recomendación fuerte

Separar importaciones por entidad.

### V1 sugerida

- importación de administraciones
- importación de edificios
- importación de contratos
- importación de clientes/contactos
- importación de periodicidades

### Futuro

Packs de onboarding guiado que encadenen varias importaciones.

---

## 5. Preview

El preview debe permitir ver antes de importar:

- filas detectadas
- columnas reconocidas
- errores de formato
- advertencias
- relaciones faltantes

Ejemplos:

- administración inexistente
- contrato inexistente
- building duplicado probable
- dirección inválida

---

## 6. Validaciones recomendadas

## Por fila

- campos requeridos
- formato
- relaciones mínimas
- geocoding si aplica

## Globales

- duplicados internos del archivo
- conflictos con datos existentes
- referencias cruzadas faltantes

---

## 7. Evolución desde el importador actual

## Estado actual

La importación actual solo cubre edificios y además crea administraciones automáticamente si no existen.

## Conclusión

Esto sirve para un MVP, pero no es consistente con el modelo futuro multi-entidad y controlado.

## Decisión

TS-18 define el destino, pero surge una deuda explícita:

- debe resolverse la compatibilidad entre el importador actual y el nuevo modelo

Esa deuda queda registrada en:

- `TS-31`

---

## 8. Modelo de resultado recomendado

```ts
export type ImportPreviewRow = {
  rowNumber: number;
  values: Record<string, unknown>;
  errors: string[];
  warnings: string[];
};

export type ImportPreviewResult = {
  entity: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: ImportPreviewRow[];
};

export type ImportExecutionResult = {
  entity: string;
  created: number;
  updated?: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};
```

---

## 9. Riesgos técnicos

1. seguir extendiendo el importador actual sin estrategia común
2. crear magia implícita como administraciones automáticas sin control
3. no separar preview y ejecución
4. acoplar demasiado geocoding al flujo completo

## Mitigación

- estrategia por entidad
- preview obligatorio
- validación explícita
- compatibilidad controlada

---

## 10. Criterios de aceptación refinados para TS-18

- entidades objetivo de importación definidas
- experiencia de preview definida
- validaciones por fila y globales definidas
- estrategia por entidad definida
- convivencia con importador actual identificada
- deuda explícita registrada en TS-31

---

## 11. Dependencias

TS-18 depende de:

- modelo de datos base
- estrategia de importación multi-entidad

TS-18 alimenta:

- onboarding de datos
- carga inicial de tenants
- poblamiento operativo rápido

---

## 12. Recomendación de ejecución posterior

Después de TS-18, continuar con las capas transversales restantes de To Do y luego volver sobre TS-31 para cerrar la migración real del importador.