# Phase 0 — Original CSS backup

Taken 2026-09-16, BEFORE any Phase 0 restructure work.

## What these are

| File | Lines | Original location |
|---|---|---|
| `home-pages.css` | 1,765 | `frontend/apps/consumer/src/app/(home)/home-pages.css` |
| `brand.css` | 232 | `frontend/apps/consumer/src/app/brand.css` |

These are byte-identical copies of the files that render the APPROVED home pages
(signed-out and signed-in) at the moment Phase 0 began.

## Why this folder is outside the app

It sits at the repo root, not inside `frontend/apps/consumer/src/`, so the build
never compiles it. A stray copy of a stylesheet inside `src/` could load twice and
cause exactly the silent visual bugs Phase 0 is trying to avoid.

## How to restore

Copy the file back over its original location and restart the dev server:

    cp css-backup/phase0-original/home-pages.css "frontend/apps/consumer/src/app/(home)/home-pages.css"
    cp css-backup/phase0-original/brand.css       frontend/apps/consumer/src/app/brand.css

## Do not delete

Keep until Phase 11 (final verification) has passed and the work is approved.
