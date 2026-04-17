# TS-29 — Especificación técnica

# Diseñar modelo de IA suggestions y trazabilidad detallada

## Estado

Draft técnico inicial para estandarizar sugerencias IA y su trazabilidad.

## Objetivo

Definir el modelo canónico de sugerencias IA y su trazabilidad detallada para reportes, agenda, revisiones y futuras capacidades del sistema.

TS-29 debe resolver:

- entidad de sugerencia IA
- tipos de sugerencia
- estados de aceptación
- rastro de input/output
- vínculo con auditoría

---

## 1. Modelo recomendado

```ts
export type AiSuggestion = {
  id: string;
  entityType: string;
  entityId: string;
  tenantId?: string | null;
  module: string;
  type: string;
  mode: 'auto_applied' | 'suggested';
  inputSnapshot?: Record<string, unknown>;
  outputSnapshot?: Record<string, unknown>;
  acceptedBy?: string | null;
  rejectedBy?: string | null;
  editedBy?: string | null;
  status: 'generated' | 'accepted' | 'rejected' | 'edited' | 'applied_automatically';
  createdAt: string;
};
```

---

## 2. Tipos iniciales esperados

- grammar_correction
- text_normalization
- internal_summary
- technical_rewrite
- consistency_warning
- risk_suggestion
- maintenance_suggestion
- observation_draft
- critical_findings_summary
- schedule_alternatives
- overload_warning
- recurrence_issue_warning
- assignment_group_suggestion

---

## 3. Trazabilidad

Debe quedar rastro de:

- qué se generó
- con qué contexto
- si se autoaplicó o sugirió
- quién aceptó o rechazó
- qué quedó finalmente

---

## 4. Relación con auditoría

Cada cambio relevante de estado debería proyectar evento en auditoría.

---

## 5. Riesgos técnicos

1. no poder explicar por qué la IA sugirió algo
2. no distinguir autoaplicado de sugerido
3. perder trazabilidad al editar manualmente

## Mitigación

- snapshots mínimos
- estados explícitos
- vínculo con audit events

---

## 6. Criterios de aceptación refinados para TS-29

- existe modelo `AiSuggestion` definido
- existen tipos iniciales definidos
- existe trazabilidad mínima definida
- existe relación con auditoría definida

---

## 7. Dependencias

TS-29 alimenta directamente:

- TS-15
- TS-16
- TS-17

---

## 8. Recomendación de ejecución posterior

Después de TS-29, seguir con TS-30.