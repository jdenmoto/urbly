# Inventario de rutas visibles y placeholders

Fecha: 2026-04-28
Tarea: S1-T1
Fuente auditada: `src/app/nav.ts`, `src/app/App.tsx`, `src/app/layouts/AppLayout.tsx`, `src/components/Sidebar.tsx` y páginas enlazadas.

## Criterio usado
- **operativa y conservar**: ya soporta un flujo real del producto.
- **operativa pero secundaria**: sirve, pero no debería competir con el flujo principal de la ola.
- **placeholder ocultable**: hoy expone una vista vacía o de valor marginal para el usuario final.
- **ruta legacy que debe salir del flujo principal**: existe por compatibilidad, redirect o arrastre del modelo anterior.

## 1) Rutas visibles en navegación principal

| Ruta | Roles | Estado real | Clasificación | Decisión concreta |
| --- | --- | --- | --- | --- |
| `/` | admin, editor, view, supervisor, scheduler, operator, auditoria | home protegida con `HomeRouterPage` | operativa pero secundaria | Mantener, pero no como eje principal para operación diaria de empresa. |
| `/services` | admin, editor, view, emergency_scheduler, supervisor, scheduler, operator, auditoria | listado operativo real | operativa y conservar | Debe quedar como centro operativo. |
| `/ai` | admin, editor, view, supervisor, scheduler, operator, auditoria | módulo real, no placeholder | operativa pero secundaria | Mantener fuera del camino principal de operación. |
| `/management` | admin, editor, view | módulo real de administraciones/contratos | operativa pero secundaria | Mantener como backoffice, no como acceso prioritario diario. |
| `/customers` | admin, editor, view | `CustomersPage` usa `ComingSoonPage` | placeholder ocultable | Sacar del menú principal en la siguiente tarea. |
| `/assets` | admin, editor, view | `AssetsPage` usa `ComingSoonPage` | placeholder ocultable | Sacar del menú principal en la siguiente tarea. |
| `/reports` | admin, editor, view, supervisor, auditoria | auditoría/exportación real | operativa y conservar | Mantener visible para empresa/auditoría. |
| `/notifications` | admin, editor, view, supervisor, scheduler, operator, auditoria | centro de alertas real | operativa pero secundaria | Mantener accesible, pero no prioritaria. |
| `/employees` | admin, editor, view | módulo real | operativa pero secundaria | Mantener como gestión interna. |
| `/technician` | emergency_scheduler | home técnica real | operativa y conservar | Mantener como entrada principal técnica. |
| `/portal` | building_admin, client | resumen cliente real | operativa y conservar | Mantener como entrada principal cliente. |
| `/portal/services` | building_admin, client | vista real de operación mínima | operativa y conservar | Mantener visible. |
| `/portal/reports` | building_admin, client | vista real de órdenes cerradas/reportes mínimos | operativa y conservar | Mantener visible. |
| `/settings/automation` | admin, editor, building_admin, client, supervisor | módulo real | operativa pero secundaria | Mantener, pero fuera del foco operativo principal. |
| `/settings/groups` | admin | módulo real | operativa pero secundaria | Mantener solo en settings. |
| `/settings/issues` | admin | módulo real | operativa pero secundaria | Mantener solo en settings. |
| `/settings/service-types` | admin | módulo real | operativa pero secundaria | Mantener solo en settings. |
| `/settings/contracts` | admin | módulo real | operativa pero secundaria | Mantener solo en settings. |
| `/settings/labs` | admin | módulo real | operativa pero secundaria | Mantener solo en settings. |
| `/settings/calendar/holidays` | admin | módulo real | operativa pero secundaria | Mantener anidada, no protagonista. |
| `/settings/calendar/non-working` | admin | módulo real | operativa pero secundaria | Mantener anidada, no protagonista. |
| `/users` | admin | módulo real de administración | operativa pero secundaria | Mantener restringida a admin. |

## 2) Rutas expuestas pero no visibles en el menú principal

| Ruta | Estado real | Clasificación | Decisión concreta |
| --- | --- | --- | --- |
| `/login` | pública | operativa y conservar | Entrada normal de autenticación. |
| `/__qa__/:role` | acceso QA | operativa pero secundaria | Mantener fuera del flujo normal; no exponer al usuario final. |
| `/services/:serviceOrderId` | detalle operativo real | operativa y conservar | Ruta clave del flujo principal. |
| `/services/:serviceOrderId/print` | imprimible real | operativa pero secundaria | Mantener como soporte del flujo, no como destino de primer nivel. |
| `/services/:serviceOrderId/closeout` | cierre técnico real | operativa y conservar | Ruta clave para técnicos/operación. |
| `/buildings` | módulo real | operativa pero secundaria | Hoy existe, pero ni siquiera está en `nav.ts`; revisar después si debe volver o quedarse fuera. |
| `/portal/access` | acceso seguro portal | operativa pero secundaria | Mantener como punto de entrada funcional, fuera del menú. |
| `/settings` | redirect a `/settings/groups` | ruta legacy que debe salir del flujo principal | No aporta destino propio; es solo conveniencia técnica. |
| `/settings/calendar` | vista agregadora real | operativa pero secundaria | Puede seguir como interna, sin necesidad de visibilidad principal. |
| `*` → redirect por rol | fallback técnico | ruta legacy que debe salir del flujo principal | Correcta como guard de navegación, no como ruta producto. |

## 3) Hallazgos concretos de placeholders y legacy

### Placeholders expuestos al usuario
1. `src/features/customers/CustomersPage.tsx` renderiza `ComingSoonPage`.
2. `src/features/assets/AssetsPage.tsx` renderiza `ComingSoonPage`.

Conclusión: hoy `customers` y `assets` crean ruido visible sin flujo real detrás.

### Legacy o compatibilidad técnica visibles en rutas
1. `/scheduling` no tiene pantalla propia: hace `Navigate` a `/services`.
2. `/settings` existe solo para redirigir a `/settings/groups`.
3. El fallback `*` solo reenvía a la home según rol.

Conclusión: estas rutas no deben orientar la navegación principal de la ola.

## 4) Decisión operativa para S1-T2

Prioridad de navegación por rol según el estado real actual:
- **empresa/operación interna**: `/services`, `/reports`, y según rol `/` o `/notifications`.
- **técnico**: `/technician`, `/services`.
- **cliente**: `/portal`, `/portal/services`, `/portal/reports`.

Entradas candidatas a salir o relegarse del menú principal inmediatamente:
- `/customers`
- `/assets`
- cualquier acceso que empuje a settings/admin antes que al flujo de `services`

## 5) Verificación mínima ejecutada
- contraste manual entre `useNavGroups(...)` en `src/app/nav.ts` y el árbol real de `Routes` en `src/app/App.tsx`
- verificación puntual de placeholders en `CustomersPage.tsx` y `AssetsPage.tsx`
- verificación puntual de que cliente y técnico sí tienen páginas reales (`ClientSummaryPage`, `BuildingAdminPage`, `TechnicianHomePage`)
