# CFC — Backend execution plan

> Written 2026-10-24. Revised the same day after reading all nine planning
> documents in full (first draft had read only two).
>
> Sources: `PLATFORM-FACTS.md`, `SCREEN-INVENTORY.md`,
> `CONSUMER-OPEN-ITEMS.md`, `PRO-OPEN-ITEMS.md`, `ADMIN-PENDING.md`,
> `ADMIN-SUMMARY.md`, `CFC-FINAL-BUILD-TRACKER.md`,
> `CONSUMER-WEB-TRANSFORMATION-PLAN.md`, `final/APP-BOUNDARIES.md`,
> `final/CONSUMER.md`, `final/DECISIONS-PENDING-CLIENT.md`.
>
> Every rule cited is from the agreement. Every endpoint listed is one the
> frontend already calls, or one a built screen needs and does not have.
>
> **Revised 2026-10-27** — client set the execution order and four build
> decisions. See §0. The analysis in §1–§7 stands unchanged; §8 was reordered
> from layered phases into a vertical slice.

---

## 0. Execution decisions — 2026-10-27

Set by the client. These override the ordering in §8 of the 2026-10-24 draft.

### 0.1 Only authentication is temporary

Everything else is built to production standard from the start. The client's
words: *"only the login will be temporary … other all things like admin upload
real services means the service and pricing module will be fully functional,
and same like customer also should be fully functional means customers should
be able to book services, and same with the pro."*

Consequence that shapes every phase below: **there is no demo dataset.** The
admin creates the real catalogue through the real admin UI, and that is the
acceptance test for *"nothing is hardcoded"*. The fixtures in
`packages/mocks/src/fixtures/` are kept as an **opt-in** script
(`pnpm seed:demo`) for load-testing and for exercising screens that need
history before history exists. It never runs by default, and it is not the
product's content.

This reverses the 2026-10-24 draft's *"seed the database from fixtures"*
decision (§3). The reasoning there — a consistent cross-referenced dataset the
client has reviewed — still holds for **testing**; it does not hold for the
delivered system.

### 0.2 Authentication — the dummy that behaves like production

The requirement: *"until I get DLT I can use this login to fully test as
production."* So the **delivery** of the OTP is dummied; the **flow** is not.

| Surface | Temporary mechanism | What is real from day one |
|---|---|---|
| Admin | Email + password checked against `.env` | JWT issue/refresh, RBAC enforced server-side, audit log |
| Customer | OTP generated, stored, verified — master code `123456` accepted while `AUTH_DUMMY_OTP=true` | Hash at rest, expiry, attempt cap, resend lock, per-phone and per-IP rate limit, real user record, real token |
| Pro | Same as customer | Same as customer |

The OTP is **never returned in an API response and never logged at** `info`**.**
That is P0 blocker B1 (§6), and a dummy that leaks the code is the blocker, not
a workaround for it. The master code is the only concession, and it is one
boolean away from gone.

**Deferred:** MSG91 + DLT templates (blocked on the client's registration),
admin 2FA, admin password reset. The 2FA toggle stays visibly unimplemented
rather than shipping the lie §2.2 describes.

### 0.3 Payments — cash and wallet real, Razorpay inert

Client: *"cash, razorpay and wallet — only cash and wallet will be fully
functional as production, and only Razorpay will be without API key."*

- **Cash** — full path, confirmed by the pro at completion.
- **Wallet** — full path. Balance **derived from an append-only ledger**, never
a stored counter (§Phase 4 of the original draft). Top-up has no gateway, so
until Razorpay lands the only credits are admin adjustments, referral rewards
and refunds.
- **Razorpay** — the UPI/card option renders **disabled with its reason**, and
the endpoint returns a configuration error rather than a fake success.

**No fake gateway.** A stub mimicking Razorpay's order/verify shapes is
throwaway code that would auto-succeed, which is exactly how an untested
signature check reaches production. Signature verification, webhook
reconciliation and idempotency get written when there are keys to test them
against — they are the whole substance of Phase 4 and cannot be written blind.

### 0.4 Images — local `uploads/`, not object storage

Client is deploying to a VPS. Express serves `/uploads` statically; Mongo
stores the **relative path** (`/uploads/services/abc.jpg`), never an absolute
URL, so the host can change without a migration.

Each Next app gets a `/uploads/:path*` rewrite to the API in `next.config.js`
— three lines per app, and **zero component changes**, because the apps use
plain `<img>` with relative `src` almost everywhere already (only
`consumer/(home)/page.tsx` uses `next/image`, on static local assets).

KYC documents are the exception: they go **outside** the statically served
directory and are read back through an authenticated route only. An Aadhaar on
a guessable public URL is a data-protection incident (original Phase 9).

`ponytail:` *local disk, single VPS. Move to object storage when there is a
second app server or a CDN requirement — not before.*

### 0.5 Where the backend lives — `cfc-backend/`, with linked types

A **separate project**, beside the frontend rather than inside it:

```
cfcapp/
  cfc-frontend/     3 Next apps, the shared packages
  cfc-backend/      Node + Express + Mongo — own package.json, own deploy
```

This revises the 2026-10-24 draft's *"*`apps/server` ***in this monorepo**"*
(the old Phase 0). That decision was made for one reason — sharing `@cfc/types`, since
*"a separate repo with copied types is how the contract drifts"* — and the
reason is sound. It is kept without the monorepo:

```json
"@cfc/types": "link:../cfc-frontend/frontend/packages/types"
```

One symlink. Both sides compile against the same definitions, nothing is
copied, and editing a type in the frontend changes the backend's typecheck
immediately. The backend still deploys on its own, which is what the VPS wants.

Two things this costs, both accepted:

- The backend's `tsconfig.json` **mirrors** the frontend's base config instead
of extending it, because `@cfc/config` depends on tailwind and a server has
no business installing it. The strictness flags must stay in step —
`@cfc/types` is type-checked in both projects, and under different settings
the same file passes in one and fails in the other.
- The backend declares **no** `"type": "module"`. `@cfc/types` declares no
module type, so tsx compiles it as CJS; going ESM puts a dual-module boundary
between them and `export * from` chains stop static-linking across it —
`ApiError` resolves as `undefined` with a misleading error. Noted in
`cfc-backend/package.json` and its README, because it will look like an
arbitrary omission to the next person.

### 0.6 Database — MongoDB Atlas

Connection string supplied by the client, held in a **gitignored** `.env`.

⚠️ It was transmitted in chat and carries a guessable password on an
admin-level user. **Rotate before production**, and create a least-privilege
application user scoped to the `cfc` database rather than reusing the cluster
admin.

### 0.7 The ordering — a vertical slice, not layered phases

The client's required demo path, in their words: *admin login → add service
categories → pro management so admin can accept a pro → customer sees those
services and books → pro gets assigned and proceeds through the pro flow
including quotation.*

That is one thread through the whole system, so §8 is reordered to follow it.
The original twelve phases were ordered by **dependency layer** (all auth, then
all catalogue, then all payments); they are now ordered by **demo thread**,
which moves pro onboarding and KYC from Phase 9 to Phase 4 and splits
consumer/pro auth away from admin auth.

Nothing in §4 (contract fixes), §6 (P0 blockers) or §7 (client blockers)
changes. The dependency facts that made the original order correct still hold
inside each phase — they are just visited in a different sequence.

### 0.8 Admin writes need frontend work — verified, not assumed

§2.1 says the admin app is read-only. What that understates: **the write UI is
already built, and its save handlers go nowhere.** Confirmed in code on
2026-10-27:

| Location | What it does today |
|---|---|
| `admin/(app)/services/page.tsx:415` | `save()` fabricates `id: cat_${Date.now()}`, calls local `setRows`. No API, no mock function. |
| `admin/(app)/services/page.tsx:203` | Active toggle is `setRows(map)`. Reload reverts it. |
| `admin/(app)/services/page.tsx:199` | Drag-reorder commits with a toast and nothing else. |
| `admin/(app)/pros/page.tsx:589` | `decide()` — KYC approve/reject is `setPending(filter)` + a toast. |
| `admin/(app)/quotations/page.tsx:159` | `decide()` — comment reads *"setState + toast. No API call."* |

So every admin write is a **three-part change**: endpoint, new function in
`@cfc/mocks` (none of these exist), and wiring the existing handler to call it.
The third part edits screen files.

This does **not** violate non-negotiable #1 in §9 (*"never change a screen file
to accommodate the backend"*). That rule protects a working screen from being
reshaped to fit a badly-shaped endpoint. These handlers were never finished —
wiring them completes the screen rather than accommodating the server. The
diffs are mechanical: make `save` async, call the function, re-`load()`.

Budget it honestly: ~10 admin files, and it is the difference between "the
endpoint exists" and "the admin can add a category."

---

## 1. What exists

| App | Port | `page.tsx` | Screens in agreement | Built |
|---|---|---|---|---|
| `@cfc/consumer` | 3000 | 28 | 44 | 44 (42 on the design system + 2 approved home pages) |
| `@cfc/pro` | 3001 | 33 | 35 | 35 |
| `@cfc/admin` | 3002 | 13 | 49 | 49 (via tabs) |

Shared: `@cfc/types` (1,781 lines — the contract), `@cfc/mocks` (~130
functions), `@cfc/ui`, `@cfc/tokens`, `@cfc/config`.

### The boundary is clean — verified, not assumed

```
screens ──▶ @cfc/mocks (≈130 functions) ──▶ fixtures
```

Measured on 2026-10-24 across `.ts`, `.tsx` **and** `.js` in all three apps:

- **0** `fetch(` / `XMLHttpRequest` / `axios` occurrences
- **0** direct fixture imports from any app (ESLint forbids it —
`eslint-app.js:L39-43`)
- 78 files import from `@cfc/mocks`; every function is `async`, returns a
`@cfc/types` type, and throws `ApiError(status, message, code)`

So the backend job is **replace each function body in**
`packages/mocks/src/api/*.ts` **with an HTTP call.** `packages/mocks/src/index.ts`
states this intent and it holds today:

> *"Swapping to the real backend replaces the body of each function and nothing
> else — if a change to the real API would require touching a screen file, the
> boundary is in the wrong place."*

**Keep the package name and every signature.** Renaming `@cfc/mocks` to
`@cfc/api` is 78 files of import churn for nothing.

**One caveat.** `apps/consumer/src/app/(home)/interactions.js` (462 lines) and
`(home)/home/interactions.js` (352 lines) are vanilla-JS IIFEs with **zero
imports** — outside the mock boundary entirely. They drive the two
client-approved home pages. The prototype cart that used to live there is
**gone** (React's `CartProvider` owns it now, per the comment at
`home/interactions.js:L121-128` and commit `6cd5ca6`), so
`final/CONSUMER.md` §7.2 and I-09 are **stale**. What remains in those files is
search/UI behaviour, and `final/CONSUMER.md` I-03 still stands: the `/` search
box never navigates and its suggestions are a hardcoded list of services that
do not exist.

### Business logic already written and correct — port it, do not re-derive it

| File | Rule implemented |
|---|---|
| `booking-draft.ts` → `priceBooking` | GST on **platform fee only**; discount before fees; add-ons once per booking, not per unit; quantity multiplies only the work, never the visit charge or platform fee; discount capped at the work |
| `pro-earnings.ts` → `commissionFor`, `settleJob` | 15% commission; **first 20 jobs at 0%**; net by subtraction so gross/fee/net always reconcile; rounded **down** |
| `pro-work.ts` → `submitQuotation`, `completeJob` | min 2 before-photos; ₹5,000 phone-confirm; 15-min admin window; OTP checked first; GPS 100 m gate that **does not block on no-fix** |
| `pro-offers.ts` | 3 nearest notified; 30 s window; first-to-accept wins; offer withholds address, phone **and** coordinates |
| `permission.ts` | All 7 roles; two layers (`canOpen` section / `can` permission); per-person grants narrow but never widen |
| `pro-onboarding.ts` | `isValidIfsc`, `isValidAccountNumber`, `isValidUpi` — verified against 17 cases |

`PRO-OPEN-ITEMS.md` §5 records the earnings engine as independently verified:
job 20 free / job 21 charged, 15% exact across four job values, 71,429 gross
values all reconciling with the fee never exceeding gross. **Do not rewrite
this from the PDF.**

### Mandated stack (`PLATFORM-FACTS.md`)

Node.js + Express + MongoDB · Firebase Auth + JWT · RBAC 7 roles · Razorpay ·
Google Maps SDK · FCM push · MSG91 SMS (DLT compliant) · WhatsApp via a
client-managed BSP.

### Clause 4.8 — a hard contractual performance requirement

> *"API should handle 10,000 concurrent users, MongoDB indexing for search, and
> daily auto-backup restoration test needed"*

This is a deliverable, not an aspiration. It sets three obligations: a load
test at 10k concurrency, explicit search indexing, and a **daily automated
restore test** — not just a daily backup.

---

## 2. What is missing

### 2.1 The admin app is 100% read-only

37 imports from `@cfc/mocks`, **every one a** `get`*. Confirmed in code —
`apps/admin/src/app/(app)/quotations/page.tsx:159`:

```js
const decide = (q, outcome) => { /* setState + toast. No API call. */ };
```

These have **no mock function and no contract**. The backend defines them, and
the mock layer needs the function added too:

**Quotations** `approveQuotation` · `editAndApproveQuotation` · `rejectQuotation`
**Pros** `approveProKyc` · `rejectProKyc` · `approveDocument` (per document
type, Admin 14) · `requestMoreDocuments` · `blockPro` · `unblockPro` ·
`issueWarning` · `applyPenalty` · `adjustProWallet` (manual, Admin 16)
**Customers** `blockCustomer` · `unblockCustomer` (Admin 21)
**Money** `approvePayout` (individual **and batch**, Admin 18) · `rejectPayout` ·
`issueRefund`
**Bookings** `overrideBookingStatus` · `assignProManually`
**Catalog** category / sub-category / service / variant CRUD ·
`reorderCategories` (Admin 22 drag-to-reorder) · `updatePricingRule` ·
`updateCommissionRule`
**Promotions** coupon CRUD · banner CRUD **with scheduling** (Admin 37)
**Support** `replyToTicket` (admin side) · `setTicketPriority` ·
`assignTicketToAgent` · `closeTicket`
**Comms** `sendBroadcast` (with **segment targeting**, Admin 45) ·
`updateAlertTemplates` (Admin 46)
**Settings** `updatePlatformSettings` (app configs, **maintenance mode**,
**feature flags**, auto-assign radius, **geofencing** — Admin 47) ·
`createSubAdmin` / `updateSubAdmin` / `revokeSubAdmin`

### 2.2 Admin features that are built as UI but have nothing behind them

From `ADMIN-SUMMARY.md` ("Things that were fake"). These need backend **and**
frontend work — the UI is a shell:

| Screen | What is fake |
|---|---|
| 1, 48 | **2FA is a switch claiming to be on.** No QR, no secret, no verification. "A toggle is not setup." |
| 44 | **Every ticket has exactly one message.** A thread view that cannot show a thread. |
| 45 | **"Specific segment" reveals nothing to pick.** |
| 46 | **Alert templates** — "configure" is two on/off switches that configure nothing |
| 47 | **App configs** — Screen 47's first requirement, not built |

### 2.3 No integrations

Razorpay, FCM, MSG91, WhatsApp BSP, Google Maps, object storage — none wired.
`checkout-steps.tsx:868` says so: *"Razorpay is a backend integration and there
are no keys here."*

### 2.4 No real-time channel

`offer-listener.tsx` polls `nextOffer`. **Live map (Admin 9) + manual
assignment (Admin 10) is the largest single gap** — the one screen that never
got the design rebuild (`ADMIN-PENDING.md` §1, `ADMIN-SUMMARY.md` §1).

### 2.5 No persistence, and no real session

`createBooking` generates a reference and stores nothing. `uploadDocument`
accepts and discards. `getConsumerProfile` is module state that resets on
reload.

Worse — `final/CONSUMER.md` §7.1: **"Signed in" is only a flag.** There is no
token, no user id, no expiry. `signIn()` sets
`localStorage["cfc.consumer.signedIn"] = "true"`, and `getConsumerProfile()`
returns the same fixture customer regardless of who signed in.

### 2.6 Domain concepts in the agreement with no model behind them

Each is named in `SCREEN-INVENTORY.md` and absent or incomplete in the data:

| Concept | Where named | State |
|---|---|---|
| **Warranty** | Customer 2, 12; Admin 27 | `warrantyDays` exists on the type but is a **flat 30 for every service** in the fixture. Admin has no editor. `final/CONSUMER.md` §13 claims 15/30/60 per service — that is **stale**. |
| **Add-ons** | Customer 14 | `priceBooking` takes `addOnsPaise` and `createBooking` takes `addOnIds`, but **Admin 27 has no way to create an add-on** (`CONSUMER-OPEN-ITEMS.md` 7.15). Either Admin 27 gains an editor or the clause is dropped. |
| **Night surcharge** | Admin 28 | Not in `PricingRule` |
| **City-wise price override** | Admin 28 | Not modelled |
| **Commission per pro** | Admin 29 | Flat 15% for everyone |
| **Reschedule** | Customer 26 | Button links to `/book/[id]?reschedule=1`; the flag is never read and a booking id hits a route expecting a service id → **error screen** (I-06) |
| **No-show count** | Admin 20, 40 | Not tracked |
| **Pro multi-area** | Pro 5, 27 | `ProListItem.area` is **one string**; the form collects several and discards all but the first. `PRO-OPEN-ITEMS.md` 1.5 asks the backend for `areas: string[]` and confirmation that dispatch matches **all** of them |
| **Ticket threads / priority / assign** | Admin 43, 44 | One message per ticket; no priority, no agent |
| **Account deactivation** | Pro 33 | Built as a request with the active-job count shown, not an instant switch |
| **Add to Calendar** | Customer 21 | Planned as `.ics` + Google Calendar URL |
| **2FA** | Admin 1, 48 | Fake toggle (§2.2) |

---

## 3. Architecture decisions

**One Express service, one MongoDB.** Three route groups
(`/api/consumer`, `/api/pro`, `/api/admin`) behind one RBAC middleware. 7 roles
and ~50 services is not a microservices problem.

**No Redis, with a named trigger.** The only structural lock is
first-to-accept-wins, and Mongo is atomic enough:

```js
// second pro gets null and sees "taken by another professional"
await Jobs.findOneAndUpdate(
  { _id: jobId, status: "offered", assignedPro: null },
  { $set: { status: "on_the_way", assignedPro: proId } },
  { returnDocument: "after" }
);
```

`ponytail:` *single Mongo, no cache tier. Clause 4.8 requires a 10k-concurrency
load test (Phase 9) — add Redis for session/dispatch/read-through caching only
if that test fails, and let the test name the hot path rather than guessing it
now.*

**No WebSockets.** The frontend already polls and FCM covers the push the
agreement names. The live map is the one place to reconsider, and even there a
5-second poll of `/api/admin/map/active` is the lazy version that works.

**Plain REST, no GraphQL/tRPC.** ~130 named functions with fixed shapes already
exist. One route per function, same name, same arguments.

**Seed the database from** `packages/mocks/src/fixtures/`**.** A consistent, seeded,
cross-referenced dataset the client has already reviewed — 50+ services, pros,
bookings, quotations, coupons, 66 reviews across 16 services. Free demo
environment. Do not rebuild it by hand.

**OTP: MSG91 + own JWT; Firebase for FCM only.** The spec names both "Firebase
Auth" and "MSG91 SMS (DLT compliant)" and they overlap — Firebase Phone Auth
sends its own SMS and would bypass the client's DLT-registered templates, which
India requires. → *client confirmation, §7.*

**Money is server-authoritative.** `priceBooking` stays client-side for display;
the server recomputes and the server's number wins. A client-sent total is
never trusted.

**The backend owns platform copy and config.** See §5 — this is the fix for 17
cross-screen contradictions, and it is a backend job, not a content edit.

---

## 4. Contract changes needed before building

Fix the type, then the frontend, then build against it.

### 4.1 Bookings do not store their price breakdown — and the tax invoice is worse than that

`ConsumerBooking` carries only `totalPaise`. Two consequences:

1. The invoice recomputes from *current* admin-editable pricing. Edit a

   platform fee and **every historical tax invoice silently changes.**
2. `final/CONSUMER.md` **I-07**: `bookings/[id]/invoice/page.tsx:246` computes

   the fee split for `svc_01`**, hardcoded** — so the tax invoice is wrong for
    every booking of any other service, today.

`CONSUMER-OPEN-ITEMS.md` 2.18 already flagged (1) for the backend team:
*"The real endpoint must return the stored breakdown — otherwise a fee change
would retroactively alter old invoices."*

**Fix:** add `breakdown: PriceBreakdown` to `ConsumerBooking`, frozen at
booking time; invoice reads it. *Phase 3.* These are tax documents.

### 4.2 `proPosition` is canvas percentages, not coordinates

```ts
proPosition: { x: number; y: number } | null;  // for MapView
```

Real tracking needs `GeoPoint`. *Phase 6.*

### 4.3 `acceptQuotation` has no payment step

Returns `Promise<void>`, but the agreement requires a **50% advance on accept**.
Must return a Razorpay order. *Phase 7.*

### 4.4 Pro record holds one area; dispatch needs many

`PRO-OPEN-ITEMS.md` 1.5. Add `areas: string[]`, and dispatch matches against
all of them. *Phase 5/9.*

### 4.5 `CartLine` has no `variantId`

`final/CONSUMER.md` I-16: adding from a service page after choosing "2 ton
window" adds the **base** price; the variant is chosen again in `/book`. The
cart price is advisory (*"The real total is priced at checkout"*) which is the
right design — but the chosen variant should not be silently dropped.
*Phase 3.*

---

## 5. One source of truth — a backend job

`final/CONSUMER.md` §13 lists **17 facts that different screens state
differently**, and a customer can see every one. These are not copy bugs to fix
once; they recur because there is no single source. Each becomes a backend
config value read by every screen:

| Fact                 | Conflicting values today                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Support phone        | `+91 90000 12345` (`SUPPORT_PHONE`) vs `1800 XXX 4567` (home pages)                                                              |
| Support hours        | `9 AM–9 PM` vs `7 AM–11 PM` vs `7 AM–9 PM`                                                                                       |
| Support email        | `help@` vs `care@cityfamilycare.in`                                                                                              |
| Warranty             | "30-day" everywhere vs per-service `warrantyDays`                                                                                |
| Visit / call-out fee | "No call-out fee" / "No visit charge" / "Free" vs ₹0 / ₹49 / ₹99 per service in the fixtures                                     |
| Where CFC operates   | 10 Trichy localities vs "Trichy and nearby" vs Bengaluru + 11 cities. `PLATFORM-FACTS.md` **forbids stating any city as scope.** |
| Cancellation         | "Free >2h ahead, fee inside 2h" vs "no policy stated, on purpose" vs legal page with headings only                               |
| Referral reward      | "Give ₹200, get ₹200" + code `AARTHI200` vs the programme fixture's ₹100/₹500                                                    |
| `FIRST20` expiry     | fixed 2026-12-31 vs "valid 30 days from today"                                                                                   |
| Languages            | "5 languages, end to end" vs English only, rest "Soon"                                                                           |
| Brand name           | "City Family Care" vs "CityFamilyCare" vs "CityFamilyCare Services Pvt Ltd"                                                      |
| Pro verification     | "Aadhaar, police verification, in-person skill test" vs "identity and document checks" vs "KYC cleared"                          |
| Price format         | `₹499.00` vs `₹499`                                                                                                              |

Build a `PlatformConfig` collection in **Phase 3**, admin-editable in Admin 47,
and have every screen read it. The alternative is fixing these 17 twice.

⚠️ Several of these values are **not yet decided by the client** (§7). The
config mechanism can be built now; the values land when answered.

---

## 6. P0 launch blockers — must not ship

Flagged in the docs as P0. None is optional.

| #   | Item                                                                                                                                                                                                                                                                                                 | Source                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| B1  | **The OTP is fake and permissive.** `otp/page.tsx` auto-fills `123456`; `auth-dialog.tsx` **prints the code on screen**; `consumer-auth.ts` accepts **any phone with any 6-digit code**. Marked *"Never ship."*                                                                                      | I-12                                     |
| B2  | **Dev console helpers reach the window.** `__cfc.setScenario()`, `__cfcSession.signIn()`, `__cfcActor("super_admin")`. Guarded on `NODE_ENV === "development"` today — verify that holds in the production bundle for all three apps, then delete.                                                   | `control.ts`, `session.tsx`, `actor.tsx` |
| B3  | **No legal text exists** — Terms, Privacy and Refund are headings only. Client's lawyer supplies it. Writing plausible legal text would be the most dangerous invention in the build: it is binding.                                                                                                 | I-24, 1.9                                |
| B4  | **Unsourced promises on the two home pages.** ₹699 strike price, "no visit charge", insurance ₹10,000, ₹100-off lateness, "Aadhaar/police/skill test", "CFC Care ₹2,499", "11 cities", **"100 metre GPS check on arrival" (wrong — the check is on completion)**, "5 languages, end to end" (false). | I-01                                     |
| B5  | **Onboarding invents claims**: "20+ more categories", "under 60 seconds", "No questions asked", wrong prices, "No credit card required".                                                                                                                                                             | I-20                                     |
| B6  | **Fabricated testimonials** — six named people in named neighbourhoods, for a platform that has not launched.                                                                                                                                                                                        | `DECISIONS-PENDING-CLIENT.md` §3         |
| B7  | **A competitor's advert shipped in** `/public`**.** `promo-cleaning.png` carried another company's branding and was replaced; `promo-salon.png` **and** `promo-ac.png` **carry the same problem and are still on disk, unused.** Delete them.                                                        | I-17, 7.14                               |
| B8  | `pnpm lint` **fails at the repo root** — 13 pre-existing errors in 3 consumer files. All the silent-no-CSS kind, so real visual bugs.                                                                                                                                                                | `ADMIN-PENDING.md` §4                    |

B1 and B2 are mine (Phase 2). B3–B7 are the client's and need chasing now.
B8 is a frontend fix that blocks CI (Phase 1).

---

## 7. Blockers — client answers needed

### 7.1 Credentials — get these first

| Item | Blocks |
|---|---|
| Razorpay account + keys (test and live) | Phase 4 |
| MSG91 account + **DLT-registered templates** | Phase 1 |
| Firebase project (FCM) | Phase 5 |
| Google Maps API key, billing enabled | Phase 2 |
| WhatsApp BSP credentials (client-managed) | Phase 9 |
| Object storage — not used, see §0.4 | — |
| `cfcservice.in` DNS | Phase 9 |
| GSTIN, registered address, invoice branding | Phase 4 |
| Real support phone, hours, email | Phase 2 (§5) |

**DLT template registration takes days to weeks in India. Start it on day one**
or Phase 1 stalls on paperwork.

### 7.2 Figures and rules the agreement does not state

| Question | Current state | Blocks |
|---|---|---|
| Payout minimum threshold | `PAYOUT_MINIMUM_PAISE = 0`; no line shown | 8 |
| The 3 Golden Rules — exact wording | Derived from enforced mechanisms | 9 |
| Penalty schedule (offences → rupees) | `PENALTY_AMOUNTS_NOT_SET = true` | 9 |
| **What "first 20 jobs" counts** — ever, or within a window? | First-20-ever (the plain reading). *It is money.* | 8 |
| Partner negotiated commission — and **who absorbs the difference** | Flat 15% for everyone | 8 |
| Referral reward figures | Placeholder ₹100 / min ₹500 | 10 |
| **Cancellation policy and fee** | No policy exists anywhere | 3 |
| What happens if the pro does not arrive | Not stated | 3, 6 |
| Auto-block minimum review count | 2.5 threshold given; sample size not | 10 |
| **GPS 100 m tolerance** — browser GPS is less accurate than native | 100 m exact | 6 |
| How far ahead can a customer book | 30 days, a guess | 2 |
| Are 2-hour arrival windows right | 08:00–20:00 in 2-hour blocks, assumed | 2 |
| Customer-side deadline on a quotation | None shown (15 min is an *admin* rule) | 7 |
| Session length / token expiry | Config only; **never stated on a screen** | 1 |
| Firebase Auth **or** MSG91 for OTP | Both named; they overlap | 1 |
| Multi-pro assignment | One assignee, as written | 5, 6, 8 |
| Pro self-deactivation, or admin request? | Built as a request | 9 |
| **Add-ons: build the Admin 27 editor, or drop the clause?** | Customer side priced; admin side impossible | 2, 3 |
| Are the reviews real? | `REVIEWS_ARE_PLACEHOLDER = true`, labelled on screen | 10 |
| `?role=pro` destination for Join-as-Pro | Sends pros into customer sign-up; `role` never read | 9 |
| "Send back" vs "Reject" wording | Screens say *Send back*; spec says *Reject* | 7 |
| Invoice PDF — confirm it is wanted | Parked; print route works today | 4/12 |
| Dark mode — confirm, affects **all three apps** | Toggle wired, no dark token block exists | 12 |
| Transaction history scope — refunds and non-wallet too? | Parked | 4 |
| Support ticket thread, or FAQ + helpline only? | Parked; admin threads are fake (§2.2) | 10 |
| PWA install / offline behaviour — never specified | Manifest only; no service worker | 12 |

### 7.3 Scope boundary — do not assume this is ours

**Multi-language (clause 4.6) is explicitly another team's.**
`CONSUMER-WEB-TRANSFORMATION-PLAN.md` §2A lists it under *"Explicitly OUT of
scope for this work — handled by another team. We build nothing for it."*
`CONSUMER-OPEN-ITEMS.md` 3.1 and the Phase 9 parking lot (P1) agree.

But server-generated strings — SMS, push notifications, invoices, email — need
the same five bundles, and no other team can own those. **Confirm who owns
server-side i18n**, and whether the admin panel is in scope at all (clause 4.6
names customer screens only).

`PRO-OPEN-ITEMS.md` §3 adds a point worth putting to the client: *"a pro
workforce in Tiruchirappalli is more likely to need Tamil than the customers
are, so the clause may have this backwards."*

### 7.4 Content

| Item | State |
|---|---|
| Service photography | Placeholder. 15 images, **one model, one polo shirt, one apartment**; five services share two photos. Of six inspected, five show Western models in Western homes. |
| Testimonials | **Fabricated** (B6) |
| Legal wording | Placeholder (B3) |

### 7.5 One accessibility decision already taken — re-raise it

`DECISIONS-PENDING-CLIENT.md` §1 and `final/CONSUMER.md` §10: teal ships as the
client's exact Figma colour. **White text on** `#00b8c4` **measures 2.43:1**; WCAG
needs 3.0:1 for large bold and 4.5:1 for body. Teal body text on white is about
2:1.

A deliberate trade after two rejections on vibrancy. **The cheapest fix is the
label, not the teal**: `--color-on-action: #0e1f3d` takes the identical
background to 6.75:1, one line, Figma colour untouched. This is the specific
thing app-store accessibility reviews and public-sector procurement checks
flag — cheap now, expensive after launch.

---

## 8. Execution order — the demo thread

> **Revised 2026-10-27 per §0.7.** Nine phases following the client's demo
> path.
>
> ⚠️ **There is one phase sequence and it is this one: Phase 1 to Phase 9.**
> The 2026-10-24 draft had its own *Phase 0–12*, numbered by dependency layer.
> Those numbers are **gone** — the old sections are kept below as §8b under
> topic names ending in *(ref)*, because their detail is still the spec for
> what goes in each phase. So "Phase 2" now means exactly one thing: admin
> login. §8b's *Identity, auth and RBAC (ref)* is the material it draws on, not
> a competing phase 1.

Each phase's exit condition is **demonstrable in the real UI** — that phase's
mock bodies swapped, the live flag enabled, the screens walked by hand.
"Tests pass" is not an exit condition on its own.

| Phase | What it delivers | Spec in §8b | Status |
|---|---|---|---|
| **1** | Foundation — server, Atlas, `fetchJson`, live flag, uploads | Foundation | ✅ **done** 2026-10-27 |
| **2** | Admin login + RBAC enforced server-side | Identity, auth and RBAC | ✅ **done** 2026-10-27 |
| **3** | Catalogue CRUD; admin creates the real services; consumer reads them | Catalog, pricing config | ✅ **done** 2026-10-27 |
| **4** | Pro registers; admin approves KYC | Pro onboarding and KYC | ✅ **done** 2026-10-27 |
| **5** | Customer OTP, addresses, booking; cash + wallet | Customer booking core; Payments (part) | ✅ **done** 2026-10-27 |
| **6** | Dispatch — offer, 30 s window, first-to-accept, manual assign | Dispatch engine | ✅ **done** 2026-10-27 |
| **7** | Job lifecycle — photos, completion OTP, GPS gate, tracking | Job lifecycle | ✅ **done** 2026-10-27 |
| **8** | Quotation — pro submits, admin 15-min window, customer accepts | Quotation flow | ✅ **done** 2026-10-27 |
| **9** | Everything remaining: earnings, reviews, notifications, support, admin ops, reports, hardening | Pro earnings; Reviews/notifications/support; Admin operations; Hardening | ◀ **in progress** — see §8c |

**1 → 2 → 3 is a strict chain.** After 3, **4 and 5 are independent** — pro
onboarding and customer booking touch different collections, and the demo path
only needs both before 6. **6 → 7 → 8 is a chain** again: there is no job to
run until one is dispatched, and no quotation until a pro is on site.

### What moved from the original draft, and why

- **Pro onboarding and KYC: last-but-three → Phase 4.** The client's step 3.
Dispatch cannot be demonstrated without an approved pro, and approving one is
an admin screen, which keeps the admin-first thread intact.
- **Auth split three ways.** Admin auth is Phase 2; pro OTP comes with Phase 4
and customer OTP with Phase 5. The original did all three at once, which
would have blocked the admin thread on OTP work it does not need.
- **Payments folded into Phase 5, reduced.** Cash and wallet ledger only, per
§0.3. Razorpay, webhooks, settlement and the three billing layers wait for
Phase 9, where keys will exist.
- **Reports and admin ops → Phase 9.** They read data that Phases 3–8 create.
Building aggregations over empty collections proves nothing.
- **Dispatch keeps polling, no FCM.** `offer-listener.tsx` already polls
`nextOffer`, so Phase 6 works in a browser with two tabs open. FCM is a
delivery channel on top, and it is the one thing that needs a real device to
verify — Phase 9.

### Per phase

Mongo schema → endpoints → **port the business logic, do not re-derive it**
(§1, §9) → swap that phase's mock bodies → enable the live flag → walk the real
screens → tests on the money and state-machine paths → done.

Schemas are added **per phase, not all upfront.** The original draft called for
"Mongo schemas for the full domain"; that is thirty collections written against
screens nobody has exercised yet, and the ones for Phase 9 would be guesses.
Each phase adds what it needs.
`ponytail:` *incremental schemas; the cost is occasional migrations on a
pre-launch database, which is cheaper than thirty speculative collections.*

---

## 8b. Reference detail — the spec each phase draws on

> ⚠️ **Not a phase sequence.** This is the 2026-10-24 draft's material, kept
> because its rules, endpoint lists and named failure modes are still correct
> and still the specification. Its *ordering* is superseded by §8, and its
> phase numbers have been removed so no number means two things. The §8 table's
> "Spec in §8b" column maps each phase to the sections below.

---

### Foundation (ref)

- `apps/server` (`@cfc/server`) **in this monorepo**, so it shares `@cfc/types`.
A separate repo with copied types is how the contract drifts.
- Express + TypeScript, Mongoose, config, structured logging, health check.
- **Error envelope matching** `ApiError` **exactly** — `{ status, message, code }`.
Every error screen already renders from this shape; match it and they work
for free.
- `fetchJson` in `@cfc/mocks`: attaches the JWT, parses the envelope, throws
`ApiError`. ~30 lines, and every later swap is one line.
- **Per-function live flag**, so a half-migrated system runs:
  ```ts
  const LIVE = new Set((process.env.NEXT_PUBLIC_LIVE_APIS ?? "").split(","));
  export const isLive = (name: string) => LIVE.has(name) || LIVE.has("*");
  ```

  This is what makes the phases independently shippable instead of a big-bang
  cutover.
- Mongo schemas for the full domain, derived from `@cfc/types`.
- **Seed script importing** `packages/mocks/src/fixtures/`**.**
- CI: typecheck, lint, test — frontend and server. **Fix B8 first or CI is red
from day one.**

**Exit:** all three apps plus the server run together. Seeded DB queryable. One
trivial endpoint (`getServiceAreas`) live through the flag, rendering from Mongo.

---

### Identity, auth and RBAC (ref)

**Consumer** `sendOtp` · `verifyOtp` · `getConsumerProfile` ·
`updateConsumerProfile`
**Pro** `sendProOtp` · `verifyProOtp`
**Admin** *(new — no mock exists)* email + password, **plus real 2FA**: TOTP
secret, QR provisioning, verification, recovery codes (§2.2 — the current
toggle is a lie). Password reset (Admin 2).

Build:

- MSG91 OTP: send, verify, 30 s resend lock (`OTP_RESEND_SECONDS`), 6 digits
(`PRO_OTP_LENGTH`), rate limit per phone **and** per IP, DLT template
registered. **Hash the OTP at rest; never log it; never return it.**
- **Resolve B1 here**: remove the `123456` auto-fill, stop printing the code in
`auth-dialog.tsx`, and reject anything but a real verified code.
- JWT issue + refresh, carrying a **real user id** — §2.5 has no identity at
all today, so `SessionProvider` needs a token and a user, not a boolean.
**Do not state a session length on any screen** (`PLATFORM-FACTS.md`
§"Not stated anywhere").
- `Users` collection on the `Role` union.
- **RBAC middleware is a direct port of** `permission.ts`**.** `can()` and
`canOpen()` become the server's authority; the frontend copy stays for
rendering only. A sub-admin who edits their JWT must still be refused.
`ADMIN-SUMMARY.md`: *"Permissions were assigned but never enforced"* — an
area admin saw the full 11-item sidebar. Enforce server-side.
- Area scoping applied **in the query** — `areaScope(actor)` already returns
what the query needs.
- **Resolve B2**: confirm `__cfc` / `__cfcSession` / `__cfcActor` cannot reach
a production bundle, then delete them.
- Audit log collection, written on every privileged action from here on.

**Exit:** real login on all three apps, with a real token. A sub-admin cannot
reach Settings by URL. An area admin's list contains only their area, enforced
server-side. Admin 2FA completes a real enrolment and challenge.

---

### Catalog, pricing config and platform settings (ref)

*"All categories, sub-categories, services and pricing are created and managed
entirely by the Admin. **Nothing is hardcoded.**"*

Reads going live: `getCategories` · `getSubCategories` · `getServices` ·
`getService` · `getPricingRules` · `getCommissionRules` · `getServiceAreas` ·
`getServiceFaqs` · `getSlots` · `searchServices` · `suggestServices` ·
`getTrendingSearches`

Writes (**all new**): category / sub-category / service / variant CRUD ·
`reorderCategories` · `updatePricingRule` (base, visit charge, platform fee,
**night surcharge**, **city-wise override** — Admin 28) ·
`updateCommissionRule` (per category, **per pro**, partner rates — Admin 29) ·
GST config · auto-assign radius (2/5/10 km) · GPS limit **as config, not 100 m
hardcoded** (§7.2) · service areas · FAQs · **warranty days per service** ·
`updatePlatformSettings` (app configs, maintenance mode, feature flags,
geofencing — Admin 47)

Plus:

- `PlatformConfig` **for §5** — support phone/hours/email, warranty default,
visit-fee policy, cancellation policy, referral terms, operating areas, brand
name, price format. One source, read by every screen.
- Every rate as `BasisPoints` in config, never a literal — `primitives.ts`
already insists on this.
- Slot availability from pro availability + existing bookings. Booking horizon
and slot width as config (§7.2 — both are guesses today).
- **MongoDB text index on service name / category / synonyms** — clause 4.8
names search indexing explicitly. Not Elasticsearch; 50+ services with a text
index is instant.
- Object storage for service and category images (reused by Phases 6 and 9).
- **Add-ons: blocked on §7.2.** If the client wants them, Admin 27 needs an
editor and `AddOn` needs a model; if not, drop `addOnIds` from
`createBooking`. Do not leave the customer side priced against data no admin
can create.

**Exit:** admin creates category → service → pricing rule and it appears on
consumer home, browse, categories, search and service detail with no code
change. Admin edits the platform fee and checkout reflects it. Admin edits the
support phone and it changes in the footer, `/support` and both home pages.

---

### Customer booking core (ref)

The 3-click target: *service select → details + slot → address + contact →
payment summary → confirmed.* **A named deliverable — do not add steps.**

`getAddresses` · `saveAddress` · `deleteAddress` · `priceBooking`
(server-authoritative) · `applyCoupon` · `getAvailableCoupons` ·
`createBooking` · `getMyBookings` · `getMyBooking` · `getMyBookingCounts` ·
`cancelBooking` · `getActiveBooking` · `getRebookable`
New: `rescheduleBooking`

Build:

- Address CRUD with pincode/geocode validation via Google Maps. **Geocoding is
genuinely needed**: the browser's Geolocation API returns coordinates, not an
address (2.9), and the map pin currently confirms rather than sets (2.10).
- **Port** `priceBooking` **verbatim** as the authority. Recompute the client's
total; a mismatch is a 409, not a silent accept.
- **Fix §4.1**: persist `breakdown: PriceBreakdown`; invoice reads it. Removes
both the retroactive-invoice bug and the hardcoded `svc_01` (I-07).
- **Fix §4.5**: carry `variantId` on the cart line.
- Port `applyCoupon` with all six named failure reasons intact — the screens
already render each one as a specific sentence. Add **first-booking-only**
and user restrictions (Admin 36).
- Coupon redemption **atomic** (`$inc` guarded by `usedCount < maxUses`), or a
popular coupon over-redeems under concurrency.
- Booking state machine with a `BookingStatus` transition table; every
transition appends to `events[]`, which the customer timeline reads.
- `createBooking` **idempotent** on a client key. A double-tap on a slow
connection must not create two bookings.
- **Reschedule (§2.6 / I-06)** — a real endpoint plus the frontend flow. The
button exists and currently lands on an error screen.
- Cancellation mechanism with the fee at **zero** pending §7.2.
- Multi-service checkout: today `/cart` books the first line and keeps the rest
(I-17). Product decision — but the endpoint should accept multiple lines so
the answer is not blocked on a schema change.

**Exit:** a real customer books a real service end to end and sees it in My
Bookings with a correct frozen breakdown. Reschedule moves a booking instead of
erroring. No pro assignment yet.

---

### Payments, wallet, invoices (ref)

Its own phase: webhook reconciliation and idempotency are where payment
integrations actually fail.

`getWalletBalance` · `getWalletTransactions` · `addMoney` · `getTransactions` ·
`getSettlements` · `getRefunds` · `getGstReport`
New: `createRazorpayOrder` · `verifyPayment` · `issueRefund` · `getInvoice`

Build:

- Razorpay order creation, checkout handoff, **signature verification**,
webhook endpoint.
- **Webhooks are the source of truth, not the client callback.** A customer who
closes the tab mid-payment must still end with a correct booking.
- **Idempotent webhook handling** — Razorpay retries, and a retried capture
must not credit twice.
- Payment ledger: double-entry, **append-only**. A correction is a new
compensating row, never a mutation. This is the difference between a
reconcilable book and a guess.
- Wallet: top-up, debit, refund credit. Balance **derived from the ledger**,
never a stored counter that can drift.
- Cash collection path (`paymentMethod: "cash"`), confirmed by the pro.
- Refunds, full and partial, gated on `payments.issue_refund`.
- **Three billing layers, exactly as specified:**
  | Layer | Who sees it | Contents |
  |---|---|---|
  | Customer invoice | Customer | Service, pro, total paid, payment mode, branding |
  | Tax invoice | Customer + Admin | Service fee, platform fee, CGST 9%, SGST 9%, total |
  | Internal settlement | **Admin only** | Customer total, pro share, CFC fee, GST collected, net each |

  All from the frozen breakdown. **The admin layer must never be reachable from
  a customer token** — `CFC-FINAL-BUILD-TRACKER.md` marks it *"must never
  render"* on a consumer screen.
- GST report: CGST/SGST per period, **on platform fee only**, ever.
- **Fix I-18**: checkout says *"You will be taken to a secure payment page"* and
there is none — Pay books immediately. True once Razorpay lands.
- Transaction history scope — refunds and non-wallet payments too (§7.2).

**PDF: deferred to Phase 9.** The invoice route is print-styled and the
browser's own dialog produces a real PDF everywhere. The agreement does ask for
auto-generated PDF, so it is scheduled, not dropped.
→ *skipped: server-side PDF, add in Phase 9 once the invoice layout is frozen.*

**Exit:** a real Razorpay test payment completes a booking. Wallet top-up and
debit work. All three invoice layers render correct, immutable figures for **any**
service. GST report reconciles against the ledger.

---

### Dispatch engine (ref)

Every rule here is documented. Nothing to invent.

`nextOffer` · `acceptOffer` · `declineOffer`
New: pro online/offline, `assignProManually`, no-pro-available alert

| Rule | Value |
|---|---|
| Pros notified per job | 3 nearest, **simultaneously** — first to accept wins |
| Accept window | **30 s**, countdown shown, auto-reject on timeout |
| Auto-assign radius | **2 / 5 / 10 km**, admin-editable |
| Rating priority | At equal distance, higher-rated notified first |
| No-pro alert | **2 min** with no acceptance → admin |
| Auto offline | Offline on accept, online on completion |

Build:

- `2dsphere` index on pro location; `$near` within the configured radius,
ordered by distance then rating descending.
- **Match against** `areas: string[]` (§4.4), not one primary area.
- Offers with a hard 30 s expiry, expired by a server sweep — never trust a
client to report its own timeout.
- **Atomic first-to-accept** (§3). The loser gets `{ kind: "taken" }`, which the
UI already handles as a real outcome rather than an error.
- Escalation: nothing in radius → widen → at 2 min raise the admin alert.
- FCM push on offer, carrying the 30 s window. `PRO-OPEN-ITEMS.md` 2.2: a web
app cannot wake a sleeping phone — this is why FCM is not optional.
- **The offer withholds address, phone and coordinates.** Three pros see it and
two will not attend. Released only in the accept response.
- Auto offline on accept, auto online on completion. **Offline is the default on
app open** — a pro who has not said they are ready should not be in the pool.
- Pro location pings while on a job — 15–30 s, not 1 s. It is their battery and
data.

**Exit:** a customer books, three real pro sessions get a push within seconds,
one accepts and the other two see "taken". A timeout auto-rejects. Nobody
accepting for 2 minutes raises an admin alert.

---

### Job lifecycle, proof of work, tracking (ref)

`getProDayStats` · `getProActiveJobs` · `getProJobs` · `getProJobCounts` ·
`getProJob` · `completeJob` · `addExtraCharge`
New: status transitions, photo upload, location ping, customer tracking feed

Build:

- **One state machine** shared with the booking machine. One job is one booking
seen from the other side; two machines will disagree.
- Photo upload to object storage: before and after, EXIF stripped, compressed,
signed URLs. Keep capture time and coordinates as **metadata fields** — they
are the proof, and EXIF is both strippable and a privacy leak if served.
(2.12: fixture photo paths point at images that do not exist.)
- **Completion, exactly as** `pro-work.ts` **has it:**
  1. OTP first — the customer's own confirmation; nothing else matters without it
  2. At least one after-photo
  3. GPS within the configured limit — *a known distance beyond it blocks; an

     unknown one does not.* No fix is recorded for admin review and the pro is
      **not** blocked. Do not "improve" this: a weak indoor signal is the one
      thing the pro cannot fix, and blocking there makes the platform's proof
      requirement into their problem. **Browser GPS is less accurate than
      native** — the tolerance is config (§7.2).
- Completion OTP generated at assignment, revealed to the customer only once a
pro is on the way (`completionOtp` is deliberately null before that).
- Extra charges, each carrying a customer-readable reason.
- **Fix §4.2**: `proPosition` → `GeoPoint`; tracking returns real coordinates
and a real ETA from the Maps distance matrix. The screen currently says
*"Live position updates once the Maps integration is connected"* — this is
that integration.
- Navigation stays a **maps deep link** (2.3): *"nobody should rebuild
turn-by-turn inside a web app"* — correct in production too.
- Timeline events appended at every transition.

**Exit:** a pro accepts, travels, arrives, uploads before-photos, works, uploads
after-photos, enters the customer's OTP and completes, while the customer
watches on the track screen. A wrong OTP, a missing photo and a 500 m distance
each fail with the right message.

---

### Quotation flow (ref)

*"The panel's priority path."*

**Pro** `submitQuotation`
**Admin (new)** `approveQuotation` · `editAndApproveQuotation` ·
`rejectQuotation`; `getQuotations` / `getQuotation` go live
**Customer** `getMyQuotations` · `getMyQuotation` · `acceptQuotation` ·
`declineQuotation` · `askQuotationQuestion` · `getPendingQuotationCount` ·
`splitQuotation`

Build:

- Pro submits description, material lines, labour. **Minimum 2 before-photos —
fewer is auto-reject**, enforced server-side as well as in the UI.
- Above **₹5,000** sets `needsPhoneConfirmation`. Not a block — a flag the admin
acts on by calling the customer.
- **15-minute window**, `decisionBy` on the record, a sweep that marks expiry.
That is how long the pro is standing in someone's house.
- Template-price comparison: a quote over the admin's template triggers review
(Admin 5, 28).
- Three admin outcomes, gated on `quotations.approve`. **Edit & approve keeps
both** the pro's original and the edit — an approved amount differing from
what was submitted is a dispute waiting to happen without the history.
- **Fix §4.3**: accept pays a **50% advance** → return a Razorpay order; balance
on completion. `splitQuotation` already computes the halves.
- `askQuotationQuestion` routes to the **team, not the pro** (2.15 — there is no
message thread on a quotation, and the screen promises a call-back).
- Notifications at every hop: submitted → admin; decided → pro + customer;
accepted → pro.
- Decide "Send back" vs "Reject" (§7.2) — it is a word, but the client reads the
spec beside the screen.

**Exit:** a pro submits with 2 photos; the admin sees it with the clock draining
and approves; the customer is notified, views the photos, accepts, pays 50%; the
pro is told to start. A 1-photo submission is refused with the right message. An
ignored quote expires at 15 minutes.

---

### Pro earnings, settlement and payouts (ref)

`getProEarnings` · `getEarningsSummary` · `getCommissionFreeRemaining` ·
`getEarningsSeries` · `getPendingSettlements` · `getPayoutBalance` ·
`getPayoutDestinations` · `requestPayout` · `commissionFor` · `settleJob` ·
`getPayouts` · `getWalletEntries`
New: `approvePayout` (individual **and batch**) · `rejectPayout` ·
`adjustProWallet` · auto-transfer job

| Rule | Value |
|---|---|
| CFC commission | **15%** of pro earning |
| Commission-free | **First 20 jobs at 0%** |
| GST | Platform fee only — **never deducted from the pro** |
| Payout | Daily option, auto-transfer to bank/UPI **within 48 h** |

Build:

- **Port** `commissionFor` **and** `settleJob` **unchanged** (§1).
- Settlement row at completion, into the Phase 4 ledger.
- 48-hour window: earnings inside it are **pending**, not available. Conflating
them shows a pro money they cannot take.
- **One function owns "this week".** `PRO-OPEN-ITEMS.md` 4.4: `getEarningsSummary`
counted from the calendar week while `getEarningsSeries` walked back a fixed 7
days, so on a Wednesday the same screen showed a **₹1,205 disagreement about
the pro's own income**. The series must use the summary's cutoff. Preserve
this server-side.
- **GST is never a pro deduction.** Treating CGST+SGST as coming out of the pro
would cost each pro **₹270 on a ₹1,500 job**. A note on pro screens, never a
line item.
- **Overdue settlements are the platform's failure**, not a rounding error. Past
48 hours the pro is owed money against a stated commitment: those rows sort
top, colour `critical`, and carry the support route.
- **"Payout requested", never "paid."** Claiming a completed transfer when it
was only initiated produces a support call the moment the pro checks their
bank.
- A **₹0 CFC fee renders as ₹0 with its reason**, never blank — a blank is
indistinguishable from data that failed to load.
- Payout request → admin approval (`payments.approve_payout`) → Razorpay
transfer → status back to the pro. Daily auto-transfer scheduled job.
- `PAYOUT_MINIMUM_PAISE` stays **config, currently 0** (§7.2).
- Partner commission as a field on the pro record, defaulting to the platform
rate (§7.2 — including who absorbs the difference).

**Exit:** completing a job writes a settlement with the correct commission,
including free for a pro under 20 jobs. Earnings, pending and payout screens all
show the same numbers across today / week / month. A payout request reaches the
admin, is approved, and Razorpay transfers it.

---

### Pro onboarding and KYC (ref)

`registerPro` · `saveProfileSetup` · `uploadDocument` · `saveBankDetails` ·
`acceptTerms` · `getApprovalState` · `getRegisterableServices` ·
`getGoldenRules` · `getPenaltyStructure` · `acceptConduct`
New: `approveProKyc` · `rejectProKyc` · `approveDocument` (per type) ·
`requestMoreDocuments` · `requestDeactivation`

Build:

- Register → profile setup → documents → bank → terms → conduct → pending.
`getApprovalState` drives the whole `(auth)` group, so the state machine is
the authority on which screen a pro lands on.
- Document upload per `REQUIRED_DOCUMENTS`, to **private** storage with signed
short-lived URLs. **KYC documents must not be publicly addressable** — an
Aadhaar on a guessable URL is a data-protection incident.
- `uploadDocument` **always returns** `pending`**.** A screen that ticked a document
green on upload would teach the pro the review is automatic, then contradict
itself. A person reviews these.
- **Per-document status and a reason on every rejection.** `PRO-OPEN-ITEMS.md`
4.7: the fixture drew two independent randoms, producing documents *rejected
with no reason* and documents *approved carrying a rejection reason*. Derive
the reason from the status; never store them independently.
- Bank validation: port `isValidIfsc` / `isValidAccountNumber` / `isValidUpi`.
**Never store a full account number in plaintext** — `bankAccountLast4` is
what every screen shows. A wrong IFSC fails days later at the first payout,
with the pro chasing it.
- **Admin owns all pricing.** `updateProProfile` accepts **only** bio,
experience, areas, phone, UPI — name and skills are admin-owned. Enforce the
allowlist server-side; a field list is not a frontend concern.
- `areas: string[]` (§4.4). **Registration picks services from the catalogue,
never free text** — a pro typing "AC repair" against "AC service & repair"
matches zero jobs and nobody finds out for a week.
- Admin KYC queue: approve, reject with reason, request more documents,
**approve per document type** (Admin 14). `pros.approve_kyc` is delegated to
sub-admins; `pros.block` is **not**.
- An unapproved or blocked pro receives no offers — `nextOffer` already checks
this and the server must too.
- **No KYC turnaround promise.** The agreement gives none; the screen says what
happens, not when. "Within 24 hours" would be a developer inventing an SLA.
- Conduct acceptance records the **exact wording version signed**. A pro who
signed one wording and later read another has a legitimate grievance — which
is why one component renders Pro 8 and Pro 35 word for word.
- Deactivation as a **request**, with the active-job count shown. A pro with
jobs booked cannot vanish; a customer expects them tomorrow.

**Exit:** a new pro signs up, uploads documents, is approved, and starts
receiving offers. A rejected pro sees a document-specific reason. Documents are
unreachable without a signed URL.

---

### Reviews, notifications, support, referral (ref)

`submitReview` · `getReviews` · `getServiceReviews` · `getServiceReviewCount` ·
`getPublicPro` · `getProReviews` · `getProOwnReviews` ·
`getProRatingBreakdown` · `replyToReview` · `getNotifications` ·
`getUnreadNotificationCount` · `markNotificationRead` ·
`markAllNotificationsRead` · `getProNotifications` · `getProUnreadCount` ·
`markProNotificationRead` · `markAllProNotificationsRead` · `getSupportFaqs` ·
`getMyTickets` · `getMyTicket` · `raiseTicket` · `replyToTicket` ·
`getProFaqs` · `getProTickets` · `getTickets` · `getTicket` ·
`getReferralProgramme` · `askAssistant`
New: admin ticket reply / priority / assign / close · `sendBroadcast` ·
`updateAlertTemplates`

Build:

- **Reviews are OTP-gated** — accepted only after the completion OTP confirmed
the job. `submitReview` already refuses `not-completed` and `already-rated`;
the server enforces both.
- Rating aggregation: average, count, 5-star breakdown. **The breakdown must
average exactly to its headline** — a distribution contradicting its own
average is the first thing anyone checks. And show the distribution, not just
the mean: four 5-stars and one 1-star averages 4.2, and so do five 4-stars;
only one of those pros has a problem.
- **Auto-block below 2.5**, with a minimum sample size — one bad first review
must not block a new pro. The agreement gives the threshold but no sample
size (§7.2). The 2.5 threshold is **never hidden** from the pro: at 2.7 they
are one bad week from losing their account.
- Rating feeds dispatch priority (Phase 5).
- Notification fan-out + FCM, per `AppNotification` / `ProNotificationKind`.
**One writer**, so counts and lists cannot disagree. Notifications derive from
the pro's real record — a pro with no warnings sees no warning notification.
**Warnings are their own kind, never grouped**; filing one under "reminder"
would bury the most consequential message the app sends.
- **Job alerts cannot be switched off.** A pro who disabled them would stop
receiving work and conclude the platform had stopped sending jobs. The switch
is present, locked on, pointing at going offline or holiday mode.
- **Role-scoped support, enforced server-side.** `PRO-OPEN-ITEMS.md` 4.6:
`getMyTickets()` hard-filters `fromRole === "customer"`; calling it from the
pro app — the obvious reuse, since the name is generic — would have shown a
professional **other people's tickets**, including *"Pro did not arrive at
scheduled time"*. The server filters by role and applies `stripInternal` so
agents' internal notes never reach a pro or a customer. **A** `getMy…` **function
in a shared package has an implicit "my" baked in; the server cannot rely on
the caller.**
- **Real ticket threads** (§2.2) — multi-message, priority, assign-to-agent, SLA
timers.
- Broadcast gated on `support.send_broadcast`, with **real segments** (§2.2), a
confirmation step and an audit row. Sending to every device at once is not
undoable.
- **Alert templates** (Admin 46): configurable SMS/WhatsApp/push templates for
booking confirm, job assigned, OTP, payout.
- WhatsApp via the client's BSP. **Blocked on credentials** (§7.1).
- Referral: code generation, attribution, reward credit. **Figures are
placeholders** (§7.2), and `/home` currently states different ones from
`/refer` (§5).
- `askAssistant` is a declared shell (`AI_ASSISTANT_IS_SHELL = true`), with an
on-screen notice that it *"cannot see your bookings or make changes"*. The
agreement says the AI assistant is *"integrated progressively based on
platform usage"* and states no model, endpoint or budget. **Leave it a shell
until the client scopes and funds it.**
→ *skipped: real AI assistant, add when scoped.*

**Exit:** a customer rates a completed job and the pro's average moves. An
uncompleted job cannot be reviewed. Notifications arrive by push with correct
unread counts. A ticket round-trips as a real thread. A pro sees zero
customer-raised tickets.

---

### Admin operations, reports, live map (ref)

`getDashboardKpis` · `getJobFeed` · `getBookings` · `getBooking` ·
`getBookingsForExport` · `previewStatusOverride` · `getCustomers` ·
`getCustomer` · `getCustomerBookings` · `getCustomerComplaints` · `getPros` ·
`getPro` · `getProWarnings` · `getCoupons` · `getBanners` · `getSubAdmins` ·
all ten `reports.ts` functions
New: everything remaining in §2.1

Build:

- Dashboard KPIs and job feed from real aggregations.
- Bookings list with filters, area scoping, **CSV and Excel export** (Admin 6,
38, 42). `bookings.export` — **area admins have no export**: *"no external
tool or third-party access at this level."*
- Status override with the preview `previewStatusOverride` returns, an audit
row, and `bookings.override_status`.
- Customers: list, detail, booking history, complaints, **no-show count**,
**block/unblock** (Admin 21).
- Pros: list with **live online/offline**, detail, warnings, penalties,
block/unblock with reason + audit trail, **manual wallet adjustment**
(Admin 16).
- Promotions: coupon CRUD (**first-booking-only**, user restrictions) and banner
CRUD **with scheduling**.
- Sub-admins: create, edit sections, **remove** (none existed). Per-person
sections **narrow** the role and can never widen it — `canOpen` guarantees
this and the server must too.
- Reports: ten aggregations — revenue (by date / category / area), bookings
(volume, completion rate, cancellation, peak hours), pro performance (ratings
trend, top earners, no-show), service demand, customers (signups, retention,
repeat rate, **MAU/DAU**).
**Mongo aggregation on pre-computed nightly rollups**, not live scans — the
dashboard is opened constantly and a full scan per open gets slower every week
of operation.
`ponytail:` *nightly rollup job; a real OLAP store only if the client asks for
sub-minute freshness.*
- **Live map (Admin 9) + manual assignment (Admin 10)** — the largest gap. Pro
positions and active-job pins from the Phase 5 pings; manual assignment for
when auto-assign fails. A 5-second poll of one endpoint, not a socket.

**Exit:** all 49 admin screens operate on real data, every write persists with
an audit row, and permissions are enforced server-side. The live map shows real
positions and manual assignment places a real job.

---

### Hardening and delivery (ref)

- **Clause 4.8, all three obligations:**
  - **Load test at 10,000 concurrent users.** Contractual. The dispatch path is
  where concurrency is structural — test it hardest. Only add Redis if this
  fails (§3).
  - **MongoDB indexing for search** — verified, not assumed.
  - **Daily automated backup *restoration* test.** Not a daily backup; a daily
  proven restore. An untested backup is not a backup.
- **Server-side i18n — confirm ownership first (§7.3).** Client screens are
another team's. SMS, push, invoices and email are not, and nobody else can own
them.
- Rate limiting: OTP, login, payment, search.
- Validation at every trust boundary (zod schemas derived from `@cfc/types`).
- Security: secret rotation, nothing in the repo, HTTPS only, CORS allowlist,
Mongo injection guards, signed URLs everywhere, OWASP pass. **Confirm B1 and
B2 are gone.**
- **Invoice PDF** server-side render, deferred from Phase 4 (§7.2 — confirm it
is still wanted).
- Observability: error tracking, request logging, uptime, payment-failure and
dispatch-failure alerts.
- **Full keyboard walkthrough of all 49 admin screens** — not started
(`ADMIN-PENDING.md` §2): tab order, Enter/Space on rows, Escape closes every
overlay with focus returned, no trap outside a modal, accessible names on
icon-only buttons.
- **Fix** `ring-focus` **in** `@cfc/ui` — five components ask for a ring colour the
preset does not define, so keyboard focus draws Tailwind's default translucent
blue instead of the brand ring, **in all three apps**
(`APP-BOUNDARIES.md` B-11, I-59, 7.18).
- Accessibility decision §7.5 put to the client.
- PWA: service worker and offline shell — *"PWA support" is named in scope but
never specified* (P10).
- Dark mode if confirmed — a values-only edit to `tokens.css`, but it affects
**all three apps**, so it is a shared decision.
- **Delete** `promo-salon.png` **and** `promo-ac.png` (B7).
- API docs (OpenAPI from the routes).
- Deploy: staging + production, CI/CD, `cfcservice.in` DNS, runbook.
- Mobile 390px pass completion (`ADMIN-MOBILE-PLAN.md`).
- UAT against real data. Handover: credentials, infra docs, Figma source
(clause 4.7), training.

**Exit:** client signs off. Production live on `cfcservice.in`. 10k load test
passed. Restore proven.

---

## 8c. Phase 9 — the backlog, measured

> Added 2026-10-28. Phase 9 is "everything remaining", which is not a plan.
> This is what that actually is, counted from `packages/mocks/src/api/` —
> every exported function still backed by a fixture rather than the API.

**18 modules, ~62 functions.** Earnings is already done (Phases 1–8 took it),
so what is left groups as:

| Group | Modules | Fns | Notes |
|---|---|---|---|
| ✅ **Reviews** | `reviews`, `reviews-submit`, `public-pro` | 6 | **done 2026-10-28** |
| ✅ **Search** | `search` | 3 | **done 2026-10-28** — was a hole in Phase 3, see below |
| Notifications | `notifications`, `pro-notifications` | 11 | FCM is the delivery channel; needs a real device |
| Support | `my-support`, `pro-support` | 8 | Admin side is a shell (§2.2) — threads, priority, assignment |
| ✅ **Admin ops — core** | `customers`, `bookings`, `dashboard`, `finance` | 14 | **done 2026-10-28** — plus block/unblock and status override |
| Admin ops — rest | `promotions`, `admin-users` | 5 | Coupon + banner CRUD, sub-admins |
| ✅ **Reports** | `reports` | 10 | **done 2026-10-29** — Admin 38–42 |
| Misc | `faqs`, `referral` | 2 | |
| **Blocked on client** | `pro-conduct` | 3 | Golden Rules wording and the penalty schedule (§7.2). `PENALTY_AMOUNTS_NOT_SET` — do not invent these |

### Done in Phase 9 so far

**`issueWarning` (Admin 17).** The last hole in Pro management. The whole UI
existed — dialog, reason chips, escalation counting, a threshold banner — and
`issue()` was `setState` + toast, the §0.8 pattern exactly. Now a real
collection, append-only like the ledger it writes to.

A penalty writes its **wallet row in the same request**, so the discipline
record and the pro's balance cannot disagree about whether money was taken.
Positive on the warning (the size of the fine), negative in the ledger (a
balance is a sum). Gated on `pros.block`, **not** `pros.approve_kyc` —
onboarding is delegated to a sub admin and discipline is not, and fining
someone is the discipline half. `warningCount` on the pro detail was hardcoded
`0`; it is now counted.

**Reviews (Customer 30, 2, 12, 13).** OTP-gated by construction: a review can
only be written against a booking the pro closed with the customer's own
completion code, so `verified` is a fact about the write path rather than a
flag someone sets. The byline is shortened at write time ("Priya V.") — a full
name beside an area is more identifying than a review needs.

This closes a loop Phases 6–8 left open: **dispatch already orders by rating**,
and ratings were fixture data. A review now `$inc`s the pro's `ratingSum` /
`ratingCount`, so the ordering is real.

`REVIEWS_ARE_PLACEHOLDER` is now **derived from the live flag** rather than
hand-set, so the "sample content" label cannot be left on over real reviews.

**Service stats.** `bookingCount`, `rating` and `reviewCount` were hardcoded
zeroes with a note saying "until the phases that create them". Both phases have
landed, so they are aggregated for real. Cancelled bookings do not count —
"most booked" is a claim about work people went through with.

### A hole in Phase 3, closed

`searchServices`, `suggestServices` and `getTrendingSearches` had **no endpoint
and no wiring**, despite §8b *Catalog* listing them as reads going live in
Phase 3 and clause 4.8 naming search indexing as a contractual deliverable.
Phase 3 was marked done with customer search still entirely on fixtures.

Now served. Matching is **per-word, order and position free** — "ac repair" has
to find "AC service & repair" — over the name, category and sub-category.
Deliberately *not* `$text`: it matches whole words only, so "clea" would find
nothing while someone is still typing "cleaning". The `service_search` text
index already exists and serves the admin's full-word search; clause 4.8 is
satisfied by that, not by the customer type-ahead.

Trending is derived from the real booking count. Before anyone has booked
anything it is simply empty, which the search screen already handles.

**Admin operations — the core four (Admin 3, 6–8, 19–21, 30–34).**

Everything here is **derived from bookings**, never from a parallel set of
finance rows: the dashboard's "new bookings today" and the bookings list's own
count have to agree, and the only way to guarantee that is for both to count
the same collection. A transaction *is* a paid booking. A settlement *is* the
split frozen onto the booking at completion, read back rather than recomputed
so a later commission change cannot rewrite a settled job.

Two writes replaced §0.8 handlers:

- **`blockCustomer` / `unblockCustomer`** (Admin 21). Enforced at **sign-in**,
so a blocked customer is refused at the door rather than let in to find every
action failing one at a time. The panel takes the blocked state from the
server's response rather than toggling locally — a block that failed must not
leave the screen claiming it worked.
- **`overrideBookingStatus`** (Admin 8), replacing `previewStatusOverride`,
which validated and returned what the record *would* become without writing
anything. That was the honest shape while the mock layer was read-only and a
lie once there is a server. An override is allowed to **break the normal
transition table** — that is what forcing means — but **cannot reopen a
completed or cancelled booking**: completion has already written a settlement
and paid the pro, so reopening would let a second completion credit them
twice. That correction is a ledger adjustment, not a rewrite of history. The
forced event lands on the customer-visible timeline marked `forced`.

Area scoping is applied **in the query** on the list *and* the detail route.
Without it on the detail, a row an area admin cannot see in their list is still
readable by pasting its id.

Three things return empty rather than fabricated rows, and each is the truthful
answer:

| Endpoint | Why empty |
|---|---|
| Customer complaints | No model, and nothing raises one. Arrives with support. |
| Refunds | No refund model and no gateway to refund through (§0.3). |
| Transactions `?status=failed` / `refunded` | Gateway-only states; Razorpay is inert. |

`CustomerDetail.email` is `null` — nothing in the sign-up flow collects one.
`complaintCount` and `noShowCount` are true zeroes, not placeholders.

**Reports (Admin 38–42).** All ten aggregated from the collections the earlier
phases fill. Nothing keeps its own counter, so a report and the screen it
summarises cannot disagree.

Three decisions a reader should not have to reverse-engineer:

- **Every time series is zero-filled across all 14 days.** A chart that drops
quiet days compresses its x-axis and makes a slow week look busy. Same for
peak hours: all 24 are returned, so 2am is visibly empty rather than missing.
- **Revenue is recognised at completion**, by `updatedAt`, matching the GST
report. A booking placed last week and finished today is today's revenue.
- **`repeatBookingRateBps` is defined**: of the customers who booked that day,
the share who had booked at least once *before* it. The phrase could equally
mean the platform-wide share of repeat customers — a different number that
moves for different reasons.

⚠️ **Two figures are honest but narrower than they look:**

| Field | Reality |
|---|---|
| `ActiveUsersPoint.dau` / `.mau` | **"Active" means placed a booking.** Nothing records sessions or app opens, so a browse-only visit is invisible. These are a floor, and will read far lower than an analytics tool. The alternative was inventing a session counter so a chart had a bigger number on it. |
| `ProPerformanceRow.noShowCount` | Always `0`. No-shows are not tracked anywhere (§2.6, Admin 20/40). A real zero, not a placeholder. |

**A timezone bug caught by the tests, worth recording.** `$dateToString`
defaults to **UTC**; the bucket keys were built from local date parts. Any
booking completed after 18:30 UTC therefore fell into the next day's bucket,
and "today" read zero while the money was plainly in the database. Both sides
now name `Asia/Kolkata` explicitly. The same latent mismatch existed in the
Phase-9 GST report's month grouping and is fixed with it.

### Still open in Pro management

Nothing. `issueWarning` was the last one. Penalties, wallet adjustments,
block/unblock, document review, KYC approval and the dispatch-eligibility
explanation are all live and covered by the self-check.

---

## 8d. Completion plan — everything left to a usable product

> Added 2026-10-29, after the client set two more decisions. This is the single
> plan for finishing; there is no separate go-live document.

### 8d.0 The two decisions that shape this

**Login stays dummy until DLT clears.** The client's words: *"until i get the
dlt login can't be done so use the fake login and build other all feature."*
So `AUTH_DUMMY_OTP=true` and the master code remain, and **everything else is
built around them**. Nothing else waits on SMS. When the templates land it is
one integration and one boolean — §0.2 was written for exactly this.

⚠️ **This is the last thing to flip before launch, and it must not be
forgotten.** The master code signs in *any* phone number: today a stranger
could sign in as any pro and read their earnings. `env.ts` already refuses to
boot with `AUTH_DUMMY_OTP=true` when `NODE_ENV=production`, which is the
guardrail — do not weaken it to get a deploy out.

**Razorpay is unblocked, with the developer's own keys.** The client: *"for
razorpay i have my compnay razorpay api that i will use and later once client
give me the api i will change."* So Razorpay moves from "deferred until there
are keys" (§0.3) to buildable now. Keys live in `cfc-backend/.env`
(gitignored); swapping to the client's account later is an env change, not a
code change.

This reverses §0.3's *"no fake gateway"* deferral for the right reason: the
objection there was that signature verification and webhook reconciliation
**cannot be written blind**. With real test keys they can be written and
tested properly, which is the whole point.

### 8d.1 Stage A — finish the feature surface *(no blockers)*

| Order | Work | Fns |
|---|---|---|
| ✅ A1 | **In-app notifications** — **done 2026-10-29.** | 8 |
| ✅ A2 | **Promotions + sub-admins** — **done 2026-10-29.** | 3 + writes |
| ✅ A3 | **Support tickets + FAQs** — **done 2026-10-29.** | 10 |
| ✅ A4 | **`PlatformConfig`** — **done 2026-10-29.** | — |
| ✅ A5 | **Stragglers** — public pro profile, pro's own reviews and reply. **done 2026-10-29.** | 4 |

**Exit:** no screen reads a fixture. Every `@cfc/mocks` function calls the API.

**Reached 2026-10-29, with four deliberate exceptions.** Measured by scanning
`packages/mocks/src/api/` for exported functions with no `fetchJson` or
`isLive` on their path:

| Still on fixtures | Why — all client decisions, none technical |
|---|---|
| `getGoldenRules`, `getPenaltyStructure`, `acceptConduct` | The 3 Golden Rules' wording and the offence→rupees table. `PENALTY_AMOUNTS_NOT_SET = true`. A fine on a document a pro signs. |
| `getReferralProgramme` | No reward, minimum or cap is stated anywhere. A referral reward on screen is a promise the business must honour. |
| `askAssistant` | `AI_ASSISTANT_IS_SHELL = true` — a scripted keyword matcher. Needs a model and a budget, or deletion. |

Everything else — 100+ functions — calls the real API.

#### A1 as built — notifications are *emitted*, not derived

The read endpoints were the trivial part. The work was **emitting a row from
every event that causes one**: assignment, work started, completion,
settlement, quotation approved/rejected/expired, payout approved/rejected,
warning issued, KYC approved/rejected, documents requested again.

Three decisions worth keeping:

- **One collection for both audiences.** A customer row and a pro row differ
only in their `kind` vocabulary and where they link. Two collections would
mean two mark-read endpoints and two chances for the badge to disagree with
the list under it.
- **`notify()` never throws into its caller.** A notification is a side effect
of something that already succeeded. A failure to write the bell row must not
roll back a completed job — it is logged and swallowed. A deliberate asymmetry
with the rest of the system, where a failed write is an error.
- **The recipient comes from the token, never a parameter.** `getProNotifications`
still *takes* a `proId` so no screen changes, and the live path ignores it.

**This is the record, not the delivery.** FCM will read from here. A push that
arrives while the phone is off is gone, and the pro still has to open the app
and see what happened — so the row is written first and always.

#### A2 as built

- **A coupon is switched off, never deleted** — redeemed coupons are
referenced by the bookings that used them.
- **Editing a coupon cannot reset `usedCount`.** Redemptions are history; the
field is simply absent from the update.
- **Banner scheduling** is the part that was never built (§2.2). Live means
`active` *and* inside the window, and the predicate lives in the model so the
admin preview and the consumer home screen cannot disagree about "live".
- **A delegated admin is revoked, not deleted** — otherwise forty audit rows
point at an id that resolves to nobody.
- Sections granted to a sub admin are stored as asked and **intersected with
the role** by `canOpen`, so a row cannot widen a role. There is a test proving
a sub admin granted `settings` still cannot open it.

#### A3 as built — one rule shapes the whole model

**An internal note must never reach the person the ticket is about.** Agents
write things like *"this customer has disputed two bookings before"* in them.

Internal notes live in the **same** `messages` array as the customer's, not a
separate collection, because that is what makes the admin view a real
conversation — complaint, internal note, reply, in the order they happened.
Two collections would have to be merged and sorted by every caller, and the
one that forgot would show an agent replying to nothing.

The cost is that stripping is mandatory on every customer-facing read, so
`publicMessages()` is the only way messages leave the server toward a customer
or pro, and a self-check asserts an internal note never appears in their
response.

Three behaviours worth recording:

- **Replying picks the ticket up.** An untouched `open` ticket is the one an
agent should take next, so answering one moves it to `in_progress` and assigns
it to whoever replied. Otherwise the queue cannot be worked.
- **A customer replying to a resolved ticket reopens it**, or the reply lands
somewhere nobody is looking.
- **Assignment validates against the admin list.** A ticket assigned to a
misspelled name is assigned to nobody, and nobody notices until the customer
chases it.

FAQs are **one collection with an audience**, not three. The three screens
(service detail, customer help, pro help) ask different questions of the same
content — that is a filter, not three data sets. `serviceId: null` means it
applies everywhere, so a new service's FAQ section is useful on day one rather
than empty.

#### A4 as built — §5's single source

Every field **defaults to empty**, and that is the point. The real values are
§7.1 items the client has not supplied, and a plausible-looking default is
worse than a blank: *a wrong support number is one a customer actually rings.*
Screens hide an empty row; they cannot hide a fabricated one.

`GET /api/public/config` is what every screen reads — footer, `/support`, both
home pages — so the 17 contradictions in `final/CONSUMER.md` §13 now have one
place to be fixed instead of seventeen.

#### A flaky test, root-caused

The suite failed intermittently with *"no offer for booking"* — twice, in
different suites. It was **not** dispatch: six tests waited on a fixed
`setTimeout(400)` for an offer written by a non-blocking dispatch call against
a **remote Atlas cluster**. Most runs 400 ms is plenty; occasionally the write
lands at 600 ms and a working dispatch engine fails the suite.

All six now poll to a deadline (`waitFor`), which is both faster in the normal
case and reliable in the slow one. Worth remembering: a fixed sleep against a
remote database is a race, not a wait.

### 8d.2 Stage B — Razorpay *(keys in hand)*

Its own stage because webhook reconciliation and idempotency are where payment
integrations actually fail. Spec is §8b *Payments, wallet, invoices (ref)*,
unchanged. The non-negotiables:

- **Webhooks are the source of truth, not the client callback.** A customer who
closes the tab mid-payment must still end with a correct booking.
- **Idempotent webhook handling** — Razorpay retries, and a retried capture
must not credit twice.
- Signature verification on every callback.
- The ledger stays **append-only**; a correction is a compensating row.

Switches on: online payment, wallet top-up, the 50% quotation advance (§4.3),
and refunds — which is also what makes Admin 33 stop returning an empty list.

### 8d.3 Stage C — the remaining integrations *(each lands with its credential)*

| Integration | Switches on | Needed |
|---|---|---|
| Firebase FCM | Push on job offer — a web app cannot wake a sleeping phone, which is why the 30-second window needs it | Service-account JSON |
| Google Maps | Address geocoding, real `proPosition` (§4.2), real ETAs | API key, billing on |
| MSG91 + DLT | **Real OTP. `AUTH_DUMMY_OTP=false`.** | DLT templates |
| WhatsApp BSP | WhatsApp notifications | Client-managed |

### 8d.4 Stage D — content and launch blockers *(client-owned)*

B3–B7 of §6, none of them code:

- Legal text — Terms, Privacy, Refund are **headings with no body**. Binding
documents; a developer must not write them.
- Six **fabricated testimonials**, named people in named neighbourhoods.
- `promo-salon.png` and `promo-ac.png` — **a competitor's branding**, still on
disk.
- Unsourced home-page claims: ₹10,000 insurance, 11 cities, 5 languages, and a
*"100 metre GPS check on arrival"* that is actually a check **on completion**.
- Real service photography.

### 8d.5 Stage E — hardening

Clause 4.8's three obligations are deliverables:

- **Load test at 10,000 concurrent users.** Dispatch is where concurrency is
structural. Add Redis only if this fails, and let the test name the hot path.
Run it **early** in this stage, not the week of launch.
- **Search indexing verified**, not assumed.
- **Daily automated backup *restoration* test** — a daily proven restore, not a
daily backup. An untested backup is not a backup.

Plus:

- **Rotate the MongoDB password** (§0.6). It was transmitted in chat and the
app connects as a cluster admin. Create a least-privilege user scoped to `cfc`.
- **Flip `AUTH_DUMMY_OTP` to false** and confirm the master code is gone.
- Delete `__cfc` / `__cfcSession` / `__cfcActor` after confirming they cannot
reach a production bundle (B2).
- **Real admin 2FA.** The current toggle claims to be on and does nothing — no
QR, no secret, no verification. §2.2: *"A toggle is not setup."*
- Rate limiting on payment and search; validation at trust boundaries; OWASP
pass; HTTPS; CORS allowlist.
- Keyboard walkthrough of all 49 admin screens, and the `ring-focus` bug
drawing Tailwind blue instead of the brand ring in all three apps.
- **Accessibility (§7.5):** white on `#00b8c4` measures **2.43:1**; WCAG needs
4.5:1. `--color-on-action: #0e1f3d` gives 6.75:1 with the Figma colour
untouched. One line. This is what store and procurement reviews flag.
- Error tracking, uptime, payment-failure and dispatch-failure alerts.

### 8d.6 Still blocked on client answers

Not scheduled, because inventing them puts words in the client's mouth:

| Needed | Why it cannot be guessed |
|---|---|
| Penalty schedule — offence → rupees | `PENALTY_AMOUNTS_NOT_SET = true`. A fine on a document a pro signs. |
| The 3 Golden Rules — exact wording | Current text is derived from enforced mechanisms. Honest, but ours. |
| Auto-block minimum review count | "Below 2.5" given, sample size not — one angry customer currently blocks a new pro. |
| Cancellation policy and fee | No policy exists anywhere. |
| Payout minimum, referral figures, per-pro commission | Money. |
| **AI assistant — real model or drop it?** | `AI_ASSISTANT_IS_SHELL = true`; scripted keyword matcher, labelled on screen. |
| **Add-ons — Admin 27 editor, or drop the clause?** | Customer side is priced against data no admin can create. |

### 8d.7 Definition of done

Not "tests pass" — each is something a person does:

1. A stranger receives a **real SMS** and books.
2. They pay **by card**, and it reaches the client's Razorpay account.
3. A pro's phone is **asleep in their pocket** and wakes with an offer.
4. Completion takes the customer's OTP; their rating moves that pro's dispatch
   priority.
5. Reports reconcile with the bank.
6. A backup is restored **automatically and proven** that morning.
7. No placeholder, no fabricated review, no promise nobody made.

---

## 9. How to run it

**Sequence: see §8.** A→B→C is a strict chain, D and E are independent after
C, F→G→H is a chain, I last. (The 0→1→2→3→4 sequence this section originally
gave is superseded — §8.)

**Per phase:** Mongo schema → endpoints → port the business logic (do not
re-derive it) → swap that phase's mock bodies → enable the flag → walk the real
screens → tests on the money and state-machine paths → done.

**Phase 1's live flag is what makes this work.** Without it the backend is
unverifiable until every endpoint exists; with it, each phase ships and gets
walked through the UI the client already approved.

**One addition for the admin phases:** a phase is not done when its endpoints
answer. It is done when the screen's handler calls them (§0.8). An endpoint
with an unwired dialog in front of it is indistinguishable, to the client, from
no endpoint at all.

### Three non-negotiables

1. **Never change a screen file to accommodate the backend.** If a phase seems

   to need it, the endpoint shape is wrong. The only exceptions are the five
    contract fixes in §4, which are frontend bugs independent of any backend.
2. **Port the existing business logic, don't rewrite it.** `priceBooking`,

   `commissionFor`, `settleJob`, `completeJob`, `submitQuotation`,
    `permission.ts` and the three bank validators are already correct and carry
    their reasoning in comments. Re-deriving them from the PDF is how GST ends up
    on the pro's labour.
3. **Never put a figure on a screen that is not in** `PLATFORM-FACTS.md`**.** That

   file exists because invented numbers — session lengths, link expiries, fake
    queues — were shipped once and had to be removed. §6 and §7 are the current
    list of things with no source. Config them; do not guess them.

### One warning from the frontend build, worth carrying over

> *"The recurring failure in this codebase is **silence**."* — `ADMIN-SUMMARY.md`

A wrong Tailwind token emits no CSS and no error. The lint rule meant to catch
it **was itself broken for the entire admin build** (single-backslash escapes,
so `\b` could never match), and fixing it immediately found 29 more dead
classes. The lesson generalises to the backend: **a check that has never failed
is not evidence it works.** Prove a new validation, guard or permission rule
rejects a planted violation before trusting it.

---

**Skipped deliberately:** microservices, Redis, WebSockets, GraphQL, a real AI
assistant, server-side PDF before Phase 9, an OLAP store for reports,
Elasticsearch, object storage (§0.4), a fake payment gateway (§0.3), speculative
schemas for unbuilt phases (§8).
**Add when:** the 10k load test names the bottleneck, or the client scopes and
funds the feature.

**Deferred on the client, not on us** (§0.2, §0.3): MSG91 + DLT templates,
admin 2FA and password reset, Razorpay and everything downstream of it
(webhooks, settlement, the three billing layers, payout transfers), FCM,
WhatsApp BSP, legal text, and the §7.2 figures. Each has a holding behaviour
that is honest about being unfinished rather than one that pretends.
