# Urbly MVP

Plataforma SaaS para gestion inteligente de edificios, agenda y dashboard. Este repositorio contiene el MVP web con React + Firebase + Tailwind y estructura preparada para evolucionar a mobile.

## Stack
- React + TypeScript (Vite)
- Tailwind CSS
- React Router
- TanStack Query + TanStack Table
- React Hook Form + Zod
- FullCalendar
- Firebase Auth + Firestore + Storage + Functions
- GitHub Actions (deploy a Firebase Hosting)

## Estructura
```
/src
  /app              -> routing y layouts
  /features         -> buildings, management, employees, scheduling, dashboard
  /components       -> UI reutilizable
  /core             -> logica de dominio
  /lib
    /firebase       -> config, auth, firestore, storage, functions
    /api            -> wrappers Firestore / Functions
  /styles           -> tailwind
/functions          -> Firebase Cloud Functions
/public
```

## Setup
1. Instalar dependencias:
   ```bash
   npm install
   npm --prefix functions install
   ```
2. Variables de entorno en `.env`:
   ```bash
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_GOOGLE_MAPS_API_KEY=...
   ```
   - Puedes copiar `.env.example` y completar los valores.
   - Para Firebase: toma `apiKey` y `projectId` desde la configuracion web en Firebase Console.
   - Para Google Maps: habilita Places API y usa la API key en `VITE_GOOGLE_MAPS_API_KEY`.
   - Habilitar Places API:
     - Google Cloud Console -> APIs & Services -> Library -> Places API -> Enable.
     - APIs & Services -> Credentials -> API Key -> Restrict key.
     - API restrictions: habilita Places API y Maps JavaScript API.
     - Application restrictions: agrega `http://localhost:5173` y tu dominio de produccion.
3. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```

## Deploy
- Configura `FIREBASE_SERVICE_ACCOUNT` y `FIREBASE_PROJECT_ID` en GitHub Actions.
- Merge a `main` para deploy automatico (hosting + functions + rules + indexes).

### Deploy manual de Functions
1. Instala Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Inicia sesion:
   ```bash
   firebase login
   ```
3. Selecciona el proyecto (si no tienes `.firebaserc`):
   ```bash
   firebase use urbly-2bae2
   ```
4. Instala dependencias y compila:
   ```bash
   npm --prefix functions install
   npm --prefix functions run build
   ```
5. Despliega:
   ```bash
   firebase deploy --only functions
   ```

## Datos seed
Ejemplo en `seed/seed.json`. Se puede importar manualmente via Firebase console o scripts propios.

## Decisiones tecnicas
- Dominio en `/core` para reutilizacion futura en React Native.
- UI responsive con breakpoints md/lg para desktop/tablet/phone.
- Imports masivos via Cloud Function `importBuildings`.

## Reglas Firestore
- Lectura para usuarios autenticados.
- Escritura solo para admin (`request.auth.token.role == 'admin'`).
