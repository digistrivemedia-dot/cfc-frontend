# CFC Admin Panel — Design System Rebuild & Screen Optimisation

## Context

The CFC Super Admin panel (49 screens per `SCREEN-INVENTORY.md` §4.3) is built and
walkable, but it is a functional skeleton rather than a finished product. All 11 nav
sections exist as routes with real mock-backed content; the gaps are in design system
breadth and interaction design, not routing or scope.

**This work is design, layout and interaction polish only.** The JSON mock layer
(`@cfc/mocks`) is NOT touched — a separate team swaps in the real backend later, and
the mock API shape must stay stable so that swap remains a one-file change.

**Scope is fixed by the agreement.** No screens are added or removed. The 49 inventory
screens stay exactly as specified. Only how they look and behave changes.

### Confirmed audit findings (read first-hand)

**P0 — blocks usage**
1. `packages/ui/src/components/data-table.tsx:189` — row click is `<tr onClick>` with no
   `tabIndex`, no `role`, no key handler. Keyboard users cannot open a record on any of
   the ~30 list screens. Ironically it works in card mode (`:257` is a real `<button>`).
2. No row selection anywhere. `TableRow` has a `data-[selected=true]` style
   (`primitives/table.tsx:53`) that nothing sets. Payout approval requires 9 individual
   clicks; there is no bulk approve/assign/export.
3. No global search or command palette. 49 screens reachable only by sidebar clicking.

**P1 — reads as unfinished**
4. Status colour is undisciplined — every badge is coloured, so a 20-row table is a
   rainbow and nothing stands out.
5. `primitives/button.tsx` has no `loading` prop. Every async action is double-clickable;
   `FormShell` hand-rolls a label swap at `form-shell.tsx:64-66`.
6. `aria-invalid` is set by `FormField` but nothing styles it — invalid inputs look valid.
7. `config/nav.ts` is 11 flat items, no grouping, no counts. Pending work is invisible
   until you navigate to it.
8. `PageHeader` takes `title: string` + one action. No breadcrumb, no back, no meta row.

**P2 — polish**
9. No sticky table headers, no page-size selector, no column visibility, no saved views.
10. No combobox (Radix `Select` cannot search) — assigning from hundreds of pros is unusable.
11. Dark mode declared but empty (`tokens.css:78`); `bg-surface` is used as *foreground*
    on filled buttons (`button.tsx:29,33,34`) which would invert and vanish.
12. Charts have no accessible representation at all.
13. `DetailRow` uses plain spans, not `<dl>/<dt>/<dd>`.
14. `Pagination` has no page-size selector and no `aria-live` announcement.

### Locked palette — "Cobalt"

White background on all surfaces. No dark mode.

```
STRUCTURE  navy-800 #0E1F3D   sidebar, headers, bottom nav — NEVER a button
           navy-700 #172C50   hover on navy
           navy-600 #1E3763   active on navy
           navy-500 #213A62   count badges on navy
           on-navy  #EDF2F9 / dim #94A6C2 / faint #65788F

BRAND      teal        #00B8C4  logo, fills >=24px only (2.4:1 — fails AA at small size)
           teal-deep   #0891A0  ALL text/links/small controls (4.61:1 AA)
           teal-hover  #077985
           teal-soft   #ECF9FA  selected rows, chip fill
           teal-line   #C2E7EC

CONTENT    white #FFFFFF · canvas #F7F9FB
           ink #0F1728 · ink-muted #5C6472 · ink-faint #89909D
           line #E7EAEF · line-soft #EFF1F5 · line-strong #DCE0E7

STATUS     neutral #F1F3F6 / #5C6472   DEFAULT for every status
           live    #12A05F / #0C6B40 / bg #EDF8F2   online, live tracking ONLY
           clock   #B8790F / #8A5410 / bg #FDF6E9   countdown, expiring ONLY
           critical#C2352F / #9F2B26 / bg #FDF0EF   blocked, failed, negative ONLY
           star    #B98218

CHARTS     #0891A0 #0E1F3D #B8790F #7B5EA7 #4A7C9B #9A5A6B  (max 6)
RADIUS     ctrl 6px · card 8px · app 14px · pill 5px
TYPE       Inter. weights 400/500/600 only. tabular-nums on every number.
```

**Four rules, enforced by lint:**
1. Two teals, two jobs — `#00B8C4` fills only; `#0891A0` for anything under 24px.
2. Navy is structure and is never clickable.
3. Statuses are neutral grey by default; colour is spent only on live / countdown / critical.
   Filled dot = active, hollow dot = inactive. Target: <=4 coloured rows per 20.
4. `font-variant-numeric: tabular-nums` on all numbers. Currency stored as integer paise.

---

## Progress

Updated as each phase lands. A phase is done only when `pnpm typecheck` and
`pnpm lint` are both green and the screen has been walked in the browser.

| # | Phase | Status |
|---|---|---|
| 1 | Token layer — Cobalt palette, z-index, motion, focus, disabled | Done |
| 2 | Primitive gaps — Button loading, Input sizes, Badge dots, Checkbox indeterminate, Table sticky | Done |
| 3 | DataTable v2 — keyboard rows, selection, bulk bar, 3-state sort, error state | Done |
| 4 | New components — command palette, combobox, filter bar, stat card, alerts, timeline, 12 status badges | Done |
| 5 | App shell — navy rail, grouped nav, live counts, breadcrumbs, skip link | Done |
| 6 | Login, forgot password (Admin 1, 2) | Done — `/login`, `/forgot-password` |
| 7 | Dashboard (Admin 3) | Done — `/` |
| 8 | Quotations list + detail (Admin 4, 5) | Done — `/quotations` |
| 9 | Bookings detail + status override (Admin 7, 8) | Done — `/bookings`, click a row |
| 10 | Live map + manual assignment (Admin 9, 10) | Not started |
| 11 | Pro directory, detail, approvals (Admin 11, 12, 13) | Done — `/pros`, `?tab=approvals` |
| 12 | Documents, block, wallet + ledger (Admin 14, 15, 16) | Done — `?tab=documents`, `?tab=wallet` |
| 13 | Warnings, payout approval (Admin 17, 18) | Done — `?tab=warnings`, `?tab=payouts` |
| 14 | Customers (Admin 19, 20, 21) | Done — `/customers` |
| 15 | Categories, sub-categories (Admin 22–25) | Done — `/services` |
| 16 | Pricing, commission (Admin 28, 29) | Done — `/services?tab=pricing` |

| 17 | Transactions, revenue, settlement (Admin 30, 31, 32) --------30
Transactions List
All payment records, filters by method/status/date 31 Revenue Dashboard Today / Weekly / Monthly revenue. Platform fee collected. GST collected. Charts.
32
Settlement Screen
Per-booking internal settlement: Customer paid, Pro share, CFC fee, GST breakdown| Not started |


| 18 | Refunds, GST (Admin 33, 34) 33 Refund Management Refund requests, approve/reject, 1-click Razorpay refund
34
GST Reports
Monthly GST collected — CGST, SGST, total. Export for filing.---| Not started |

| 19 | Coupons, banners (Admin 35, 36, 37)  Promotions & Banners # Screen Description
35
Coupons / Promo Codes
Active coupons, usage stats, enable/disable 36 Add / Edit Coupon Code, discount type, max uses, expiry, user restrictions, first-booking only option
37
Banners / Offers Management
Homepage banners, image upload, link to category/service, scheduling------- | Not started |


| 20 | Reports (Admin 38–42) -------Reports & Analytics # Screen Description
38
Revenue Reports
Revenue by date/category/area, charts, Excel export 39 Bookings Reports Volume, completion rate, cancellation analysis, peak hours
40
Pro Performance Reports
Job completion rates, ratings trends, top earners, no-show count 41 Service Demand Reports Which services are booked most, which areas have highest demand
42
Customer Reports
New signups, retention, repeat booking rate, MAU/DAU-----------| Not started |


| 21 | Support tickets, push, alerts (Admin 43–46) Support & Communications # Screen Description
43
Support Tickets List
All open/closed tickets, priority filter, assign to agent 44 Ticket Detail / Reply Thread view, internal notes, status update, resolve 45 Push Notification Manager Compose and send push to all users / Pros / specific segments 46 Whats App / SMS Alert configuration Configure automated alerts: booking confirm, job assigned, OTP, payout---------| Not started |


| 22 | Platform settings, profile, sub admins (Admin 47, 48, 49)--------Platform Settings # Screen Description
47
Platform Settings Screen
App configs, maintenance mode, feature flags, auto-assign radius, geofencing 48 Admin Profile Screen Admin name, role, password change, 2FA setup
49
Sub Admin Management
Add/remove sub admins, assign permissions, area assignment for Area Admins | Not started |
| 23 | Cross-cutting — chart a11y, permissions, keyboard walk, mobile pass, **extend the off-scale lint rule to `packages/ui`** | Not started |

### Fixed along the way, outside the numbered phases

- **Off-scale dimensions generated no CSS.** `spacing` is replaced rather than
  extended and width/height inherit from it, so `w-56`, `w-72`, `h-14`, `size-9`
  resolved to nothing at all — the sidebar had no width and every avatar had no
  size, silently. Named dimensions added to the preset (`w-rail`, `h-bar`,
  `size-avatar`) and the lint rule extended to catch integer off-scale values,
  not only fractional ones.
- **`bg-surface` used as button foreground** (`button.tsx`, `checkbox.tsx`).
  Replaced with `--color-on-action`, so a background change can never invert a
  label into invisibility.
- **Hydration warning from browser extensions.** `suppressHydrationWarning` on
  `<body>` in all three apps — scoped to the element extensions actually touch.

---

## Phases

Each phase is independently shippable and ends green on `pnpm lint && pnpm typecheck`.

### Foundation (phases 1–4) — everything downstream depends on these

**Phase 1 — Token layer**
`packages/tokens/src/tokens.css`, `packages/tokens/src/index.ts`,
`packages/config/tailwind-preset.js`

- Replace the 36 flat tokens with the Cobalt set above.
- Add what is missing today: a `--z-*` scale (every overlay currently hardcodes `z-50` —
  `dialog.tsx:19`, `sheet.tsx:35`, `popover.tsx:21`, `select.tsx:44`, `dropdown-menu.tsx:21`,
  `tooltip.tsx:20`), motion tokens (duration/easing — `sheet.tsx:41` hardcodes
  `duration-200 ease-out`), `--focus-ring-color` (currently hardwired to action blue in
  `styles.css:36-39`), and a disabled-surface token (today everything is `opacity-50`).
- Keep the closed-scale discipline and the 6 `no-restricted-syntax` lint rules in
  `packages/config/eslint-app.js` — they are the strongest part of the current system.
- Add a lint rule for rule 1: flag `bg-brand-teal` on any element with a text size token.
- Fix the dark-mode landmine now even though dark mode ships never: `button.tsx:29,33,34`
  and `checkbox.tsx:26` use `bg-surface` as a *foreground* colour. Introduce
  `--color-on-action` and use it there.
- Update the JS mirrors in `tokens/src/index.ts` and `charts/theme.ts:13-15`
  (hardcoded hex, a documented drift hazard).

Verify: `pnpm dev --filter admin`, every screen still renders; no raw hex anywhere.

**Phase 2 — Primitive gaps**
`packages/ui/src/primitives/*`

- `button.tsx` — add `loading?: boolean` with spinner, width-lock, `aria-busy`,
  and a double-submit guard. Add `leftIcon`/`rightIcon` slots.
- `input.tsx` — add size variants (`sm` h-8 to pair with `Button size="sm"`; today it is
  fixed `h-touch` 44px and mismatches every toolbar). Add `aria-invalid:border-critical`
  styling. Add trailing adornment + clear button.
- `textarea.tsx` — error state, auto-grow, character counter.
- `checkbox.tsx` — indeterminate rendering (`:23-27` always renders a `Check`), required
  for a correct select-all header.
- `badge.tsx` — add `dot` and `removable` variants (needed for filter chips).
- `table.tsx` — sticky header, `TableFooter`, `TableCaption`.
- `select.tsx` — export `SelectGroup`/`SelectLabel`/`SelectSeparator` + scroll buttons.
- `dropdown-menu.tsx` — add `CheckboxItem`, `RadioItem`, `Label`, `Sub*` (needed for
  column-visibility menus).
- `toast.tsx` — map `warning`, `info`, `loading` classNames; add an action-button style.
- Export `usePrefersReducedMotion` (implemented at `lib/use-prefers-reduced-motion.ts`,
  never exported).

**Phase 3 — DataTable v2**
`packages/ui/src/components/data-table.tsx`

- **Fix the P0 keyboard bug**: rows become focusable with `tabIndex={0}`,
  `role="button"`, Enter/Space handlers, and `stopPropagation` guidance for nested actions.
- Row selection: `selectedIds`, `onSelectionChange`, header select-all using the new
  indeterminate checkbox, wired to the existing `data-[selected=true]` style.
- `<BulkBar>` slot that appears when selection is non-empty.
- Sticky header. Pinned first column option.
- 3-state sort (asc → desc → unsorted); today `handleSort:114-119` can never return to
  unsorted and always starts a new column at desc.
- `error` prop with retry (today a failed fetch must be handled outside the table).
- Default empty state (today `empty` is optional with no default — an empty table with
  no `empty` prop renders literally nothing, `:130`).
- `tabular?: boolean` on `Column` so numeric columns get tabular figures automatically.
- Keep the container-query card collapse — it is genuinely good and better than viewport
  queries for tables inside drawers.

**Phase 4 — New composed components**
`packages/ui/src/components/*`

- `command-palette.tsx` — ⌘K over all 49 screens + recent records. Radix Dialog + a
  filtered list; no new dependency.
- `combobox.tsx` — searchable single-select on Popover + Command.
- `multi-select.tsx` — for status/area/service filters.
- `filter-bar.tsx` — chips showing their current value, "N filters · Clear all",
  URL-state sync.
- `stat-card.tsx` — KPI tile with label, value, delta, optional sparkline.
- `sparkline.tsx` — inline SVG, no library.
- `inline-alert.tsx` — non-toast messaging; there is no inline messaging component at all today.
- `timeline.tsx` — booking status history, audit entries.
- `page-header.tsx` v2 — breadcrumbs, back affordance, meta row, `title: ReactNode`,
  multiple actions, tabs slot.
- `pagination.tsx` v2 — page-size selector, `aria-live` range announcement,
  `<nav aria-label="Pagination">`.
- `states.tsx` — add `LoadingState`, `NoResultsState` (empty-because-filtered reads
  differently from empty-because-new), `ForbiddenState`.
- `detail-shell.tsx` — `DetailRow` becomes real `<dl>/<dt>/<dd>`; `DetailCard` gains
  collapsible + `padded={false}`.
- Domain status badges beyond bookings: payout, quotation, pro, transaction, ticket.
  Today only `BookingStatusBadge` exists (`status-badge.tsx`) and every other screen maps
  tones inline — exactly the "same status coloured two ways" failure its own docstring warns about.

### Shell (phase 5)

**Phase 5 — App shell & navigation**
`apps/admin/src/components/app-shell.tsx`, `src/config/nav.ts`, `(app)/layout.tsx`

- Navy rail on the Cobalt palette; teal brand mark; teal active bar.
- Group the 11 items into 4 sections: Operations / People / Catalogue & money /
  Insight & admin.
- Live counts on Quotations, Pro management, Support.
- Mount the command palette; add a skip-to-content link (none exists in `@cfc/ui`).
- Breadcrumb bar in the top chrome.
- Keep the mobile drawer — the agreement requires a mobile-friendly panel.

### Screens (phases 6–17) — 1–3 screens each

Each screen phase applies the same checklist: Cobalt palette, status discipline,
DataTable v2 with selection + bulk actions where the verb exists, filter-bar with URL
sync, loading/empty/no-results/error states, keyboard reachability, `PageHeader` v2 with
breadcrumbs, tabular figures, and a mobile pass.

| Phase | Route | Inventory screens |
|---|---|---|
| 6  | `(auth)/login`, `(auth)/forgot-password` | Admin 1, 2 |
| 7  | `(app)/page.tsx` | Admin 3 — dashboard, StatCards + sparklines, live feed |
| 8  | `(app)/quotations` | Admin 4, 5 — SLA clock discipline, bulk approve |
| 9  | `(app)/bookings` — list + detail | Admin 6, 7, 8 |
| 10 | `(app)/bookings` — map + assign | Admin 9, 10 — combobox for pro assignment |
| 11 | `(app)/pros` — directory + detail + approvals | Admin 11, 12, 13 |
| 12 | `(app)/pros` — documents, block, wallet | Admin 14, 15, 16 |
| 13 | `(app)/pros` — warnings, payouts | Admin 17, 18 — bulk payout approval |
| 14 | `(app)/customers` | Admin 19, 20, 21 |
| 15 | `(app)/services` — categories, sub-categories | Admin 22, 23, 24, 25 |
| 16 | `(app)/services` — services, pricing, commission | Admin 26, 27, 28, 29 |
| 17 | `(app)/payments` — transactions, revenue, settlement | Admin 30, 31, 32 |
| 18 | `(app)/payments` — refunds, GST | Admin 33, 34 |
| 19 | `(app)/promotions` | Admin 35, 36, 37 |
| 20 | `(app)/reports` | Admin 38–42 — chart a11y, date-range wiring |
| 21 | `(app)/support` | Admin 43, 44, 45, 46 |
| 22 | `(app)/settings` | Admin 47, 48, 49 |

### Close-out (phase 23)

**Phase 23 — Cross-cutting pass**
- Chart accessibility: `role="img"`, `aria-label`, `accessibilityLayer` (available in
  Recharts 2.15), data-table fallback.
- Extend `packages/types/src/permission.ts` from 4 permissions (all `bookings.*`) to cover
  all 11 sections. Today `areaScope()` is honoured only by `getBookings`
  (`mocks/src/api/bookings.ts:35-37`) — an Area Admin sees every pro and customer.
  *Types and UI gating only; no mock API signature changes.*
- Full keyboard walkthrough of all 49 screens.
- Mobile pass at 390px.
- Verify the four palette rules hold everywhere.

---

## Reuse — do not rebuild these

- `DataTable` container-query card collapse (`data-table.tsx:97-112`) — extend, don't replace.
- `mocks/src/control.ts` — `Scenario` harness with `normal/empty/error/slow/hang` and
  `window.__cfc.setScenario()`. Best infrastructure in the repo; every phase uses it to
  exercise states.
- `apps/admin/src/lib/actor.tsx` — `window.__cfcActor("area_admin")` role switching.
- `packages/ui/src/lib/format.ts` — `formatCurrency`, `formatCurrencyAxis` ("₹1.2L"),
  `formatDate`, `formatSchedule`.
- `packages/ui/src/lib/csv.ts` — `toCsv`/`downloadCsv`.
- `packages/ui/src/lib/cn.ts` — tailwind-merge extended with the custom scales.
- `packages/config/eslint-app.js` — the 6 restriction rules; extend, never weaken.
- The `Suspense` + `useSearchParams` split pattern in
  `apps/consumer/src/app/(auth)/otp/page.tsx:215-226`.

---

## Verification

Per phase:
```
pnpm lint && pnpm typecheck          # must be green
pnpm dev --filter admin              # localhost:3002
```

Per screen phase, in the browser:
1. `window.__cfc.setScenario("slow")` → loading skeletons render, no layout shift
2. `window.__cfc.setScenario("empty")` → correct empty state, and the *no-results*
   variant when filters are active
3. `window.__cfc.setScenario("error")` → error state with a working retry
4. `window.__cfc.setScenario("normal")` → data renders
5. `window.__cfcActor("area_admin")` → scoped view; `("pro")` → forbidden state
6. Keyboard only: Tab to every control, Enter/Space opens rows, Escape closes overlays,
   focus returns to the trigger
7. DevTools responsive at 390px → tables become cards, drawer works
8. Count coloured rows in any 20-row table — must be <= 4

There is no test infrastructure in the repo (no runner, no config, no test files) and
adding one is out of scope here. Verification is the manual matrix above.
