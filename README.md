# CFC — City Family Care

Frontend for a home-services marketplace: three Next.js apps sharing one design
system.

| App | Port | Screens | State |
|---|---|---|---|
| **Admin** — super admin web panel | 3002 | 49 | Built, mobile responsive |
| **Consumer** — customer PWA | 3000 | 44 | In progress (9 of 44) |
| **Pro** — professional app | 3001 | 35 | Not started |

## Getting started

Requires Node 20+ and pnpm.

```bash
cd frontend
pnpm install
pnpm dev:admin      # http://localhost:3002
pnpm dev:consumer   # http://localhost:3000
```

Every command runs from `frontend/`, not the repository root.

## Layout

```
frontend/
  apps/
    admin/       super admin panel
    consumer/    customer PWA
    pro/         professional app
  packages/
    ui/          design system — components, primitives, charts, formatters
    tokens/      colour and type tokens as CSS custom properties
    types/       shared domain types
    mocks/       the fake API every screen reads from
    config/      Tailwind preset, ESLint configs, tsconfig bases
```

## Read these before writing code

Four documents, in this order:

1. **`SCREEN-INVENTORY.md`** — the 128 screens the agreement specifies. A screen
   is done when it satisfies its inventory line, not when it looks finished.
2. **`PLATFORM-FACTS.md`** — every real domain rule: the 15-minute quotation
   window, the ₹5,000 phone-confirmation threshold, GST at CGST 9% + SGST 9% on
   the platform fee only. **It also lists what is *not* stated anywhere and must
   never be claimed on a screen.** No figure goes into the UI without a source
   here.
3. **`ADMIN-SUMMARY.md`** — what was built, what was wrong with it, and what is
   still pending.
4. **`frontend/RUNBOOK.md`** — commands and troubleshooting.

## Three things that will bite you

**The Tailwind scale is closed.** `spacing` is *replaced*, not extended, so an
off-scale class like `w-24` or `gap-1.5` generates **no CSS at all** — no error,
no warning, the element simply has no size. This has caused real bugs: a
sidebar with no width, avatars with no size, dropdowns that never scrolled.
Named dimensions live in `packages/config/tailwind-preset.js`. Six ESLint rules
catch the common cases; run the linter.

**Opacity modifiers do not work on colour tokens.** Tokens are authored as hex,
so `bg-action/90` generates nothing. Add a dedicated token instead.

**Screens never import fixtures.** They import functions from `@cfc/mocks`. The
mock API shape is a contract with the backend team — if swapping in the real API
would require touching a screen file, the boundary is in the wrong place.

## Checks

```bash
cd frontend
pnpm typecheck   # all packages
pnpm lint        # all apps + the ui package
```

Both must be green before a commit. The design-system rules above are enforced
by the linter, so a lint failure is usually a real visual bug rather than a
style preference.

## Not in this repository

The signed agreement and the platform PDF are excluded by `.gitignore` —
they are the client's documents, not source. `PLATFORM-FACTS.md` is the extract
the code needs.
