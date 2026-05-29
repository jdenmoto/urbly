# U2-T05 — Política de iconografía por módulo

Fecha: 2026-05-29
Alcance: navegación principal y top-level modules

## Reglas
1. Todos los iconos de navegación usan `stroke=currentColor`.
2. Trazo único para set UI: `strokeWidth=1.7`.
3. Terminaciones homogéneas: `strokeLinecap=round`, `strokeLinejoin=round`.
4. Grid objetivo: `viewBox 24x24`.
5. Un módulo no cambia de icono entre sidebar/topbar/mobile nav.

## Mapa de iconos por módulo
- Dashboard: `LayoutDashboard`
- Services / My Services: `Briefcase`
- Buildings: `Building2`
- Management: `Landmark`
- Reports: `FileText`
- AI Workspace: `Sparkles`
- Employees: `Users`
- Users/Admin: `ShieldUser`
- Settings: `Settings`

## Criterio UX
- Pictograma semántico primero, decoración después.
- Diferenciación por contexto se hace con color/estado, no cambiando forma de icono.
- Evitar mezcla de familias visuales mientras convivan en la misma navegación.

## Estado de implementación
- `src/app/navIcons.tsx` normalizado a constantes compartidas `base` y `strokeWidth`.
