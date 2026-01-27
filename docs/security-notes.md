# Notas de permisos y seguridad

- Roles y claims: `admin`, `editor`, `view`, `building_admin`.
- `building_admin` se restringe por `administrationId` en claims y en reglas de Firestore.
- Firestore Rules validan campos obligatorios en `management_companies`, `buildings` y `contracts`.
- Lecturas para `building_admin` limitadas a su administración, edificios con contrato y agendamientos asociados.
- Escritura permitida solo para `admin`/`editor` (excepto usuarios, solo `admin`).
- Feature flags solo lectura para usuarios autenticados.

## Riesgos de seguridad a revisar
- Subidas a Storage: revisar reglas de Storage si no están definidas.
- Descarga de PDF: validar alcance del edificio en la Function.
- Datos existentes sin nuevos campos: actualizar seed/migraciones para evitar inconsistencias.
