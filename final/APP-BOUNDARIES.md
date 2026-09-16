# APP-BOUNDARIES.md — how Consumer, Pro and Admin share code, and how not to break each other

> **Who this is for.** Anyone about to change the customer app who must not break
> the Pro app or the Admin panel, which the client has already accepted. Also anyone
> about to change shared code. Everything here was read from the repository on
> **2026-09-15**. Where something is measured rather than read, it says how and when.
> Where it could not be proven, it says **NOT VERIFIED**.
>
> **Companion documents:** `final/CONSUMER.md` (the customer app in depth),
> `final/FILE-AUDIT.md` (every other file).

---

## Contents

1. [The monorepo in one picture](#1-the-monorepo-in-one-picture)
2. [The rules that keep apps apart](#2-the-rules-that-keep-apps-apart)
3. [What each app pulls in, side by side](#3-what-each-app-pulls-in-side-by-side)
4. [Every shared file and its blast radius](#4-every-shared-file-and-its-blast-radius)
5. [Which shared components, types and mocks each app actually uses](#5-which-shared-components-types-and-mocks-each-app-actually-uses)
6. [How the consumer redesign is isolated, and where it is not](#6-how-the-consumer-redesign-is-isolated--and-where-it-is-not)
7. [Local changes to shared files right now, and the proof](#7-local-changes-to-shared-files-right-now--and-the-proof)
8. [Collision scenarios: things that would break another app](#8-collision-scenarios--things-that-would-break-another-app)
9. [Where a change belongs (decision table)](#9-where-a-change-belongs-decision-table)
10. [Before you edit a shared file: checklist](#10-before-you-edit-a-shared-file--checklist)
11. [Proving nothing leaked: exact procedure](#11-proving-nothing-leaked--exact-procedure)
12. [Pro and Admin at a glance](#12-pro-and-admin-at-a-glance)
13. [Open boundary issues](#13-open-boundary-issues)

---

## 1. The monorepo in one picture

```
frontend/                          pnpm workspace + Turborepo
├── package.json                   root scripts: dev, dev:consumer|pro|admin, build, lint, typecheck, format
├── pnpm-workspace.yaml            packages: apps/*, packages/*
├── pnpm-lock.yaml                 ONE lockfile for all three apps
├── turbo.json                     build / dev / lint / typecheck pipelines
├── apps/
│   ├── consumer/   @cfc/consumer  port 3000   customers (the app being redesigned)
│   ├── pro/        @cfc/pro       port 3001   service professionals   (accepted)
│   └── admin/      @cfc/admin     port 3002   operations console      (accepted)
└── packages/
    ├── config/     @cfc/config    Tailwind preset, ESLint configs, tsconfigs
    ├── tokens/     @cfc/tokens    tokens.css (CSS variables) + a few JS constants
    ├── types/      @cfc/types     TypeScript interfaces for every domain object
    ├── ui/         @cfc/ui        shared components, primitives, charts, formatters, styles.css
    └── mocks/      @cfc/mocks     the fake API + seeded fixtures used by all three apps
```

- **Every package ships TypeScript source, not built output.** Each app lists them
  in `transpilePackages` (`apps/*/next.config.js:L4`), so a change in a package is
  picked up by all three apps on their next dev reload or build. **Nothing is
  versioned or published.** `workspace:*` means "whatever is on disk right now".
- **One lockfile.** Adding a dependency to any app or package rewrites
  `frontend/pnpm-lock.yaml`, which all apps install from.
- **Turborepo tasks** (`frontend/turbo.json`): `build` depends on `^build` and caches
  `.next/**`; `lint` and `typecheck` depend on `^build`; `dev` is persistent and
  uncached. Packages have no `build` script, so `^build` is a no-op for them.

---

## 2. The rules that keep apps apart

| Rule | Enforced by | What it prevents |
|---|---|---|
| **Apps never import from other apps** | ESLint `no-restricted-imports`, patterns `**/apps/*`, `@cfc/consumer/*`, `@cfc/pro/*`, `@cfc/admin/*` (`packages/config/eslint-app.js:L28-33`) | Consumer code leaking into Pro or Admin, or the reverse |
| Shared code lives in `packages/*` and is imported by package name | Same rule, message "Move the shared code into packages/ui" | Copy-paste drift |
| Never import `@cfc/ui` internals (`@cfc/ui/src/primitives/*`) | `eslint-app.js:L35-38` | Bypassing the public API of the design system |
| Screens never import mock **fixtures** directly | `eslint-app.js:L39-43` | Tight coupling to seed data |
| **Separate public folders, separate origins** | Next.js serves `apps/<app>/public/` only for that app; each app runs on its own port or domain | One app's images, manifest or `localStorage` reaching another |

**Verified on 2026-09-15:** no file under `apps/pro` or `apps/admin` references
`brand.css`, `home-pages.css` or any path inside `apps/consumer` (grep returned
nothing). No app imports another app.

**A consequence of the rule:** some code is intentionally duplicated per app. Both
Pro and Admin carry their own `src/lib/fonts.ts`, `src/fonts/*.woff2` and logo PNGs.
Consumer and Pro each have their own `components/coming-soon.tsx`. The consumer
`components/logo.tsx` comment says the same mark is drawn separately in Admin. **Do
not "fix" this duplication by importing across apps.** Move the code to
`packages/ui` if it really must be shared.

---

## 3. What each app pulls in, side by side

| | Consumer | Pro | Admin |
|---|---|---|---|
| Port (`package.json` scripts) | 3000 | 3001 | 3002 |
| `@cfc/*` dependencies | mocks, tokens, types, ui (+ config dev) | same | same |
| `next` / `react` | 15.1.12 / 19.0.0 | 15.1.12 / 19.0.0 | 15.1.12 / 19.0.0 |
| `eslint-config-next` | 15.1.3 | 15.1.3 | 15.1.3 |
| `tailwind.config.js` | shared preset; content `./src/**`, `../../packages/ui/src/**` | identical | identical |
| `.eslintrc.js` | shared `eslint-app.js` **+ consumer-only overrides for `src/app/(home)/**`** | shared only (6 lines) | shared only (6 lines) |
| Global CSS imported by root layout | `@cfc/ui/styles.css` **then `./brand.css`**; `(home)/layout.tsx` adds `./home-pages.css` | `@cfc/ui/styles.css` only | `@cfc/ui/styles.css` only |
| Fonts (`src/lib/fonts.ts`) | Archivo (local) **+ Plus Jakarta Sans (next/font/google)** | Archivo only | Archivo only |
| `<html className>` | `archivo.variable jakarta.variable` | `archivo.variable` | `archivo.variable` |
| Root providers | `SessionProvider`, `CartProvider`, `AreaProvider`, `<Toaster/>` | none in root layout | `ActorProvider` |
| `themeColor` from `@cfc/tokens` | `SURFACE` (#ffffff) | `STRUCTURE` (#0e1f3d) | `SURFACE` (#ffffff) |
| PWA manifest | `public/manifest.webmanifest` (start `/home`) | `public/manifest.webmanifest` | none |
| `public/` logos | logo, logo-mark, logo-white, logo-mark-white | same four names | same four names |
| Page routes (`page.tsx` count) | 28 | 33 | 13 |

---

## 4. Every shared file and its blast radius

"Blast radius" = which apps change if this file changes.

### 4.1 `packages/tokens/src/tokens.css` — **all three apps**

- **How it reaches them:** `packages/ui/src/styles.css:L1` does
  `@import "@cfc/tokens/tokens.css"`, and every app's root layout imports
  `@cfc/ui/styles.css`.
- **What it holds:** every colour, radius, shadow, focus-ring, z-index and motion
  variable (`--color-*`, `--radius-*`, `--shadow-*`, `--z-*`, `--duration-*`,
  `--ease-*`), all on `:root`.
- **Changing a value** recolours or reshapes **Pro and Admin immediately**. In the
  consumer it changes only the tokens `brand.css` does **not** override (see
  `CONSUMER.md` §9.1 for the exact list: focus ring, live/critical colours, star,
  structure active/muted/line, on-structure text, border-strong, disabled, z-index,
  motion).
- **Current values are the original "Cobalt" palette**: action `#0891a0`, canvas
  `#f7f9fb`, ink `#0f1728`, navy `#0e1f3d`, radius 5/6/8px, clock amber `#b8790f`.
  **The consumer does not render with these.** It overrides most of them in
  `apps/consumer/src/app/brand.css`.
- **Risk:** HIGH. Never edit it to change the consumer's look; use `brand.css`.

### 4.2 `packages/tokens/src/index.ts` — **all three apps (JS)**

- Exports `SURFACE`, `INK`, `INK_MUTED`, `BORDER`, `STRUCTURE`, `ACTION`, `SERIES`.
  These are hex strings kept in step with `tokens.css` **by hand** (`L8-10`).
- Used: consumer and admin import `SURFACE` (browser `themeColor`), Pro imports
  `STRUCTURE`; `packages/ui/src/charts/theme.ts` uses the chart colours.
- **They mirror the shared palette, not the consumer's.** If the consumer ever draws
  a chart or canvas, it gets the old teal and navy.

### 4.3 `packages/ui/src/styles.css` — **all three apps**

Tailwind directives plus base rules: `* { border-color }`, `body` background, ink
colour, **Archivo font**, 15px/22px, `.tabular` (tabular figures), global
`:focus-visible` outline from tokens, `.on-structure-surface` focus colour,
`.skip-link`, `::selection`, reduced-motion kill switch. The consumer's `brand.css`
overrides the body font on `html:root body`; Pro and Admin keep Archivo.
**Risk:** HIGH. Any base rule here applies to every element in every app.

### 4.4 `packages/config/tailwind-preset.js` — **all three apps + `packages/ui`**

- Every app's `tailwind.config.js` uses it as its only preset.
- **Its scales are closed**: `colors`, `spacing`, `borderRadius`, `fontSize`,
  `fontWeight`, `boxShadow`, `screens` are *replaced*. A class outside them emits **no
  CSS and no error**.
- **Adding** a new key (under `theme` or `theme.extend`) is safe for other apps: an
  unused key emits nothing.
- **Changing or removing** an existing key silently changes or kills that utility in
  **every app and every shared component**.
- **Locally modified (uncommitted):** added `fontWeight.bold/extrabold` and
  `spacing 16/20/24`. See §7.
- **Risk:** HIGH for edits, LOW for additions.

### 4.5 `packages/config/eslint-app.js` — **all three apps' lint, and therefore their builds**

- `next build` runs ESLint and fails on errors. A new or stricter rule here can **fail
  the Pro or Admin build** even if their code did not change.
- Rules: see `CONSUMER.md` §10 (import boundaries, no hex, no arbitrary values, no
  default palette, no `toLocaleString`, dead fractional/integer dimensions, no opacity
  modifiers on tokens, `import type`).
- **Locally modified (uncommitted):** removed `16|20|24` from the dead-integer-dimension
  regex (`L114`), with an explanatory comment (`L107-112`). See §7.
- **Risk:** HIGH. Always lint all three apps after touching it.

### 4.6 `packages/config/eslint-package.js` — **`packages/ui` lint**

- Used by `packages/ui/.eslintrc.js` (a one-liner). Same token rules as the apps,
  minus Next and import rules, applied to class strings inside `cva()`/`cn()` as well.
- **Not updated alongside `eslint-app.js`:** its integer-dimension regex (`L71`)
  **still blocks `16|20|24`**. A shared component that uses `mt-16` fails package lint
  even though the preset now defines it (B-02).

### 4.7 `packages/config/tsconfig-base.json` and `tsconfig-next.json` — **every typecheck**

Strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noUnusedLocals/Parameters`, `allowJs`, `jsx: preserve`, Next plugin. Loosening or
tightening a flag changes what compiles in all apps and packages at once.

### 4.8 `packages/ui/src/**` (components, primitives, charts, `lib/format.ts`) — **every app that uses the export**

- A visual change to a shared component appears in every app using it (§5 lists who
  uses what).
- **Styling of shared components is token-driven**, so the consumer sees them in its
  own palette: for example `Button` uses `rounded-control`, `bg-action`, `h-touch`
  (`packages/ui/src/primitives/button.tsx:L28-67`). In the consumer that means 14px
  radius and teal `#0fb3a6`; in Pro and Admin, 6px radius and `#0891a0`. **This
  restyling is consumer-only and intended.**
- `formatCurrency` (`lib/format.ts`) is used by all three apps. Changing its default
  (e.g. dropping paise) changes every price and total in Admin's finance tables too.
- Tailwind in **every app scans `packages/ui/src`**, so a class used only inside a
  shared component still gets generated in every app.

### 4.9 `packages/types/src/**` — **every app that uses the type**

Interfaces such as `ServiceDetail`, `Review`, `QuotationDetail`. Adding a required
field breaks compilation wherever that object is built (mocks) or destructured
(screens). Adding an optional field is safe. 14 types are used by 2+ apps (§5.2).

### 4.10 `packages/mocks/src/**` — **every app that calls the function or reads the fixture**

- **`fixtures/seed.ts` and `fixtures/catalog.ts`** feed consumer (catalogue, prices,
  photos, pricing rules via `api/catalog.ts`, `api/booking-draft.ts`) **and** admin
  (`api/catalog.ts`, and `SERVICE_NAMES` from `fixtures/seed.ts`). Renaming a service
  changes consumer photos (paths are built from names), consumer category tiles, and
  admin service tables and filters.
- **`fixtures/bookings.ts` `AREA_OPTIONS`** → consumer area picker **and** admin filters
  (4 files).
- **`api/my-support.ts`** `SUPPORT_PHONE`, `SUPPORT_HOURS`, `raiseTicket` → consumer
  **and** pro.
- **`api/reviews.ts`** `REVIEWS_ARE_PLACEHOLDER` → consumer (3 files) **and** pro.
- **`api/promotions.ts`** `getBanners` → consumer **and** admin.
- **`api/pros.ts`** → pro (7 files) **and** admin.
- **`control.ts`** (scenario + latency) → **every** api function in every app. The
  scenario is kept in `sessionStorage`, which is per origin. Apps on different ports
  do not share it.
- **Risk:** MEDIUM. The data is fake, but reviewers judge screens by it, and Admin's
  reports aggregate it.

### 4.11 Tooling at `frontend/` — **everything**

`package.json` (scripts, `packageManager: pnpm@11.25.0`, `engines.node >=20`),
`pnpm-workspace.yaml` (`allowBuilds` for `sharp`, `unrs-resolver`), `pnpm-lock.yaml`,
`turbo.json`, `.gitignore`. A dependency bump in one app changes the lockfile for all.
Bumping `next` in one app only would make the apps diverge. The last bump did all three
together (commit `b922c8c`).

---

## 5. Which shared components, types and mocks each app actually uses

Produced on 2026-09-15 by scanning every `import { … } from "@cfc/…"` in
`apps/*/src`. The numbers are **how many files** in that app import the name.

### 5.1 `@cfc/ui` — 133 distinct names used; **63 used by two or more apps**

**Used by all three apps (changing these affects everyone):**
`AlertDialog` (+ `Action/Cancel/Content/Description/Footer/Header/Title`),
`Avatar`, `AvatarFallback`, `Badge` (C 11 · P 14 · A 9), **`Button` (C 24 · P 30 · A 14)**,
`Dialog`, `DialogContent`, `DialogDescription`, `DialogTitle`, `EmptyState`,
**`ErrorState` (C 18 · P 13 · A 11)**, `FormField`, `InlineAlert`, `Input`, `MapView`,
`Sheet`, `SheetBody`, `SheetContent`, `SheetHeader`, `SheetTitle`,
**`Skeleton` (C 18 · P 20 · A 13)**, `Switch`, `Textarea`, `Toaster`,
**`cn` (C 35 · P 31 · A 13)**, **`formatCurrency` (C 16 · P 15 · A 9)**,
`formatSchedule`, `initials`, **`toast` (C 19 · P 22 · A 10)**.

**Consumer + Pro only:** `Accordion`, `PhotoGrid`, `StarRating`,
`usePrefersReducedMotion`, `raiseTicket` (mocks).
**Consumer + Admin only:** `BookingStatusBadge`, `DialogHeader`, `DropdownMenu`
(+ `Content/Item/Trigger`), `NoResultsState`, `TicketStatusBadge`, `Timeline`,
`TimelineItem`, `formatCount`, `formatDate`.
**Pro + Admin only (the consumer never renders them):** `ChartFrame`, `Checkbox`,
`Column`, `DataTable`, `LineChart`, `RadioGroup`, `RadioGroupItem`, `Tabs`,
`TabsList`, `TabsTrigger`, `formatCurrencyAxis`.

**Used by the consumer and nobody else (safer to change for the consumer):**
`AvatarImage`, `Calendar`, `OtpDisplay`, `Popover`, `PopoverContent`,
`PopoverTrigger`, `SheetFooter`, `SnapScroller`, `StarRatingInput`, `formatDayShort`,
`formatTime`. Note: `packages/ui/src/index.ts:L174-175` says "the pro app reuses
StarRating and SnapScroller". The scan shows Pro imports `StarRating` but **not**
`SnapScroller`.

### 5.2 `@cfc/types` — 110 names used; 14 used by two or more apps

`Banner` (C, A) · `Coupon` (C, A) · `DocumentType` (P, A) · `ProDetail` (P, A) ·
`ProWarning` (P, A) · `QuotationDetail` (C, A) · `QuotationStatus` (P, A) ·
`Review` (C, P) · **`ServiceDetail` (C 10 files, A 2)** · `ServiceFaq` (C, P) ·
`ServiceVariant` (C, A) · `SubCategory` (C, A) · `TicketDetail` (C, A) ·
`TicketListItem` (P, A).

### 5.3 `@cfc/tokens` JS

`SURFACE` (consumer, admin) · `STRUCTURE` (pro).

### 5.4 `@cfc/mocks` — which source files each app depends on

| App | Mock source files reached through its imports |
|---|---|
| Consumer | `api/addresses`, `api/booking-draft`, **`api/catalog`**, `api/consumer-auth`, `api/faqs`, `api/my-bookings`, `api/my-quotations`, **`api/my-support`**, `api/notifications`, **`api/promotions`**, `api/public-pro`, `api/referral`, `api/reviews-submit`, **`api/reviews`**, `api/search`, `api/slots`, `api/wallet`, `control`, **`fixtures/bookings`** |
| Pro | **`api/my-support`**, `api/notifications`, `api/pro-conduct`, `api/pro-earnings`, `api/pro-jobs`, `api/pro-notifications`, `api/pro-offers`, `api/pro-onboarding`, `api/pro-profile`, `api/pro-support`, `api/pro-work`, **`api/pros`**, **`api/reviews`** |
| Admin | `api/admin-users`, `api/bookings`, **`api/catalog`**, `api/customers`, `api/dashboard`, `api/finance`, **`api/promotions`**, **`api/pros`**, `api/quotations`, `api/reports`, **`fixtures/bookings`**, **`fixtures/seed`** |

**Bold** = reached by more than one app. Api files also import fixtures internally
(for example `api/catalog.ts` imports `fixtures/catalog.ts`, which is itself built from `fixtures/seed.ts`), so
the true overlap is larger than this table. Before editing a fixture, grep
`packages/mocks/src/api` for who imports it.

---

## 6. How the consumer redesign is isolated, and where it is not

### 6.1 Isolated by the import graph (Pro and Admin cannot reach these)

| Consumer-only thing | Why Pro/Admin cannot be affected |
|---|---|
| `apps/consumer/src/app/brand.css` (palette, radii, shadows, body font, `.text-hero`, `.text-section`) | Imported only by `apps/consumer/src/app/layout.tsx:L11`. Verified: no reference in `apps/pro` or `apps/admin`. |
| `html:root { … }` overrides | Only exist where `brand.css` is loaded. `html:root` (0,1,1) out-ranks the shared `:root` (0,1,0) regardless of bundle order. |
| `apps/consumer/src/app/(home)/**` (both home pages, `home-pages.css`, `interactions.js`) | Separate app, separate build. The CSS is additionally scoped to `.cfc-page`. |
| Plus Jakarta Sans | Loaded only in `apps/consumer/src/lib/fonts.ts`; Pro/Admin `fonts.ts` load Archivo only. |
| Consumer `.eslintrc.js` overrides for `(home)` | Pro and Admin `.eslintrc.js` spread the shared config with no overrides. |
| `localStorage` keys (`cfc.consumer.*`, `cfc_*`) | Browser storage is per origin; each app has its own port or domain. |
| Everything in `apps/consumer/public/` | Served only by the consumer app. |

### 6.2 NOT isolated (a consumer-motivated change here reaches Pro and Admin)

| Shared thing touched for the consumer | Status |
|---|---|
| `packages/config/tailwind-preset.js`: `bold`, `extrabold`, spacing `16/20/24` | Uncommitted. Additive. Measured to leave Pro and Admin CSS byte-identical (§7). |
| `packages/config/eslint-app.js`: `16|20|24` removed from the dead-dimension rule | Uncommitted. Pro and Admin use none of those steps, so their lint result is unchanged (§7). |
| Any future edit to `packages/ui` components to "look better on consumer" | **Would change Pro and Admin.** Restyle through tokens in `brand.css`, or wrap or compose inside `apps/consumer/src/components` instead. |
| Any edit to `packages/mocks` fixtures (prices, names, areas) | **Would change Admin** (catalogue, areas, reports) and possibly **Pro** (support, reviews, pros). |

### 6.3 Consumer-only effects on shared components (intended, but be aware)

Because shared components read tokens, `brand.css` changes how **they** look **in the
consumer only**: every `Button` (14px radius, new teal), `Badge tone="clock"` and
`InlineAlert tone="clock"` (**blue** instead of amber, because the consumer redefines
`--color-clock*`), `Sheet`/`Dialog` corners (20px card radius), `Skeleton`,
`EmptyState`, `ErrorState` colours, and focus rings (still the old teal, since
`--color-focus-ring` is not overridden). **None of this changes Pro or Admin.**

---

## 7. Local changes to shared files right now, and the proof

As of 2026-09-15, `git status` shows exactly **two** modified files outside
`apps/consumer`: both in `packages/config`, both uncommitted.

### 7.1 `packages/config/tailwind-preset.js` (+29 lines)

- `fontWeight`: added `bold: "700"`, `extrabold: "800"` (`L299-315`); existing
  `normal/medium/semibold` unchanged.
- `spacing`: added `16: "64px"`, `20: "80px"`, `24: "96px"` (`L232-243`); every existing
  step unchanged.

**Why this cannot change Pro or Admin output:** Tailwind emits CSS only for classes
found in scanned content. A grep on 2026-09-15 found **0** uses of `font-bold`,
`font-extrabold`, or any `-16`, `-20`, `-24` spacing/size utility in `apps/pro/src`,
`apps/admin/src` or `packages/ui/src`.

**Measured during this project on 2026-09-15 (not re-run for this document):** Pro and
Admin were each built with `next build` at the baseline preset (the change temporarily
stashed) and again with the change applied, and the SHA-256 of their concatenated
`.next/static/css/*.css` was compared:

| App | Before | After | Result |
|---|---|---|---|
| Pro | 36,391 bytes · `dab402f3fb2498e8…` | 36,391 bytes · `dab402f3fb2498e8…` | **Identical** |
| Admin | 37,894 bytes · `31faf7bc2245bf88…` | 37,894 bytes · `31faf7bc2245bf88…` | **Identical** |

Both apps were built once more after the ESLint change below, with 0 lint or build
errors and the same hashes.

### 7.2 `packages/config/eslint-app.js`

- Removed `16|20|24` from the "not on the closed scale" integer-dimension regex (`L114`)
  and added a comment explaining why (`L107-112`).
- **Effect on Pro and Admin:** a rule that stops flagging `16/20/24` can only produce
  *fewer* errors, and those apps use none of these steps. Their lint result is unchanged.
- **Side effect:** `packages/config/eslint-package.js` was not changed, so shared
  components are still blocked from these steps (B-02).

### 7.3 If you commit these

Commit the preset and ESLint changes **together with** the consumer changes that use
them (`font-bold`, `mt-16`, `mt-20`, `text-hero`…). Committing the consumer files
without the preset would give the consumer classes that emit no CSS. Committing the
preset alone is harmless.

---

## 8. Collision scenarios: things that would break another app

Each row is a realistic mistake, what happens, and the safe alternative.

| # | Mistake | What breaks | Do this instead |
|---|---|---|---|
| C-01 | Changing `--color-action` (or any colour, radius or shadow) in `packages/tokens/src/tokens.css` "because the consumer looks wrong" | Pro and Admin repaint instantly | Override the token in `apps/consumer/src/app/brand.css` inside `html:root` |
| C-02 | Changing `Button`, `Badge`, `Sheet`… classes in `packages/ui` for consumer taste | All three apps change | Change tokens in `brand.css`, or build a consumer component in `apps/consumer/src/components` that wraps the primitive |
| C-03 | Renaming or removing a preset key (`rounded-control`, `h-bar`, `text-title`, `bg-live`…) | Every use in every app silently emits no CSS | Add a new key; migrate usages; remove the old key only when a grep across `apps/*/src` and `packages/ui/src` finds 0 uses |
| C-04 | Replacing a scale (e.g. redefining `spacing` without the existing steps) | Layouts collapse in all apps | Only add keys |
| C-05 | Adding a lint rule to `eslint-app.js` | Pro or Admin `next build` can start failing | Run `lint` for all three apps before committing |
| C-06 | Adding `font-sans` to a shared component | Consumer text in that component switches from Jakarta to Archivo | Leave font choice to inheritance; the consumer sets it on `body` |
| C-07 | Adding a `:root` rule or `@layer` in `packages/ui/src/styles.css` | Applies to every element in every app; `@layer` rules lose to Tailwind's unlayered output | Scope app-specific base CSS in the app |
| C-08 | Editing `fixtures/seed.ts` service names or `fixtures/catalog.ts` prices | Consumer photos break (paths are built from names); Admin tables and reports change | Change names and photos together; tell Admin reviewers |
| C-09 | Changing `AREA_OPTIONS` | Consumer area picker **and** Admin filters change | Coordinate both |
| C-10 | Changing `SUPPORT_PHONE` / `SUPPORT_HOURS` / `REVIEWS_ARE_PLACEHOLDER` | Consumer **and** Pro change | Coordinate both |
| C-11 | Changing `formatCurrency` defaults | Every money figure in all apps changes | Pass an option at the call site |
| C-12 | Adding a required field to a shared type | Typecheck fails wherever that object is built or used | Make it optional, then fill it in everywhere |
| C-13 | Bumping `next`, `react` or `tailwindcss` in one app | Apps diverge; the lockfile changes for all | Bump all three apps in one commit |
| C-14 | Importing from `apps/consumer` inside `apps/pro` or `apps/admin` (or the reverse) | Lint error; the build fails | Move the code to `packages/ui` |
| C-15 | Running `next build` inside an app while `next dev` runs for the same app | The dev server's `.next` is overwritten and it serves 500 errors | Stop the dev server first, or build in a copy |
| C-16 | Copying consumer `brand.css` values into `packages/tokens` to "unify" | Pro and Admin take on the consumer palette without review | Only if the client approves a platform-wide rebrand; do it in its own commit and rebuild all apps |
| C-17 | Moving `(home)` CSS rules out of `.cfc-page` scope | Rules start matching the consumer's other 40+ screens (not Pro/Admin) | Keep every rule prefixed with `.cfc-page` |
| C-18 | Using a Tailwind class inside `interactions.js` (`.js` is not in any app's Tailwind `content`) | The class emits no CSS | Use the `.cfc-page` stylesheet, or add `.js` to `content` |

---

## 9. Where a change belongs (decision table)

| You want to… | Put it in | Affects |
|---|---|---|
| Change a consumer colour, radius or shadow | `apps/consumer/src/app/brand.css` (`html:root`) | Consumer only (then also `home-pages.css` `:root` for `/` and `/home`) |
| Change the two home pages' look | `apps/consumer/src/app/(home)/home-pages.css` (keep `.cfc-page` scope) | Consumer `/`, `/home` only |
| Add a Tailwind value the consumer needs | `packages/config/tailwind-preset.js` `theme.extend` **as a new key**; also update `eslint-app.js` and `eslint-package.js` regexes if it is a spacing step | Safe for all (additive) |
| Build a consumer-only component | `apps/consumer/src/components/` | Consumer only |
| Change a shared component's behaviour or markup | `packages/ui/src/…`, then run §11 | All apps using it (§5.1) |
| Change seed data for a consumer screen | `packages/mocks/src/…`, after checking §5.4 | Possibly Admin/Pro |
| Add a field to a domain object | `packages/types`, optional first | All importers |
| Change a lint rule for the consumer only | `apps/consumer/.eslintrc.js` `overrides` | Consumer only |
| Change a lint rule for everyone | `packages/config/eslint-app.js` | All builds |
| Add a font | the app's `src/lib/fonts.ts` + root layout `className` | That app only |

---

## 10. Before you edit a shared file: checklist

1. **Is it really shared?** Paths under `frontend/packages/**`, `frontend/package.json`,
   `frontend/pnpm-*`, `frontend/turbo.json` are. `frontend/apps/<app>/**` is not.
2. **Can the change live in the consumer instead?** Use §9. Prefer `brand.css`, consumer
   components, or consumer `.eslintrc.js` overrides.
3. **Is it additive?** Adding a new token, preset key, optional type field or new export
   is low-risk. Changing or removing an existing one is high-risk.
4. **Find every user.** Grep all three apps and the ui package, for example:
   `grep -rn "rounded-control" frontend/apps/*/src frontend/packages/ui/src`. For mocks
   and types, re-run the import scan in §5.
5. **Capture a baseline** for Pro and Admin (§11 step 1) **before** editing.
6. **Make the change** in its own commit (or at least its own reviewable diff).
7. **Prove nothing leaked** (§11 steps 2–4).
8. **Update the docs:** this file's §7, and `CONSUMER.md` if consumer behaviour changed.
9. **Do not push** unless the owner has said so. The `agency` remote is reported to
   deploy to Vercel (`CONSUMER.md` §2.1).

---

## 11. Proving nothing leaked: exact procedure

Run from `frontend/` in Git Bash. **Stop any running `next dev` for Pro and Admin first**
(C-15).

```bash
# 1. Baseline (before your change)
for a in pro admin; do
  (cd apps/$a && npx next build > /dev/null 2>&1)
  cat apps/$a/.next/static/css/*.css | sha256sum | cut -c1-16 > /tmp/$a.before
done

# 2. Apply your change, then rebuild and hash again
for a in pro admin; do
  (cd apps/$a && npx next build 2>&1 | tail -5)          # must show no errors
  cat apps/$a/.next/static/css/*.css | sha256sum | cut -c1-16 > /tmp/$a.after
  diff -q /tmp/$a.before /tmp/$a.after && echo "$a CSS identical" || echo "$a CSS CHANGED"
done

# 3. Types and lint for all three apps
for a in consumer pro admin; do (cd apps/$a && npx tsc --noEmit && npx next lint); done

# 4. The shared ui package's own checks
(cd packages/ui && npx tsc --noEmit && npx eslint src --ext .ts,.tsx --max-warnings 0)
```

- **"CSS identical"** proves styling did not change. It does **not** prove markup or
  behaviour did not change. For a component change, also open the affected Pro and Admin
  screens (§5.1 tells you which components they use).
- For a mocks or types change, hashes do not help; rely on `tsc` plus looking at the
  screens that read the data.
- A `git stash push -- <file>` / `git stash pop` around step 1 is the cleanest way to get
  a baseline for an edit you have already made. Check `git stash list` afterwards.

---

## 12. Pro and Admin at a glance

Read from `apps/pro/src/app` and `apps/admin/src/app` (route files only). Their inner
screens were not audited for this document.

**Pro (`@cfc/pro`, port 3001), 33 `page.tsx` files.**
`/` · `(auth)`: splash, onboarding, register, login, otp, profile-setup, documents,
bank-details, terms, approval · `(app)`: dashboard, status, jobs, jobs/[id],
jobs/[id]/work, jobs/[id]/quote, jobs/[id]/quote/status, jobs/[id]/complete, earnings,
earnings/transactions, earnings/payout, earnings/pending, profile, profile/edit,
profile/services, profile/availability, reviews, notifications, support, settings,
conduct, warnings. Navy browser chrome (`themeColor: STRUCTURE`), PWA manifest, no
root providers. Uses Pro-specific mocks for offers, jobs, earnings, onboarding, conduct.
**Relevant to the consumer:** Pro has its own `/register`. That is the natural target for
the consumer's "Join as a professional" once its public URL is known (`CONSUMER.md`
I-08, D-04).

**Admin (`@cfc/admin`, port 3002), 13 `page.tsx` files.**
`(auth)`: login, forgot-password · `(app)`: dashboard `/`, bookings, customers, payments,
promotions, pros, quotations, reports, services, settings, support. White chrome,
`ActorProvider` (role-based access). Heaviest user of `DataTable`, `Tabs`, charts, filters.
**Relevant to the consumer:** Admin reads the **same catalogue, areas and banners**
the consumer shows (§4.10), so a consumer-driven data change is visible to Admin
reviewers.

---

## 13. Open boundary issues

| ID | Issue | Evidence | Suggested action |
|---|---|---|---|
| B-01 | Two palettes: the shared `tokens.css` (Cobalt, `#0891a0`, 5/6/8px) and the consumer's `brand.css` (`#0fb3a6`, 14/20px, blue clock), plus a third copy of the consumer palette in `home-pages.css` | §4.1, `CONSUMER.md` §9 | Decide whether the new look is consumer-only or platform-wide. If platform-wide, move it into `tokens.css` deliberately, with Pro/Admin review. |
| B-02 | `eslint-package.js` still blocks `16/20/24` while `eslint-app.js` allows them | `eslint-package.js:L71` vs `eslint-app.js:L114` | Update both regexes together, or revert both. |
| B-03 | `@cfc/tokens` JS constants mirror the shared palette, not the consumer's | `packages/tokens/src/index.ts` | If the consumer ever uses `ACTION`, `INK` or `SERIES`, add consumer equivalents in the consumer app. |
| B-04 | `eslint-config-next` 15.1.3 vs `next` 15.1.12 in all three apps | `apps/*/package.json` | Align all three together. |
| B-05 | The two preset/ESLint changes are uncommitted and only make sense with the consumer changes that use them | §7.3 | Commit together, or not at all. |
| B-06 | `SUPPORT_PHONE`, `SUPPORT_HOURS`, `REVIEWS_ARE_PLACEHOLDER` are shared by consumer and Pro, while the consumer home pages print different contact details | §4.10, `CONSUMER.md` §13 | Fix the source values once; remove hardcoded copies on the home pages. |
| B-07 | `packages/ui/src/index.ts:L174-175` says Pro reuses `SnapScroller`; the import scan shows it does not | §5.1 | Correct the comment. |
| B-08 | The preset's header comment still describes the scales as ops-console-first ("A marketing page can shout…", `tailwind-preset.js:L285-289`), while new keys were added for the shopfront | `tailwind-preset.js` | Refresh the comment when committing §7. |
| B-09 | Root layouts differ in how they apply the font: consumer `<body className="… font-sans …">` resolves to Archivo but is overridden to Jakarta by `brand.css`; Pro/Admin rely on `styles.css` | §3, `CONSUMER.md` §9.1 | No action needed. Just do not remove `html:root body` from `brand.css`. |
| B-10 | Local `git` has `refs/original/*` from a `filter-branch` author rewrite | `git for-each-ref` | Leave it, or delete deliberately with `git update-ref -d`. It does not affect the apps. |
| B-11 | Five shared components style keyboard focus with `outline-none` + `ring-2 ring-focus`: `accordion.tsx:L81`, `otp-input.tsx:L170`, `photo-grid.tsx:L52`, `service-card.tsx:L49`, `star-rating.tsx:L142` (all in `packages/ui/src/components/`). The preset defines `outlineColor.focus` but **no ring colour named `focus`**, so `ring-focus` emits no CSS. By Tailwind 3.4.17's defaults (`ringColor.DEFAULT` `#3b82f6`, `ringOpacity.DEFAULT` 0.5), `ring-2` then draws a translucent default-blue ring instead of the brand focus colour, in every app that renders these components. Reading-based; **not visually verified**. `CONSUMER-OPEN-ITEMS.md` 7.18 describes these rings as invisible, which these defaults do not support. | `tailwind-preset.js:L350-359`; `node_modules/.pnpm/tailwindcss@3.4.17/.../stubs/config.full.js:L761-776` | Replace with `focus-visible:outline-focus` in `packages/ui`, then run §11 for Pro and Admin. |
