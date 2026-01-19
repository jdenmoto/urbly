# Functions and Deploy

## Install and build
```
npm --prefix functions install
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
