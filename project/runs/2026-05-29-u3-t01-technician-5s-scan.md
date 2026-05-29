# U3-T01 — Home técnico 5-second scan

Fecha: 2026-05-29
Rama: feat/u3-t01-technician-5s-scan-20260529

## Objetivo
Mejorar lectura de 5 segundos para técnico: estado, cuándo, dónde y siguiente acción inmediata.

## Cambios
- `src/features/technician/TechnicianHomePage.tsx`
  - nuevo bloque “Escaneo rápido” antes del resto del contenido.
  - muestra servicio prioritario con: estado, cuándo, dónde.
  - agrega dos acciones inmediatas: abrir servicio y cierre.
- `public/locales/es.yaml`
  - claves `technician.scan.*`.
- `project/artifacts/ui-ux-tracker-2026-05-29.md`
  - fase U3 pasa a `in_progress`.
  - `U3-T01` marcado como completado.

## Validación
- `npm run test:run -- src/features/technician/__tests__/TechnicianHomePage.test.ts src/features/technician/__tests__/TechnicianPrimaryMobileCta.test.ts`
- `npm run lint -- src/features/technician/TechnicianHomePage.tsx`
- `npm run typecheck`

Resultado:
- tests: ok
- lint: ok (warnings preexistentes no relacionados)
- typecheck: ok
