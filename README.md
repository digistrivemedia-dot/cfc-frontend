# CFC — City Family Care

Frontend for an Indian home-services marketplace: three Next.js applications
sharing one design system.

| App | Port | Routes | Who uses it |
|---|---|---|---|
| **Consumer** | 3000 | 29 | The customer — browses services, books, pays, tracks the job |
| **Pro** | 3001 | 33 | The professional — accepts jobs, does the work, gets paid |
| **Admin** | 3002 | 13 | The back office — bookings, professionals, customers, payments |

Each app deploys independently. They never import each other; they share only
types and mock data.

## Getting started

Requires Node 20+ and pnpm.

```bash
cd frontend
pnpm install
pnpm dev             # all three
pnpm dev:consumer    # http://localhost:3000
pnpm dev:pro         # http://localhost:3001
pnpm dev:admin       # http://localhost:3002
```

Every command runs from `frontend/`, not the repository root.

## Layout

```
frontend/
  apps/
    consumer/    customer app
    pro/         professional app
    admin/       back office
  packages/
    ui/          design system — components, primitives, charts, formatters
    tokens/      colour and type tokens as CSS custom properties
    types/       shared domain types
    mocks/       the fake API every screen reads from
    config/      Tailwind preset, ESLint configs, tsconfig bases
```

## There is no backend yet

Every screen reads from `@cfc/mocks`. The cart, the session and the selected
area persist in `localStorage` only — signing in flips a boolean rather than
authenticating anything.

The mock API shape is a contract with the backend team. **If swapping in the
real API would require editing a screen file, the boundary is in the wrong
place.** Screens import functions from `@cfc/mocks`, never fixtures directly.

## Read these before writing code

1. **`ARCHITECTURE.md`** — how the apps fit together, how the styling is
   layered, the rules, and what is deliberately unfinished. **Start here.**
2. **`SCREEN-INVENTORY.md`** — the screens the agreement specifies, and the
   numbering used in code comments ("Customer 12", "Pro 35"). A screen is done
   when it satisfies its inventory line, not when it looks finished.
3. **`PLATFORM-FACTS.md`** — every real domain rule: the 15-minute quotation
   window, the ₹5,000 phone-confirmation threshold, GST on the platform fee
   only. **It also records what is not stated anywhere and must never be
   claimed on screen.** No figure reaches the UI without a source here.
4. **`frontend/RUNBOOK.md`** — commands and troubleshooting.

## Four things that will bite you

**Never edit `frontend/packages/`.** All three apps import it, so a change made
for one silently changes the other two. If a shared package genuinely needs a
new value, add a **named token** — and confirm it is additive by building the
other two apps before and after and comparing their CSS output.

**The Tailwind scale is closed.** `colors`, `spacing`, `fontSize`, `borderRadius`
and `boxShadow` are *replaced*, not extended — so an off-scale class like
`w-24`, `gap-1.5` or `text-white` generates **no CSS at all**. No error, no
warning, no red underline; the style simply does not apply. Check
`packages/config/tailwind-preset.js` before writing any class you have not used
in this repo, and confirm in the browser that a styling change actually took
effect.

**Opacity modifiers do not work on colour tokens.** They are authored as hex, so
`bg-action/90` generates nothing. Add a dedicated token instead.

**The consumer home pages are client-approved.** `app/(home)/` and its
stylesheets carry a signed-off design. Changes there need the client's
agreement; the rest of the app does not.

## Checks

```bash
cd frontend
pnpm typecheck   # all packages
pnpm lint        # all apps + the ui package
```

Both must be green before a commit. Note that neither catches a styling change
that silently did nothing — see the closed-scale warning above, and check the
browser.

## Not in this repository

The signed agreement is excluded by `.gitignore` — it carries commercial terms
the code never needs. `PLATFORM-FACTS.md` is the extract that does.
`cfcplatform.pdf`, the client's screen specification, **is** committed: it is
the source of the screen inventory and the numbering used throughout the code.
