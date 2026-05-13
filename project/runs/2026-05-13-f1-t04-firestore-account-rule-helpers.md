# Run F1-T04 — Firestore Rules helpers tenant-aware

## Branch
`fix/firestore-account-rule-helpers`

## Cambios
- Agregados helpers tenant-aware en `firestore.rules`:
  - `activeAccountId()`
  - `isAccountMember(accountId)`
  - `accountRole(accountId)`
  - `accountPermissions(accountId)`
  - `isActiveAccountMember(accountId)`
- Agregado match mínimo para `accounts/{accountId}` y `accounts/{accountId}/members/{memberId}` con lectura por membresía activa y lectura admin/owner del mismo account. El fallback legacy `/{document=**}` queda intacto por scope.
- Extendidos tests de reglas para membresía propia, no-miembro/account inactivo y admin del account.

## Validaciones
- `npm run test:rules` ✅
- `npm run typecheck` ✅

## Siguiente tarea
F1-T05 — reglas explícitas read para `service_orders` desde `fix/service-orders-read-rules`.
