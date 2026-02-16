# Trello Cards

Listas sugeridas:
- 📦 Backlog
- 🚧 En progreso
- 🔍 En revisión
- ✅ Listo para deploy

## [Agendamientos] Filtro por edificio y generación de PDF
**Contexto**
- Filtrar agendamientos por edificio en calendario y lista.
- Generar PDF solo cuando haya edificio seleccionado.

**Requerimientos funcionales**
- Selector de edificio (searchable).
- Filtro aplicado a calendario y lista.
- Botón “Generar PDF” habilitado solo con edificio seleccionado.
- PDF con administración, edificio y rango visible.
- Nombre: `Agendamientos_<NombreEdificio>_<YYYY-MM-DD>.pdf`.

**Requerimientos técnicos**
- Function en Firebase para generación.
- Validación de permisos y alcance por edificio.
- Estados de carga y error en UI.

**Criterios de aceptación**
- UI implementada
- Backend/Firebase Function
- Validaciones
- Permisos
- Testing
- QA manual

## [Contratos] CRUD por administración y enlace con edificios
**Contexto**
- Una administración puede tener múltiples contratos.
- Cada edificio debe tener exactamente 1 contrato.

**Requerimientos funcionales**
- CRUD de contratos dentro de Administraciones.
- Edificios muestran “Sin contrato” si no tiene.
- No permitir inconsistencias entre administración y contrato.

**Requerimientos técnicos**
- Colección `contracts` con `administrationId`.
- `buildings.contractId` obligatorio.
- Validaciones de integridad en backend.

**Criterios de aceptación**
- UI implementada
- Backend/Firebase Function (si aplica)
- Validaciones
- Permisos
- Testing
- QA manual

## [Portal] Acceso restringido para BUILDING_ADMIN
**Contexto**
- Vista exclusiva para administradores de edificio.

**Requerimientos funcionales**
- Ver su administración.
- Ver edificios asociados a contratos.
- Ver agendamientos de esos edificios.

**Requerimientos técnicos**
- Rol `BUILDING_ADMIN` con claims.
- Protección de rutas y filtrado de datos.
- Validación en reglas/Functions.

**Criterios de aceptación**
- UI implementada
- Backend/Firebase Function (si aplica)
- Validaciones
- Permisos
- Testing
- QA manual

## [Programación] Completar servicios con novedades
**Contexto**
- Al completar un servicio, registrar novedades opcionales.

**Requerimientos funcionales**
- Modal de completado.
- Flujo Sí/No novedades.
- Formulario de novedades con tipo/categoría/descripción y 2 fotos.
- Listado editable de novedades.

**Requerimientos técnicos**
- Catálogo tipo → categorías.
- Storage para fotos.
- Persistencia estructurada en Firestore.

**Criterios de aceptación**
- UI implementada
- Backend/Firebase Function (si aplica)
- Validaciones
- Permisos
- Testing
- QA manual

## [Campos requeridos] Administraciones y edificios
**Contexto**
- Campos obligatorios en ambos dominios.

**Requerimientos funcionales**
- Validación en formularios.
- Borde rojo al error.

**Requerimientos técnicos**
- Validación en backend (Firestore Rules / Functions).

**Criterios de aceptación**
- UI implementada
- Validaciones
- Permisos
- Testing
- QA manual

## [Seguridad] Notas y riesgos
**Contexto**
- Documentar decisiones de seguridad y riesgos técnicos.

**Requerimientos funcionales**
- Documento de notas de permisos.
- Documento de riesgos/decisiones.

**Requerimientos técnicos**
- Docs en `docs/`.

**Criterios de aceptación**
- Documentación lista
