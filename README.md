# Urbly MVP

Urbly is a SaaS platform for modern building management. This repository contains the web MVP built with React, Firebase, and Tailwind, prepared for future React Native reuse.

## Table of Contents
- Docs index: `docs/README.md`
- Project overview: `docs/project-overview.md`
- Firebase setup: `docs/firebase-setup.md`
- Environment variables: `docs/env.md`
- Google Maps setup: `docs/google-maps.md`
- Functions and deploy: `docs/functions.md`
- Seed and cleanup: `docs/seed.md`
- Bulk import: `docs/import.md`
- Trello cards: `docs/trello.md`
- Security notes: `docs/security-notes.md`
- Risks: `docs/risks.md`

## Quick Start
```
npm install
npm --prefix functions install
npm run dev
```

## Deploy (Firebase Preview Channels)
Use Hosting preview channels for safe QA deploys before production:

```bash
# Uses current git branch as channel id
npm run deploy:preview

# Custom channel id
npm run deploy:preview -- feature-calendar-redesign
```

Optional env vars:
- `FIREBASE_PREVIEW_EXPIRES` (default: `7d`)
- `FIREBASE_PROJECT` (if you want to force a project id)
