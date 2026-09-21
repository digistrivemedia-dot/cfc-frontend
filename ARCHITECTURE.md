# CFC — Architecture

**Read this before changing anything.** It covers how the three apps fit
together, how styling is layered, the traps that fail silently, and what is
deliberately unfinished.

Written for a developer or an AI agent arriving cold. Every number here was
measured against the code.

---

## 1. What this is

An Indian home-services marketplace, built as **three separate web
applications** sharing one foundation.

```
cfc/
├── frontend/
│   ├── apps/
│   │   ├── consumer/     29 routes — the customer books a service
│   │   ├── pro/          33 routes — the professional does the job
│   │   └── admin/        13 routes — the back office
│   ├── packages/         shared by all three — see §2
│   └── pnpm-workspace.yaml
├── cfcplatform.pdf       the client's screen specification
├── SCREEN-INVENTORY.md   the screen contract derived from that PDF
├── PLATFORM-FACTS.md     the business rules — cited by 16 source files
└── ARCHITECTURE.md       this file
```

Each app deploys independently. They never import each other — they share only
**types** and **mock data**.

| App | Files | Lines | Avg lines/file |
|---|---|---|---|
| consumer | 61 | 18,867 | 309 |
| pro | 47 | 12,285 | 261 |
| admin | 24 | 16,649 | 693 |

---

## 2. The shared packages — and the rule that protects them

| Package | Holds |
|---|---|
| `packages/ui` | Every reusable component — Button, Badge, Card, Input, Sheet, EmptyState, Skeleton, Avatar, charts |
| `packages/mocks` | All fake data **and the fake API**. There is no backend; every screen reads from here |
| `packages/types` | The domain shapes — Booking, Service, Customer, Pro |
| `packages/config` | The Tailwind preset — see §4 |
| `packages/tokens` | Raw CSS colour and spacing variables |

> ### Never edit `frontend/packages/`
>
> All three apps import from here. A change made for one **silently changes the
> other two**, including apps you are not testing.
>
> If a shared package genuinely needs a new value, add a **named token** — never
> an arbitrary value — and prove it is additive: build the other two apps before
> and after, and confirm their CSS output is byte-identical. Scales inside
> `extend` add names without altering existing ones; scales outside it replace
> the defaults entirely.

---

## 3. How the styling is layered

### 3.1 The load order is deliberate

`apps/consumer/src/app/layout.tsx` loads three stylesheets in this order:

```tsx
import "@cfc/ui/styles.css";      // 1. shared — from packages/, do not edit
import "./brand.css";             // 2. the consumer's own colour values
import "../styles/patterns.css";  // 3. what Tailwind cannot express
```

**The order carries meaning:**

1. **`@cfc/ui/styles.css`** — the shared design system, used by all three apps.
2. **`brand.css`** loads *after* it, so the consumer's teal overrides the shared
   palette **for this app only**. Pro and Admin never import it and keep the
   shared colours. This is how the consumer is re-branded without touching
   `packages/`.
3. **`patterns.css`** loads last, so the tokens it references already exist.

`app/(home)/layout.tsx` then adds one more, for two pages only:

```tsx
import "./home-pages.css";
```

### 3.2 What each stylesheet is for

| File | Lines | Scope |
|---|---|---|
| `app/brand.css` | 248 | **Colour values only**, whole consumer app |
| `styles/patterns.css` | 334 | The 21 `(app)` screens — see §5 |
| `app/(home)/home-pages.css` | 792 | `(home)` only |
| `styles/home-page.css` | 686 | `(home)` only |
| `styles/chrome.css` | 310 | `(home)` only |
| `styles/foundation.css` | 189 | `(home)` only |
| `styles/primitives.css` | 44 | `(home)` only |

**`brand.css` is not where you write styling.** It redefines token *values*
("teal means `#02BABC` here"). Layout and appearance are written as Tailwind
classes in the component.

**The home-page stylesheets are fenced off.** They serve `/` and `/home` and
nothing else — `grep -rl "cfc-page" app/(app)/` returns zero files. That design
is client-approved; see §6.

### 3.3 Route groups

Next.js uses `(brackets)` to group routes **without adding to the URL**.
`app/(app)/cart/page.tsx` serves `/cart`, not `/app/cart`.

| Group | Screens | Note |
|---|---|---|
| `(home)` | `/` and `/home` | **Client-approved. Changes need sign-off.** |
| `(app)` | the 21 working screens | Header + footer from `layout.tsx` |
| `(auth)` | login, register, OTP, forgot | Centred card, no nav |

---

## 4. The closed Tailwind preset — the most expensive trap

`packages/config/tailwind-preset.js` defines a **fixed** set of allowed classes.
`colors`, `spacing`, `fontSize`, `borderRadius`, `boxShadow` and `screens` are
**replaced**, not extended.

> **A class that is not in the preset compiles to nothing.**
> No error. No warning. No red underline. The style simply does not apply, and
> the page looks subtly wrong with nothing to explain why.

Ordinary-looking classes that generate no CSS in this repo:

```
text-white   h-11      py-3.5    min-h-touch
rounded-lg   gap-1.5   px-1.5    size-7
border-1.5   w-24      z-dropdown
```

`text-white` is the instructive one: there is no `white` key, so a button label
written that way keeps whatever ink it inherited.

**Two habits that prevent this:**

- Copy a class from a neighbouring file rather than typing one from memory of
  standard Tailwind.
- After a styling change, confirm in the browser that it applied. A change that
  did nothing looks identical to a change you forgot to save.

Neither `pnpm typecheck` nor `pnpm lint` catches this.

**Also:** opacity modifiers do not work on colour tokens. They are authored as
hex, so `bg-action/90` generates nothing — add a dedicated token instead.

The preset defines a `coarse:` variant (`@media (pointer: coarse)`) for touch
targets. It is a **pointer** query, not a width one, so a narrow desktop window
keeps tight spacing and only a finger gets the 44px minimum.

---

## 5. Styling a screen

**Use Tailwind.** That is the answer for layout, spacing, colour and type on
every screen.

`src/styles/patterns.css` holds a small set of classes for things the closed
preset genuinely cannot express:

| Class | Why it exists |
|---|---|
| `.cfc-radio` / `.cfc-check` | Sibling-driven controls. The checked state comes from `input:checked + .cfc-radio`, and the tick is **drawn** with a rotated border in `::after` rather than set as a glyph — a font tick sits differently in every typeface. Tailwind has no utility for either. |
| `.cfc-badge`, `.cfc-chip`, `.cfc-eyebrow`, `.cfc-info`, `.cfc-row`, `.cfc-price`, `.cfc-card-pad` | Off-grid values — 11px type, 9px and 18px padding, 1.5px borders, 0.04em tracking. None has a token in the closed scale, and approximating them would shift every badge, price and row on screen. |

> **Do not add to `patterns.css`.** If a value you need does not exist in the
> preset, add a **named token** to `packages/config/tailwind-preset.js` and
> prove it is additive, per §2.

An example of that proof: `maxWidth.wrap: "1180px"` exists because the page
container must match the app bar exactly, and nothing sat between
`max-w-screen-lg` (1024px) and `max-w-screen-xl` (1280px). Pro and Admin were
built with and without it and their CSS came out byte-identical.

---

## 6. The rules

1. **Never edit `frontend/packages/`** without the proof described in §2.
2. **Verify every new class against the preset** — unknown classes silently do
   nothing.
3. **`app/(home)/` is client-approved** — changes there need sign-off.
4. **Do not add to `patterns.css`** — add a named token instead.
5. **Screens import from `@cfc/mocks`**, never fixtures directly.
6. **Mobile is the same flow as desktop**, not a different one.
7. **Never run `next build` while `next dev` is running.** Both write to
   `.next`; the dev server's stylesheets start returning 404.

---

## 7. Running it

```bash
cd frontend
pnpm install
pnpm dev
```

| App | Port |
|---|---|
| consumer | 3000 |
| pro | 3001 |
| admin | 3002 |

A single app: `pnpm dev:consumer`

### 7.1 If the editor feels slow

It is not the source — 19,000 lines opens instantly. It is `node_modules`:
**35,775 files**, which VS Code, the TypeScript server and (on Windows)
Defender all walk.

- Add the repo folder to Windows Defender exclusions
- Set `files.watcherExclude` and `search.exclude` for `**/node_modules/**` and
  `**/.next/**`

### 7.2 If routes return 500 or 404 for no reason

Almost always an **orphaned dev server** still holding the port while serving
from a `.next` folder that was deleted underneath it. Symptoms are confusing:
some routes 500 with `Cannot find module './vendor-chunks/…'`, or every route
404s while the server looks like it started.

The `EADDRINUSE` line that explains it sits at the **top** of the startup log,
far above the errors you are reading. Check there first.

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

Then delete `.next` and start again. `pkill -f "next dev"` does **not**
reliably kill it on Windows, which is how the orphan survives.

Webpack may also log `ENOENT … .pack.gz`. That is its compressed cache being
held or removed mid-write — on Windows, usually the antivirus. Noisy rather
than fatal; the Defender exclusion above stops it.

---

## 8. What is not built

### 8.1 There is no backend

Every screen reads from `@cfc/mocks`. The cart, the session and the selected
area persist in `localStorage` only. Signing in flips a boolean.

Four flags in `packages/mocks` gate content that is deliberately placeholder.
Each puts a visible notice on screen; setting it to `false` removes the notice
and turns the feature on:

| Flag | Gates |
|---|---|
| `REVIEWS_ARE_PLACEHOLDER` | Review copy is written in-house. Turning it off enables the "Verified" badges. |
| `REFERRAL_TERMS_ARE_PLACEHOLDER` | ₹100 per referral above ₹500 is a placeholder shape. No programme is documented. |
| `AI_ASSISTANT_IS_SHELL` | The assistant is a scripted keyword responder. No model, no endpoint. |
| `PENALTY_AMOUNTS_NOT_SET` | The Pro penalty schedule. No rupee figure is documented anywhere. |

### 8.2 Open questions for the client — none can be invented

**Each is a promise the business would then have to honour.** These are gaps in
what the client documented, not gaps in the build.

| Question | Where it bites |
|---|---|
| **What is the cancellation and refund policy?** How late can someone cancel, and what is refunded? | Service detail FAQs, Booking detail, My Bookings |
| **What happens if the professional does not arrive?** | Same FAQs, Live tracking |
| **Are the reviews real?** | Home, Service detail, Pro profile |
| **How far ahead can a customer book?** The calendar is capped at 30 days as a guess. | Slot selection |
| **Are 2-hour arrival windows right?** 08:00–20:00 in 2-hour blocks is assumed. | Slot selection |
| **What are the referral terms?** No reward, minimum spend or cap is documented. | Refer and earn |
| **Is there a customer deadline on a quotation?** The 15-minute window is an admin rule; no customer deadline is stated, so no countdown is shown. | Quotation flow |
| **The legal wording must come from the client's lawyer.** Terms, privacy and refund policy are binding; an invented refund clause commits the business to honouring it. | Legal |
| **The 3 Golden Rules and penalty amounts (Pro).** The agreement names neither the rules nor any figure. | Pro conduct |

### 8.3 Spec clauses that cannot be honoured literally on the web

Flagged rather than faked. **Do not "fix" these by inventing the data** — each
was reasoned through and an alternative shipped instead.

| Clause | Why not | What is there |
|---|---|---|
| "Sort by distance" | No geo data on services, no customer location. A made-up distance puts a false number in front of a buying decision. | Sort by rating, price, popularity |
| "OTP auto-read" | Android SMS Retriever API. WebOTP is Chrome-on-Android only. | `autocomplete="one-time-code"` so the keyboard offers it |
| "Voice search" | Web Speech API — never Firefox. | Mic renders only where the API exists |
| "Real-time map" | Maps SDK is out of frontend scope; no API key. | `MapView`, built to be swapped for the SDK |
| "PDF download" (invoice) | Generated server-side per the agreement. | Print-styled route + `window.print()` |
| "Razorpay integration" | Frontend only, no keys. | Method picker + a stand-in dialog |
| "Detect location" | Geolocation returns coordinates, not an address. | Sets the pin, says *"Please still type the address"* |
| "AI Chat Assistant" | No model, no endpoint, no budget stated. | A chat UI stating it *"cannot see your bookings or make changes"* |
| "Add money" (wallet) | No payment gateway. | Real amount presets; an alert says nothing will be charged |
| "Photo upload" (profile) | No file store. | Button present but disabled, with the reason |
| Native share | `navigator.share` is absent on most desktops. | Share renders only where supported; **Copy link** always offered |
| "Book this professional" | Auto-assign offers a job to the three nearest pros; first to accept wins. | The profile answers *"who is coming?"* |

**One flagged for the backend team:** the invoice tax breakdown is *recomputed*,
not stored — a completed booking carries only `totalPaise`. The real endpoint
must return the stored breakdown, or a future fee change would retroactively
alter old invoices.

### 8.4 Deferred by decision

| Item | Note |
|---|---|
| **Multi-language** (EN/TA/KN/HI/TE) | Another team's scope. Copy is kept as JSX text so extraction is mechanical later. The switcher lists all five with English selected and the rest marked *Soon*. |
| **Dark mode** | The toggle is wired and persists, but `tokens.css` has **no dark block**, so `data-theme="dark"` changes nothing yet. Adding it is a values-only edit — but it affects **admin too**, so it is a shared decision. |
| **PWA service worker** | Manifest exists; the offline shell comes later. |
| **Splash + onboarding** | Client confirmed: not needed on web. |

### 8.5 Known technical debt

- **No automated tests and no CI.** Nothing catches a regression before it
  reaches main. Given §4 — styling that fails silently — this is the highest
  gap in the repo.
- Nine consumer files exceed 600 lines; `book/[id]/page.tsx` is 1,166.
- Three admin files exceed 1,400 lines; `pros/page.tsx` is 2,468.
- `(auth)/otp/page.tsx` hand-rolls a 6-digit input. Pro needs an `OtpDisplay`
  too; the two should become siblings in `@cfc/ui`.
- `ServiceCard` uses a raw `<img>` **deliberately** — it lives in `@cfc/ui`,
  which must not depend on `next/image`.

---

## 9. Where the screen numbers come from

Code comments cite screens by number — *"Customer 12"*, *"Pro 35"*,
*"Admin 4"*. Those come from **`SCREEN-INVENTORY.md`**, derived from
**`cfcplatform.pdf`** (the client's specification, committed at the repo root).

**`PLATFORM-FACTS.md`** holds the business rules the code depends on — warranty
period, fee structure, what is documented versus assumed. **16 source files
cite it.** When a screen needs a number the client has not given, it goes into
that document as an open question rather than into the code as a guess.
