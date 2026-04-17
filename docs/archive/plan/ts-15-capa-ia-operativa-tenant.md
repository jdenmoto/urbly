# TS-15 — Especificación técnica

# Definir capa IA operativa y configuración por tenant

## Estado

Draft técnico inicial, consolidando las reglas IA ya definidas en el plan.

## Objetivo

Diseñar la capa operativa de IA del sistema como un copiloto controlado, configurable por tenant, módulo y rol, con límites explícitos, trazabilidad y futura relación con pricing.

TS-15 debe resolver:

- capacidades IA permitidas
- niveles de autonomía
- configuración por tenant
- configuración por módulo y rol
- tenants sin IA
- relación con planes de pago
- gobernanza y seguridad operativa

---

## 1. Reglas confirmadas por negocio

## Nivel de autonomía

- nivel 3 controlado

## Autoaplicable

- corrección gramatical
- normalización menor de texto
- resumen preliminar interno

## Requiere confirmación humana

- reescritura técnica
- prioridad/riesgo
- alertas de mantenimiento
- reprogramaciones
- borradores de cotización listos para revisión
- redacción al cliente

## Prohibido automático

- aprobar cotización
- enviar al cliente
- cerrar reporte
- cerrar servicio
- cambiar calificaciones técnicas
- reasignar operador

## Configuración

- por tenant
- por módulo
- por rol
- tenants sin IA permitidos
- configurable por plan de pago
- sí puede impactar pricing futuro

---

## 2. Decisión estructural

## Recomendación fuerte

La capa IA no debe resolverse solo con feature flags sueltas.

Debe tener un **modelo de capacidad explícito**.

---

## 3. Modelo conceptual recomendado

```ts
export type AiCapabilityMode = 'disabled' | 'suggest_only' | 'auto_apply_low_risk';

export type AiTenantPolicy = {
  tenantId: string;
  planId?: string | null;
  enabled: boolean;
  modules: Record<string, AiModulePolicy>;
  roles?: Record<string, AiRolePolicy>;
  createdAt?: string;
  updatedAt?: string;
};

export type AiModulePolicy = {
  enabled: boolean;
  capabilities: Record<string, AiCapabilityMode>;
};

export type AiRolePolicy = {
  enabled?: boolean;
  allowedCapabilities?: string[];
  deniedCapabilities?: string[];
};
```

---

## 4. Módulos iniciales relevantes

## Recomendados

- `service_reports`
- `scheduling`
- `quotations`
- `client_communication`
- `review_assistance`

---

## 5. Capacidades iniciales relevantes

### Reportes

- grammar_correction
- text_normalization
- internal_summary
- inconsistency_detection
- maintenance_suggestion
- risk_suggestion
- observation_draft

### Agenda

- schedule_alternatives
- overload_detection
- recurrence_issue_detection
- assignment_group_suggestion

### Cotizaciones

- quotation_draft
- client_copy_draft

---

## 6. Resolución de permisos IA

## Recomendación

La decisión final de si una capacidad se usa debe evaluarse en este orden:

1. política del plan
2. política del tenant
3. política del módulo
4. política del rol
5. regla dura del sistema

### Importante

Las prohibiciones duras del sistema nunca deben poder ser sobreescritas por tenant.

---

## 7. Regla de tenants sin IA

## Confirmado

Debe poder existir tenant completamente sin IA.

## Implicación

El sistema debe seguir funcionando normalmente sin degradación funcional crítica, solo sin asistencia IA.

---

## 8. Relación con pricing

## Confirmado

Puede impactar pricing o plan comercial futuro.

## Recomendación

No acoplar todavía facturación directa a la lógica de ejecución.

### Mejor enfoque

- política de plan define qué capacidades están disponibles
- pricing consume esa política, no al revés

---

## 9. Integración con módulos existentes

TS-15 no implementa el detalle funcional de IA en cada módulo, pero define el marco para:

- TS-16 reportes
- TS-17 agenda
- futuro soporte en cotizaciones y comunicación

---

## 10. Trazabilidad mínima requerida

Toda acción IA debe registrar:

- tenant
n- módulo
- capacidad
- modo aplicado
- actor humano relacionado si existe
- entrada relevante
- salida relevante
- decisión final
- timestamp

---

## 11. Riesgos técnicos

1. usar flags dispersos sin política central
2. permitir que tenants rompan reglas de seguridad duras
3. acoplar pricing demasiado pronto a runtime
4. no poder explicar por qué una capacidad estuvo o no activa

## Mitigación

- política centralizada
- reglas duras no overrideables
- separación entre plan comercial y política ejecutable
- resolución explícita y auditable

---

## 12. Criterios de aceptación refinados para TS-15

- existe modelo de política IA por tenant definido
- existe resolución por módulo y rol definida
- existen tenants sin IA soportados conceptualmente
- existe separación entre política configurable y reglas duras del sistema
- existe relación con pricing definida a nivel conceptual
- existe trazabilidad mínima definida

---

## 13. Dependencias

TS-15 depende de:

- lineamientos globales de IA del plan
- TS-22 para consolidación multi-tenant más amplia

TS-15 alimenta:

- TS-16
- TS-17
- futuras capacidades IA por producto

---

## 14. Recomendación de ejecución posterior

Después de TS-15, el siguiente paso natural es TS-16, porque ya queda listo el marco de control para aterrizar IA sobre reportes.