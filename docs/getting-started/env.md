# Environment Variables

## Frontend (.env / .env.local)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_GOOGLE_MAPS_API_KEY=
```

## Scripts (seed/cleanup)
```
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
```

## Functions (runtime)
Set the Google Maps API key for Cloud Functions (secrets):
```
firebase functions:secrets:set GOOGLE_MAPS_API_KEY
```
Verify:
```
firebase functions:secrets:access GOOGLE_MAPS_API_KEY
```
