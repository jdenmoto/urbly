# Functions and Deploy

## Install and build
```
npm --prefix functions install
npm --prefix functions run typecheck
npm --prefix functions run build
```

## Deploy functions
```
firebase deploy --only functions
```

## Set runtime secret (Google Maps)
```
firebase functions:secrets:set GOOGLE_MAPS_API_KEY
```

## Deploy rules and indexes
```
firebase deploy --only firestore:rules,firestore:indexes
```

## GitHub Actions secrets
Secrets esperados por los workflows actuales:

### Obligatorios
- `FIREBASE_SERVICE_ACCOUNT`
- `FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_GOOGLE_MAPS_MAP_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`

### Opcionales
- `FIREBASE_HOSTING_SITE`
- `FIREBASE_BROWSER_KEY_ID`
