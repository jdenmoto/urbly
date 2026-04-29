# Urbly MVP

Urbly is a SaaS platform for modern building management. This repository contains the web MVP built with React, Firebase, and Tailwind, prepared for future React Native reuse.

## Table of Contents
- Docs index: `docs/README.md`
- Project overview: `docs/getting-started/project-overview.md`
- Firebase setup: `docs/getting-started/firebase-setup.md`
- Environment variables: `docs/getting-started/env.md`
- Google Maps setup: `docs/getting-started/google-maps.md`
- Functions and deploy: `docs/getting-started/functions.md`
- Seed and cleanup: `docs/getting-started/seed.md`
- Bulk import: `docs/reference/import.md`
- Trello cards: `docs/reference/trello.md`
- Security notes: `docs/reference/security-notes.md`
- Risks: `docs/reference/risks.md`
- Urbly v2 docs: `docs/implementation/urbly-v2/README.md`
- Resumen final de revisión: `docs/implementation/final-pr-summary-2026-04-28.md`
- Urbly v2 design doc: `docs/implementation/urbly-v2/design.md`
- Plan de implementación vigente: `docs/implementation/current-implementation-plan.md`

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
