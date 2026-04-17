# TS-23 — Especificación técnica

# Diseñar modelo de documentos y adjuntos del sistema

## Estado

Draft técnico inicial para unificar evidencias, archivos operativos y documentos derivados.

## Objetivo

Definir el modelo de documentos y adjuntos del sistema para soportar fotos, PDFs, archivos generados, anexos de cotización, evidencia de servicio y futuros activos asociados a edificios o contratos.

TS-23 debe resolver:

- entidad documento o adjunto
- relación con entidades de negocio
- tipo de archivo
- origen del archivo
- visibilidad
- versionado cuando aplique

---

## 1. Necesidad transversal

El sistema ya trabaja o trabajará con:

- fotos de servicio
- PDFs de cotización
- PDFs de reportes
- anexos o soportes
- archivos generados por sistema
- adjuntos potenciales de edificio o contrato

Eso justifica una capa documental unificada.

---

## 2. Modelo recomendado

```ts
export type DocumentVisibility = 'internal' | 'client' | 'restricted';
export type DocumentOrigin = 'upload' | 'generated' | 'imported' | 'system';

export type DocumentRecord = {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes?: number;
  origin: DocumentOrigin;
  visibility: DocumentVisibility;
  version?: number | null;
  uploadedBy?: string | null;
  createdAt: string;
};
```

---

## 3. Relación con entidades

Debe poder asociarse a:

- service_order
- service_report
- quotation
- quotation_version
- building
- contract
- tenant_policy si más adelante se necesita

---

## 4. Visibilidad

## Recomendación

- `internal`: solo equipo interno
- `client`: visible en portal o experiencia cliente
- `restricted`: acceso muy controlado

---

## 5. Origen

## Recomendación

- `upload`
- `generated`
- `imported`
- `system`

Esto permite distinguir evidencia subida manualmente de archivos generados por el sistema.

---

## 6. Versionado

No todos los documentos requieren versionado.

## Recomendación

Usar `version` cuando el documento representa una versión formal, por ejemplo:

- cotización PDF
- reporte exportado formal

---

## 7. Riesgos técnicos

1. mezclar evidencia informal con documentos formales sin metadata suficiente
2. no distinguir visibilidad cliente vs interna
3. acoplar storage path a lógica de negocio demasiado rígida

## Mitigación

- metadata mínima estándar
- visibilidad explícita
- entidad documental separada del storage físico

---

## 8. Criterios de aceptación refinados para TS-23

- existe modelo `DocumentRecord` definido
- existen relaciones posibles con entidades de negocio definidas
- existe visibilidad definida
- existe origen definido
- existe estrategia mínima de versionado definida

---

## 9. Dependencias

TS-23 alimenta directamente:

- TS-07
- TS-11
- TS-12
- TS-28

---

## 10. Recomendación de ejecución posterior

Después de TS-23, seguir con TS-24.