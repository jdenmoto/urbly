# Urbly — Agent Execution Instructions

Modelo ejecutor principal: `ollama/qwen2.5-coder:3b`

Estas instrucciones son obligatorias para cualquier agente que implemente tareas de Urbly.

## 1. Principio central

Las tareas deben ser pequeñas, atómicas y verificables.  
No intentes resolver una fase completa en una sola ejecución.

Si una tarea parece grande, divídela antes de implementar.

## 2. Antes de empezar cualquier tarea

1. Leer `docs/plans/urbly-master-implementation-plan.md`.
2. Identificar la primera tarea `pending` o `in_progress` asignada.
3. Confirmar que la rama base local está actualizada con `develop`.
4. Crear una rama específica para la tarea.
5. Revisar únicamente los archivos listados en la tarea, salvo que sea necesario inspeccionar dependencias directas.
6. Si falta una decisión crítica, no inventar: marcar `blocked` y notificar.

## 3. Flujo Git obligatorio

```bash
git checkout develop
git pull --ff-only origin develop || git pull --ff-only github develop
git checkout -b <branch-name>
```

Al terminar:

```bash
git status
git add <files>
git commit -m "<conventional commit en español>"
git push -u origin <branch-name> || git push -u github <branch-name>
```

No hacer merge a `develop`.
No desplegar producción.

## 4. TDD obligatorio

Para todo cambio funcional:

1. Crear o actualizar test primero.
2. Ver test fallar si es viable.
3. Implementar cambio mínimo.
4. Ver test pasar.
5. Refactorizar solo si no amplía alcance.

Si no es viable crear test primero, documentar por qué en el update del plan maestro.

## 5. Validaciones mínimas

Cada tarea debe correr como mínimo:

```bash
npm run lint
npm run typecheck
npm run test:run -- <test relacionado si aplica>
```

Si toca build, rutas, Firebase client, Cloud Functions, reglas, dependencias o CI:

```bash
npm run build:minimum
```

Si toca Functions:

```bash
npm --prefix functions run build
```

Si toca dependencias:

```bash
npm audit
npm --prefix functions audit
```

## 6. Actualización obligatoria del plan maestro

Al completar completamente una tarea, actualizar:

`docs/plans/urbly-master-implementation-plan.md`

Debe quedar claro:

- tarea marcada como `done`
- rama usada
- commit generado
- archivos cambiados
- validaciones ejecutadas
- siguiente tarea exacta
- punto de arranque para el siguiente agente

No basta con escribir “continuar con la siguiente fase”.  
Debe decir exactamente qué archivo/tarea debe abrir el siguiente agente.

## 7. Si hay bloqueo

Marcar tarea como `blocked` en el plan maestro e incluir:

- qué faltó
- qué se intentó
- archivo/línea si aplica
- pregunta específica para desbloquear

Además, notificar por Telegram usando canal configurado:

- channel: `telegram`
- target: `129362677`

Mensaje breve:

```txt
Urbly bloqueado en <TASK-ID>: <causa>. Necesito decisión: <pregunta concreta>.
```

## 8. Límites de autonomía

Permitido:

- modificar frontend
- modificar Cloud Functions
- modificar Firestore/Storage Rules
- modificar CI
- modificar tests
- borrar código legacy si ya fue reemplazado y validado
- hacer commit
- hacer push

Prohibido:

- desplegar producción sin autorización explícita
- hacer merge a `develop`
- cambiar alcance de producto sin actualizar plan maestro
- guardar secretos
- relajar reglas de seguridad para hacer pasar tests
- usar permisos genéricos cuando la tarea pide tenant-aware

## 9. Estilo de implementación para qwen2.5-coder:3b

Preferir:

- cambios pequeños
- funciones simples
- nombres explícitos
- tests directos
- no abstracciones grandes
- no refactors masivos
- no tocar archivos fuera del scope

Evitar:

- reescribir pantallas completas
- migraciones gigantes en una tarea
- cambios combinados de seguridad + UX + refactor
- inferir requisitos faltantes

## 10. Convención de commits

Usar conventional commits en español:

- `fix: proteger lectura de service orders`
- `feat: agregar portal publico tokenizado`
- `test: cubrir permisos multi tenant`
- `refactor: remover scheduling del flujo principal`
- `chore: actualizar ci de pruebas`

## 11. Criterio para pedir escalamiento

Escalar si:

- falta una decisión de producto o seguridad
- una prueba requiere infraestructura no definida
- un cambio implica migración irreversible
- el modelo no puede mantener contexto suficiente
- hay conflicto entre plan maestro y código real

No escalar por errores normales de lint/test; investigar primero.

## 12. Estado actual

No ejecutar aún.  
El plan maestro está en fase de cierre de decisiones críticas, especialmente multitenancy, rol de reapertura y cobertura objetivo.


## 13. Branch de fase y PR

Cada fase tiene un branch de integración `phase/<n>-<slug>`.
Las tareas atómicas pueden usar ramas propias. Al completar todas las tareas de una fase, el último agente debe:

1. integrar ramas atómicas en el branch de fase,
2. correr gates de fase,
3. crear o actualizar `docs/plans/phase-<n>-changelog.md`,
4. abrir PR grande contra `develop`,
5. dejar el PR abierto para revisión humana.

No hacer merge sin autorización explícita.

## 14. Migración y multitenancy confirmados

- Tenant root: `account`.
- Account inicial: `urbly-default`.
- Memberships: `accounts/{accountId}/members/{uid}`.
- Custom claims: `activeAccountId`, `role`, `permissions`.
- Cambio de cuenta activa: callable server-side.
- Usuarios pueden tener roles distintos por cuenta.
- Técnicos multi-cuenta son empleados separados por cuenta.
- `settings` vive por cuenta en `accounts/{accountId}/settings/...`.
- `feature_flags` son globales por defecto.

## 15. Cobertura confirmada

- Global mínima inicial: 70%.
- Dominio crítico: 90%.
- Firebase Rules: tests con emulator obligatorios.
- CI debe fallar si baja la cobertura mínima.
- Excepciones solo documentadas en plan maestro.
