# Run: fix circular chunk warning in Vite build

Date: 2026-06-01
Owner: SpiderMan (developer)

## Context
During `npm run build`, Vite/Rollup reported:
- Circular chunk: `feature-buildings -> feature-services -> feature-buildings`.

## Change applied
File updated:
- `vite.config.ts`

Manual chunk strategy was adjusted to group tightly coupled feature code into a single chunk:
- `src/features/scheduling/**`
- `src/features/buildings/**`
- `src/features/services/**`

These now resolve to:
- `feature-operations`

This removes the inter-chunk cycle caused by cross-feature imports while preserving vendor chunking.

## Validation
Command run:
- `npm run build`

Result:
- Exit code `0`
- Build completed successfully.
- Previous circular chunk warning is no longer present.

## Notes
- A non-blocking Browserslist staleness notice still appears (`caniuse-lite is 6 months old`), unrelated to this fix.
