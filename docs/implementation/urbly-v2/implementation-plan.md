# Urbly v2 Implementation Plan

## 1. Objetivo
Traducir el design doc de Urbly v2 en una secuencia de implementación realista, incremental y verificable.

Este plan busca evitar un refactor caótico. La idea es reorganizar producto, UX y arquitectura paso a paso, manteniendo el sistema utilizable mientras se migra el corazón del producto.

---

## 2. Principios de implementación
- avanzar por fases pequeñas y reversibles
- no romper producción por perseguir rediseño grande
- separar cambios de modelo, navegación y UI cuando sea posible
- proteger la operación actual mientras se introduce `serviceOrder`
- tratar CI/CD como trabajo de producto e infraestructura, no como detalle secundario
- exigir validación automática confiable antes de merge y deploy

---

## 3. Resultado esperado
Al final de este plan, Urbly debe quedar mejor en cinco ejes:
- modelo de dominio más claro
- navegación por actor y flujo
- experiencia operativa mejor segmentada
- portal cliente más valioso
- pipeline de GitHub estable para validar y desplegar sin fricción

---

## 4. Fase 0, preparación y endurecimiento del proyecto
Objetivo: preparar base segura antes de rediseñar.

### 4.1 Auditoría técnica inicial
Revisar y documentar:
- estructura actual de `src/app`, `src/features`, `src/components`, `src/core`, `src/lib`
- dependencias fuertes de `appointment`
- acoplamientos entre agenda, checklist, reportes y portal
- reglas de Firestore y Storage afectadas por el nuevo flujo
- estado real del CI/CD en GitHub Actions

### 4.2 Entregables
- mapa de dependencias actuales
- lista de riesgos de migración
- lista de colecciones, modelos y claims implicados
- diagnóstico CI/CD actual con fallas, duplicidades y huecos

### 4.3 Archivos probables a revisar
- `src/features/scheduling/SchedulingPage.tsx`
- `src/features/dashboard/DashboardPage.tsx`
- `src/features/buildingAdmin/BuildingAdminPage.tsx`
- `src/app/App.tsx`
- `src/app/nav.ts`
- `src/core/models/*`
- `src/lib/api/*`
- `functions/src/*`
- `.github/workflows/*`

---

## 5. Fase 1, modelo de dominio y arquitectura de información
Objetivo: introducir la nueva base conceptual sin romper todavía toda la UI.

## 5.1 Trabajo de dominio
Definir el nuevo modelo `serviceOrder`.

### Debe incluir como mínimo
- `id`
- `customerId`
- `buildingId`
- `contractId`
- `type`
- `priority`
- `status`
- `scheduledStartAt`
- `scheduledEndAt`
- `assignedTechnicianId`
- `checklist`
- `issues`
- `attachments`
- `report`
- `communication`
- `timeline`
- `sourceAppointmentId` o estrategia de migración equivalente

### Decisión recomendada
No borrar `appointment` al inicio.
Crear compatibilidad temporal mientras el sistema migra.

## 5.2 Trabajo de información
Actualizar el modelo de navegación para separar experiencias:
- empresa
- técnico
- cliente

### Entregables
- contrato de datos inicial de `serviceOrder`
- mapa de relación entre `appointment` y `serviceOrder`
- nueva taxonomía de módulos
- propuesta de permisos por rol

### Resultado esperado
Base estable para refactorar pantallas sin improvisar estructura.

---

## 6. Fase 2, navegación y shell de aplicación
Objetivo: mover la app hacia la nueva organización sin rehacer todo al mismo tiempo.

## 6.1 Cambios principales
- rediseñar `src/app/nav.ts`
- revisar `App.tsx` para introducir nuevas rutas de producto
- ajustar `AppLayout.tsx`, `Sidebar.tsx`, `BottomNav.tsx` y `TopBar.tsx`
- separar navegación por actor según rol

## 6.2 Nueva navegación sugerida
### Empresa
- Inicio
- Servicios
- Agenda
- Clientes
- Activos
- Técnicos
- Reportes
- IA
- Configuración

### Técnico
- Hoy
- Mis servicios
- Historial
- Evidencias
- Perfil

### Cliente
- Resumen
- Servicios
- Próximos mantenimientos
- Informes
- Solicitudes
- Contacto

## 6.3 Entregables
- shell actualizado
- rutas nuevas con placeholders funcionales cuando haga falta
- guards por rol alineados con la nueva experiencia

### Resultado esperado
La app empieza a verse como Urbly v2 incluso antes del refactor profundo del core.

---

## 7. Fase 3, extracción del core operativo
Objetivo: dejar de usar `SchedulingPage` como pantalla monolítica.

## 7.1 Problema a resolver
`SchedulingPage` mezcla demasiadas responsabilidades:
- agenda
- edición
- filtros
- incidencias
- cierre
- fotos
- checklist
- PDF

Eso debe dividirse.

## 7.2 Nueva estructura sugerida
Crear una carpeta tipo:
- `src/features/services/`

Con al menos:
- `ServicesPage.tsx`
- `ServiceCalendarView.tsx`
- `ServiceListView.tsx`
- `ServiceDetailPage.tsx`
- `ServiceCloseoutPage.tsx`
- `components/*`

## 7.3 Estrategia de migración
1. mantener `SchedulingPage` funcionando
2. extraer submódulos reutilizables
3. crear nueva experiencia `Servicios`
4. migrar gradualmente acciones críticas
5. retirar la pantalla vieja cuando el flujo nuevo esté estable

## 7.4 Entregables
- agenda separada del cierre técnico
- detalle de servicio separado del CRUD general
- componentes más pequeños y testeables
- menor carga cognitiva en mobile y desktop

### Resultado esperado
Corazón del negocio más limpio, escalable y listo para IA.

---

## 8. Fase 4, dashboard por rol
Objetivo: reemplazar el home genérico por experiencias de entrada útiles.

## 8.1 Empresa
Crear un dashboard con:
- servicios hoy
- atrasados
- incidencias críticas
- técnicos ocupados
- clientes que requieren seguimiento
- accesos rápidos

## 8.2 Técnico
Crear una home con:
- siguiente servicio
- ruta y ubicación
- checklist pendiente
- evidencia pendiente
- CTA para iniciar o cerrar servicio

## 8.3 Cliente
Crear una home con:
- estado general
- próximo mantenimiento
- informe reciente
- solicitudes abiertas
- CTA de contacto o solicitud

## 8.4 Entregables
- home por rol
- componentes de summary reutilizables
- mejor jerarquía visual y menor ruido

---

## 9. Fase 5, portal cliente serio
Objetivo: pasar de un portal básico a una pieza fuerte del producto.

## 9.1 Trabajo funcional
Agregar o rediseñar:
- resumen general del edificio
- historial de servicios
- próximos mantenimientos
- informes descargables
- evidencias destacadas
- solicitudes
- timeline de actualizaciones

## 9.2 Trabajo de UX
- reducir tablas cuando no aporten
- mostrar estado primero
- usar tarjetas, timeline y bloques de evidencia
- simplificar acciones principales

## 9.3 Entregables
- nuevo `BuildingAdminPage` o flujo equivalente dividido en subpantallas
- navegación cliente clara
- valor percibido mucho más alto

---

## 10. Fase 6, IA integrada en el flujo
Objetivo: convertir la IA en una capa operativa real.

## 10.1 Casos prioritarios
- resumir historial del caso
- generar borrador de informe técnico
- redactar mensaje al cliente
- sugerir próximo mantenimiento
- clasificar incidencias

## 10.2 Implementación sugerida
Introducir acciones explícitas dentro del detalle/cierre de servicio:
- `Generar informe`
- `Resumir caso`
- `Redactar mensaje`
- `Sugerir seguimiento`

## 10.3 Reglas de UX
- siempre editable antes de guardar o enviar
- no reemplazar criterio humano
- mostrar claramente qué fue generado por IA

### Entregables
- UI contextual de IA
- integración backend segura
- telemetría básica de uso y calidad

---

## 11. Fase 7, sistema visual y branding
Objetivo: consolidar una superficie premium-operativa.

## 11.1 Trabajo visual
- normalizar spacing y layouts
- mejorar jerarquía tipográfica
- revisar colores semánticos y estados
- reforzar feedback de acciones
- mejorar login y estados vacíos

## 11.2 Reglas concretas
- spacing en múltiplos de 8
- mejor contraste
- mobile-first para técnico
- consistencia entre tarjetas, tablas, modales y formularios

### Entregables
- guía visual aplicada en pantallas clave
- login mejorado
- componentes base más consistentes

---

## 12. Fase 8, CI/CD de GitHub perfecto y estable
Objetivo: dejar la validación, previews y deploys de GitHub funcionando de forma confiable.

## 12.1 Diagnóstico actual
El proyecto ya tiene workflows para:
- CI
- preview manual
- deploy a `develop`
- deploy a `main`
- rollback

La base existe, pero el implementation plan debe asumir que hace falta endurecerla para que quede realmente sólida.

## 12.2 Problemas potenciales a resolver
- validación parcial con `lint:ci` puede no cubrir todo en todos los casos
- puede faltar test runner formal en pipeline
- creación repetida de `.env.local` en múltiples workflows
- posibilidad de divergencia entre CI, preview y deploy
- falta de smoke checks post-build o post-deploy
- falta de verificación explícita de Firebase config/secrets antes de desplegar
- falta de documentación más operativa del flujo para el equipo

## 12.3 Estado objetivo del pipeline
### Pull Request
Debe ejecutar como mínimo:
- instalación de dependencias web y functions
- lint completo o estrategia híbrida confiable
- typecheck
- build web
- build functions
- validación de formato opcional según costo
- checks claros por job

### Preview
Debe permitir:
- crear preview fácilmente por PR o manualmente
- devolver URL de preview siempre que el deploy sea exitoso
- validar build antes de publicar
- dejar visible la causa del fallo cuando algo rompa

### Deploy a develop
Debe hacer:
- deploy solo si CI está verde
- publicación estable en staging
- actualización segura de URLs necesarias
- smoke check básico posterior

### Deploy a main
Debe hacer:
- deploy solo desde estado validado
- hosting + functions + firestore consistentes
- rollback simple y probado
- trazabilidad clara del SHA desplegado

## 12.4 Trabajo concreto a incluir en la fase CI/CD
1. auditar `.github/workflows/ci.yml`
2. auditar `.github/workflows/preview.yml`
3. auditar `.github/workflows/deploy-develop.yml`
4. auditar `.github/workflows/deploy.yml`
5. revisar si `rollback.yml` realmente cubre el peor caso
6. extraer pasos repetidos de setup si conviene
7. agregar typecheck explícito si hace falta
8. decidir si `lint:ci` se mantiene o se complementa con `lint` full en ramas críticas
9. agregar smoke validation mínima después de deploy
10. documentar secrets obligatorios, opcionales y fallo esperado por ausencia
11. verificar branch protections en GitHub
12. dejar el pipeline listo para que no se mergee nada roto

## 12.5 Entregables de esta fase
- workflows corregidos y más consistentes
- documentación operativa del pipeline
- validaciones mínimas obligatorias bien definidas
- deploys reproducibles
- rollback verificado

### Resultado esperado
GitHub Actions deja de ser algo “más o menos funcionando” y pasa a ser infraestructura confiable de desarrollo.

---

## 13. Orden recomendado de ejecución real
1. auditoría técnica + auditoría CI/CD
2. modelo `serviceOrder`
3. navegación v2
4. extracción de `Servicios`
5. dashboard por rol
6. portal cliente
7. IA embebida
8. branding y refinamiento
9. endurecimiento final del pipeline y documentación de release

### Nota
Aunque el CI/CD aparece como fase 8 conceptual, la auditoría y reparación inicial del pipeline debe arrancar desde el comienzo para no desarrollar sobre una base inestable.

---

## 14. División de trabajo por bloques

## Bloque A, foundations
- dominio
- rutas
- permisos
- CI/CD base

## Bloque B, core operativo
- servicios
- agenda
- detalle
- cierre

## Bloque C, experiencias por actor
- dashboard empresa
- dashboard técnico
- portal cliente

## Bloque D, diferenciadores
- IA
- branding
- refinamiento UX

---

## 15. Criterios de aceptación por fase

### Dominio
- `serviceOrder` definido y usable
- coexistencia con `appointment` controlada

### Navegación
- cada rol ve una experiencia coherente
- no hay rutas mezcladas sin propósito

### Core operativo
- agenda, detalle y cierre ya no viven en un solo monstruo
- el técnico puede ejecutar tareas críticas con menos pasos

### Portal cliente
- ya transmite estado, trazabilidad y valor

### IA
- al menos 2 o 3 acciones generan ahorro operativo real

### CI/CD
- ningún merge importante ocurre sin checks mínimos
- previews y deploys son trazables
- rollback está documentado y probado

---

## 16. Riesgos de implementación
- intentar migrar todo de una sola vez
- romper compatibilidad con datos actuales
- sobrecargar al equipo con refactor y rediseño simultáneo
- mover IA demasiado pronto sin limpiar flujo base
- asumir que CI/CD ya está “suficientemente bien” cuando todavía puede fallar en casos borde

### Mitigación
- fases pequeñas
- compatibilidad temporal
- feature flags si hace falta
- validación continua
- pipeline endurecido desde temprano

---

## 17. Próximo paso recomendado
Convertir este implementation plan en plan técnico ejecutable por tareas.

### Siguiente documento sugerido
- `docs/urbly-v2/execution-plan.md`

Con:
- tareas concretas por archivo
- secuencia de commits
- pruebas por fase
- criterios de done
- estrategia de rollout
