# Riesgos y decisiones técnicas

## Decisiones
- Validaciones críticas se aplican en frontend y Firestore Rules.
- `building_admin` usa `administrationId` en claims para filtrar acceso.
- Contratos se gestionan como colección separada `contracts`.

## Riesgos
- Datos legacy sin nuevos campos requeridos pueden fallar al editar.
- `building_admin` depende de claims actualizados; requiere refresh de token.
- Subida de fotos de novedades depende de reglas de Storage configuradas.

## Acciones recomendadas
- Ejecutar migración/seed para completar nuevos campos requeridos.
- Revisar reglas de Storage para limitar acceso por rol.
