# Instalación y configuración rápida

## Requisitos
- Node.js
- npm
- Firebase CLI
- proyecto Firebase configurado

## 1. Instalar dependencias
```bash
npm install
npm --prefix functions install
```

## 2. Configurar variables de entorno
Frontend en `.env.local`:
```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_GOOGLE_MAPS_API_KEY=
VITE_GOOGLE_MAPS_MAP_ID=
```

Scripts/seed:
```bash
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
```

## 3. Configurar Firebase
- habilitar Auth, Firestore, Storage, Functions y Hosting
- descargar `service-account.json` local, sin commitear
- desplegar reglas e índices:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```
- configurar secret de Functions:
```bash
firebase functions:secrets:set GOOGLE_MAPS_API_KEY
```
- asignar claim admin al usuario inicial

## 4. Levantar proyecto
```bash
npm run dev
```

## 5. Validar build
```bash
npm run build
```

## 6. Deploy de functions cuando aplique
```bash
npm --prefix functions run build
firebase deploy --only functions
```

## Referencias detalladas
- `firebase-setup.md`
- `env.md`
- `functions.md`
- `google-maps.md`
