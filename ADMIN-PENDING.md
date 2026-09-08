# CFC Admin — What is still pending

Last updated: 2026-09-06

All **49 admin screens** in `SCREEN-INVENTORY.md` §4.3 are built. Phases 1–22 of
`ADMIN-REBUILD-PLAN.md` are complete. This file is the honest remainder.

Verified against the code on the date above, not from memory.

---

## 1. Phase 10 — Live map + manual assignment (Admin 9, 10)

**Status: still on its original pre-rebuild implementation.**

Every other screen went through the full rebuild. This one was skipped during
the run and never came back. It is the largest single gap.

Route: `/bookings?tab=map`

What the inventory asks for:

| # | Screen | Description |
|---|---|---|
| 9  | Live Map / Tracking | Real-time pro locations, active job pins |
| 10 | Manual Assignment | Assign a job to a specific pro when auto-assign fails |

Relevant documented rules (`PLATFORM-FACTS.md`):

- Pros notified per job: **3 nearest, simultaneously** — first to accept wins
- No-pro-available alert after **2 minutes** with no acceptance
- Rating priority: at equal distance, the higher-rated pro is notified first

---

## 2. Phase 23 — Cross-cutting

| Item | Status |
|---|---|
| Extend token lint to `packages/ui` | **Done** — 2026-09-06 |
| Extend `permission.ts` to all 11 sections | **Done** |
| Chart accessibility (`ChartFrame`) | **Done** |
| Role-aware nav, route guard, real sign-in | **Done** |
| Full keyboard walkthrough, all 49 screens | **Not started** |
| 390px mobile pass | **In progress** — see `ADMIN-MOBILE-PLAN.md` |

### Keyboard walkthrough — what it means

Not a code change up front; a pass with the mouse unplugged:

1. Tab reaches every control in a sensible order
2. Enter / Space opens a row (already fixed in `DataTable`)
3. Escape closes every overlay and focus returns to the trigger
4. No focus trap outside a modal, and no lost focus inside one
5. Every icon-only button has an accessible name

---

## 3. Parked open items — raised, awaiting the client's call

These were deliberately deferred during the build.

### 3a. Multi-pro assignment

The agreement specifies **one assignee per booking**. Multi-person jobs (a deep
clean, a full-house painting) are a real operational need that the current model
cannot express.

**Decision needed:** stay with one assignee as written, or extend the model.
Extending it touches the booking type, the assignment UI (Admin 10), the pro
app's job view, and payout splitting — so it is not a UI-only change.

### 3b. "Send back" vs "Reject" wording

Inventory Admin 4 says **Reject**. The dashboard and quotation queue currently
say **Send back**.

"Send back" describes what actually happens — the quote returns to the pro for
revision rather than dying. But the client reads the spec beside the screen, and
a word that does not match invites a question.

**Decision needed:** match the doc exactly (*Reject*), or keep the clearer verb
and note the deviation.

---

## 4. Known issue outside admin scope

`@cfc/consumer` fails `pnpm lint` with **13 pre-existing errors** across three
files:

- `apps/consumer/src/app/(app)/home/page.tsx`
- `apps/consumer/src/app/(app)/category/[id]/page.tsx`
- `apps/consumer/src/components/consumer-nav.tsx`

They are fractional spacing (`gap-1.5`), opacity modifiers (`bg-action/90`) and
arbitrary values — all of which **silently generate no CSS**, so they are real
visual bugs, not style nits.

Not caused by the admin work and not in admin scope, but `pnpm lint` at the repo
root fails until they are fixed.

---

## Current state of the checks

```
pnpm typecheck        6/6 packages green
pnpm lint             @cfc/admin  green
                      @cfc/pro    green
                      @cfc/ui     green  (newly linted, 2026-09-06)
                      @cfc/consumer  13 pre-existing errors
```

## What was fixed on 2026-09-06

`packages/ui` had **no lint script at all** — the six token rules guarded the
three apps but never the library the tokens live in. A dead class in a screen
breaks that screen; the same class in `Combobox` breaks every dropdown in all
three apps.

Adding `@cfc/config/eslint-package` found ten real zero-CSS bugs:

- `max-h-64` in `Combobox` and `FilterBar` — the scroll cap generated nothing,
  so a long option list ran down the page instead of scrolling
- `w-24` as `DataTable`'s **default** skeleton width — every column without an
  explicit width had a zero-width loading skeleton
- `max-w-xl` in `FormShell`, plus five more skeleton widths

The rule itself also had a coverage gap: it only inspected `className`
attributes, but most of this library's styling lives inside `cva()` calls. That
is now covered and verified in both directions.
