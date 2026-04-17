# Google Maps Setup

## Enable APIs
In Google Cloud Console:
- Enable Maps JavaScript API
- Enable Places API (New)
- Enable Geocoding API

## API key restrictions
- API restrictions: allow the three APIs above.
- Application restrictions: add
  - http://localhost:5173/*
  - your production domain

## Functions Geocoding
Cloud Functions import uses Geocoding API. Set the key with:
```
firebase functions:secrets:set GOOGLE_MAPS_API_KEY
```
Then deploy functions.
