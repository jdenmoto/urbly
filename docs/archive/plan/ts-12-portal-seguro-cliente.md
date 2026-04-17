# TS-12 — Especificación técnica

# Implementar portal seguro de cliente para cotizaciones y reportes

## Estado

Draft técnico inicial, aterrizado contra el estado actual del proyecto.

## Objetivo

Diseñar el portal seguro del cliente como experiencia externa controlada por enlace temporal, separada del portal autenticado interno actual.

TS-12 debe resolver:

- diferencia entre portal cliente autenticado actual y portal seguro por token
- acceso a cotizaciones
- acceso a reportes resumidos y completos
- expiración y regeneración de enlace
- lenguaje comercial
- permisos y alcance del cliente en esta superficie

---

## 1. Hallazgo principal sobre el código actual

Hoy existe `ClientSummaryPage`, pero no corresponde al producto definido para cotizaciones seguras.

### Estado actual detectado

`src/features/portal/ClientSummaryPage.tsx`

Funciona como:

- vista autenticada por usuario interno/cliente ya existente en sistema
- scope por `administrationId`
- resumen de servicios de edificios ligados a esa administración

### Problema

Eso no resuelve el caso definido de negocio:

- acceso por enlace seguro
- token temporal
- cotización específica
- respuesta del cliente sin login tradicional

## Conclusión

TS-12 no debe reutilizar sin más la página actual.

Debe crear una **segunda superficie** distinta:

1. portal autenticado interno cliente, si se mantiene
2. portal seguro por token para cotización y reportes

---

## 2. Decisión estructural

## Recomendación fuerte

Separar claramente estas dos experiencias.

### A. Portal cliente autenticado

- usuario con login
- administración asociada
- visión continua de servicios

### B. Portal seguro de acceso temporal

- acceso por token
- sin login obligatorio tradicional
- orientado a cotización específica y reportes asociados permitidos

TS-12 implementa principalmente **B**.

---

## 3. Alcance funcional confirmado

## 3.1 Cotización

El enlace seguro del cliente debe mostrar solo la cotización.

No debe mostrar en esta fase:

- resumen interno del servicio
- historial de versiones
- estructura interna de revisión

## 3.2 Reportes

En el frente cliente se definió que debe poder ver:

- versión resumida del reporte
- opción de ver reporte completo
- hallazgos críticos destacados
- PDF del reporte completo

## Interpretación recomendada

No mezclar todo en un único panel caótico.

### Flujo sugerido

- entrada principal: cotización
- luego accesos a reportes relacionados si están habilitados por negocio

---

## 4. Modelo técnico del token

TS-11 ya dejó el concepto. TS-12 lo aterriza en experiencia.

```ts
export type QuotationSecureToken = {
  id: string;
  quotationId: string;
  version: number;
  tokenHash: string;
  expiresAt: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  invalidatedAt?: string | null;
};
```

## Reglas confirmadas

- configurable por sistema
- default 15 días hábiles
- si vence, el cliente debe pedir nuevo enlace al comercial
- el comercial puede regenerarlo directamente
- la regeneración crea token nuevo sobre la misma versión
- el anterior debe invalidarse
- debe quedar auditado

---

## 5. Rutas y arquitectura recomendada

## Recomendación

Crear superficie dedicada, separada del portal autenticado actual.

### Ejemplo de rutas

- `/secure/quotation/:token`
- `/secure/report/:token/:reportId` o acceso derivado dentro del mismo contexto seguro

## Importante

No depender del auth tradicional de Firebase para esta entrada.
Debe resolverse con validación backend de token.

---

## 6. Flujo de acceso

## Paso 1
Cliente abre enlace seguro.

## Paso 2
Frontend envía token a backend para validación.

## Paso 3
Backend responde:

- token válido / inválido / vencido / inactivo
- payload permitido de la cotización
- capacidades habilitadas

## Paso 4
Cliente interactúa:

- aprobar cotización completa
- rechazar
- pedir cambios con texto libre
- descargar PDF
- ver reportes relacionados permitidos

---

## 7. Payload de lectura recomendado

No conviene exponer documentos internos crudos del dominio.

### View model sugerido

```ts
export type SecureQuotationView = {
  quotationId: string;
  version: number;
  title?: string;
  summary?: string;
  lineItems: Array<{
    label: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totals: {
    subtotal: number;
    taxes?: number;
    discounts?: number;
    total: number;
    currency?: string;
  };
  statusLabel: string;
  expiresAt: string;
  pdfUrl?: string | null;
  availableReports?: SecureReportSummary[];
};

export type SecureReportSummary = {
  id: string;
  title: string;
  summary: string;
  criticalFindings?: string[];
  pdfUrl?: string | null;
};
```

---

## 8. Lenguaje y presentación

## Confirmado

La interfaz del cliente debe usar lenguaje comercial.

## Implicación

No exponer:

- estados internos como `rechazado_interno`
- notas internas del supervisor
- terminología demasiado técnica salvo que el tenant así lo permita

## Regla adicional confirmada

Los hallazgos críticos pueden usar:

- lenguaje técnico
- lenguaje comercial
- ambos según tenant

---

## 9. Acciones del cliente

## Confirmado

Puede:

- aprobar la cotización completa
- rechazar
- pedir cambios con texto libre
- descargar PDF
- ver reporte resumido y completo si está habilitado

## No puede

- aprobar parcialmente por ítems
- editar la cotización directamente
- ver auditoría interna

---

## 10. Respuesta del cliente

## Recomendación técnica

Persistir la respuesta como evento formal, no como simple cambio de estado.

```ts
export type CustomerQuotationResponse = {
  id: string;
  quotationId: string;
  version: number;
  tokenId: string;
  decision: 'approve' | 'reject' | 'request_changes';
  message?: string;
  createdAt: string;
};
```

---

## 11. Integración con reportes

TS-12 debe permitir exposición controlada de reportes.

## Vista resumida

Debe mostrar:

- resumen ejecutivo
- hallazgos críticos
- acceso a reporte completo

## Vista completa

Debe mostrar:

- contenido aprobado para cliente
- PDF descargable

## Recomendación

No exponer directamente la estructura interna bruta del reporte técnico si el tenant quiere capa comercial encima.

---

## 12. Integración con tenant

TS-12 depende de configuración tenant-aware.

Debe permitir definir por tenant:

- si expone reportes o no
- lenguaje técnico o comercial
- qué capacidades IA o resumen automático se muestran
- branding futuro si se desea

---

## 13. Auditoría mínima requerida

Eventos mínimos:

- token validado
- acceso exitoso al enlace
- acceso fallido por token inválido
- acceso fallido por token vencido
- aprobación del cliente
- rechazo del cliente
- solicitud de cambios del cliente
- descarga PDF
- regeneración de token
- invalidación de token anterior

---

## 14. Riesgos técnicos

1. mezclar portal autenticado actual con portal seguro temporal
2. exponer demasiado dominio interno al cliente
3. validar token solo en frontend
4. no invalidar enlaces viejos regenerados
5. no modelar bien la respuesta del cliente

## Mitigación

- superficies separadas
- view models específicos
- validación backend obligatoria
- invalidación explícita
- evento formal de respuesta del cliente

---

## 15. Criterios de aceptación refinados para TS-12

- existe separación explícita entre portal autenticado actual y portal seguro temporal
- existe modelo de token seguro aterrizado en experiencia
- existe flujo de validación de acceso definido
- existe payload de lectura seguro para cliente
- existe modelo de respuesta del cliente
- existe exposición controlada de reportes
- existe auditoría mínima definida
- existe integración conceptual con tenant config

---

## 16. Dependencias

TS-12 depende de:

- TS-11
- TS-21
- TS-22
- TS-28 en la capa PDF completa

TS-12 alimenta:

- aprobación cliente real
- consumo externo seguro del producto

---

## 17. Recomendación de ejecución posterior

Después de TS-12, el siguiente paso lógico es TS-13 o TS-21.

Mi recomendación: TS-21 primero si quieres cerrar mejor el modelo técnico del portal seguro, o TS-13 si prefieres seguir con una capacidad transversal visible.