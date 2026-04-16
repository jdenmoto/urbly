# TS-21 — Especificación técnica

# Diseñar modelo de portal seguro de cliente y tokens de acceso

## Estado

Draft técnico inicial, complementando TS-12 desde la capa de modelo y seguridad.

## Objetivo

Definir el modelo técnico del portal seguro y sus tokens de acceso para cotizaciones y reportes, incluyendo expiración, invalidación, regeneración y validación backend.

TS-21 debe resolver:

- token seguro
- política de expiración
- invalidación
- regeneración
- respuesta de validación
- relación con versión de cotización

---

## 1. Modelo recomendado

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

---

## 2. Reglas confirmadas

- expira
- configurable por sistema
- default 15 días hábiles
- si vence, el cliente pide nuevo enlace al comercial
- el comercial puede regenerarlo directamente
- la regeneración crea token nuevo sobre la misma versión
- el anterior se invalida
- debe auditarse

---

## 3. Validación de acceso

Recomendación:

- validar siempre en backend
- frontend nunca decide solo por sí mismo si el token es válido

---

## 4. Resultado de validación sugerido

```ts
export type SecureTokenValidationResult = {
  valid: boolean;
  reason?: 'expired' | 'invalid' | 'inactive';
  quotationId?: string;
  version?: number;
};
```

---

## 5. Riesgos técnicos

1. exponer token plano reutilizable sin hashing adecuado
2. no invalidar el anterior al regenerar
3. mezclar autenticación interna con token temporal

## Mitigación

- hashing
- invalidación explícita
- validación backend obligatoria

---

## 6. Criterios de aceptación refinados para TS-21

- existe modelo de token seguro definido
- existen reglas de expiración e invalidación definidas
- existe resultado de validación definido
- existe relación con versión de cotización definida
- existe separación entre login tradicional y acceso por token

---

## 7. Dependencias

TS-21 alimenta directamente TS-12.

---

## 8. Recomendación de ejecución posterior

Después de TS-21, seguir con TS-22.