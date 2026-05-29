# U2-T03 — Labels/descripciones por rol en navegación

Fecha: 2026-05-29
Rama: feat/u2-t03-nav-labels-roles-20260529

## Objetivo
Ajustar la descripción de navegación operativa según rol interno para mejorar contexto y escaneo.

## Cambios
- `src/app/nav.ts`
  - `operations` group usa copy contextual por rol:
    - `operator/scheduler` => `nav.operations.section.description.operations`
    - `supervisor` => `nav.operations.section.description.supervisor`
    - `auditoria` => `nav.operations.section.description.audit`
    - resto interno => `nav.operations.section.description.default`
- `public/locales/es.yaml`
  - se agrega estructura `nav.operations.section.description.*`.
- `src/app/nav.test.ts`
  - test nuevo de selección de descripción por rol.
- `project/artifacts/ui-ux-tracker-2026-05-29.md`
  - `U2-T03` marcado como completado.

## Validación
- `npm run test:run -- src/app/nav.test.ts src/lib/__tests__/i18nDictionary.test.ts`
- `npm run lint -- src/app/nav.ts src/app/nav.test.ts`
- `npm run typecheck`

Resultado:
- tests: ok
- lint: ok (warnings preexistentes no relacionados)
- typecheck: ok
