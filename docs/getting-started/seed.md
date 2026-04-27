# Seed and Cleanup

## Variables necesarias
```bash
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
SEED_DEMO_PASSWORD=UrblyDemo2026!
```

## Seed base de Firestore
```bash
npm run firestore:seed
```

## Crear usuarios demo por rol
```bash
npm run seed:users
```

## Inicializar todo de una vez
```bash
npm run seed:all
```

## Usuarios demo creados
- `admin.demo@urbly.local`
- `editor.demo@urbly.local`
- `view.demo@urbly.local`
- `scheduler.demo@urbly.local`
- `supervisor.demo@urbly.local`
- `operator.demo@urbly.local`
- `auditoria.demo@urbly.local`
- `emergency.demo@urbly.local`
- `buildingadmin.demo@urbly.local`
- `client.demo@urbly.local`

Todos usan la misma contraseña definida en `SEED_DEMO_PASSWORD`.

## Notas
- `building_admin` y `client` quedan asociados a `mgmt-aurora` para probar portal y vistas externas.
- el script aplica claims y además deja sincronizado `users` en Firestore.

## Limpieza
```bash
npm run firestore:clear:buildings
```
