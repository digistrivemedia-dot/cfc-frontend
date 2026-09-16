# CONSUMER.md — the City Family Care customer app

> **Who this is for.** A developer, or an AI agent, who has never seen this code
> and has to change, add or remove something in the customer app without
> breaking it. Everything here was read from the files themselves on
> **2026-09-15**. Nothing is from memory. Where something could not be proven
> from the code, it says **NOT VERIFIED**.
>
> **Companion documents:** `final/APP-BOUNDARIES.md` (how Consumer, Pro and
> Admin share code and how not to break them), `final/FILE-AUDIT.md` (every
> file outside the consumer app, including all `.md` docs).

---

## Contents

0. [How to read this document](#0-how-to-read-this-document)
1. [The app in 60 seconds](#1-the-app-in-60-seconds)
2. [Git and deployment state: read before you commit](#2-git-and-deployment-state--read-this-before-you-commit-anything)
3. [Folder map](#3-folder-map)
4. [Routing: the four route groups and what each gives a screen](#4-routing--the-four-route-groups-and-what-each-gives-a-screen)
5. [Every URL, and whether a customer can actually reach it](#5-every-url-and-whether-a-customer-can-actually-reach-it)
6. [The "three home pages" problem](#6-the-three-home-pages-problem)
7. [State: session, cart, area, and everything in browser storage](#7-state--session-cart-area-and-everything-in-browser-storage)
8. [The data layer (mocks)](#8-the-data-layer-mocks)
9. [Styling: two separate systems](#9-styling--two-separate-systems-read-this-before-touching-any-css)
10. [Lint and TypeScript rules that will stop your build](#10-lint-and-typescript-rules-that-will-stop-your-build)
11. [File-by-file reference](#11-file-by-file-reference)
12. [Issues register (numbered)](#12-issues-register)
13. [Things that disagree with each other across screens](#13-things-that-disagree-with-each-other-across-screens)
14. [Safe to delete, and things that look unused but are not](#14-safe-to-delete-and-things-that-look-unused-but-are-not)
15. [How-to recipes](#15-how-to-recipes)
16. [Decisions only you or the client can make](#16-decisions-only-you-or-the-client-can-make)
17. [How this audit was done, and what it could not check](#17-how-this-audit-was-done-and-what-it-could-not-check)

---

## 0. How to read this document

**Paths** are relative to `frontend/apps/consumer/` unless they start with
`frontend/` or the repo root.

**`file.tsx:L42`** means line 42 of that file as it was on 2026-09-15.
Line numbers drift as code changes. Search for the quoted text if a
line has moved.

**Git state tags** used on every file:

| Tag | Meaning |
|---|---|
| `COMMITTED` | Identical to the last commit (`b922c8c`). |
| `MODIFIED` | Tracked by git, changed on this machine, **not committed**. |
| `UNTRACKED` | Not in git at all. Exists only on this machine. |
| `IGNORED` | Generated file, excluded by `frontend/.gitignore`. |

**Verdicts** used on every file:

| Verdict | Meaning |
|---|---|
| **IN USE** | Imported, rendered, or referenced. The "Used by" line says where. |
| **IN USE — UNREACHABLE** | The code works, but nothing in the app links to it. A customer only gets there by typing the URL. |
| **DUPLICATE** | Repeats logic or data that also lives elsewhere (named). |
| **OUTDATED** | Its comments or copy contradict the current code or the platform facts (quoted). |
| **SAFE TO DELETE** | Nothing references it. The proof is given. |
| **NEEDS YOUR DECISION** | A product, client or legal question the code cannot answer. |

A file can carry more than one verdict. For example, **IN USE** + **OUTDATED**
means "keep it, but its comments are wrong".

**Severity** in the issues register:

| Severity | Meaning |
|---|---|
| **P0** | Legal/trust risk or a customer-visible lie (invented figures, false promises), or data shown to the wrong person. |
| **P1** | A feature that looks like it works but does not (dead end, wrong data, broken link). |
| **P2** | Inconsistency a customer can notice (different phone numbers, colours, labels). |
| **P3** | Code hygiene: duplication, stale comments, unused code. |

---

## 1. The app in 60 seconds

- **What:** the customer-facing web app (PWA) of City Family Care, a home-services
  marketplace. Customers browse services, add them to a cart, book a slot, track
  the professional, pay, rate, and raise support tickets.
- **Where:** `frontend/apps/consumer/`, one of three Next.js apps in a pnpm +
  Turborepo monorepo. The other two are `apps/pro` (service professionals) and
  `apps/admin` (operations console).
- **Stack:** Next.js **15.1.12** App Router, React **19.0.0**, TypeScript (strict),
  Tailwind CSS **3.4.17**, `lucide-react` icons, shared packages `@cfc/ui`,
  `@cfc/tokens`, `@cfc/types`, `@cfc/mocks`, `@cfc/config` (`package.json:L12-35`).
- **Backend:** **there is none.** Every screen reads and writes through
  `@cfc/mocks`, an in-memory fake API with artificial latency (see §8). Nothing
  persists beyond the browser's `localStorage`. Real auth, payments (Razorpay),
  maps (Google Maps), SMS and push are not connected.
- **Run it:** from `frontend/`, `pnpm dev:consumer` (or from this folder,
  `pnpm dev`). Port **3000** (`package.json:L6`). Pro runs on 3001, Admin on 3002.
- **Checks:** `pnpm typecheck` (`tsc --noEmit`), `pnpm lint` (`next lint`),
  `pnpm build` (`next build`, which runs lint too and **fails on lint errors**).
- **Size:** 106 files outside `node_modules`/`.next`/`.turbo`:
  8 config (1 generated), 31 public assets, 41 under `src/app`, 20 components,
  4 `lib` files, 2 font files.
- **The single most important fact about this app right now:** it contains
  **two unrelated design and code systems**. 42 screens are built with Tailwind
  on the shared design system. 2 screens (`/` and `/home`) are a verbatim port of
  a client-approved HTML prototype with their own hand-written CSS, their own
  vanilla-JS behaviour, their own header, footer and cart, and a lot of invented
  marketing copy. They are **not connected** to each other in several important
  ways (§6, §9, §12).

---

## 2. Git and deployment state — read this before you commit anything

### 2.1 Remotes and branches (from `git remote -v`, `git for-each-ref`)

| Ref | Points to | Notes |
|---|---|---|
| `main` (local, checked out) | `b922c8c` "Bump Next.js 15.1.3 -> 15.1.12 across all three apps" | |
| remote `agency` | `https://github.com/digistrivemedia-dot/cfc-frontend.git` | Local tracking ref `agency/main` = `b922c8c`. |
| remote `origin` | `https://github.com/cityfamilycareservices/cfc-frontend.git` | Local tracking ref `origin/main` = `0ed3c1b` (one commit behind). |
| branch `backup/pre-handoff-port` | `cab1b4c` "Backup: consumer redesign work before handoff port" | Holds an earlier consumer redesign, see 2.4. |
| branch `backup-before-author-rewrite` | `0ed3c1b` | Same tree as `origin/main`. |
| `refs/original/*` | `1276f5e` (author "City Family Care") | Left behind by a `git filter-branch` author rewrite. Safe to remove with `git update-ref -d`, but only on purpose. |

**NOT VERIFIED:** the remote-tracking refs above are local copies and were not
refreshed with `git fetch` during this audit. The real state of either GitHub
repo may differ. `refs/original` shows that `filter-branch` rewrote these local
refs.

**Deployment, per the project owner, not provable from the repo:** the
`agency` repository is connected to Vercel, so **a push to it deploys to the site
the client reviews**. The standing instruction is **do not push**. There is no
Vercel config file in the repo that confirms the connection.

### 2.2 What is committed and what exists only on this machine

Everything below is **local only** and would be lost if this folder were
deleted:

| State | Files |
|---|---|
| `UNTRACKED` (not in git at all) | The entire `src/app/(home)/` folder: 9 files, the two approved home pages. |
| `MODIFIED`, not committed | 28 consumer files, plus the renamed browse page below (which is also modified). Mostly `font-semibold` → `font-bold` on headings, plus `brand.css` (144 changed lines), `lib/fonts.ts` (+24), `layout.tsx`, `home-hero.tsx`, `.eslintrc.js` (41 changed lines). |
| **Renamed and staged** | `src/app/(app)/page.tsx` → `src/app/(app)/browse/page.tsx` (`RM` in `git status`). |
| **Staged (`A`) but not committed** | 16 files under `cfc-handoff/`, plus `cfc-home.html` at the repo root. |
| Shared packages `MODIFIED` | `frontend/packages/config/tailwind-preset.js` (+29 lines), `frontend/packages/config/eslint-app.js`. **These are read by Pro and Admin too.** See `APP-BOUNDARIES.md`. |

> **Trap:** because the handoff files and the rename are already **staged**, a
> plain `git commit` (without `-a`) commits *only* those staged files and
> silently leaves every other change behind. A `git commit -a` commits the
> modified files but **not** the untracked `(home)/` folder. There is no single
> command that captures this work correctly by accident. Always run `git status`
> first.

### 2.3 Commit history that touched the consumer app

`5b353cb` initial commit → Pro phases 1–9 (touched consumer only incidentally) →
`0ed3c1b` "Consumer Home & Discovery (screens 7-13): audit, fixes, and cart" →
`b922c8c` Next.js security bump. Everything after that is uncommitted (2.2).

### 2.4 The previous redesign attempt (branch `backup/pre-handoff-port`)

Commit `cab1b4c` contains a different consumer redesign that was set aside when
the approved handoff arrived. It added components that **do not exist in the
current working tree**: `components/marketing-nav.tsx`, `promo-row.tsx`,
`promo-strip.tsx`, `cities-row.tsx`. It also changed
`frontend/packages/tokens/src/tokens.css` (+12 lines), which the current tree
does **not** have. If you ever see a comment mentioning `MarketingNav`, it
refers to that branch (see `src/app/(home)/layout.tsx:L5-7`, issue **I-58**).

The same commit also contains the 16 `cfc-handoff/` files and the root
`cfc-home.html`, identical to the copies staged on `main` today
(`git diff --cached backup/pre-handoff-port -- cfc-handoff cfc-home.html` prints
nothing). The branch exists only on this machine; no remote contains `cab1b4c`.
See `FILE-AUDIT.md` §9.

### 2.5 What the "old home page" was

At the last commit, the site's front door `/` was `src/app/(app)/page.tsx`. That
same file now lives at `src/app/(app)/browse/page.tsx`, 96% identical
(`git diff -M`). The differences are the heading weights, the `Band` component
using `text-section`, and section spacing (`mt-16`/`mt-20`). `/` is now served
by `src/app/(home)/page.tsx`.

---

## 3. Folder map

```
frontend/apps/consumer/
├── .eslintrc.js            lint config (shared rules + exemptions for (home))
├── next-env.d.ts           Next.js type shim (IGNORED by git, regenerated)
├── next.config.js          transpiles the @cfc/* workspace packages
├── package.json            scripts, deps, port 3000
├── postcss.config.js       tailwind + autoprefixer
├── tailwind.config.js      shared preset + content paths
├── tsconfig.json           extends @cfc/config/tsconfig-next, "@/*" alias
├── tsconfig.tsbuildinfo    TypeScript cache (IGNORED, regenerated)
├── public/                 static files served from "/"
│   ├── manifest.webmanifest   PWA manifest (start_url "/home")
│   ├── logo.png, logo-mark.png            used by the manifest
│   ├── logo-white.png, logo-mark-white.png   UNREFERENCED
│   ├── images/cat-*.png (4)     category tiles on /browse and /categories
│   ├── images/promo-*.png (3)   UNREFERENCED
│   └── mock/
│       ├── banners/*.jpg (3)    offer banners (named in mocks fixtures)
│       └── services/*.jpg (16)  one per service (path BUILT from the service name)
└── src/
    ├── app/
    │   ├── layout.tsx       ROOT layout: fonts, providers, global CSS
    │   ├── brand.css        consumer-only token overrides + fluid type classes
    │   ├── (app)/           42-screen shop: shared header/footer/tab bar
    │   ├── (auth)/          splash, onboarding, login, register, otp, forgot-password
    │   └── (home)/          THE TWO APPROVED HOME PAGES (/, /home) — UNTRACKED
    ├── components/          20 app-specific components
    ├── lib/                 session, cart, area providers; fonts
    └── fonts/               Archivo variable font files
```

---

## 4. Routing — the four route groups and what each gives a screen

Next.js "route groups" are folders in parentheses. They **do not appear in the
URL**; they exist so a set of screens can share a layout. A URL can only be
defined once across all groups.

| Layout file | Wraps | What every screen inside gets |
|---|---|---|
| `src/app/layout.tsx` (root) | **everything** | `<html>` with both font variables; `SessionProvider` → `CartProvider` → `AreaProvider`; `<Toaster />`; global CSS `@cfc/ui/styles.css` then `./brand.css`; PWA metadata; `themeColor` white. |
| `src/app/(app)/layout.tsx` | `/browse`, `/categories`, `/search`, `/service/*`, `/pro/*`, `/cart`, `/book/*`, `/bookings/*`, `/quotes/*`, `/notifications`, `/profile`, `/settings`, `/support`, `/wallet`, `/refer`, `/legal/*` | `ScenarioHook` (dev console helpers), `ConsumerTopBar` (desktop), `ConsumerMobileTopBar`, `<AppMain>` (bottom padding), `ConsumerFooter`, `CartBar` (floating checkout bar), `ConsumerBottomNav` (signed-in phone tab bar). |
| `src/app/(auth)/layout.tsx` | `/splash`, `/onboarding`, `/login`, `/register`, `/otp`, `/forgot-password` | Nothing. A passthrough `<>{children}</>`. Each screen draws its own chrome (most use `AuthShell`). |
| `src/app/(home)/layout.tsx` | `/` and `/home` | Nothing structural. It imports `./home-pages.css`, the prototype stylesheet. The pages draw their own header, menu, footer, cart drawer and mobile bars. |

**Consequences a developer must know:**

1. `/` and `/home` **do not get** the shared header, footer, `CartBar`,
   bottom tab bar, `AreaPicker` or the `__cfc` scenario helpers. Anything added
   to `(app)/layout.tsx` will **not** appear on the two home pages.
2. The providers in the root layout **do** wrap `/` and `/home`, so `useSession`,
   `useCart` and `useArea` work there. The home pages simply do not call them yet.
3. `home-pages.css` is imported by the `(home)` layout, so it is loaded when a
   visitor enters `/` or `/home`. **Expected Next.js behaviour, not tested in a
   browser here:** stylesheets are not unloaded on client-side navigation, so
   after visiting `/` then clicking into `/categories`, that stylesheet is still
   in the document. Its selectors are scoped to `.cfc-page` (safe), but its
   `:root` variables (`--teal`, `--ink`, `--pad`…) and three unscoped
   selectors stay live. See §9.3.

---

## 5. Every URL, and whether a customer can actually reach it

"Inbound links" counts literal `href`, `router.push` and `router.replace` targets
in `src/` (a grep, so it misses computed URLs such as mock notification `href`
values, noted where relevant). "Inventory #" refers to the client's screen
inventory numbering as the code comments cite it ("Customer N").

| URL | File | Inventory # | Sign-in needed | How a customer gets there | Status |
|---|---|---|---|---|---|
| `/` | `(home)/page.tsx` | 7 (Home) | No | Default URL; logo links; "Home" in nav menu and tab bar; sign-out; login/OTP redirect | **Approved prototype, partly wired**. §6, §12 |
| `/home` | `(home)/home/page.tsx` | 7 (signed-in) | **Not enforced** | Only its own tab-bar link, and PWA `start_url` | **Prototype; hardcoded fake customer**. I-02 |
| `/browse` | `(app)/browse/page.tsx` | 7 (previous) | No | **Nothing links to it (0 inbound)** | **IN USE — UNREACHABLE**. §6 |
| `/categories` | `(app)/categories/page.tsx` | 10, 11 | No | 25 inbound (only `/bookings`, with 33, has more) | Working |
| `/categories?sub=Name` | same | 11 | No | Category tiles, footer, banners | Working |
| `/search` | `(app)/search/page.tsx` | 8, 9 | No | Header search box (the `(app)` header only), pro skill tags | Working |
| `/service/[id]` | `(app)/service/[id]/page.tsx` | 12 | No | Service cards, search suggestions, home rails | Working |
| `/pro/[id]` | `(app)/pro/[id]/page.tsx` | 13 | No | Only the booking detail screen (1 inbound) | Working |
| `/cart` | `(app)/cart/page.tsx` | "basket"/checkout | No (sign-in asked at checkout) | Header cart icon, `CartBar` | Working |
| `/book/[serviceId]` | `(app)/book/[id]/page.tsx` + 2 files | 14–21 | **Yes** (`RequireAccount`) | "Book this service", hero "Book now", cart checkout | Working, see I-10, I-11, I-17 |
| `/bookings` | `(app)/bookings/page.tsx` | 25 | Yes | Account menu, tab bar, footer | Working |
| `/bookings/[id]` | `(app)/bookings/[id]/page.tsx` | 26 | Yes | Booking cards, notifications | **Reschedule button broken** (I-06) |
| `/bookings/[id]/track` | `.../track/page.tsx` | 27–29 | Yes | Booking detail "Track live", active booking card | Working (map is a placeholder) |
| `/bookings/[id]/review` | `.../review/page.tsx` | 30 | Yes | Booking detail "Rate this job" | Working |
| `/bookings/[id]/invoice` | `.../invoice/page.tsx` | 31, 32 | Yes | Booking detail "View receipt"/"Tax invoice" | **Tax invoice uses the wrong service's fees** (I-07) |
| `/quotes/[id]` | `(app)/quotes/[id]/page.tsx` | 22–24 | Yes | 0 literal links; reached from a mock notification (`href: "/quotes/quo_0002"` in `packages/mocks/src/fixtures/notifications.ts:L27`) | Working |
| `/notifications` | `(app)/notifications/page.tsx` | 39 | Yes | Bell icon (`(app)` header, signed-in only) | Working |
| `/profile` | `(app)/profile/page.tsx` | 33–35 | Yes | Account menu, tab bars | **Sign out does not sign out** (I-05) |
| `/settings` | `(app)/settings/page.tsx` | 43, 44 | No | Account menu, profile, `/home` menu | Working (dark mode/language are placeholders) |
| `/support` | `(app)/support/page.tsx` | 40–42 | Tickets tab only | Account menu, profile, footer, `/home` tab bar | Working (assistant is scripted) |
| `/wallet` | `(app)/wallet/page.tsx` | 36, 37 | Yes | Account menu, footer, profile | Working (add money is a placeholder) |
| `/refer` | `(app)/refer/page.tsx` | 38 | Yes | Footer, profile, wallet, `/home` menu | Working (terms are placeholders) |
| `/legal/terms` `/legal/privacy` `/legal/refunds` | `(app)/legal/[doc]/page.tsx` | 44 | No | Settings, footers | **Headings only; no legal text** (I-24) |
| `/splash` | `(auth)/splash/page.tsx` | 1 | No | **Nothing links to it (0 inbound)** | **IN USE — UNREACHABLE** |
| `/onboarding` | `(auth)/onboarding/page.tsx` | 2 | No | Only from `/splash` | Effectively unreachable; invented claims (I-20) |
| `/login` | `(auth)/login/page.tsx` | 3 | No | 8 inbound | Working |
| `/register` | `(auth)/register/page.tsx` | 4 | No | Login, footer "Work with us" (`?role=pro`, ignored, I-08) | Working |
| `/otp` | `(auth)/otp/page.tsx` | 5 | No | Login, register, forgot-password | **Accepts any number, auto-fills the code** (I-12) |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | 6 | No | Login "Forgot password?" | Working (the flow is just OTP login again) |

---

## 6. The "three home pages" problem

This is the most confusing part of the app. Read this section before touching
anything related to "home".

| URL | What it is | Who it is for | Uses the real session? | Uses the real cart? | Shared header/footer? |
|---|---|---|---|---|---|
| `/` | Approved prototype, **signed-out** design | A stranger | **No** | No (links to `/categories` and `/service/*` only) | No, own header |
| `/home` | Approved prototype, **signed-in** design | A signed-in customer | **No.** Shows "Aarthi Subramanian" to everyone | **No.** Its own in-memory cart | No, own header |
| `/browse` | The previous home page (was `/` at the last commit) | Both (switches on the real session) | Yes | Yes (`ShopServiceCard`) | Yes |

What actually happens today, all verified by reading the code:

1. **A signed-in customer can never reach `/home` by clicking.** Every "Home"
   link in the shared chrome points to `/`: `components/consumer-nav.tsx:L60`
   (`NAV_ITEMS`, used by both the account menu and the bottom tab bar), plus the
   logo (`L106`, `L393`). After login, `/otp` redirects to `/`
   (`(auth)/otp/page.tsx:L111`), and so do `/login` and `/register` when already
   signed in (`login/page.tsx:L32`, `register/page.tsx:L29`). **So a signed-in
   customer lands on the signed-out marketing page, which shows "Log in" buttons.**
2. **`/` does not check the session at all.** `(home)/page.tsx` never imports
   `useSession` (grep confirmed: no match in `(home)/`).
3. **`/home` does not check the session either**, and every personal detail on
   it is hardcoded prototype text: name, masked phone, "You have not booked
   anything yet", referral code `AARTHI200`, address state. Anyone who opens
   `/home` sees the same fake person.
4. **The PWA opens `/home`.** `public/manifest.webmanifest:L5` sets
   `"start_url": "/home"`, so an installed app launches straight into the fake
   signed-in page, signed in or not.
5. **`/browse` is the only home screen that is actually wired to the product**
   (session-aware, real active booking card, real "book again", real cart). It
   has **zero inbound links**.
6. **`/splash` also has zero inbound links**, and it redirects to `/`
   (`splash/page.tsx:L33`), not to `/home` as its own comment says (`L14`).

**Decision needed** (§16, D-01): what `/`, `/home` and `/browse` should each be.
The two common answers:
**(a)** `/` = signed-out prototype; `/home` = signed-in prototype, wired to the
session, cart and profile, with signed-in users redirected there; `/browse`
deleted once `/home` is wired.
**(b)** Keep `/browse` as the signed-in home and give it the approved visual
design.
Nothing in the code decides this.

---

## 7. State — session, cart, area, and everything in browser storage

### 7.1 The three React providers (all in the root layout, all `"use client"`)

| Provider / hook | File | Holds | Initial value | Persistence |
|---|---|---|---|---|
| `SessionProvider` / `useSession()` | `lib/session.tsx` | `signedIn: boolean \| null`, `signIn()`, `signOut()` | `null` until `localStorage` is read (`L47`). **Screens must treat `null` as "unknown", not "signed out"** (`L103-108`). | `localStorage["cfc.consumer.signedIn"] = "true"` |
| `CartProvider` / `useCart()` | `lib/cart.tsx` | `lines: CartLine[] \| null`, `count`, `subtotalPaise`, `add`, `remove`, `setQuantity`, `has`, `clear` | `null` until read | `localStorage["cfc.consumer.cart"]` (JSON), written on every change (`L73-80`) |
| `AreaProvider` / `useArea()` | `lib/area.tsx` | `area: string \| null`, `setArea`, `ready` | `null`, `ready=false` | `localStorage["cfc.consumer.area"]` |

**Important properties:**

- **"Signed in" is only a flag.** There is no token, no user id and no expiry.
  `signIn()` sets the flag; `getConsumerProfile()` always returns the same
  fixture customer regardless of who "signed in".
- **Profile edits do not survive a reload.** The mock keeps the customer in module
  state that "resets on reload" (`packages/mocks/src/api/consumer-auth.ts:L39-45`).
- **Dev console helpers:** `__cfcSession.signIn()` / `.signOut()` / `.state()`
  exist only when `NODE_ENV === "development"` (`session.tsx:L78-91`) and reload
  the page.
- **A cart line stores the service, not the variant.** `CartLine`
  (`cart.tsx:L25-32`) has no `variantId`. Adding from a service page after
  choosing "2 ton window" still adds the base price (see I-16). The variant is
  chosen again in `/book`.
- **Checkout books one line at a time.** `/cart` sends the first line to
  `/book/[id]?qty=n` and keeps the rest (`cart/page.tsx:L59-66`). The booking
  flow removes only the booked service afterwards
  (`book/[id]/page.tsx:L300-303`).

### 7.2 There are TWO carts

| | Real cart | `/home` prototype cart |
|---|---|---|
| Code | `lib/cart.tsx` (`CartProvider`) | `(home)/home/interactions.js:L111-256` (vanilla JS array `var cart = []`) |
| Persists | Yes, `localStorage` | **No.** Gone on refresh or navigation |
| Seen by `/cart`, header badge, `CartBar` | Yes | **No** |
| Checkout | `/cart` → `/book/[id]` | Toast "Next: slot picker. Not built yet." (`L267`) |
| Discount | Real coupons via `applyCoupon` | Hardcoded "FIRST20" = min(₹300, 20%) (`L140-142`) |
| Items | Real service ids | Rail uses real ids; **search suggestions add fake ids** like `'ac'`, `'deep'` at prototype prices (`L297-316`, `L374-380`) |

Items added on `/home` never reach the real checkout. **Wiring `/home` to
`CartProvider` is unfinished work** (recipe §15.7).

### 7.3 Every browser-storage key the consumer writes

| Key | Store | Written by | Read by | Notes |
|---|---|---|---|---|
| `cfc.consumer.signedIn` | local | `lib/session.tsx` | same | |
| `cfc.consumer.cart` | local | `lib/cart.tsx` | same | JSON `CartLine[]` |
| `cfc.consumer.area` | local | `lib/area.tsx` | same | |
| `cfc.scenario` | **session** | `packages/mocks/src/control.ts:L13` | same | Mock scenario; survives reload, per tab |
| `cfc_recent_searches` | local | `(app)/search/page.tsx:L34` | same | Max 6 |
| `cfc_notify_prefs` | local | `(app)/settings/page.tsx:L43` | same | Per-device only |
| `cfc_theme` | local | `(app)/settings/page.tsx:L44` | same, **only on the settings screen** | Also sets `data-theme` on `<html>`, but **nothing reads it at app start** and there is no dark theme (I-31) |
| `cfc_onboarding_seen` | local | `onboarding/page.tsx:L30`, `otp/page.tsx:L101` | `splash/page.tsx:L32` | |
| `cfc_reg_name`, `cfc_reg_area` | **session** | `register/page.tsx:L45-46` | **Nothing. Written, never read** (grep across `apps/` and `packages/`) | I-13 |

Two naming conventions are mixed (`cfc.consumer.*` and `cfc_*`), see I-42.

---

## 8. The data layer (mocks)

### 8.1 What it is

`@cfc/mocks` (`frontend/packages/mocks/src/`) is a fake API: `api/*.ts`
(functions screens call) over `fixtures/*.ts` (seeded data). **It is shared with
Pro and Admin.** Editing a fixture can change what those apps show. See
`APP-BOUNDARIES.md`.

- **Every api function awaits `latency()`**: 240–700 ms normally, 1.8–3 s
  when `slow`, never resolves when `hang` (`control.ts`).
- **Scenarios** (`normal | empty | error | slow | hang`) are stored in
  `sessionStorage["cfc.scenario"]`. `applyScenario(real, emptyValue)` returns
  the real value, the empty value, or throws.
- **Console helpers** `__cfc.empty() / normal() / error() / slow() / which()`
  are attached by `components/scenario-hook.tsx`, **only inside the `(app)`
  route group and only in development**. There is no helper for `hang`. On `/`,
  `/home` and the auth screens `__cfc` does not exist, but a scenario set
  elsewhere in the same tab still applies there.
- **Lint rule:** screens must import api functions from `@cfc/mocks`, never
  fixtures (`packages/config/eslint-app.js:L39-43`).

### 8.2 What the consumer uses (63 names, from a scan of every import)

Auth: `sendOtp`, `verifyOtp`, `getConsumerProfile`, `updateConsumerProfile`.
Catalogue: `getCategories`, `getSubCategories`, `getServices`, `getService`,
`getServiceFaqs`, `getServiceReviews`, `getReviews`, `getBanners`,
`searchServices`, `suggestServices`, `getTrendingSearches`.
Pros: `getPublicPro`, `getProReviews`.
Booking: `getSlots`, `getAddresses`, `saveAddress`, `deleteAddress`,
`priceBooking`, `createBooking`, `getAvailableCoupons`, `applyCoupon`.
My bookings: `getActiveBooking`, `getRebookable`, `getMyBookings`,
`getMyBookingCounts`, `getMyBooking`, `cancelBooking`, `submitReview`,
`chipsFor`.
Quotations: `getMyQuotation`, `acceptQuotation`, `declineQuotation`,
`askQuotationQuestion`, `splitQuotation`.
Money: `getWalletBalance`, `getWalletTransactions`, `addMoney`,
`getReferralProgramme`.
Support: `getSupportFaqs`, `getMyTickets`, `getMyTicket`, `raiseTicket`,
`replyToTicket`, `askAssistant`.
Notifications: `getNotifications`, `markNotificationRead`,
`markAllNotificationsRead`.
Controls/constants: `setScenario`, `getScenario`, `AREA_OPTIONS`,
`SUPPORT_PHONE`, `SUPPORT_HOURS`, `REVIEWS_ARE_PLACEHOLDER`,
`REFERRAL_TERMS_ARE_PLACEHOLDER`, `AI_ASSISTANT_IS_SHELL`.
Types: `BookingTab`, `NotificationFilter`, `WalletFilter`, `Scenario`.

### 8.3 Facts in the fixtures that screens depend on

| Fact | Value | Source |
|---|---|---|
| Services | **16**, in **10** sub-categories, under 5 admin categories (only 3 have services) | `packages/mocks/src/fixtures/seed.ts` `SERVICE_CATALOG` |
| Service ids | `svc_01` … `svc_16` | `fixtures/catalog.ts` |
| Booking ids (consumer) | `bkg_c01` … | `fixtures/my-bookings.ts` |
| Service photo path | **Built from the name:** `/mock/services/${name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.jpg` | `fixtures/catalog.ts:L334` |
| Warranty | **Random per service: 15, 30 or 60 days** (`pick([15,30,60])`) | `fixtures/catalog.ts` `warrantyDays` |
| Visit charge | **Random per service: ₹0, ₹49 or ₹99** | `fixtures/catalog.ts:L371` |
| Platform fee | 8% of base price, rounded to the rupee | `fixtures/catalog.ts:L370` |
| Service areas | 10 Tiruchirappalli localities: Srirangam, Thillai Nagar, K.K. Nagar, Woraiyur, Cantonment, Golden Rock, Ariyamangalam, Thiruverumbur, Manachanallur, Marungapuri | `fixtures/seed.ts` `AREAS` |
| Support phone / hours | `+919000012345` / `9:00 AM - 9:00 PM` | `api/my-support.ts:L102-103` |
| Coupons | `FIRST20` (20%, max ₹300, first booking, expires 2026-12-31), `CLEAN150`, `AC10`, `MONSOON25` (inactive), `WELCOME100` | `fixtures/promotions.ts:L17-21` |
| Placeholder flags | `REVIEWS_ARE_PLACEHOLDER = true`, `REFERRAL_TERMS_ARE_PLACEHOLDER = true`, `AI_ASSISTANT_IS_SHELL = true` | `api/reviews.ts:L21`, `api/referral.ts:L20`, `api/my-support.ts:L117` |
| OTP | **Any 6-digit code for any phone number** is accepted by `verifyOtp`; the UI shows/auto-fills `123456` | `packages/mocks/src/api/consumer-auth.ts:L22-37`, `auth-dialog.tsx:L40`, `otp/page.tsx:L20` |

**Consequence:** several screens promise "30-day warranty on every job" and
"no visit/call-out fee" while the catalogue's own data says otherwise (§13).

---

## 9. Styling — two separate systems (read this before touching any CSS)

### 9.1 System A — Tailwind on the shared design system (42 screens + components)

The chain that decides how a Tailwind screen looks, in order:

1. **`frontend/packages/tokens/src/tokens.css`**: shared CSS variables
   (`--color-action`, `--radius-card`, `--shadow-sm`…) on `:root`. **Shared with
   Pro and Admin.**
2. **`frontend/packages/config/tailwind-preset.js`**: maps utilities to those
   variables. **The scale is closed.** `colors`, `spacing`, `borderRadius`,
   `fontSize`, `fontWeight`, `boxShadow` and `screens` are *replaced*, not
   extended. **A class not in the preset silently produces no CSS**, with no
   error. **Shared.**
3. **`frontend/packages/ui/src/styles.css`**: `@tailwind` directives plus base
   rules (body font Archivo 15px, `.tabular`, `:focus-visible`, `.skip-link`,
   reduced motion). Imported first by the root layout. **Shared.**
4. **`src/app/brand.css`**: **consumer only.** Redefines tokens on `html:root`
   (one element heavier than `:root`, so it wins regardless of bundle order,
   `brand.css:L40-50`). Also sets the body font and defines `.text-hero` and
   `.text-section`.

**What the consumer actually renders with** (shared value → consumer value):

| Token | Shared (`tokens.css`) | Consumer (`brand.css`) | Effect |
|---|---|---|---|
| `--color-action` (buttons, links) | `#0891a0` | **`#0fb3a6`** | Brighter teal |
| `--color-action-hover` / `-press` | `#077985` / `#05606a` | `#07837a` / `#055c55` | |
| `--color-action-subtle` / `-line` | `#ecf9fa` / `#c2e7ec` | `#e8f7f5` / `#b6e5e0` | |
| `--color-brand` / `-bright` / `-deep` | `#00b8c4` / `#22c7d4` / `#00707c` | `#0fb3a6` / `#14c9ba` / `#07837a` | |
| `--color-ink` / `-muted` / `-faint` | `#0f1728` / `#5c6472` / `#89909d` | `#0b2239` / `#62788f` / `#8fa3b8` | |
| `--color-structure` / `-raised` (navy) | `#0e1f3d` / `#172c50` | `#0b2239` / `#143252` | |
| `--color-canvas` / `--color-neutral-subtle` | `#f7f9fb` / `#f1f3f6` | `#f5f8fa` / `#f5f8fa` | |
| `--color-border` / `-soft` | `#e7eaef` / `#eff1f5` | `#e3eaf0` / `#eef3f7` | |
| **`--color-clock` / `-ink` / `-subtle`** | **amber** `#b8790f` / `#8a5410` / `#fdf6e9` | **blue** `#2456d6` / `#2456d6` / `#ecf1ff` | **Every "clock", "warning" and "gain" colour in the consumer is blue, not amber** (below) |
| `--radius-pill` / `-control` / `-card` | `5px` / `6px` / `8px` | `9999px` / `14px` / `20px` | Rounder everything |
| `--shadow-sm` / `-md` / `-lg` | 5–12% alpha | Two-layer, 35–50% alpha | Visible depth |
| **Not overridden** (still shared values) | `--color-focus-ring #0891a0` (the **old** teal), `--color-structure-active/muted/line`, `--color-on-structure*`, `--color-live*`, `--color-critical*`, `--color-star`, `--color-border-strong`, `--color-disabled-*`, `--z-*`, `--duration-*` | | Focus rings use a different teal from buttons (I-45) |

**Blue "clock" side effects (verified by reading the preset aliases
`tailwind-preset.js:L178-205`):** `warning` = `clock-ink`, `gain` = `clock`, so
these all render **blue** in the consumer: the "Note" callout on
`/forgot-password` (`bg-warning-subtle text-warning`, `L52-53`), the warranty
icon on `/onboarding` (`bg-gain-subtle text-gain`, `L67-68`), the quotation tint
on `/notifications` (`KIND_META`, `L59`), every `Badge tone="clock"` ("Rate
this", "Pending", "Coming soon") and every `InlineAlert tone="clock"`. The
`brand.css:L114-115` comment says blue is meant as a *tint* for icon plates.
Using the clock token for it also recoloured every status that means "a
countdown is running". **NEEDS YOUR DECISION** (D-06).

**Fonts:**

- `lib/fonts.ts` loads **Archivo** (local variable font, `--font-archivo`) and
  **Plus Jakarta Sans** (`next/font/google`, self-hosted at build, `--font-jakarta`).
  Both variables are on `<html>` (`layout.tsx:L42`).
- The shared base sets `body { font-family: var(--font-archivo) }`, and the
  preset's `font-sans` is also Archivo (`tailwind-preset.js:L333-335`).
  `brand.css:L156-158` overrides the resolved `body` font to Jakarta
  (`html:root body`). **So text inherits Jakarta, but any element with an explicit
  `font-sans` class, including `<body className="… font-sans …">` in
  `layout.tsx:L43`, resolves through the preset to Archivo.** It currently renders
  Jakarta only because `html:root body` (0,1,2) beats the `.font-sans` utility
  (0,1,0) on `<body>` itself. No consumer component adds `font-sans`, so they
  inherit. The only other `font-sans` in shared code is a `<kbd>` inside
  `CommandPalette` (`packages/ui/src/components/command-palette.tsx:L281`), which the
  consumer does not use. If anyone adds `font-sans` to an inner element, that element
  switches to Archivo.
- `width-condensed` / `width-expanded` (`font-stretch`) only mean something
  in Archivo. Under Jakarta they have **no visible effect**
  (`shop-service-card.tsx:L121`, `splash/page.tsx:L119`,
  `onboarding/page.tsx:L190`).

**Type scale** (preset `fontSize`): `caption 12` · `small 13` · `body 15` ·
`heading 17 / heading-lg 20` · `title 22 / title-lg 30` ·
`display 32 / display-lg 44`. Consumer-only fluid classes in `brand.css`:
**`.text-hero`** = `clamp(2.1rem, 1.15rem+3.1vw, 3.75rem)`, weight 800, used
**once** (`components/home-hero.tsx:L110`). **`.text-section`** =
`clamp(1.5rem, 1.05rem+1.5vw, 2.25rem)`, weight 700, used **once**
(`browse/page.tsx:L549`, inside `Band`).

**Weights:** `normal 400`, `medium 500`, `semibold 600`, and (added locally,
uncommitted) `bold 700`, `extrabold 800`.

**Spacing:** `0, px, 1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 12=48`, and (added
locally, uncommitted) `16=64, 20=80, 24=96`, plus `touch=44`, `touch-lg=56`,
`panel=min(640px,70vh)`. **`p-7`, `gap-10`, `h-14`, `size-9`, `w-56`, `mt-0.5`
and every other value not listed produce no CSS.** Named sizes for common
components are in the preset's `extend` (`size-tile 40`, `size-tile-lg 80`,
`size-mark 28`, `size-avatar 36`, `h-bar 56`, `h-bar-lg 64`, `h-field 36`,
`w-menu 224`, `max-w-detail 640`, `pb-tab-bar 80`, `pb-action-bar 88`,
`pb-bars 168`, `top-bar-tall 64`, `bottom-tab-bar 80`, `aspect-card 4/3`,
`aspect-banner 5/2`, `grid-cols-detail`…).

**Colours:** only preset names work (`ink`, `canvas`, `surface`, `border`,
`structure`, `on-structure`, `brand`, `action`, `on-action`, `neutral`, `live`,
`clock`, `critical`, `star`, `disabled`, legacy `success/warning/danger/gain/go`,
`series-1..6`). **`bg-white`, `text-gray-500`, `bg-action/50` and every other
Tailwind default colour or opacity modifier produce no CSS.**

### 9.2 System B — `src/app/(home)/home-pages.css` (only `/` and `/home`)

A 1,141-line hand-written stylesheet, ported from
`cfc-handoff/reference/cfc-nextjs/app/globals.css`, with every selector
prefixed by `.cfc-page` (the wrapper `<div>` both pages render). It does **not**
use Tailwind classes or the shared tokens. It has its **own** variables on
`:root` (`L50-77`):

`--teal #0fb3a6`, `--teal-deep #07837a`, `--teal-ink #055c55`,
`--teal-wash #e8f7f5`, `--blue #2456d6`, `--blue-wash #ecf1ff`,
`--ink #0b2239`, `--ink-2 #2d4763`, `--muted #62788f`, `--paper #f5f8fa`,
`--line #e3eaf0`, `--line-soft #eef3f7`, radii `10/14/20/28`, three shadows,
`--max 1180px`, `--pad 24px` (18px under 620px), `--ease`.

**These values are copied by hand into `brand.css`, not linked to it.** Change one
file and the other does not follow (I-40).

### 9.3 How the two systems are kept apart, and where they leak

| Mechanism | Where | Why |
|---|---|---|
| `.cfc-page` prefix on every rule | `home-pages.css` | `.cfc-page h1` (0,1,1) beats the shared bare `h1` rules. `@layer` was tried and **does not work**, because Tailwind emits unlayered CSS and unlayered always beats layered (`L29-32`). |
| `html:has(.cfc-page)` | `L84`, `L90` | Document-level rules apply only while a `.cfc-page` element exists. |
| `overflow-x: hidden` on **`body` only** | `L85-90` | On `html` (or on the wrapper) it breaks `position: sticky` headers. This was a real bug earlier. |

**Leaks (verified by reading):**

- `:root { --teal…; --pad… }` (`L50-77`, `L720`) are **global** custom
  properties. Harmless today (the shared tokens use `--color-*` names), but a
  future token named `--ink`, `--line` or `--pad` would collide.
- **Unscoped selectors:** `.rv-2`, `.rv-4`, `.rv-6` (`L576-578`, second selector
  on each line) and `.mobile-search-row` (`L1056`). They only match elements
  with those exact class names, so nothing else is affected today.
- **Stale comment inside the file:** `L100-104` says the overflow guard is
  applied "to `html` by the layout". That is false; `L85-90` puts it on `body`.
- At ≤900px, `.cfc-page` gets `padding-bottom: 74px` (`L716`) for the mobile
  action bar, and the signed-in page also sets `document.body.style.paddingBottom`
  from JS (`home/interactions.js:L282`).

### 9.4 Hardcoded colours that bypass both systems (so a token change will not fix them)

| File:line | Value | Should be |
|---|---|---|
| `components/home-hero.tsx:L83`, `browse/page.tsx:L715`, `L899`, `pro/[id]/page.tsx:L203` | `rgba(0,184,196,…)` = old Figma teal `#00b8c4` | new teal `#0fb3a6` |
| `home-hero.tsx:L91`, `active-booking-card.tsx:L49`, `splash/page.tsx:L57,L89,L98-102` | `rgba(37,99,235,…)` = Tailwind blue-600 | brand blue `#2456d6` or remove |
| `banner-carousel.tsx:L115` | `rgba(14,31,61,…)` = old navy `#0e1f3d` | `#0b2239` |
| `categories/page.tsx:L365` | `rgba(11,31,58,…)` | `#0b2239` |
| `subcategory-tile.tsx:L57` | `rgba(23,26,60,…)` (an indigo navy) | `#0b2239` |
| `(home)/home/page.tsx:L333-340` | `#fff #e3eaf0 #e8f7f5 #0fb3a6 #eef3f7` in the empty-state SVG | allowed only because lint is off for `(home)` |

### 9.5 How to confirm a Tailwind class actually does something

1. Look it up in `frontend/packages/config/tailwind-preset.js` (§9.1 lists the
   scales). If the key is not there and it is not a stock Tailwind utility that
   the preset leaves untouched (`flex`, `grid-cols-3`, `max-w-xs`, `border-4`,
   `line-clamp-2`, `left-1/2`…), it does nothing.
2. Or run the app and inspect the element in browser devtools. If the class has
   no matching rule, it is dead.
3. **Do not trust the Tailwind CLI for this in this repo on Windows.** During
   this audit `npx tailwindcss -c tailwind.config.js` produced the same 52 KB
   output with or without `--content`, and contained no responsive classes such as
   `md:px-6`, so it was not scanning the source. `next build` / `next dev` do
   generate the classes (the app is styled). Use those.
4. `.tabular`, `.text-hero` and `.text-section` are **not Tailwind utilities**.
   They are hand-written in `packages/ui/src/styles.css` and `brand.css`. A
   Tailwind-only check will wrongly report them as dead.

---

## 10. Lint and TypeScript rules that will stop your build

`next build` runs ESLint and **fails on any lint error**. That includes the
build that deploys to Vercel.

**Shared rules** (`frontend/packages/config/eslint-app.js`), applied through
`.eslintrc.js`:

| # | Rule | Example that fails |
|---|---|---|
| 1 | No importing from other apps | `import … from "../../pro/…"` |
| 2 | No importing `@cfc/ui/src/primitives/*` | use `@cfc/ui` |
| 3 | No importing mock **fixtures** | use the api functions |
| 4 | No raw hex literal in code | `"#0fb3a6"` in a `.tsx` |
| 5 | No arbitrary Tailwind values | `w-[437px]` |
| 6 | No Tailwind default palette | `bg-slate-500` |
| 7 | No `.toLocaleString()` | use `formatCurrency`/`formatDate` from `@cfc/ui` |
| 8 | No fractional spacing | `mt-0.5`, `gap-1.5` |
| 9 | No off-scale integer dimensions | `h-14`, `size-9`, `p-10`, `w-40` (**`16/20/24` were removed from this list locally**, since they are real steps now) |
| 10 | No opacity modifier on token colours | `bg-action/90` |
| 11 | `import type` for types | `@typescript-eslint/consistent-type-imports` |

**Consumer-only exemptions** (`.eslintrc.js:L17-44`, `MODIFIED`, uncommitted):

- `src/app/(home)/**/*.js` → parsed with `espree` (not the TypeScript parser),
  `no-unused-vars` off. Needed because `interactions.js` is plain JS outside
  `tsconfig`.
- `src/app/(home)/**/*.tsx` → `react/no-unescaped-entities` off **and
  `no-restricted-syntax` off entirely**. The comment (`L15-16`) says "three
  rules", but switching off `no-restricted-syntax` disables **rules 4–10 all
  together** for those files. Hex, arbitrary values, default palette,
  `toLocaleString`, dead dimensions and opacity modifiers are all unchecked in
  the two home pages (I-49).

**TypeScript** (`frontend/packages/config/tsconfig-base.json`):
`strict`, **`noUncheckedIndexedAccess`** (array access returns `T | undefined`),
**`exactOptionalPropertyTypes`** (you cannot pass `undefined` to an optional prop
unless its type says `| undefined`, which is why props here read
`foo?: string | undefined`), `noUnusedLocals`, `noUnusedParameters`,
`noFallthroughCasesInSwitch`, `noImplicitOverride`. `allowJs: true`.
`tsconfig.json` includes only `.ts`/`.tsx`, so `interactions.js` is not
type-checked; its types come from the hand-written `interactions.d.ts` files.

---

## 11. File-by-file reference

Format of each entry: **path** · lines · git state · verdict. Then: what it
is, what it depends on, who uses it, and what is wrong with it.

### 11.1 Configuration

**`.eslintrc.js`** · 45 · `MODIFIED` · **IN USE**, **OUTDATED** (comment)
Spreads the shared `eslint-app.js`, sets the TS project, and adds two
`overrides` for `src/app/(home)/**` (§10). At the last commit it was only the
first 6 lines. Issue: comment `L15-16` says "exempts one directory from three
rules" but disables the whole `no-restricted-syntax` group (I-49).

**`next-env.d.ts`** · 5 · `IGNORED` · **IN USE** (generated)
Next.js type references. Regenerated by `next dev`/`next build`. Never edit.

**`next.config.js`** · 5 · `COMMITTED` · **IN USE**
`reactStrictMode: true`, `transpilePackages` for the four `@cfc/*` runtime
packages (they ship TypeScript source, not built JS). Identical in Pro and Admin.

**`package.json`** · 36 · `COMMITTED` · **IN USE**
Name `@cfc/consumer`. Scripts `dev`/`start` on port 3000, `build`, `lint`,
`typecheck`. Issue: `eslint-config-next` is `15.1.3` while `next` is `15.1.12`
(I-50, same in Pro and Admin).

**`postcss.config.js`** · 3 · `COMMITTED` · **IN USE**. Tailwind + Autoprefixer.

**`tailwind.config.js`** · 9 · `COMMITTED` · **IN USE**
Uses the shared preset; content scans `./src/**/*.{ts,tsx}` and
`../../packages/ui/src/**/*.{ts,tsx}`. **`.js` and `.css` files are not
scanned**, so a Tailwind class written inside `interactions.js` would produce no
CSS (none are used today).

**`tsconfig.json`** · 20 · `COMMITTED` · **IN USE**
Extends `@cfc/config/tsconfig-next`, maps `@/*` → `./src/*`. Contains a
trailing comma in `include` (`L15`), which TypeScript accepts.

**`tsconfig.tsbuildinfo`** · 263 KB · `IGNORED` · **SAFE TO DELETE**
TypeScript incremental cache, regenerated on the next `tsc`. Ignored by
`*.tsbuildinfo` in `frontend/.gitignore:L22`.

**`.turbo/`** (not counted) · `IGNORED` · **SAFE TO DELETE**. Turborepo task logs
(`turbo-build.log`, `turbo-lint.log`, `turbo-typecheck.log`).
**`.next/`** · `IGNORED` · **SAFE TO DELETE** (build output; stop the dev
server first). **`node_modules/`** · `IGNORED` · reinstall with `pnpm install`.

### 11.2 App shell

**`src/app/layout.tsx`** · 56 · `MODIFIED` · **IN USE**, **OUTDATED** (comment)
Root layout for every URL. Imports `@cfc/ui/styles.css` then `./brand.css`
(`L8-11`). Sets metadata (title "City Family Care", manifest, Apple web app),
viewport (`maximumScale 5`, `themeColor` = `SURFACE` white from `@cfc/tokens`).
Renders `<html lang="en" className={archivo.variable + jakarta.variable}>`,
`<body className="bg-canvas font-sans text-ink antialiased" suppressHydrationWarning>`,
the three providers and `<Toaster />`. Change since the last commit: added
`jakarta`. Note: the handoff prompt asked for the reference layout's SEO metadata
(canonical, Open Graph, Twitter) and its JSON-LD block to be merged in. **They were not**, and
that is fortunate: the reference JSON-LD (`cfc-handoff/reference/cfc-nextjs/app/layout.tsx:L21`)
tells search engines about 11 cities, a `+91-1800-000-4567` support line, "40 more services"
and ₹10,000 insurance, the same unsourced claims listed in I-01. Do not merge it as is. Issue: comment `L9-10` still says "the consumer's Figma teal", but the
teal is now the handoff `#0fb3a6` (I-57).

**`src/app/brand.css`** · 183 · `MODIFIED` · **IN USE**, **OUTDATED** (header)
Consumer-only token override (§9.1). Structure: header comment `L1-38`,
`html:root` specificity note `L40-50`, token block `L51-141`, body font
`L156-158`, `.text-hero` `L171-176`, `.text-section` `L178-183`. At the last
commit it overrode only the five `--color-action*` tokens to `#00b8c4`.
Issues: the header `L1-38` still describes the old `#00b8c4` decision and its
2.43:1 contrast as current. `L52-64` supersedes it, but the file now tells both
stories (I-57). The contrast figure "2.9:1" for white on `#0fb3a6` (`L61-62`) is
**NOT VERIFIED** by this audit. Comment `L120-123` says buttons "become
pill-shaped", but `--radius-control: 14px` on a 44px-tall button gives a rounded
rectangle, not a pill. Redefining `--color-clock*` to blue changes
every status colour (§9.1, D-06).

**`src/app/(app)/layout.tsx`** · 47 · `COMMITTED` · **IN USE**. See §4.

**`src/app/(auth)/layout.tsx`** · 16 · `COMMITTED` · **IN USE**, **OUTDATED** (comment)
Passthrough. Comment `L7-8` says the app layout "will be built in Batch 2"; it
exists (I-58).

**`src/app/(home)/layout.tsx`** · 26 · `UNTRACKED` · **IN USE**, **OUTDATED** (comment)
Passthrough that imports `./home-pages.css`. Issues: comment `L5-7` says the
`(app)` layout adds `MarketingNav` (no such component exists here; it is from the
backup branch, §2.4), and `L14-15` says the stylesheet "is layered", but the
stylesheet header says layering was abandoned and it is scoped instead (I-58).

### 11.3 The approved home pages — `src/app/(home)/` (all `UNTRACKED`)

**`(home)/page.tsx`** · 627 · **IN USE**, **NEEDS YOUR DECISION** (copy)
URL `/`. Client component. Calls `initCFC()` on mount (`L11`) and
`useCatalogue()` + `useRevealLateContent()` (`L16-17`). Renders a
`<div className="cfc-page">` with, in order: an inline SVG icon sprite (`L21-55`,
`<symbol id="i-…">`, referenced as `<use href="#i-clean">`); skip link; sticky
header `#hdr` (logo, city picker, nav anchors `#services #how #care #pro`, "Log in"
→ `/login`, "Book a service" → `/categories`, burger); mobile sheet `#sheet`;
hero (FIRST20 kicker, H1, search bar with mic and suggestions, "Popular" chips,
four trust items, animated illustration cards); categories `#services` (**real**
tiles from `useCatalogue`, skeletons while loading); three promo cards `#care`;
most-booked rail `#booked` (**real** services, "Book" → `/service/[id]`); how it
works `#how`; why-CFC grid; pro band `#pro`; testimonial marquee; FAQ `#faq`
(native `<details>`); cities; footer (Services column = first 6 real tiles, Help
and legal links wired, Company links `#top`); mobile action bar `#mbar`.

What is **wired to the product**: category tiles, rail, "See all N services",
header/sheet/mobile-bar booking and login buttons, footer Services/Help/legal.

What is **not wired** (verified in `interactions.js`):
- **Search does not search.** Typing shows the prototype's own hardcoded list
  (`interactions.js:L151-178`). Picking a suggestion only fills the input
  (`L255-261`). The "Search" button only focuses the input (`L274`). Nothing
  navigates to `/search` or a service (I-03).
- **Voice search** uses real speech recognition when available; otherwise, **or
  on any error**, it plays a scripted demo that types "Tap and mixer repair"
  (`L106-120`, `L129`, `L142`, `L145`).
- City picker (11 hardcoded cities, `L277-278`) only changes the label text
  (`L292-297`). "Use my current location" only closes the popover (`L313`).
- Promo buttons (`L266`, `L275`, `L284`), city buttons (`L542-553`), "Join as a
  professional" and "See how earnings work" (`L428-429`), mobile "Call CFC support"
  (`L622`), footer app/company links (`L569-570`, `L587-591`): **no action**.

Unverified or invented claims still on this page (I-01; each needs a source or
removal):
`L122` FIRST20 20% off (real coupon, OK) · `L124` "and 40 more services"
(catalogue has 16) · `L170-173` trust row: "30 day warranty on every job" (fixture
warranties are 15/30/60), "Fixed price", **"100 metre GPS check on arrival"
(PLATFORM-FACTS says the 100 m check is to *mark the job complete*, not on
arrival; this wording was written during this project and is inaccurate)**,
**"5 languages, end to end" (only English exists; `settings/page.tsx:L79-85`;
also written during this project and currently false)** · `L182-183` ₹499 with a
struck-through ₹699 and "No visit charge" (no ₹699 price exists; visit charges
exist in fixtures) · `L187-197` pro "Rajesh Kumar, 4.8, 612 jobs" · `L204`
"12th Main, Koramangala" · `L69`, `L295` "Bengaluru" (service areas are
Tiruchirappalli localities) · `L264` "Up to ₹300 back" (matches FIRST20's ₹300
cap) · `L272-275` "CFC Care" plan at ₹2,499/year (not in fixtures or
PLATFORM-FACTS) · `L281-282` "Mornings cost less, save 15%" (no such rule) ·
`L398-403` "Aadhaar check, police verification and an in-person skill test",
"On time, or ₹100 off", "Damage cover up to ₹10,000", "Support in English, Tamil,
Kannada, Telugu and Hindi, 7 AM to 11 PM" · `L437-440` pro stats (these match
PLATFORM-FACTS: 0% for first 20 jobs, 48-hour payout, 15% commission; "MRP on
parts" has no source) · `L458` testimonials labelled "Sample content" (the six
names and cities in `L464-493` are invented) · `L508-531` FAQ: reschedule free
up to 2 hours before, cancellation fee inside 2 hours, ₹10,000 insurance reported
within 48 hours, "7 AM to 9 PM" (contradicts "7 AM to 11 PM" on the same page,
`L403`, `L504`) · `L539-553` 11 South Indian cities (PLATFORM-FACTS forbids any
city as scope) · `L601-602` phone "1800 XXX 4567" and `care@cityfamilycare.in` ·
`L607` "CityFamilyCare Services Pvt Ltd" (legal entity name, NOT VERIFIED).

**`(home)/home/page.tsx`** · 504 · **IN USE — UNREACHABLE** (§6), **NEEDS YOUR DECISION**
URL `/home`. Calls `initCFCApp()` and keeps its handle (`L10-18`); after the
catalogue loads, calls `handle.current.refresh()` so the rail gets Add buttons
(`L28-30`). Renders: sprite (`L34-80`, more icons than `/`), app bar `#appbar`
(address button, search with mic, **inert** notifications bell `L111-114`, cart
button `#cartBtn`, account button and menu `#acctMenu`), mobile search row,
welcome/setup checklist, address capture panel, welcome offer card, categories
(**real**), "Popular in Bengaluru" rail (**real** services with `data-id/name/price/icon`
attributes for the vanilla cart, `L281-288`, price in **rupees** not paise),
bookings empty state (**hardcoded**, always empty), CFC Care card, referral strip,
help strip, footer, cart drawer `#cart`, toast `#toast`, floating cart bar
`#cartBar`, tab bar.

Hardcoded or not wired (verified): name "Aarthi Subramanian" and "+91 98xxx xx190"
(`L128-129`, `L163`, `L169`); "You have not booked anything yet" (`L164`) shown
regardless of data; menu "Saved addresses" / "Payment methods" → `#main`
(`L134-135`); **"Log out" button does nothing** (`L141`, no handler in
`interactions.js`); "Valid for 30 days from today" (`L210`, FIRST20 expires on a
fixed date); "CFC Care, ₹2,499 a year" (`L351`); "Give ₹200, get ₹200" / `AARTHI200`
(`L365-368`, while the real `/refer` screen says its terms are placeholders);
"Chat with us" and "1800 XXX 4567" buttons (`L382-383`); **the entire footer links
to `#main`** (`L394-442`, unlike `/`, whose footer was partly wired); cart drawer
"Visit charge: Free" (`L464`). Tab bar: Home → `/home`, Bookings, Help → `/support`,
Account → `/profile` (`L484-500`).

**`(home)/interactions.js`** · 462 · **IN USE**, **DUPLICATE** (catalogue)
Plain browser JavaScript for `/`. `export function initCFC()` binds everything and
returns a cleanup function that removes the listeners registered through its `on()`
helper, plus its timers and observers (`L451-460`). Listeners attached to the
freshly rendered suggestion and city buttons are not tracked; they are discarded
with those elements. Sections: header shadow + mobile bar on scroll (`L14-23`); mobile
sheet with Escape and focus trap (`L25-42`, `L440-448`); `.rv` reveal observer,
**collected once at mount** (`L44-56`); rail prev/next (`L58-62`); marquee cloning
(`L64-74`); chips fill input (`L76-84`); voice search + demo (`L86-146`);
**hardcoded prototype catalogue `SERVICES` with prices that do not match the
real catalogue and includes Laundry / Packers and movers** (`L150-178`);
suggestion dropdown (`L181-274`); city picker (`L276-316`); count-up animation for
`[data-count]` (`L318-349`); the looping "live booking" illustration (`L351-393`);
rail progress bar + mouse drag-to-scroll (`L395-438`). Marked `/* eslint-disable */`
(`L1`). Types in `interactions.d.ts`.

**`(home)/interactions.d.ts`** · 1 · **IN USE**. `export function initCFC(): () => void;`

**`(home)/home/interactions.js`** · 494 · **IN USE**, **DUPLICATE**
Plain JavaScript for `/home`. `initCFCApp()`: toast (`L15-25`); sticky app bar;
account menu open/close (`L33-48`); **address capture kept only in memory**
(`L50-109`, "Use current location" types a fixed Koramangala address, `L105-109`);
**the separate in-memory cart** (`L111-256`, §7.2); checkout guard + "Not built
yet" toast (`L258-268`); empty-state CTA scroll; **referral "copied" toast that
does not copy anything** (`L275`); tab-bar height → `--tabbar-h` and
`body.style.paddingBottom` (`L277-285`); tab `aria-current` toggling (`L287-294`);
second hardcoded `SERVICES` list with fake ids; **picking a suggestion adds it to
the cart** (`L296-392`); voice for every `.mic` with a fake fallback (`L394-423`);
rail controls (`L431-474`). Returns `cleanup` with a `refresh` property
(`L478-492`) that re-runs `render()`. That was added during this project so the
rail, which arrives after mount, gets its Add buttons.

**`(home)/home/interactions.d.ts`** · 12 · **IN USE**. Declares `CFCAppHandle`
(callable cleanup with `refresh`) and `initCFCApp(): CFCAppHandle`.

**`(home)/use-catalogue.ts`** · 271 · **IN USE**, minor **DUPLICATE**
Written during this project to replace the prototype's hardcoded tiles and rail.
`useCatalogue(bookedLimit = 8)` calls `getServices()` once and derives:
`tiles` (one per sub-category that has an active service, ordered by `TILE_ORDER`
`L75-86`, icon and label from `TILE_META` `L61-72`, price "From ₹X" = cheapest
`basePricePaise` formatted without paise, href `/categories?sub=`), `booked` (top N
by `bookingCount`, rating `null` → "New", duration from the default variant, href
`/service/[id]`, `pricePaise`), `serviceCount`, `loading`, `error`.
`useRevealLateContent(ready)` (`L241-271`) observes `.cfc-page .rv:not(.in)`
elements that appeared after `initCFC` ran, so late tiles do not stay invisible.
Used by both home pages (`useCatalogue(6)` on `/home`). Notes: `formatDuration`
(`L147-152`) is the third copy in the app (I-37). The JSDoc at `L239` mentions a
`deps` parameter that does not exist. Label mapping ("Appliance" → "Appliance
repair", "Water" → "Water purifier") differs from `/categories`, which shows raw
names (I-38). If `getServices` fails, `error` is set but **neither page renders
an error state**: the skeletons disappear and the grid is empty (I-19).

**`(home)/home-pages.css`** · 1,141 · **IN USE**. See §9.2–9.3. Sections by line:
header notes `1-42` · tokens `50-77` · base/scoping `79-126` · section rhythm
`128-134` · buttons `136-152` · header `154-211` · hero + search + trust +
illustration `213-361` · categories `363-385` · promos `387-411` · rail `413-455` ·
how it works `457-473` · why grid `475-483` · pro band `485-503` · testimonials
`505-522` · cities + footer `524-555` · mobile bar `557-569` · reveal `571-578` ·
skip link `580-588` · suggestions `590-623` · city picker `625-655` · rail progress
`657-668` · FAQ `670-688` · responsive `690-769` · signed-in shell `771-1098` ·
loading skeletons `1101-1141` (added during this project).

### 11.4 Screens — `src/app/(app)/`

**`(app)/browse/page.tsx`** · 1,012 · `MODIFIED` + renamed · **IN USE — UNREACHABLE**, **OUTDATED** (comment), **NEEDS YOUR DECISION**
The previous home page. Fetches in one effect, gated on `signedIn !== null`
(`L168-206`): public data (`getCategories` (**result discarded**, `L188`),
`getSubCategories`, `getServices`, `getBanners`, `getReviews(6)`), plus personal
data when signed in (`getConsumerProfile`, `getActiveBooking`, `getRebookable`).
Renders: `ActiveBookingCard` if a live booking exists, otherwise `HomeHero`;
sticky `CategoryStrip` filter; "Book again" `SnapScroller`; "Browse by category" 5
`SubCategoryTile`s + "View all N categories" → `/categories`; a filter notice;
four `GROUPS` shelves of `ShopServiceCard`s (`L111-146`); "Offers for you"
`BannerCarousel`; "Most booked this month" ranked rows; `HowItWorks` (new customers
only); `WhyCfc`; `Testimonials` (with the "Sample content" notice); `JoinAsPro` →
`/register?role=pro`; `GetTheApp` ("Soon" badges). Local components: `Band`
(`L533-559`, uses `text-section`), `RebookCard`, `RankedServiceRow`, `HowItWorks`,
`WhyCfc`, `Testimonials`, `TestimonialCard`, `JoinAsPro`, `GetTheApp`,
`StoreBadge`. Issues: header comment `L54` still says "Served at `/`";
`SUBCATEGORY_IMAGE` (`L78-89`) is duplicated in `categories/page.tsx` (I-36);
copy "Every job carries a 30-day warranty" (`L704`), "No call-out fee" (`L770`) (§13).

**`(app)/categories/page.tsx`** · 399 · `MODIFIED` · **IN USE**, **DUPLICATE**
Customer 10/11. `?sub=` absent → grid of every sub-category with at least one
active service (photo `SubCategoryCard`s). `?sub=Name` → breadcrumb, that
sub-category's services as `ShopServiceCard`s, native `<select>` sort (Most booked /
Top rated / Price low→high / high→low) kept in `?sort=`. Wrapped in `Suspense`
because of `useSearchParams`. Issues: `SUBCATEGORY_IMAGE` + `FALLBACK_IMAGE`
duplicated from browse (`L51-65`); `SubCategoryCard` (`L330-385`) re-implements
`components/subcategory-tile.tsx` with a different scrim colour (`L365`); shows raw
names "Appliance", "Water" (I-38); no mobile bottom padding (`pt-4 md:pb-12`,
`L167`), though the footer provides space.

**`(app)/search/page.tsx`** · 777 · `COMMITTED` · **IN USE**
Customer 8/9. `?q=` drives results (`searchServices`), `?sort=` drives order.
Discovery state: recent searches (`localStorage["cfc_recent_searches"]`, max 6) and
trending chips. Type-ahead (`suggestServices`, 200 ms debounce), keyboard navigation,
suggestions that navigate straight to `/service/[id]`, "See all results". Voice
search via Web Speech API with full error handling (`L475-525`); the mic button
only renders where the API exists (`L85-93`). Sticky search bar under the mobile
header using `--cfc-mobile-bar` (`L256-258`). Distance sort intentionally omitted
(`L95-107`). No issues found beyond I-42 (key naming).

**`(app)/service/[id]/page.tsx`** · 726 · `MODIFIED` · **IN USE**
Customer 12. Loads `getService` + `getServiceFaqs`, then `getServiceReviews(name)`.
Two-column layout on desktop (`lg:grid-cols-detail`, sticky `BookingCard`), a
fixed `MobileActionBar` below `lg`. Shows gallery (falls back to a placeholder on
image error), sub-category, H1, star rating or "New service", warranty badge
(**real per-service days**), description, inclusions, `TrustRow`, FAQ accordion,
reviews (4 then "Show all"). Variant radio list; "Book this service" →
`/book/[id]?variant=`. Add/stepper uses the real cart. Issues: the back link shows
the **admin category** name ("Home & Maintenance") and goes to `/categories` root
(`L132-138`), the taxonomy `/categories` deliberately hides (I-39); "Starting at"
label above the **selected** variant's price (`L308-311`); Add ignores the chosen
variant (`L233-243`, I-16); `formatDuration` copy (`L720-726`, I-37).

**`(app)/pro/[id]/page.tsx`** · 467 · `MODIFIED` · **IN USE**
Customer 13. `getPublicPro` (a deliberately limited projection with no bank or
earnings data) + `getProReviews`. Identity card (avatar or photo, verified badge,
rating, area, jobs / years / joined), "Browse services" CTA (no "book this pro",
because auto-assign picks the pro). Bio, skill tags → `/search?q=`, review
distribution + list with "Sample content" notice. Issue: hardcoded old teal in the
card cap (`L203`). Reached only from booking detail.

**`(app)/cart/page.tsx`** · 304 · `MODIFIED` · **IN USE**
The checkout basket. Empty state → `/categories`. Lines with image, name, "from"
price, stepper, remove; "Add more services"; summary with estimate. "Continue to
booking" (signed in) or "Sign in to book" → `AuthDialog`, then checkout of the
**first line only** (`L59-66`). Copy: "Visit charge, platform fee and GST are
confirmed on the next step" (`L261-262`) and "Every job carries a 30-day warranty"
(`L288`) (§13). Prices shown as `₹499.00` (full formatter).

**`(app)/book/[id]/page.tsx`** · 1,123 · `COMMITTED` · **IN USE**, **OUTDATED** (comments)
Customers 14–21. `[id]` is a **service id**. Wrapped in `RequireAccount`.
`?step=` = `options | slot | address | summary | payment | done`; `?variant=`,
`?addons=` (comma list), `?qty=` also live in the URL. The options step is skipped
automatically when there is nothing to choose (`L241-261`). Slot step: calendar
(today to +30 days) and morning/afternoon windows from `getSlots`. Address step:
saved addresses (`getAddresses`), `MapView` placeholder pin, `AddressSheet` to add or
edit (browser geolocation fills only the pin; city and state are **hardcoded
"Tiruchirappalli", "Tamil Nadu"**, default point, `L952-955`). Summary/coupon/payment
from `checkout-steps.tsx`; confirmation from `confirmation.tsx`. One
`priceBooking()` breakdown feeds summary, payment and confirmation (`L265-275`).
`pay()` calls `createBooking` and removes the service from the cart (`L285-308`).
Issues: **slot and address are React state, not URL**. Refreshing on `summary`
or `payment` loses them and "Pay" silently does nothing (`L125-131`, guard `L286`,
I-10). Refreshing on `done` shows the options step again because `reference` is gone
(`L372`, I-11). Stale comments: `L59-70` ("two steps"), `L484-490` ("Four steps are
named even though two are built") (I-58). `?reschedule=1` is never read (I-06).

**`(app)/book/[id]/checkout-steps.tsx`** · 957 · `COMMITTED` · **IN USE**
Exports `OptionsStep` (variants, `QuantityPicker` max 6 `L320`, add-ons, running
subtotal), `SummaryStep` (booking recap, coupon entry), `PriceBreakdownCard`
(service, add-ons, discount, visit charge, platform fee, GST 9%+9% on the platform
fee, total), `CouponSheet` (`getAvailableCoupons`, `applyCoupon`, a named reason for
each refusal), `PaymentStep` (UPI / card / wallet (disabled if short) / cash).
Issues: header comment `L46-52` says "18, 19, 20, 21" but the file also holds 14;
**the payment note "You will be taken to a secure payment page" (`L950-953`) is
untrue**, since pressing Pay books immediately with no gateway (I-18);
`formatDuration` copy `L62-68`.

**`(app)/book/[id]/confirmation.tsx`** · 184 · `MODIFIED` · **IN USE**
Customer 21. Animated tick (skipped for reduced motion), reference, service, arrival
window, address, "Add to calendar" (generates an `.ics` download, fixed 2-hour
duration `L139`), "View my bookings".

**`(app)/bookings/page.tsx`** · 288 · `MODIFIED` · **IN USE**
Customer 25. Tabs Upcoming / Ongoing / Completed / Cancelled in `?tab=`, with counts
(`getMyBookingCounts`). Cards → `/bookings/[id]`; "Rate this" badge on unrated
completed jobs.

**`(app)/bookings/[id]/page.tsx`** · 439 · `MODIFIED` · **IN USE**, **BROKEN ACTION**
Customer 26. State-dependent actions (`L112-118`): cancel (pending/assigned, with a
confirm dialog `cancelBooking`), contact pro (`tel:` / `sms:`), rate, receipt, tax
invoice, track live. **The Reschedule button links to `/book/${booking.id}?reschedule=1`
(`L328`). `booking.id` is a booking id (`bkg_c01`), the book route expects a
service id, `getService` throws 404, and the customer sees "We could not start this
booking".** (I-06). Before/after photos render as tinted placeholders (`L413-429`).

**`(app)/bookings/[id]/track/page.tsx`** · 344 · `MODIFIED` · **IN USE**
Customers 27–29. Assigned: ETA countdown (local, per minute), `MapView` placeholder
with the note "Live position updates once the Maps integration is connected".
In progress: `OtpDisplay` completion code. Completed: before/after `PhotoGrid`.
Timeline with pending future steps. Pending or cancelled → an explanatory state.

**`(app)/bookings/[id]/review/page.tsx`** · 263 · `MODIFIED` · **IN USE**
Customer 30. Only for completed jobs. Stars first; chips (`chipsFor(rating)`) and
text appear after; ≤2 stars shows a support link mentioning "the 30-day warranty"
(`L233`). `submitReview`.

**`(app)/bookings/[id]/invoice/page.tsx`** · 352 · `MODIFIED` · **IN USE**, **BUG**
Customers 31/32. `?tax=1` switches receipt ↔ tax invoice; completed jobs only;
"Print or save as PDF" (`window.print()`, `print:hidden` chrome). **Bug:
`TaxInvoice` computes fees with `priceBooking({ serviceId: "svc_01" })` (`L246`),
so every tax invoice shows AC service's platform fee and GST whatever was booked,
and "Professional fee" is derived from that.** (I-07). Also, the site header, footer
and tab bar are not hidden when printing (only elements inside this page carry
`print:hidden`).

**`(app)/quotes/[id]/page.tsx`** · 453 · `MODIFIED` · **IN USE**
Customers 22–24. Quotation from the pro: findings, before photos, materials, labour,
total, 50/50 advance split (`splitQuotation`). Accept (pays advance), Decline (with
confirm), Ask a question (sheet; "our team will call you"). Statuses `approved`,
`customer_accepted`, `customer_declined`, `rejected`.

**`(app)/notifications/page.tsx`** · 293 · `MODIFIED` · **IN USE**, **OUTDATED** (comment)
Customer 39. Filters All / Bookings / Quotations / Offers / Reminders in `?kind=`;
"Mark all read"; rows link to `n.href`. Issues: comment `L194-195` says unread uses a
dot "rather than bold text", but unread titles are `font-semibold` (`L224`);
`<Link href onClick={onOpen}>` where `onOpen` also calls `router.push`
(`L86-88`, `L260`), so it navigates twice (harmless, but redundant).

**`(app)/profile/page.tsx`** · 592 · `COMMITTED` · **IN USE**, **BUG**
Customers 33–35. Identity + stats (bookings, wallet, member since), links (addresses
sheet, wallet, refer, support, settings), `EditProfileSheet` (name, area; photo upload
disabled with a note), `AddressesSheet` (list + remove only). **Bug: "Sign out" is a
`<Link href="/login">` (`L188-197`). It navigates without calling `signOut()`, so the
customer stays signed in.** The same defect was fixed in the header menu and
settings, per the comment at `settings/page.tsx:L253-257` (I-05). `displayPhone`
copy (`L219`).

**`(app)/settings/page.tsx`** · 331 · `MODIFIED` · **IN USE**
Customers 43/44. Notification toggles (local only), dark mode toggle
(saves `cfc_theme`, sets `data-theme`, "Coming soon", **no dark theme exists**),
language sheet (English only; four marked "Soon"), legal links, app version
`0.1.0` (hardcoded `L87`), "Rate a booking", sign out (signed-in only, calls
`signOut()`). Public (no sign-in needed).

**`(app)/support/page.tsx`** · 606 · `MODIFIED` · **IN USE**
Customers 40–42. Helpline card (`SUPPORT_PHONE`, `SUPPORT_HOURS`), tabs in `?tab=`:
Help (FAQ accordion + raise-ticket sheet), My tickets (`RequireAccount`, thread
sheet with replies), Assistant (scripted `askAssistant`, "Not a live assistant
yet" notice). `displayPhone` copy (`L585`). Raising a ticket while signed out is
allowed from the Help tab.

**`(app)/wallet/page.tsx`** · 423 · `MODIFIED` · **IN USE**
Customers 36/37. Balance, "Add money" sheet (presets; "Payment gateway pending";
nothing charged), "Earn by referring", transactions filtered by `?show=`
(`all | topup | booking | refund`; labels All / Added / Spent / Credits), each line with
balance after. Minor: a transaction's booking reference links to `/bookings`, not
that booking (`L268-273`).

**`(app)/refer/page.tsx`** · 303 · `MODIFIED` · **IN USE**
Customer 38. Code (copy; Web Share where available, otherwise copy link), how it
works (minimum and reward amounts from the programme fixture), tracker
(invited / booked / earned), "Sample terms" notice while
`REFERRAL_TERMS_ARE_PLACEHOLDER`.

**`(app)/legal/[doc]/page.tsx`** · 134 · `MODIFIED` · **IN USE**, **NEEDS YOUR DECISION**
Customer 44. `terms`, `privacy`, `refunds` only: a title, an "Awaiting the final
wording" notice and numbered section **headings with no text** (`L31-75`). Unknown
slug → "Document not found". The back link always says "Settings" (`L94-100`) even
when opened from a footer. There is **no `safety` document**; the `/` footer "Safety"
link points at `/legal/terms` (I-24).

### 11.5 Screens — `src/app/(auth)/`

**`(auth)/splash/page.tsx`** · 164 · `MODIFIED` · **IN USE — UNREACHABLE**, **OUTDATED**
Customer 1. Navy full screen, inline SVG shield/house (not the `Logo` component),
"CFC / City Family Care / Trusted Home Services", pulsing dots with an inline
`<style>` keyframe. After 1.8 s → `/` if `cfc_onboarding_seen`, else `/onboarding`
(`L30-38`). Issues: the comment says returning users go to `/home` (`L14`), but the
code sends them to `/` (`L33`); "blue+orange logo animation" (`L9`) is the old brand
brief; hardcoded blue `rgba(37,99,235)` throughout the SVG.

**`(auth)/onboarding/page.tsx`** · 404 · `MODIFIED` · **IN USE** (only via `/splash`), **NEEDS YOUR DECISION** (copy)
Customer 2. Desktop: marketing page (header with Shield icon, not `Logo`; hero; 4
service tiles with hardcoded prices; promises strip; 3 feature cards; CTAs → `/login`).
Mobile: 3-slide walkthrough with dots. Every exit sets `cfc_onboarding_seen`.
Unsupported claims: "…and **20+ more categories** — all booked in **under 60
seconds**" (`L54`; there are 10 sub-categories); "background-checked, trained and
rated. You see their **photo, ID** and reviews before they arrive" (`L62`); warranty
"**No questions asked**" (`L70`); "Beauty & Salon From ₹599" (`L79`; the real
Beauty floor is ₹299); "No credit card required" (`L211`). `bg-gain-subtle text-gain`
renders blue (§9.1). (I-20)

**`(auth)/login/page.tsx`** · 142 · `COMMITTED` · **IN USE**, **OUTDATED** (comment)
Customer 3. Mobile number → `sendOtp` → `/otp?from=login&phone=`. Signed-in visitors
are redirected to `/` (`L31-33`). Links: "Create an account", "Forgot password?"
(there is no password; the OTP flow is the same). "Terms of Service" and "Privacy
Policy" are **plain `<span>`s, not links** (`L135-139`). Comment `L16` mentions a
"two-column desktop layout" that `AuthShell` no longer has.

**`(auth)/register/page.tsx`** · 156 · `COMMITTED` · **IN USE**, **BUG**
Customer 4. Name + mobile + area → saves name and area to `sessionStorage`
(`L45-46`, **never read**, I-13) → `sendOtp` → `/otp?from=register`. **`?role=pro`
is never read** (no `useSearchParams`), so the "Work with us as a professional"
links in the footer (`consumer-footer.tsx:L118`) and on `/browse` (`L922`) put a
professional through **customer** registration (I-08). Terms/Privacy are spans
(`L149-153`).

**`(auth)/otp/page.tsx`** · 244 · `COMMITTED` · **IN USE**, **DEMO BEHAVIOUR**
Customer 5. Six digit boxes, paste support, 30 s resend. **Auto-fills `123456` after 3
seconds** (`L20`, `L66-72`) and the subheading says "Auto-filling in a moment…". On
verify: sets `cfc_onboarding_seen`, `signIn()`, `router.replace("/")` (`L99-111`).
**Any phone number with any 6-digit code signs in** (mock `verifyOtp`). Must change before real auth (I-12).

**`(auth)/forgot-password/page.tsx`** · 118 · `COMMITTED` · **IN USE**
Customer 6. States "CFC uses mobile OTP for login. There's no separate password", then
the same OTP flow with `from=forgot-password` (which also signs in). The note callout
renders blue (§9.1).

### 11.6 Components — `src/components/`

**`active-booking-card.tsx`** · 140 · `MODIFIED` · **IN USE** (by `/browse` only)
Navy card for a live booking: status dot (live/clock), service, reference, area,
ETA, pro name, rating, Call (`tel:`), completion code, "Track live"/"View booking" →
`/bookings/[id]`. Issue: hardcoded `rgba(37,99,235)` glow (`L49`).

**`app-main.tsx`** · 70 · `COMMITTED` · **IN USE** (by `(app)/layout.tsx`)
`<main className="flex-1 …">` whose bottom padding depends on signed-in state, cart
count and pathname: `pb-tab-bar md:pb-0` (tab bar only), `pb-action-bar` (cart bar
only), `pb-bars md:pb-action-bar` (both), `pb-0`. Its suppression list (`/cart`,
`/book/*`, `/service/*`, `L32-36`) **must match `cart-bar.tsx:L41-44`**. Change both or
neither.

**`area-picker.tsx`** · 123 · `COMMITTED` · **IN USE** (by `consumer-nav.tsx`)
Popover listing `AREA_OPTIONS` (10 Trichy localities); "Set your area" vs
"Serving X · Change". Renders nothing until `ready`.

**`auth-dialog.tsx`** · 355 · `MODIFIED` · **IN USE** (by `cart/page.tsx`, `require-account.tsx`)
Modal sign-in: phone step → code step (auto-submits on 6 digits, paste, backspace,
30 s resend) → `signIn()` → `onDone()`. **Shows "For this demo the code is 123456"
to every visitor** (`L40`, `L311-314`, I-12). Double blank line at `L190-191`.

**`auth-shell.tsx`** · 143 · `MODIFIED` · **IN USE** (by login, register, otp, forgot-password)
Centered card layout for auth screens: header with `Logo` → `/`, optional back
button, H1, subheading, children, three assurances ("30-day warranty", "Verified
pros", "Fixed prices"; hidden on OTP). The comment (`L26-30`) names classes that do
not exist here (`bg-white/10`, `rounded-2xl`, `text-white`…) only to explain why they
were removed. Those names are not used in the markup.

**`banner-carousel.tsx`** · 158 · `MODIFIED` · **IN USE** (by `/browse` only)
Auto-advancing (5 s, pause on hover), swipeable carousel of `Banner`s. Resolves a
banner's `linkTarget` (a service **name** or admin category **name**) to a real URL
(`L54-73`). Issues: its own `getServices` + `getSubCategories` fetch, repeating what
`/browse` already loaded; old navy `rgba(14,31,61)` (`L115`); inline pixel sizes
(`L121`, `L148-151`).

**`cart-bar.tsx`** · 123 · `COMMITTED` · **IN USE** (by `(app)/layout.tsx`)
Floating white checkout pill (count, estimate, "Checkout" → `/cart`) when the cart has
items, except on `/cart`, `/book/*`, `/service/*` (`L41-44`). Sits above the tab bar for
signed-in phones (`bottom-tab-bar md:bottom-0`). Keep in sync with `app-main.tsx`.

**`cart-button.tsx`** · 50 · `COMMITTED` · **IN USE** (by `consumer-nav.tsx`)
Header cart icon → `/cart` with a count badge ("9+").

**`category-strip.tsx`** · 161 · `COMMITTED` · **IN USE** (by `/browse` only)
Sticky horizontal chip row that filters `/browse` in place. Sticks below the measured
mobile header (`var(--cfc-mobile-bar, 104px)`) or `md:!top-bar-tall` on desktop
(`L80-86`). Issue: Water and Plumbing both use the `Wrench` icon (`L39`, `L44`).

**`coming-soon.tsx`** · 37 · `COMMITTED` · **SAFE TO DELETE**
Placeholder for unbuilt routes. **Proof:** no file in `apps/` or `packages/` imports or
names `coming-soon`/`ComingSoon` except Pro's own separate
`apps/pro/src/components/coming-soon.tsx`, which is a different file.

**`consumer-footer.tsx`** · 163 · `COMMITTED` · **IN USE** (by `(app)/layout.tsx`)
Navy footer: logo, one-line pitch ("…with a 30-day warranty on every job"), phone +
hours from mocks, `help@cityfamilycare.in`, "Serving Tiruchirappalli and nearby areas",
columns Services (4 links) / Your account / Legal, copyright, "Work with us as a
professional" → `/register?role=pro` (I-08). `displayPhone` helper (`L155-163`,
duplicated in profile and support).

**`consumer-nav.tsx`** · 535 · `COMMITTED` · **IN USE** (by `(app)/layout.tsx`)
Exports `ConsumerTopBar` (desktop: logo → `/`, `AreaPicker`, `HeaderSearch` button →
`/search`, `CartButton`, then `NotificationBell` + `AccountMenu` when signed in, or
"Log in"), `ConsumerMobileTopBar` (brand row + search/area row; publishes its height
as the CSS variable `--cfc-mobile-bar`, `L353-368`), `ConsumerBottomNav` (fixed phone
tab bar, **signed-in only**, `L464`). `AccountMenu` uses the Radix `DropdownMenu`
(portals out of the sticky header; see the stacking-context note `L218-243`), items
from `NAV_ITEMS` + Help + Settings + Sign out (`signOut()` then `/`). Issues:
`NAV_ITEMS` "Home" → `/` (`L60`, §6); two consecutive JSDoc blocks, the first stale
(`L167-173`), describe `HeaderSearch` (I-58).

**`home-hero.tsx`** · 218 · `MODIFIED` · **IN USE** (by `/browse` only)
Server component (no `"use client"`). H1 "What can we help you with?" + "Serving
{area}", then a navy card with an H2 using `.text-hero` ("The price you see is the
price you pay."), a copy line with the starting price, "Explore services" →
`/categories`, "Book now" → `/book/[topServiceId]`, three promise chips, and the sofa
cleaning photograph. Issues: **two competing headings**, an H1 at 22/30 px above an
H2 at up to 60 px; hardcoded old teal and Tailwind blue glows (`L83`, `L91`); copy
"No call-out fee" (`L125`, §13); the comment `L33-35` claims everything stated is
documented, which is not true of "no call-out fee".

**`logo.tsx`** · 36 · `COMMITTED` · **IN USE** (by auth-shell, consumer-footer, consumer-nav)
Inline SVG shield + house mark using `currentColor`. The comment says the admin app
draws the same mark separately (apps must not import each other). **The two home
pages use a different mark** (a house icon in a teal tile, `.logo-mark`), and splash
and onboarding use yet other marks (§13).

**`quick-actions.tsx`** · 104 · `COMMITTED` · **SAFE TO DELETE**
Pills for the top 6 services. **Proof:** zero references to `quick-actions` or
`QuickActions` anywhere in `apps/` or `packages/` outside the file itself.

**`require-account.tsx`** · 101 · `MODIFIED` · **IN USE** (12 screens)
Gate for personal screens: `null` session → renders nothing; signed in → children;
signed out → a card with the screen's own title and description, "Sign in" (opens
`AuthDialog`, the content appears in place afterwards), "Browse services instead" →
`/categories`.

**`scenario-hook.tsx`** · 49 · `COMMITTED` · **IN USE** (by `(app)/layout.tsx`)
Development only: attaches `window.__cfc` with `empty/normal/error/slow/which` (§8.1).

**`shop-service-card.tsx`** · 199 · `COMMITTED` · **IN USE** (by browse, categories, search)
Photo (→ service), sub-category label, name, 2-line description, rating, "from" price,
Add → stepper using the real cart, "Added" strip. Issues: price uses
`width-condensed` (no effect under Jakarta, §9.1) and the full formatter
(`₹499.00`, `L121-122`) while the home pages show `₹499` (I-41).

**`subcategory-tile.tsx`** · 73 · `COMMITTED` · **IN USE** (by `/browse` only)
Photo tile with a legibility scrim, name, "N services". Scrim colour `rgba(23,26,60)`
(`L57`). Re-implemented separately inside `categories/page.tsx` (I-36).

### 11.7 Libraries and fonts

**`lib/session.tsx`** · 111 · `COMMITTED` · **IN USE** (13 files). §7.1. Comment
`L31` refers to a `SessionGate` that does not exist anywhere (grep).

**`lib/cart.tsx`** · 138 · `COMMITTED` · **IN USE** (8 files). §7.1.

**`lib/area.tsx`** · 72 · `COMMITTED` · **IN USE** (2 files). §7.1.

**`lib/fonts.ts`** · 55 · `MODIFIED` · **IN USE** (root layout). Archivo (local,
`src/fonts/*.woff2`, weights 100–900, widths 62–125) and Plus Jakarta Sans
(Google, self-hosted at build, weights 400–800). The Jakarta comment explains why it
was added.

**`src/fonts/archivo-latin.woff2`, `archivo-latin-ext.woff2`** · binary ·
`COMMITTED` · **IN USE** (by `lib/fonts.ts:L26-27`). Pro and Admin have their own
copies in their own `src/fonts/`.

### 11.8 Public assets — `public/`

| File | Bytes | Used by | Verdict |
|---|---|---|---|
| `manifest.webmanifest` | 522 | root `layout.tsx` metadata | **IN USE**; `start_url "/home"` (§6, D-01) |
| `logo.png` | 114,958 | manifest icon 512 | **IN USE** |
| `logo-mark.png` | 51,356 | manifest icon 192 | **IN USE** |
| `logo-white.png` | 81,476 | nothing | **SAFE TO DELETE** (0 references in `apps/consumer` or `packages`) |
| `logo-mark-white.png` | 27,504 | nothing | **SAFE TO DELETE** (same proof) |
| `images/cat-electrical.png` | 490,991 | `SUBCATEGORY_IMAGE` in browse + categories | **IN USE** |
| `images/cat-cleaning.png` | 562,532 | same | **IN USE** |
| `images/cat-plumbing.png` | 546,189 | same | **IN USE** |
| `images/cat-beauty.png` | 738,408 | same | **IN USE** |
| `images/promo-ac.png` | 692,537 | nothing | **SAFE TO DELETE** |
| `images/promo-cleaning.png` | 698,271 | nothing (named only in a comment, `home-hero.tsx:L197`, explaining its removal) | **SAFE TO DELETE** |
| `images/promo-salon.png` | 683,995 | nothing | **SAFE TO DELETE** |
| `mock/banners/first-booking.jpg` | 88,010 | `packages/mocks/src/fixtures/promotions.ts:L36` | **IN USE** |
| `mock/banners/ac-service.jpg` | 92,354 | `promotions.ts:L37` | **IN USE** |
| `mock/banners/deep-cleaning.jpg` | 91,109 | `promotions.ts:L38` (banner inactive) | **IN USE** |
| `mock/services/*.jpg` (16 files) | 102–167 KB each | **path built from the service name** (`catalog.ts:L334`); several also named in browse/categories/home-hero | **IN USE, all 16. DO NOT DELETE.** A text search makes 9 of them look unreferenced. |

Duplicated images (identical SHA-256): `plumbing-tap-pipe.jpg` =
`ro-water-purifier-service.jpg` = `tap-washer-replacement.jpg`, and
`men-s-grooming.jpg` = `salon-at-home-women.jpg`. So three different services show
the **same photograph**, and so do men's grooming and women's salon (I-43). They
cannot be deleted (each path is requested), but they should be replaced with
distinct photos.

---

## 12. Issues register

Every item below was found by reading the code named. **None has been fixed**; this
document changes nothing.

| ID | Sev | Where | Problem | Suggested fix |
|---|---|---|---|---|
| I-01 | P0 | `(home)/page.tsx`, `(home)/home/page.tsx`, `(home)/interactions.js` | Many unsourced promises and figures (full list in §11.3): ₹699 strike price, "no visit charge", "40 more services", insurance ₹10,000, ₹100-off lateness, Aadhaar/police/skill test, CFC Care ₹2,499, mornings 15% off, 11 cities, fake testimonials, fake pro, cancellation/reschedule rules, two different support hours, "100 metre GPS check on arrival" (wrong: the check is for completion), "5 languages, end to end" (false: English only). | Get each confirmed by the client in writing, or remove it. Reword the GPS and language lines. |
| I-02 | P0 | `(home)/home/page.tsx` | Hardcoded customer identity "Aarthi Subramanian", masked phone, referral code, shown to anyone; no session check; PWA opens here. | Gate on `useSession`, read `getConsumerProfile`, remove hardcoded identity. |
| I-03 | P1 | `(home)/interactions.js:L151-274` | The search box on `/` never leads anywhere (pick = fill input; Search = focus). Suggestions come from a hardcoded list with services and prices that do not exist. | On submit or pick → `router.push('/search?q=')` or `/service/[id]`; source suggestions from `suggestServices`. |
| I-04 | P1 | `consumer-nav.tsx:L60` (Home link), `L106`/`L393` (logo), `otp/page.tsx:L111`, `login/page.tsx:L32`, `register/page.tsx:L29` | Signed-in customers are sent to the **signed-out** home `/`. (Sign-out sending a customer to `/`, `consumer-nav.tsx:L326` and `settings/page.tsx:L268`, is correct and not part of this issue.) | Decide D-01, then redirect signed-in users to `/home` and point "Home" there. |
| I-05 | P1 | `profile/page.tsx:L188-197` | "Sign out" is a link to `/login` and never calls `signOut()`. | Use `signOut()` then `router.push("/")`, as `settings/page.tsx:L262-273` does. |
| I-06 | P1 | `bookings/[id]/page.tsx:L328`, `book/[id]/page.tsx` | "Reschedule" passes a booking id to a route that expects a service id → error screen; `?reschedule` is never read. | Build a reschedule flow (booking id → its service id + prefilled address), or hide the button. |
| I-07 | P1 | `bookings/[id]/invoice/page.tsx:L246` | Tax invoice fees are always computed for `svc_01`. | Use the booking's own service id or a stored breakdown. |
| I-08 | P1 | `consumer-footer.tsx:L118`, `browse/page.tsx:L922`, `register/page.tsx` | `/register?role=pro` sends professionals into customer sign-up; `role` is never read. The `/` page's "Join as a professional" button is inert. | Link to the Pro app's URL (needs the real URL, D-04). |
| I-09 | P1 | `(home)/home/interactions.js` | `/home` cart is separate, in-memory, and checkout says "Not built yet"; search picks add fake-id services. | Wire to `useCart()` (recipe §15.7). |
| I-10 | P1 | `book/[id]/page.tsx:L125-131`, `L286` | Refreshing on summary/payment loses slot and address; "Pay" then does nothing, silently. | Put `slot` and `address` in the URL, or guard the step and send the customer back. |
| I-11 | P2 | `book/[id]/page.tsx:L372` | Refreshing the confirmation (`?step=done`) shows the options step again. | Keep the reference in the URL, or redirect to `/bookings`. |
| I-12 | P0 (before launch) | `otp/page.tsx:L20,L66-72`, `auth-dialog.tsx:L40,L311-314`, `packages/mocks/src/api/consumer-auth.ts:L22-37` | OTP auto-fills `123456`; the dialog prints the code; the mock accepts **any phone number with any 6-digit code**. | Remove when real auth lands. Never ship. |
| I-13 | P3 | `register/page.tsx:L45-46` | Name and area saved to `sessionStorage`, never read, so the registration form data is discarded. | Pass to `updateConsumerProfile` after OTP, or remove the fields. |
| I-14 | P2 | `consumer-nav.tsx:L464` | The shared phone tab bar is hidden for signed-out visitors, while `/home` shows its own tab bar on phones to everyone and `/` shows a "Book a service" bar instead. | Decide consistent mobile navigation. |
| I-15 | P2 | `(home)/page.tsx`, `(home)/home/page.tsx` | The new home pages use neither `AreaPicker` nor real areas: the city picker lists 11 cities, the shared header lists 10 Trichy localities. | One source (`AREA_OPTIONS`) for both, after D-03. |
| I-16 | P2 | `service/[id]/page.tsx:L233-243`, `lib/cart.tsx:L25-32` | Adding to cart ignores the chosen variant and always adds base price. | Add `variantId` to `CartLine` and carry it into `/book`. |
| I-17 | P2 | `cart/page.tsx:L59-66` | Checkout books only the first cart line; the others wait. | Product decision: multi-service checkout, or keep and explain. |
| I-18 | P1 | `checkout-steps.tsx:L950-953` | "You will be taken to a secure payment page", but there is none; Pay books immediately. | Change copy until Razorpay is integrated. |
| I-19 | P2 | `(home)/page.tsx`, `(home)/home/page.tsx`, `use-catalogue.ts` | If the catalogue fails to load, both home pages show an empty category grid and rail with no error or retry. | Render an error state when `error` is true. |
| I-20 | P0 | `onboarding/page.tsx:L54,L62,L70,L76-81,L211` | "20+ more categories", "under 60 seconds", "photo, ID", "No questions asked", wrong prices, "No credit card required". | Rewrite from PLATFORM-FACTS or remove the screen (D-05). |
| I-21 | P2 | `(home)/page.tsx:L601`, `interactions.js:L219`, `(home)/home/page.tsx:L383,L432` | Placeholder phone "1800 XXX 4567" shown to customers. | Use `SUPPORT_PHONE` once the real number is known. |
| I-22 | P2 | `(home)/page.tsx:L569-570,L587-591`, `(home)/home/page.tsx:L394-442` | Footer links to `#top` or `#main` (dead); `/home` footer entirely unwired. | Wire to real routes as on `/`, or remove. |
| I-23 | P2 | `(home)/page.tsx:L266,L275,L284,L428-429,L542-553,L622` | Inert buttons (promos, pro CTAs, cities, call). | Wire or remove. |
| I-24 | P0 (before launch) | `legal/[doc]/page.tsx` | No legal text exists; only headings. No safety document. | Client's lawyer supplies text (D-07). |
| I-31 | P3 | `settings/page.tsx:L116-130` | Dark-mode preference saved but never applied at app start; no dark theme exists. | Keep as "coming soon", or remove until built. |
| I-36 | P3 | `browse/page.tsx:L78-98`, `categories/page.tsx:L51-65,L330-385`, `subcategory-tile.tsx` | Category image map and tile component duplicated. | Move the map to one module; reuse `SubCategoryTile`. |
| I-37 | P3 | `service/[id]/page.tsx:L720`, `checkout-steps.tsx:L62`, `use-catalogue.ts:L147` | `formatDuration` written 3 times (slightly different code). | One helper (e.g. in `src/lib`). |
| I-38 | P2 | `use-catalogue.ts:L61-72` vs `categories/page.tsx`, `category-strip.tsx` | The same sub-category is "Appliance repair" on home and "Appliance" on `/categories`; "Water purifier" vs "Water"; different icons per screen. | One label + icon map. |
| I-39 | P2 | `service/[id]/page.tsx:L132-138` | Back link shows the admin category "Home & Maintenance". | Show the sub-category and link to `/categories?sub=`. |
| I-40 | P2 | `brand.css` vs `home-pages.css:L50-77` | Two copies of the palette with different variable names, kept in step by hand. | Make `home-pages.css` read `var(--color-*)`, or generate one from the other. |
| I-41 | P2 | `shop-service-card.tsx:L122`, cart, checkout vs home pages | Prices shown as `₹499.00` on most screens and `₹499` on home. | Decide one format; `formatCurrency(x, { compact: true })` gives whole rupees. |
| I-42 | P3 | §7.3 | Storage keys use two naming styles. | Standardise on `cfc.consumer.*` with a migration read. |
| I-43 | P2 | `public/mock/services` | Five services share two photographs. | Replace with distinct images. |
| I-44 | P2 | §9.4 | Hardcoded old teal, old navy and Tailwind blue in inline styles. | Replace with the current palette or tokens. |
| I-45 | P3 | `packages/tokens` vs `brand.css` | Focus ring still the old teal `#0891a0`; buttons are `#0fb3a6`. | Add `--color-focus-ring` to `brand.css` if a matching ring is wanted. |
| I-46 | P2 | `home-hero.tsx:L61,L110` | An H1 at 22–30 px sits above an H2 at up to 60 px. | Make the large headline the H1. |
| I-47 | P3 | `consumer-nav.tsx`, `category-strip.tsx:L39,L44` | Water and Plumbing share an icon. | Pick a distinct icon. |
| I-48 | P2 | `notifications/page.tsx`, `(home)/home/page.tsx:L111-114` | The `/home` bell does nothing; the shared bell links to `/notifications`. | Wire. |
| I-49 | P2 | `.eslintrc.js:L28-43` | Lint for the two home pages disables all syntax rules, not three. | Narrow to the hex-literal rule only, or accept knowingly. |
| I-50 | P3 | `package.json:L30` | `eslint-config-next` 15.1.3 with `next` 15.1.12 (same in Pro, Admin). | Align versions across all three apps together. |
| I-51 | P3 | `banner-carousel.tsx:L36-39` | Refetches services and sub-categories already loaded by the page. | Pass them as props. |
| I-52 | P3 | `browse/page.tsx:L173,L188` | `getCategories()` fetched and discarded. | Remove the call. |
| I-53 | P3 | `wallet/page.tsx:L268-273` | Transaction reference links to the bookings list, not the booking. | Link to `/bookings/[id]` when the id is known. |
| I-54 | P3 | `login/page.tsx:L135-139`, `register/page.tsx:L149-153` | "Terms"/"Privacy" look like links but are spans. | Link to `/legal/*`. |
| I-55 | P3 | `invoice/page.tsx` | Site header, footer and tab bar print along with the invoice. | Add `print:hidden` to the shared chrome, or a print stylesheet. |
| I-56 | P3 | `shop-service-card.tsx:L121`, `splash:L119`, `onboarding:L190` | `width-condensed`/`width-expanded` have no effect under Jakarta. | Remove, or keep only where Archivo is used. |
| I-57 | P3 | `layout.tsx:L9-10`, `brand.css:L1-38`, `brand.css:L120-123` | Comments describe the old `#00b8c4` Figma teal as current, and claim a 14px control radius makes buttons pill-shaped. | Update comments. |
| I-58 | P3 | `(home)/layout.tsx:L5-7,L14-15`, `(auth)/layout.tsx:L7-8`, `book/[id]/page.tsx:L59-70,L484-490`, `checkout-steps.tsx:L46-52`, `login/page.tsx:L16`, `splash/page.tsx:L14`, `consumer-nav.tsx:L167-173`, `notifications/page.tsx:L194-195`, `home-pages.css:L100-104`, `session.tsx:L31`, `use-catalogue.ts:L239`, `browse/page.tsx:L54` | Comments that contradict the code. | Correct each (quoted in §11). |
| I-59 | P2 | `packages/ui/src/components/accordion.tsx:L81` (FAQs on `/service/[id]` and `/support`), `photo-grid.tsx:L52` (`/bookings/[id]/track`, `/quotes/[id]`), `star-rating.tsx:L142` | These shared components remove the outline on focus and ask for `ring-focus`, a ring colour the preset does not define. That class emits nothing, so keyboard focus shows Tailwind's default translucent blue ring instead of the brand focus style. Reading-based, not visually verified; see `APP-BOUNDARIES.md` B-11. `CONSUMER-OPEN-ITEMS.md` 7.18 records it as open. | Fix in `packages/ui` with `outline-focus`. This is a shared change, so follow `APP-BOUNDARIES.md` §10. |

(IDs are not continuous. The gaps are left for future items so existing references
do not move.)

---

## 13. Things that disagree with each other across screens

A customer can see every one of these. Each needs **one** source of truth.

| Topic | What different screens say |
|---|---|
| **Support phone** | `+91 90000 12345` (`SUPPORT_PHONE`: shared footer, `/support`) · `1800 XXX 4567` (`/`, `/home`) |
| **Support hours** | `9:00 AM - 9:00 PM` (`SUPPORT_HOURS`) · `7 AM to 11 PM` (`/` why-grid and FAQ intro, `/home` help strip) · `7 AM to 9 PM` (`/` FAQ answer) |
| **Support email** | `help@cityfamilycare.in` (shared footer) · `care@cityfamilycare.in` (`/`, `/home`) |
| **Where CFC operates** | 10 Tiruchirappalli localities (`AREA_OPTIONS`, area picker, address form city) · "Serving Tiruchirappalli and nearby areas" (shared footer) · Bengaluru default + 11 South Indian cities (`/`, `/home`). PLATFORM-FACTS: no city may be stated as scope. |
| **Warranty** | "30-day warranty on every job" (shared footer, hero, `WhyCfc`, auth assurances, cart, review, onboarding, `/`) · **15, 30 or 60 days per service** (service detail badge, from fixtures) · "No questions asked" (onboarding) |
| **Visit / call-out fee** | "No call-out fee" (`HomeHero`, `WhyCfc`) · "No visit charge" (`/` hero card and FAQ) · "Visit charge: Free" (`/home` cart) · "Visit charge … confirmed on the next step" (`/cart`) · ₹0/₹49/₹99 per service (fixtures, shown in checkout breakdown) |
| **Cancellation** | Free more than 2 hours ahead, fee inside 2 hours (`/` FAQ) · "Our team will contact you about anything you have already paid", with no policy stated on purpose (booking detail cancel dialog, citing CONSUMER-OPEN-ITEMS 1.1) · legal refunds page has headings only |
| **Pro verification** | "Aadhaar, police verification, in-person skill test" (`/`) · "identity and document checks" (`WhyCfc`) · "background-checked, trained… photo, ID" (onboarding) · "KYC cleared" (pro profile badge) |
| **Referral reward** | "Give ₹200, get ₹200" and code `AARTHI200` (`/home`) · amounts from the programme fixture, marked "Sample terms" (`/refer`) |
| **FIRST20** | Expires on a fixed date, 2026-12-31 (fixture) · "Valid for 30 days from today" (`/home`) |
| **Languages** | "5 languages, end to end" (`/` trust row) · English only, others "Soon" (`/settings`) |
| **Brand name** | "City Family Care" (shared chrome, auth, metadata) · "CityFamilyCare" + "CFC" (`/`, `/home`) · "CityFamilyCare Services Pvt Ltd" (home footers) |
| **Logo** | Shield + house SVG (`components/logo.tsx`) · house icon in a teal tile (`/`, `/home`) · a separate shield/house/check SVG (`/splash`) · lucide `Shield` icon in a teal square (`/onboarding`) · PNG files (manifest) |
| **Category names** | "Appliance repair", "Water purifier" (home pages) · "Appliance", "Water" (`/categories`, `/browse` strip) |
| **Price format** | `₹499.00` (cards, cart, checkout) · `₹499` (home pages) |
| **Teal / navy** | `#0fb3a6` (tokens, home CSS) · `rgba(0,184,196)` (4 inline glows) · navy `#0b2239` vs `rgba(14,31,61)`, `rgba(11,31,58)`, `rgba(23,26,60)` in inline scrims |
| **Status colours** | Amber for "clock/warning" in Pro and Admin · **blue** in the consumer (§9.1) |
| **Search** | `/search`: real, voice, recent, trending · `/`: hardcoded list, never navigates · `/home`: hardcoded list, adds fake items to a fake cart |

---

## 14. Safe to delete, and things that look unused but are not

### 14.1 Safe to delete (with proof)

| Path (under `frontend/apps/consumer/`) | Proof | Size |
|---|---|---|
| `src/components/quick-actions.tsx` | 0 references to `quick-actions` or `QuickActions` in `apps/` or `packages/` | 104 lines |
| `src/components/coming-soon.tsx` | 0 references except Pro's own unrelated copy at `apps/pro/src/components/coming-soon.tsx` | 37 lines |
| `public/images/promo-ac.png` | 0 references in `apps/consumer`, `packages` | 693 KB |
| `public/images/promo-cleaning.png` | Only a comment in `home-hero.tsx:L197` says it was removed | 698 KB |
| `public/images/promo-salon.png` | 0 references | 684 KB |
| `public/logo-white.png` | 0 references (Pro and Admin have their own copies in their own `public/`) | 81 KB |
| `public/logo-mark-white.png` | 0 references (same) | 28 KB |
| `tsconfig.tsbuildinfo`, `.turbo/`, `.next/` | Generated, git-ignored, rebuilt automatically | — |

Deleting these five public files saves about **2.2 MB**. Run `pnpm build` afterwards.

### 14.2 Looks unused, but is NOT — do not delete

| Path | Why it is needed |
|---|---|
| `public/mock/services/*.jpg` (all 16) | The mock catalogue **builds** each path from the service name (`packages/mocks/src/fixtures/catalog.ts:L334`). A text search finds only some of them. |
| `src/app/(home)/interactions.d.ts`, `(home)/home/interactions.d.ts` | The only type information TypeScript has for the `.js` files. Without them, the pages fail to type-check. |
| `next-env.d.ts` | Required by Next.js; regenerated. |
| `src/app/(auth)/layout.tsx`, `src/app/(home)/layout.tsx` | Passthroughs, but they define the route groups' chrome (and `(home)` loads its CSS). |
| `src/app/(app)/browse/page.tsx` | Unreachable today, but it is the only fully product-wired home screen. **Decide D-01 first.** |
| `src/app/(auth)/splash/page.tsx`, `onboarding/page.tsx` | Unreachable today, but they are inventory screens 1 and 2. **Decide D-05 first.** |
| `src/fonts/*.woff2` | Archivo is still the fallback font and the `font-sans` utility. |

---

## 15. How-to recipes

### 15.1 Add a new screen that has the normal header and footer

1. Create `src/app/(app)/your-route/page.tsx`. Start with `"use client"` if it uses
   hooks.
2. Fetch through `@cfc/mocks` api functions in a `useEffect`, and handle three states:
   `null` → `<Skeleton>`, error → `<ErrorState action={{ label: "Try again", onClick: load }}>`,
   empty → `<EmptyState>`. Follow `wallet/page.tsx` as a compact example.
3. If it shows personal data, wrap the default export in
   `<RequireAccount title="…" description="…">`.
4. If it reads `useSearchParams`, wrap the inner component in `<Suspense>` (otherwise
   `next build` fails).
5. Page container convention:
   `mx-auto max-w-screen-md px-4 pt-4 md:px-6 md:pb-12` (use `max-w-screen-xl` for
   wide grids).
6. Headings: `text-title font-bold text-ink` (screens); sections
   `text-heading font-semibold`.
7. Link to it from somewhere, or it is unreachable (see §5).
8. Only use classes that exist (§9.1, §9.5). No hex, no arbitrary values (§10).

### 15.2 Add a link to the shared navigation

- Account menu + phone tab bar: `NAV_ITEMS` in `components/consumer-nav.tsx:L59-64`.
  The tab bar is a 4-column grid (`grid-cols-4`, `L475`), so a fifth item needs
  `grid-cols-5`.
- Footer: `SERVICE_LINKS` / `ACCOUNT_LINKS` / `LEGAL_LINKS` in
  `components/consumer-footer.tsx:L34-52`.
- **These do not appear on `/` or `/home`**; edit those pages' own markup too.

### 15.3 Change a colour, radius or shadow for the consumer only

Edit `src/app/brand.css` inside the `html:root { }` block. **Never** edit
`packages/tokens/src/tokens.css` for a consumer-only change; Pro and Admin read it.
Then also update `src/app/(home)/home-pages.css:L50-77` if the two home pages should
match (I-40), and check the hardcoded inline colours in §9.4.

### 15.4 A Tailwind value you need does not exist

1. Prefer the nearest existing step.
2. If it is really needed, add a **named key** under `theme.extend` in
   `frontend/packages/config/tailwind-preset.js`. **This file is shared.** Adding a new
   key does not change Pro or Admin output (unused keys emit no CSS), but changing or
   removing an existing key does. Follow `APP-BOUNDARIES.md` §"Before you edit a
   shared file".
3. If you add an integer spacing step, also remove it from the dead-dimension regex in
   `packages/config/eslint-app.js:L114`, or lint will reject it.

### 15.5 Add or change a service, price or category shown to customers

Data lives in `frontend/packages/mocks/src/fixtures/seed.ts` (`SERVICE_CATALOG`,
`[category, subCategory, name, lowPaise, highPaise]`) and `fixtures/catalog.ts`
(variants, add-ons, inclusions, descriptions, pricing rules). **Admin reads the same
fixtures.** Also add:
- a photo at `public/mock/services/<slug>.jpg`, where the slug is the name lower-cased
  with runs of non-alphanumerics replaced by `-`;
- an entry in `TILE_META` + `TILE_ORDER` (`src/app/(home)/use-catalogue.ts`) for a new
  sub-category, or it gets the fallback house icon;
- an entry in `SUBCATEGORY_IMAGE` in **both** `browse/page.tsx` and
  `categories/page.tsx`;
- an icon in `components/category-strip.tsx` `ICONS`.

### 15.6 Edit copy on the two home pages safely

- Text is plain JSX in `(home)/page.tsx` / `(home)/home/page.tsx`. `&#8377;` is the
  rupee sign.
- Anything with an `id` is used by `interactions.js` (`$('id')`). **Do not rename or
  remove an element with an `id`**, or its behaviour silently stops. Search the matching
  `interactions.js` for the id first.
- `data-count` on a `<strong>` animates a count-up to that number. The rendered text
  must match the target.
- Classes `rv`, `rv-1…rv-6` fade elements in on scroll; an `rv` element that never gets
  `in` stays invisible (`use-catalogue.ts` handles late ones).
- Icons are `<svg className="ic"><use href="#i-name"></use></svg>`. The symbol must exist
  in that page's sprite at the top of the file.

### 15.7 Wire `/home`'s cart to the real cart (unfinished work)

1. In `(home)/home/page.tsx`, call `useCart()`; render the rail's Add/stepper as React
   (`add({ serviceId, serviceName, fromPricePaise, imageUrl })`, `setQuantity`).
2. Replace the drawer (`#cart`, `#cartBody`, `#cartFoot`) and floating bar (`#cartBar`)
   with JSX reading `lines`, `count`, `subtotalPaise`; checkout → `/cart` (or
   `/book/[firstServiceId]` when signed in).
3. In `(home)/home/interactions.js`, delete the cart block (`L111-256`), the
   `checkoutBtn` handler (`L258-268`), `renderRailButtons`, and the suggestion `pick` that
   calls `add` (`L374-380`); keep toast, menu, address (or move those to React too).
4. Remove `refresh` from `interactions.d.ts` and the `useEffect` that calls it, once
   nothing depends on it.
5. Test: add on `/home` → the header badge on `/categories` shows the same count → `/cart`
   lists it → refresh keeps it.

### 15.8 Confirm a change did not affect Pro or Admin

See `final/APP-BOUNDARIES.md` §"Proving nothing leaked". In short: build Pro and Admin
before and after, and compare the SHA-256 of their `.next/static/css/*.css` output.

### 15.9 Run the checks

From `frontend/`: `pnpm --filter @cfc/consumer typecheck`,
`pnpm --filter @cfc/consumer lint`, `pnpm --filter @cfc/consumer build`. Note: running
`next build` in `apps/consumer` **overwrites the `.next` folder a running `next dev` is
using**; stop the dev server first or it starts serving 500 errors.

---

## 16. Decisions only you or the client can make

| ID | Decision | Why it blocks work |
|---|---|---|
| D-01 | What `/`, `/home` and `/browse` are, and where a signed-in customer lands | Blocks I-02, I-04, I-09, manifest `start_url`, and whether `/browse` can be deleted. |
| D-02 | Every marketing claim on the home pages and onboarding (list in §11.3 and I-20) | Legal and trust risk; PLATFORM-FACTS forbids unsourced figures. |
| D-03 | Service area / cities to show publicly | Home pages say 11 cities, fixtures say Trichy localities, PLATFORM-FACTS says no city may be stated as scope. |
| D-04 | The Pro app's public URL | Needed for "Join as a professional" (I-08). |
| D-05 | Keep splash and onboarding? | Both unreachable; onboarding carries invented claims. |
| D-06 | Should "clock / warning" statuses be blue in the consumer? | `brand.css` turned them blue to use blue as a decorative tint. |
| D-07 | Legal documents | Customers can book with no terms, privacy or refund text. |
| D-08 | Real support phone, hours and email | Three different sets are shown (§13). |
| D-09 | Warranty and visit-charge policy | Copy and data disagree (§13). |
| D-10 | Price display format (`₹499` or `₹499.00`) | I-41. |
| D-11 | Whether to commit the uncommitted work, on which branch, and when to push | §2.2; deployment is tied to the `agency` remote. |

---

## 17. How this audit was done, and what it could not check

**Done by reading, on 2026-09-15:** every source file under `src/` (all 41 app files, 20
components, 4 lib files) in full; all config files; `home-pages.css` in full; the shared
`tailwind-preset.js`, `eslint-app.js`, `tokens.css`, `styles.css`, `tsconfig-base.json`;
the relevant mock api and fixture files; `PLATFORM-FACTS.md`.

**Done by command:** `git status`, `git diff -M HEAD`, `git log`, `git for-each-ref`,
`git ls-files`; import scans of every `@cfc/*` import; importer scan for every
component; inbound-link counts per route; reference scans for every `public/` file
(including mocks); SHA-256 of every image; storage-key scan; Tailwind version and
default `minHeight` scale from `node_modules/tailwindcss` 3.4.17.

**NOT VERIFIED:**
- **Visual rendering.** No browser was driven during this audit, and the dev server was
  not running for the final checks. Nothing here says how a screen *looks*.
- **Dead Tailwind classes, machine-checked.** The Tailwind CLI did not scan the source in
  this environment (§9.5). Classes were resolved by reading the preset instead; none
  used in real markup was found to be missing.
- **The GitHub remotes' real state and the Vercel connection** (§2.1).
- **Contrast ratios quoted in `brand.css` comments.**
- **Whether the `(home)` stylesheet remains loaded after client-side navigation**
  (described as expected Next.js behaviour in §4).
- **Legal accuracy** of any customer-facing text, including the legal entity name.
