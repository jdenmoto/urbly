# Urbly v2 Design Doc

## 1. Objetivo
Rediseñar Urbly para que deje de sentirse como un panel administrativo por módulos y pase a comportarse como un sistema operativo de servicio para tres actores: empresa, técnico y cliente.

La meta no es solo mejorar UI. La meta es reordenar producto, flujo operativo y experiencia para que la IA quede integrada en el corazón del negocio.

---

## 2. Resumen ejecutivo
La base actual de Urbly es funcional, pero su arquitectura de información está centrada en entidades internas como `buildings`, `management`, `employees` y `appointments`.

Eso sirve para operar datos, pero no representa bien el ciclo real del negocio:

1. solicitud
2. diagnóstico
3. cotización
4. programación
5. ejecución
6. evidencia
7. informe
8. comunicación
9. seguimiento

Urbly v2 debe reorganizarse alrededor de una entidad central de servicio y de experiencias separadas por actor.

---

## 3. Diagnóstico del estado actual

### Fortalezas
- Stack moderno y suficiente para iterar rápido: React, TypeScript, Tailwind, Firebase.
- Existe base funcional real para dashboard, edificios, empleados, agenda, usuarios y portal.
- `SchedulingPage` ya concentra buena parte de la lógica operativa del negocio.
- Existe infraestructura suficiente para reportes, PDFs, fotos y settings.

### Debilidades
- La navegación principal está pensada desde administración interna, no desde flujo de servicio.
- `SchedulingPage` concentra demasiadas responsabilidades y crea una UX pesada.
- `DashboardPage` funciona como control interno, pero no como home diferenciado por rol.
- El portal cliente es demasiado básico para transmitir control, trazabilidad y valor.
- La IA todavía no está integrada como capa transversal de trabajo.
- La marca y la experiencia visual no parecen todavía producto premium-operativo.

### Riesgo principal
Si Urbly evoluciona sobre la estructura actual sin rediseño de producto, crecerá como software administrativo con features nuevas pegadas encima. Eso hace más difícil introducir IA, escalar UX móvil para técnicos y construir una experiencia fuerte para clientes.

---

## 4. Decisión de diseño principal
La entidad principal del sistema no debe seguir siendo solo `appointment`.

Se propone introducir una entidad núcleo:
- `serviceOrder`
- o `serviceCase`

Recomendación: **`serviceOrder`** para mantener lenguaje más operativo y comercial.

### `serviceOrder` debe agrupar
- cliente
- edificio o activo
- tipo de servicio
- prioridad
- estado
- fecha programada
- técnico asignado
- checklist operativo
- evidencias
- incidencias
- cotización relacionada
- informe técnico
- historial
- seguimiento
- comunicación generada al cliente

Esto permite que agenda, ejecución, reportes, portal cliente y automatizaciones giren alrededor del mismo objeto.

---

## 5. Principios de producto para Urbly v2

### 5.1 Producto centrado en flujo, no en tablas
La experiencia debe seguir el ciclo operativo del servicio, no la estructura interna de base de datos.

### 5.2 Separación clara por actor
Empresa, técnico y cliente comparten datos, pero no deben compartir la misma experiencia principal.

### 5.3 IA embebida en los momentos críticos
La IA debe reducir trabajo administrativo y acelerar decisiones, no vivir en un módulo aislado.

### 5.4 Mobile-first para técnicos
La experiencia del técnico debe diseñarse primero para móvil, partiendo desde 320px y subiendo. Las acciones críticas deben resolverse con pocos pasos, buen contraste, feedback claro y superficies táctiles cómodas.

### 5.5 Confianza visual y operativa
La UI debe transmitir orden, trazabilidad y calidad. Priorizar jerarquía visual clara, spacing consistente en múltiplos de 8, contraste suficiente y patrones repetibles.

### 5.6 Menor carga cognitiva
Separar lectura, acción, edición y cierre en pantallas o modos distintos cuando mezclarlo complique la operación.

---

## 6. Actores y jobs to be done

## A. Empresa
Perfil: equipo administrativo, coordinador, operación.

### Jobs principales
- saber qué servicios están activos, atrasados o en riesgo
- asignar técnicos
- verificar cumplimiento
- revisar incidencias y pendientes
- generar o validar cotizaciones e informes
- comunicar estado al cliente
- usar IA para reducir carga operativa

### Qué necesita ver primero
- servicios de hoy
- atrasados
- incidencias críticas
- técnicos ocupados
- clientes con riesgo
- acciones rápidas

---

## B. Técnico
Perfil: ejecutor de campo.

### Jobs principales
- ver sus servicios del día
- llegar rápido al contexto correcto
- seguir checklist
- capturar evidencias
- reportar incidencias
- cerrar servicio sin fricción
- apoyarse en IA para notas e informe

### Qué necesita ver primero
- siguiente servicio
- dirección y contexto
- checklist requerido
- evidencias pendientes
- CTA de cierre

---

## C. Cliente
Perfil: administrador del edificio, administración o contacto de cuenta.

### Jobs principales
- entender qué servicios están ocurriendo
- revisar historial
- consultar informes y evidencias
- saber qué sigue
- abrir solicitudes
- sentir control y confianza

### Qué necesita ver primero
- estado general
- próximos mantenimientos
- últimos informes
- solicitudes abiertas
- canal de contacto

---

## 7. Arquitectura de producto propuesta

## 7.1 Empresa
### Módulos
- Inicio
- Servicios
- Agenda
- Clientes
- Activos
- Técnicos
- Reportes
- IA
- Configuración

### Notas
- `Servicios` reemplaza el papel central actual de `Scheduling`.
- `Clientes` y `Activos` separan relación comercial de inventario operativo.
- `IA` puede existir como sección liviana, pero sus acciones deben aparecer dentro de servicios, reportes y comunicaciones.

---

## 7.2 Técnico
### Módulos
- Hoy
- Mis servicios
- Historial
- Evidencias
- Perfil

### Notas
- Navegación más corta y móvil.
- Acciones principales visibles sin scroll excesivo.
- Información secundaria detrás de paneles o secciones plegables.

---

## 7.3 Cliente
### Módulos
- Resumen
- Servicios
- Próximos mantenimientos
- Informes
- Solicitudes
- Contacto

### Notas
- El cliente no necesita ver complejidad interna.
- Debe predominar claridad, estado y confianza.

---

## 8. Navegación propuesta

## 8.1 Navegación empresa
1. Inicio
2. Servicios
3. Agenda
4. Clientes
5. Activos
6. Técnicos
7. Reportes
8. IA
9. Configuración

## 8.2 Navegación técnico
1. Hoy
2. Mis servicios
3. Historial
4. Evidencias
5. Perfil

## 8.3 Navegación cliente
1. Resumen
2. Servicios
3. Próximos mantenimientos
4. Informes
5. Solicitudes
6. Contacto

### Criterio UX
- Mantener consistencia entre actor y navegación.
- En móvil, usar bottom nav solo para acciones de alta frecuencia.
- En desktop, sidebar con jerarquía simple y pocas secciones.
- Usar labels cortos y orientados a tarea.

---

## 9. Rediseño de pantallas clave

## 9.1 Inicio / Dashboard
### Problema actual
Demasiado orientado a métricas internas y no suficientemente personalizado por rol.

### Propuesta
Home por rol.

#### Empresa
- servicios hoy
- servicios atrasados
- incidencias abiertas
- técnicos activos
- clientes que requieren seguimiento
- CTA rápidos: crear servicio, reprogramar, generar informe, enviar actualización

#### Técnico
- próximo servicio
- ruta / dirección
- hora de entrada
- checklist pendiente
- incidencias abiertas
- CTA rápidos: iniciar, subir foto, cerrar servicio

#### Cliente
- resumen del estado del edificio
- próximo mantenimiento
- informe más reciente
- solicitudes abiertas
- CTA rápidos: ver informe, abrir solicitud, contactar

---

## 9.2 Servicios
### Problema actual
La lógica está enterrada dentro de `SchedulingPage`.

### Propuesta
Crear una sección `Servicios` con tres vistas principales:

#### Vista 1: Agenda
- calendario
- lista
- filtros rápidos
- reprogramación
- asignación

#### Vista 2: Detalle de servicio
- contexto del cliente y edificio
- técnico asignado
- historial reciente
- checklist
- incidencias
- evidencias
- timeline del caso

#### Vista 3: Cierre de servicio
- checklist final
- carga de fotos
- incidencias finales
- informe técnico
- resumen generado por IA
- mensaje al cliente

### Beneficio
Baja carga cognitiva, escala mejor y deja claro el flujo.

---

## 9.3 Clientes y activos
### Problema actual
`BuildingsPage` mezcla operación útil con administración.

### Propuesta
Separar:
- `Clientes`: relación comercial y administrativa
- `Activos`: edificios, contratos, estado operativo e historial

### Beneficio
Mejor modelo mental para empresa y mejor crecimiento futuro.

---

## 9.4 Portal cliente
### Problema actual
Se siente como tabla + mapa + citas.

### Propuesta
Transformarlo en portal de confianza.

### Debe incluir
- estado actual del servicio
- próximos mantenimientos
- historial por edificio
- informes descargables
- evidencias destacadas
- incidencias relevantes
- solicitudes y seguimiento
- mensajes y actualizaciones

### Beneficio
Sube valor percibido y mejora retención.

---

## 9.5 Login y superficie de marca
### Problema actual
Funcional, pero genérico.

### Propuesta
- reforzar branding
- mejor copy de confianza
- layout más limpio
- jerarquía visual más fuerte
- estados de error y recuperación mejor resueltos

### Beneficio
Mejor primera impresión y mejor coherencia de producto.

---

## 10. Estrategia de IA
La IA debe aparecer en contexto, no solo en una página separada.

## 10.1 Antes del servicio
- resumir historial del edificio
- sugerir diagnóstico inicial
- generar borrador de cotización
- recomendar fecha o prioridad

## 10.2 Durante la ejecución
- estructurar notas técnicas
- sugerir clasificación de incidencia
- recordar evidencias faltantes
- ayudar a completar checklist

## 10.3 Cierre del servicio
- redactar informe técnico
- resumir hallazgos
- redactar mensaje al cliente
- sugerir próximo mantenimiento

## 10.4 Gestión y dirección
- resumen semanal
- clientes sin atención reciente
- servicios críticos
- técnicos saturados
- oportunidades de upsell o mantenimiento preventivo

### UX de IA recomendada
- botones de ayuda contextual
- panel lateral o bloque auxiliar dentro del servicio
- acciones explícitas como “Generar informe”, “Redactar mensaje”, “Resumir caso”
- permitir edición humana antes de enviar o guardar

---

## 11. Sistema visual recomendado
Basado en los principios de `ui-ux-design`.

### 11.1 Dirección visual
- estilo moderno, sobrio, profesional
- sensación premium-operativa, no startup juguetona
- contraste fuerte, layouts claros, mucho orden visual

### 11.2 Espaciado
- sistema de 8px
- padding de tarjetas: 24 a 32px
- separación entre secciones: 48 a 64px

### 11.3 Tipografía
- máximo dos fuentes
- sans-serif fuerte para UI
- escala clara entre body, títulos de sección y números de dashboard

### 11.4 Responsive
- mobile-first
- puntos clave: 320, 576, 768, 992, 1200
- experiencia de técnico priorizada en móvil
- experiencia empresa priorizada en desktop pero funcional en tablet

### 11.5 Accesibilidad
- contraste mínimo 4.5:1 en texto
- foco visible
- etiquetas claras
- navegación consistente
- botones suficientemente grandes para uso táctil

### 11.6 Microinteracciones
- hover sutil
- feedback claro al guardar, cerrar, completar o subir evidencias
- animaciones breves con transform y opacity

---

## 12. Roadmap de implementación

## Fase 1: Reordenamiento de producto
Objetivo: preparar base conceptual correcta.

### Entregables
- nuevo mapa de navegación
- definición de `serviceOrder`
- diseño de roles y permisos por experiencia
- nueva jerarquía de módulos

### Resultado esperado
Una arquitectura que soporte crecimiento sin meter más complejidad accidental.

---

## Fase 2: Core operativo
Objetivo: rehacer el corazón del flujo.

### Entregables
- rediseño de `SchedulingPage` hacia `Servicios`
- separación agenda / detalle / cierre
- dashboard por rol
- quick actions operativas

### Resultado esperado
Mejor operación y menor carga cognitiva.

---

## Fase 3: Portal cliente
Objetivo: subir valor percibido y trazabilidad.

### Entregables
- home cliente
- historial
- informes y evidencias
- solicitudes y seguimiento

### Resultado esperado
Mejor experiencia B2B y mejor sensación de control.

---

## Fase 4: IA integrada
Objetivo: convertir Urbly en producto más fuerte y más eficiente.

### Entregables
- informe asistido
- mensajes asistidos
- resumen de caso
- seguimiento sugerido
- tablero de insights operativos

### Resultado esperado
Menor trabajo manual y producto más diferenciado.

---

## Fase 5: Branding y refinamiento visual
Objetivo: cerrar percepción de producto premium-operativo.

### Entregables
- refresh visual
- login mejorado
- sistema de componentes más fuerte
- consistencia transversal

### Resultado esperado
Más confianza, mejor venta y mejor adopción.

---

## 13. Decisiones recomendadas
1. No seguir agregando features grandes sobre `SchedulingPage` como está.
2. Introducir cuanto antes el concepto `serviceOrder`.
3. Rediseñar primero arquitectura y flujo antes de embellecer pantallas.
4. Diseñar la experiencia del técnico desde móvil.
5. Convertir el portal cliente en una pieza seria del producto, no una vista secundaria.
6. Integrar IA en pasos operativos concretos, no como módulo aislado.

---

## 14. Próximo paso recomendado
Pasar de este design doc a un plan de implementación con prioridad de archivos, pantallas y secuencia de trabajo.

### Plan sugerido siguiente
1. traducir este documento a arquitectura técnica
2. definir `serviceOrder` y mapa de datos
3. planificar refactor de navegación
4. planificar rediseño de `SchedulingPage`
5. ejecutar por fases con cambios pequeños y verificables
6. incluir reparación y endurecimiento del CI/CD de GitHub para que validaciones, build y deploy queden estables

---

## 15. Criterio de éxito
Urbly v2 será exitoso si logra esto:
- la empresa entiende y controla la operación sin fricción
- el técnico ejecuta desde móvil con pocas acciones
- el cliente ve trazabilidad y confianza
- la IA ahorra tiempo real
- la UI se siente moderna, consistente y sólida
