# Firebase Setup

## 1) Create the Firebase project
1. Go to Firebase Console and create a new project.
2. Enable Google Analytics if needed.

## 2) Enable products
- Authentication: enable Email/Password provider.
- Firestore Database: create in production or test mode.
- Storage: create default bucket.
- Functions: enable Cloud Functions.
- Hosting: enable Hosting.

## 3) Create a Web App
1. Project settings -> Your apps -> Add web app.
2. Copy `apiKey` and `projectId` into `.env.local`.

## 4) Service account
1. Project settings -> Service accounts -> Generate new private key.
2. Save the JSON locally as `service-account.json` (do not commit).

## 5) Firestore rules and indexes
Deploy rules and indexes:
```
firebase deploy --only firestore:rules,firestore:indexes
```

## 6) Storage CORS (for uploads)
Create `cors.json` and apply:
```
gsutil cors set cors.json gs://YOUR_BUCKET
```

## 7) Functions secret (Google Maps)
Set the Google Maps API key for Functions:
```
firebase functions:secrets:set GOOGLE_MAPS_API_KEY
```

## 8) Admin role
Set custom claim `role=admin` for your user. Example:
```
node -e "const admin=require('firebase-admin');admin.initializeApp({credential:admin.credential.cert(require('./service-account.json'))});admin.auth().getUserByEmail('YOUR_EMAIL').then(u=>admin.auth().setCustomUserClaims(u.uid,{role:'admin'})).then(()=>console.log('ok'))"
```
Then sign out/in to refresh the token.
