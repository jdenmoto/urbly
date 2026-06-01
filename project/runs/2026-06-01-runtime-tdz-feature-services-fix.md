# Run: fix runtime TDZ in feature-services chunk

Date: 2026-06-01
Owner: SpiderMan (developer)

## Reported issue
Runtime error in production bundle:
- `Uncaught ReferenceError: Cannot access 'qi' before initialization`
- file: `feature-services-*.js`

## Root cause hypothesis
A manual feature chunking strategy grouped/forced coupled modules in a way that made module init order more fragile at runtime (TDZ on minified binding under circular evaluation path).

## Applied fix
Updated `vite.config.ts`:
- Removed manual chunk mapping for application features.
- Kept only vendor chunking rules.

This lets Rollup/Vite compute safer chunk boundaries for app modules and avoids forced ordering between services/buildings/scheduling feature modules.

## Validation
Command run:
- `npm run build`

Result:
- Exit code `0`
- Build completed successfully.
- Output now splits by route/module and no longer emits `feature-services-*.js` as a monolithic manual feature chunk.

## Operational note
If the browser still requests old hashed assets (e.g. `feature-services-BVZpCHYl.js`), it's likely a stale deployed bundle or browser/service-worker cache. A fresh deploy plus hard refresh should clear it.
