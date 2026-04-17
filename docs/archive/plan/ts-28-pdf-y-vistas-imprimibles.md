# TS-28 — Especificación técnica

# Diseñar estrategia de PDF y vistas imprimibles para cotizaciones y reportes

## Estado

Draft técnico inicial para salida documental formal del sistema.

## Objetivo

Definir la estrategia de generación de PDF y vistas imprimibles para cotizaciones y reportes, diferenciando render para pantalla, impresión y portal seguro.

TS-28 debe resolver:

- fuente de verdad del contenido
- vistas imprimibles
- generación PDF
- versionado del PDF formal
- relación con portal seguro

---

## 1. Principio recomendado

La fuente de verdad debe ser el dato estructurado, no el PDF.

El PDF es una proyección formal generada.

---

## 2. Alcance inicial

- cotizaciones
- reportes

---

## 3. Estrategia sugerida

### Pantalla

- vista operativa normal

### Imprimible

- vista específica optimizada para impresión

### PDF

- generado desde la vista o desde renderer controlado
- asociado a versión formal cuando corresponda

---

## 4. Versionado

## Recomendación

- cotización: PDF ligado a `quotation_version`
- reporte: PDF formal ligado al estado final aprobado o exportado

---

## 5. Relación con portal seguro

El cliente puede ver HTML seguro o PDF formal según caso.

No asumir que portal y PDF son exactamente la misma capa visual.

---

## 6. Riesgos técnicos

1. usar PDF como fuente de verdad
2. no separar pantalla vs impresión
3. no versionar PDFs formales

## Mitigación

- dato estructurado primero
- proyecciones separadas
- PDFs versionados cuando el documento es formal

---

## 7. Criterios de aceptación refinados para TS-28

- existe principio de dato estructurado como fuente de verdad
- existe estrategia separada para pantalla, impresión y PDF
- existe versionado definido para PDFs formales
- existe relación conceptual con portal seguro definida

---

## 8. Dependencias

TS-28 alimenta directamente:

- TS-11
- TS-12
- TS-23

---

## 9. Recomendación de ejecución posterior

Después de TS-28, seguir con TS-29.