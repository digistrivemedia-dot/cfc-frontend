# CFC Admin — Mobile responsiveness, in 10 phases

Last updated: 2026-09-06

The agreement requires the admin panel to be **mobile friendly** (section 4.3
heading). This plan takes it from "mostly works" to "designed for a phone",
one route at a time, without breaking the desktop view.

---

## The target

**390px** — iPhone 14 / 15 logical width, and the narrowest device worth
designing for. If it works at 390 it works at 360 with a little slack, and
everything above 390 is easier, not harder.

Three widths are checked on every phase:

| Width | What it represents |
|---|---|
| **390px** | Phone. The pass/fail width. |
| **768px** | Tablet portrait — where `sm:` has fired but `lg:` has not. Most layout bugs hide here. |
| **1280px** | Desktop. Must not change at all. |

---

## What the audit already found

Run before writing this plan, against the real code — not assumed.

**Already handled, do not rebuild:**

- `DataTable` collapses to cards below a **640px container width** (a container
  query, not a viewport one — so it works inside a drawer too). All six
  `DataTable` usages supply a `card` layout, so nothing renders blank.
- `Dialog` is `w-[calc(100%-32px)] max-w-lg` — already fits a phone.
- `Sheet` is `w-full max-w-md` — already full-width on a phone.
- `PageHeader` already wraps its title, meta and actions.
- The sidebar is already a drawer below `lg`.
- The support sheet's 640px widening is scoped `sm:max-w-detail`, so 390px is
  unaffected.

**Actual risks found:**

- **66 unprefixed `grid-cols-*`**, of which **6 are 3-or-more columns** with no
  breakpoint. Four are real risks; two (the 2FA QR grid, the 6-digit OTP row)
  are correct as they are.
- **Customers and Quotations build their lists as hand-written `<ul>` rows**,
  not `DataTable` — so they get none of the card collapse and need their own
  mobile treatment.
- Only **one** `overflow-x-auto` container in the whole admin app, so any wide
  content that is not a `DataTable` currently pushes the page sideways.
- Filter bars, tab strips and toolbars are horizontal flex rows with no
  wrapping or scroll strategy at 390px.

---

## Rules for every phase

Non-negotiable, because the point is to not break what works.

1. **Desktop is frozen.** Every change is additive at the small end — a base
   style plus `sm:`/`lg:` restoring what exists. If a 1280px screenshot changes,
   the change is wrong.
2. **Mobile-first direction.** Write the phone style as the base and let
   breakpoints add, rather than writing desktop and overriding down. Tailwind's
   `sm:` is min-width; fighting it with `max-` variants is how the two views
   drift apart.
3. **No horizontal page scroll, ever.** Wide content scrolls inside its own
   `overflow-x-auto` container. The `<body>` never moves sideways.
4. **Touch targets ≥ 44px.** The `h-touch` token already exists for this. Icon
   buttons in a row need spacing, not just size.
5. **The closed scale still applies.** No arbitrary values, no off-scale steps —
   `pnpm lint` runs on every phase and the token rules now cover `packages/ui`
   too.
6. **Nothing is hidden to "fix" mobile.** If a column does not fit, it moves
   into the card layout — it does not disappear. An admin on a phone is doing
   the same job as one at a desk.
7. **One route per phase, green before moving on:** `pnpm typecheck` and
   `pnpm lint --filter @cfc/admin` both pass, then a screenshot at 390.

---

## The phases

Ordered by **shared-surface first**: fixing the shell and the primitives once
means every later phase starts from a working base. Then routes in descending
order of how much an operator actually uses them on a phone.

### Phase M1 — Shell, navigation, and the primitives everything sits on

Files: `components/app-shell.tsx`, `packages/ui/src/primitives/{dialog,sheet,tabs,popover}.tsx`

The frame every screen renders inside. Doing this first means phases M2–M10
inherit a working shell rather than each patching around it.

- Header at 390: logo, drawer trigger, search, bell and avatar in one row
  without crowding. Search likely collapses to an icon.
- Drawer: width, scroll, and that it closes on navigation (already wired).
- Tab strips scroll horizontally rather than wrapping into stacked rows — a
  three-row tab strip eats half a phone screen.
- Popover and dropdown collision padding at 390, so a menu near the right edge
  does not clip.
- Confirm `Dialog`/`Sheet` behaviour at 390 rather than assuming it.

### Phase M2 — Dashboard (Admin 3)

File: `app/(app)/page.tsx` · route `/`

The first screen anyone opens, and the one most likely to be checked on a
phone between jobs.

- The stat row (`New bookings / Pending quotes / Active jobs / Earned today`)
  at one or two columns, not four.
- The approval queue rows: `Send back` / `Approve` are the two most important
  buttons in the panel — they must be reachable and not overlap the amount.
- The "Needs you" side cards stack below the queue rather than squeezing beside it.

### Phase M3 — Quotations (Admin 4, 5)

File: `app/(app)/quotations/page.tsx` · route `/quotations`

**Hand-built `<ul>` rows — no `DataTable` card collapse.** This is real work,
not a check.

- The queue row carries a name, a service, an SLA clock, an amount and two
  actions. At 390 that is a card, not a row.
- The 15-minute SLA countdown must stay legible — it is the reason the screen
  exists.
- The detail panel: photos, costing table, approve/reject.

### Phase M4 — Bookings list and detail (Admin 6, 7, 8)

File: `app/(app)/bookings/page.tsx` · route `/bookings`

- `DataTable` already collapses; verify the card layout carries enough to act on.
- The filter bar — status, area, date range — at 390.
- The booking detail sheet: timeline, customer, pro, status override.
- **Known trap:** `DetailShell` splits at `lg:`, which is a *viewport* query. In
  a sheet on a wide screen that reserves a 320px rail inside a 448px drawer.
  This bit the support sheet already. Check every detail panel for it.

### Phase M5 — Pro management (Admin 11–18)

File: `app/(app)/pros/page.tsx` · route `/pros` — **2,450 lines, the largest**

Seven tabs: directory, detail, approvals, documents, block, wallet, warnings,
payouts. Budget more time here than any other phase.

- The tab strip alone needs the M1 scroll treatment.
- Document verification: image previews and approve/reject at 390.
- The wallet ledger and payout approval tables.
- Bulk payout approval — the selection bar and its actions on a phone.

### Phase M6 — Customers (Admin 19, 20, 21)

File: `app/(app)/customers/page.tsx` · route `/customers`

**Also hand-built `<ul>` rows.** Same treatment as M3.

- The directory list becomes cards.
- Customer detail: booking history, complaints, wallet.

### Phase M7 — Services and pricing (Admin 22–29)

File: `app/(app)/services/page.tsx` · route `/services` — 1,842 lines

- Categories and sub-categories, including **drag-to-reorder on touch**. HTML5
  drag events do not fire on touch devices; this needs either pointer events or
  an explicit mobile affordance. Flag early if it turns out to be large.
- The service dialog: variants, inclusions, images, warranty.
- Pricing and commission tables.
- **Known risk:** `grid-cols-3` at `services/page.tsx:1634`.

### Phase M8 — Payments and finance (Admin 30–34)

File: `app/(app)/payments/page.tsx` · route `/payments` — 1,286 lines

- **Known risk:** `grid-cols-4` at `payments/page.tsx:233` — a four-segment tab
  strip at 390px.
- Transaction, settlement, refund and GST tables are the widest content in the
  app. Money columns must stay aligned and readable, which is what the
  `tabular` token is for.
- The one existing `overflow-x-auto` in the app is here; check it is enough.

### Phase M9 — Promotions and Reports (Admin 35–42)

Files: `app/(app)/promotions/page.tsx`, `app/(app)/reports/page.tsx`

- **Known risk:** `grid-cols-3` at `promotions/page.tsx:1173`.
- Coupon and banner forms, including the scheduling date/time fields.
- **Charts are the main work.** Recharts needs an explicit height and a
  container that does not overflow. Axis labels at 390 will collide unless the
  tick count is reduced. The `ChartFrame` accessible table already exists and
  does not need rebuilding.
- The revenue split switch and the date range picker on a phone.

### Phase M10 — Support, Settings, Auth (Admin 43–49, 1, 2)

Files: `app/(app)/support/page.tsx`, `app/(app)/settings/page.tsx`, `app/(auth)/*`

- Support: the ticket sheet (already partly done), the push composer's
  two-column layout, the alert config rows with their paired switches.
- Settings: the three tabs, the permission checkbox grid, the app-config fields.
- Login and forgot-password, including the role picker and the **6-digit OTP
  row** (`grid-cols-6` at `login/page.tsx:411` — correct as-is, but verify it
  fits 390 without the boxes shrinking below a usable tap size).
- Final sweep: the 390px pass across all 49 screens, and the keyboard
  walkthrough from `ADMIN-PENDING.md` folded in here.

---

## Progress

| Phase | Scope | Status |
|---|---|---|
| M1 | Shell, nav, primitives | **Done** — 2026-09-06 |
| M2 | Dashboard | **Done** — no changes needed |
| M3 | Quotations | **Done** — 2026-09-06 |
| M4 | Bookings | **Done** — no changes needed |
| M5 | Pro management | **Done** — 2026-09-08 |
| M6 | Customers | **Done** — 2026-09-08 |
| M7 | Services & pricing | **Done** — 2026-09-08 |
| M8 | Payments & finance | **Done** — no changes needed |
| M9 | Promotions & Reports | **Done** — 2026-09-08 |
| M10 | Support, Settings, Auth | **Done** — no changes needed |

---

## Phase log

### M1 — Shell, nav, primitives · done 2026-09-06

Three real defects, all found by reading the code rather than assumed:

1. **The mobile top bar had no account menu and no notification bell.** Both
   were added to the desktop bar only, so on a phone there was no way to sign
   out at all (the only exit was editing the URL), no way to see which role or
   area you were signed in as, and no view of pending work — the sidebar badges
   that carry it sit behind the drawer. The account menu is now one shared
   `AccountMenu` component rendered by both bars, so the two cannot drift apart
   again.

2. **The mobile bar never named the current section.** Desktop has a
   breadcrumb; mobile said "CFC Admin" on all 49 screens. It now shows the
   section name, truncating rather than pushing the actions off-screen.

3. **`TabsList` was `inline-flex` with no wrap and no scroll.** Pro management
   has seven tabs — at 390px that pushed the whole page sideways. It now
   scrolls as its own region, with the scrollbar hidden.

`scrollbar-none` was **not a real utility** — writing it without defining it
would have generated nothing, the exact silent failure the closed scale exists
to prevent. Added as a proper plugin in the preset.

**Checked and deliberately not changed:** the four unprefixed `grid-cols-3/4`
segmented controls. Their labels are short — "Today", "7 days", "30 days",
"All time" at roughly 85px each — and fit at 390px. Changing them would have
been fixing a non-problem.

Touching the preset requires a **dev server restart**; it is read at boot.

### M2 — Dashboard · done 2026-09-06, no changes needed

Audited rather than assumed. Every grid already carries a breakpoint
(`sm:grid-cols-2 xl:grid-cols-4`, `lg:grid-cols-3`), there are no fixed widths,
the approval-queue row is `flex-wrap` with `w-full sm:w-auto` buttons, and the
live feed uses `min-w-0` + `truncate` throughout.

Changing anything here would have been churn.

### M3 — Quotations · done 2026-09-06

The queue row wraps into three lines on a phone — identity, clock + amount,
decisions — which is the right shape. Two adjustments:

1. **The amount was stranded mid-row.** On its own wrap line the clock + amount
   block stayed left-aligned with the avatar column, leaving dead space beside
   the one number an admin is weighing. Now `ml-auto sm:ml-0` — right-aligned
   on a phone where the eye already goes for a figure, unchanged on desktop.

2. **The identity block now takes `basis-full sm:basis-auto`**, so the wrap is
   deliberate at narrow widths rather than depending on how long the service
   name happens to be.

Verified and left alone: "Edit & approve" already shortens to "Edit" below
`sm:`; all three decision buttons already carry `flex-1 sm:flex-none`; the
detail sheet uses stacked `DetailCard`s, not `DetailShell`.

### M4 — Bookings · done 2026-09-06, no changes needed

The single grid is `lg:grid-cols-2`. **`DetailShell` is no longer used anywhere
in the admin app**, so the viewport-query trap flagged in this plan cannot bite
— checked across every route, not assumed from the support fix.

### M5 — Pro management · done 2026-09-08

Ten tabs, which the M1 scroll fix already covers. Two real defects found:

1. **Fixed-width skeletons overflowed the page while loading.** `w-line-2xl`
   is 256px; in a list row that also carries a 36px avatar, 24px of gaps, 32px
   of padding and an 80px trailing button, only about 218px is available at
   390px. The skeleton was wider than its own row, so **five screens pushed the
   page sideways during load** — the first thing anyone sees. Fixed across
   `pros`, `customers`, `payments`, `services` and `promotions` by capping
   rather than fixing the width (`w-full max-w-line-2xl`), which leaves the
   desktop proportions identical.

2. **Rating, jobs completed and pending payout vanished below `sm`.** They sit
   in a right-hand column that is simply not rendered on a phone. Those are
   the facts an operator judges a pro on, so they now ride along in the meta
   line instead of disappearing. Availability was already handled correctly —
   hidden in the column, shown as a badge inside the row.

Two `max-w-line-*` tokens were added to the preset; writing them without
defining them would have generated nothing.

### M6 — Customers · done 2026-09-08

The same defect as M5's second one, and the reason to check every list rather
than trust the first one that looked fine: **total bookings and total spend
were `hidden sm:flex`** — dropped entirely below 640px.

Those two numbers are what an operator scans a customer list *for*: whether
this is a regular worth keeping, and what they are worth. Plan rule 6 says
nothing is hidden to fix mobile, so they move into the meta line on a phone and
the right-hand column takes over from `sm` up. Desktop is unchanged.

The row itself was already sound — `min-w-0`, `flex-wrap`, `truncate`
throughout.

### M7 — Services and pricing · done 2026-09-08

The flagged unknown was drag-to-reorder on touch. It turned out to be a
**touch-target** problem rather than a drag problem.

`useReorder`'s own docstring is explicit: HTML5 drag never fires on a touch
screen, so a caller must expose move-up/move-down as the real path. This screen
already did — but at `size-6`, **24px**, and as raw `<button>` elements that do
not inherit the `Button` component's coarse-pointer hit expansion. On a phone,
the only way to reorder a category was a pair of 24px targets sitting 1px
apart.

Both arrows now carry the same expansion: 24px painted, 44px to hit, under a
coarse pointer only. The paired arrows still read as one control under a mouse.

Checked and found already sound: no raw `<table>` on this screen, the
`grid-cols-3` at line 1634 is three square image tiles (~110px each at 390px),
pricing uses `DataTable` which card-collapses.

### M8 — Payments and finance · done 2026-09-08, no changes needed

The widest content in the app, and it was already handled. The single raw
`<Table>` in the entire admin app — monthly GST — is correctly wrapped in
`overflow-x-auto`. Nothing is hidden below a breakpoint. The `grid-cols-4`
segmented control carries short labels ("Today", "7 days", "30 days", "All
time") that fit at ~85px each.

### M9 — Promotions and Reports · done 2026-09-08

Two fixes, both found by pattern rather than by reading:

1. **Banner reordering had the identical 24px raw-button defect as M7.**
   Same fix. Finding it came from grepping for the pattern after fixing
   services, not from reading 1,339 more lines.

2. **Chart X-axis labels overlapped at 390px.** Recharts draws every tick by
   default, so a 24-hour peak-hours chart or a 30-day revenue series collapsed
   into unreadable mush on a phone. `minTickGap={16}` with
   `interval="preserveStartEnd"` drops labels until each has room — which costs
   a wide chart nothing, because there is already space and none are dropped.
   Applied to both `BarChart` and `LineChart`, so every chart in the app is
   covered.

`ResponsiveContainer` at `width="100%"` was already correct.

### M10 — Support, Settings, Auth · done 2026-09-08, no changes needed

The support sheet was rebuilt during Phase 21 (single column, `sm:max-w-detail`
so 390px is unaffected) and the push composer's two-column layout is already
`lg:` prefixed. Settings' one unprefixed grid is the 2FA QR code —
`grid-cols-5` inside an 80px `size-emblem` box, correct by design. The login
OTP row is `grid-cols-6` and fits.

A final sweep for the two defect patterns found in M5–M7 — content hidden below
a breakpoint, and fixed widths in flex rows — returned nothing outstanding
across all eleven routes.

---

## Cross-cutting fix — touch targets (applies to all phases)

`Button` size `sm` and `icon` paint at **32px**, which is below the 44px touch
minimum. These are the buttons an operator actually reaches for on a phone:
approve, reject, remove, assign — on every screen.

Growing them would make every admin table row taller at every width. Instead
the **hit area** is extended past the painted box with a pseudo-element, and
only under a coarse pointer. A mouse keeps the tight 32px target that makes
dense rows usable; a finger gets 44px. The button looks identical either way.

This needed a `coarse:` variant, which **does not exist in Tailwind v3** —
`pointer-coarse:` is a v4 feature, so writing it here would have generated
nothing at all. Added as a real plugin variant in the preset.

It is a *pointer* query, not a width one, deliberately: a 390px browser window
on a desktop still has a mouse and keeps the tight targets; a tablet at 1024px
gets the large ones. Width is a poor proxy for how someone is pointing.

---

## How each phase is verified

Per phase, before it is called done:

```
pnpm typecheck                 # 6/6 green
pnpm lint --filter @cfc/admin  # clean
```

Then in the browser at **390 / 768 / 1280**:

1. No horizontal page scroll at 390
2. Every button reachable and ≥44px
3. Nothing overlapping, nothing clipped, no text truncated to meaninglessness
4. Desktop at 1280 **unchanged** from before the phase
5. `window.__cfc.setScenario("slow" | "empty" | "error")` — the loading, empty
   and error states are also laid out at 390, not just the happy path
6. `__cfcActor("area_admin")` — the narrower sidebar and permission states hold up
