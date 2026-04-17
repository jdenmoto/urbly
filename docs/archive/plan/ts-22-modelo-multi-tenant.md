# TS-22 — Especificación técnica

# Diseñar modelo multi-tenant para plantillas, IA y configuración operativa

## Estado

Draft técnico inicial, consolidando la capa multi-tenant del producto.

## Objetivo

Definir el modelo multi-tenant que soporte configuración variable por cliente o tenant para:

- plantillas de reporte
- capacidades IA
- lenguaje cliente
- reglas operativas configurables
- relación con plan comercial

TS-22 debe resolver:

- qué se configura por tenant
- qué queda fijo a nivel sistema
- cómo se resuelven defaults y overrides
- cómo se relaciona con pricing

---

## 1. Áreas confirmadas de variabilidad

- plantillas de reporte
- capacidades IA
- lenguaje técnico o comercial para cliente
- configuración operativa relevante
- tenants sin IA
- relación con planes de pago

---

## 2. Decisión estructural

## Recomendación fuerte

Usar política por tenant con defaults del sistema y overrides explícitos, no configuraciones dispersas por módulo sin jerarquía.

---

## 3. Modelo sugerido

```ts
export type TenantPolicy = {
  tenantId: string;
  planId?: string | null;
  reports: TenantReportsPolicy;
  ai: TenantAiPolicy;
  clientExperience: TenantClientExperiencePolicy;
  operations?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type TenantReportsPolicy = {
  defaultTemplateId?: string | null;
  templateOverridesByServiceType?: Record<string, string>;
};

export type TenantAiPolicy = {
  enabled: boolean;
  modules?: Record<string, Record<string, 'disabled' | 'suggest_only' | 'auto_apply_low_risk'>>;
};

export type TenantClientExperiencePolicy = {
  reportLanguageMode?: 'technical' | 'commercial' | 'mixed';
  exposeReports?: boolean;
};
```

---

## 4. Reglas de resolución

Orden sugerido:

1. defaults del sistema
2. política del plan
3. política del tenant
4. política específica del módulo

---

## 5. No overrideables

Debe quedar fijo a nivel sistema:

- reglas duras de seguridad IA
- núcleo común mínimo del reporte
- restricciones críticas de operación

---

## 6. Relación con pricing

## Confirmado

- sí impacta pricing o plan comercial

## Recomendación

El plan comercial habilita capacidades, pero la política ejecutable es la fuente de verdad técnica.

---

## 7. Riesgos técnicos

1. exceso de variabilidad sin límites
2. tenants rompiendo consistencia del producto
3. mezclar configuración de negocio con ejecución de runtime

## Mitigación

- defaults claros
- overrides explícitos
- capacidades no overrideables
- política centralizada

---

## 8. Criterios de aceptación refinados para TS-22

- existe modelo `TenantPolicy` definido
- existen áreas de variabilidad definidas
- existe jerarquía de resolución definida
- existe separación entre configurable y no overrideable
- existe relación conceptual con pricing definida

---

## 9. Dependencias

TS-22 alimenta directamente:

- TS-10
- TS-12
- TS-15

---

## 10. Recomendación de ejecución posterior

Después de TS-22, seguir con TS-23 o TS-24.