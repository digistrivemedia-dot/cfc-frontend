# CFC Pro App — Phase 10 verification

> The single verification pass for all 35 screens, batched here as instructed
> rather than run after each phase.
>
> Run date: 2026-09-09 · Branch `main` · 35 of 35 screens built

---

## 1. What passed

| Check | Result |
|---|---|
| `tsc --noEmit` — `@cfc/types` | **0 errors** |
| `tsc --noEmit` — `@cfc/mocks` | **0 errors** |
| `tsc --noEmit` — `@cfc/ui` | **0 errors** (1 fixed, see 2.1) |
| `tsc --noEmit` — `@cfc/pro` | **0 errors** |
| `tsc --noEmit` — `@cfc/admin` | **0 errors** (unaffected) |
| `next lint` — `@cfc/pro` | **0 errors, 0 warnings** (2 fixed, see 2.2 and 2.3) |
| `next build` — `@cfc/pro` | **exit 0**, every route compiles |
| Dead-class sweep | **184 sizing classes, 0 dead** |
| Fact audit | **every figure traces to `PLATFORM-FACTS.md`** |
| Icon-only controls without an accessible name | **0** |
| Table columns hidden below a width | **0** |

---

## 2. What Phase 10 found and fixed

Four real defects, none of which would have produced an error at runtime until
a user hit them.

### 2.1 An unused import that only the package-level typecheck saw
`money-breakdown.tsx` imported `React` and never used it. The pro app's
typecheck passed because it does not compile `packages/ui` in isolation — only
`tsc -p packages/ui` caught it. **Worth knowing: a green app typecheck is not a
green monorepo.**

### 2.2 A React hook called conditionally — a real crash
`(app)/warnings/page.tsx` had `React.useMemo` **below** an early
`if (failed) return`. On a failed fetch the hook count changes between renders
and React throws *"Rendered fewer hooks than expected"*, taking the screen down
— at exactly the moment the pro is already looking at an error.

Both memos moved above every return. This is the one finding in this pass that
would have been a visible crash in production.

### 2.3 A date formatted inline, bypassing the shared formatter
`(app)/jobs/[id]/page.tsx` called `toLocaleString` directly.
`formatSchedule` already does that job — relative day for the near window,
falling back to a real date — and is what every other screen uses. Two formats
for the same field on two screens is precisely why that lint rule exists.

### 2.4 A failed fetch that looked like lost paperwork
`(auth)/approval/page.tsx` caught a failed fetch by setting `loading` false and
leaving `state` null — so the documents section rendered **"No documents on file
yet."**

To a pro waiting on KYC that reads as *their paperwork has been lost*, on the
one screen where they are already anxious and have no way to check. A network
failure and a missing record now say different things, and the failure offers a
retry.

Also aligned: `(app)/status` used `max-w-screen-sm` where every other screen
uses `max-w-detail`. Same 640px, but consistency in the container is worth
having.

---

## 3. The dead-class sweep

The design system's default failure mode is a class that looks plausible and
emits **no CSS at all**: `spacing` is replaced rather than extended, and
`width`, `maxWidth`, `padding`, `inset` and `height` are five separate maps that
do not share values.

The sweep extracts every sizing and spacing class from the app's source and
checks each against the built CSS bundle.

```
scanned 184 distinct sizing classes in apps/pro/src
css bundle: 35 KB
=== every sizing class in the app generates real CSS ===
```

**Three such bugs were caught during the build**, each recorded in
`PRO-OPEN-ITEMS.md` §4:

| Class | What it broke | Cause |
|---|---|---|
| `bottom-tab-bar` | The action bar would have sat **on top of** the tab strip | `tab-bar` was in `padding` only, not `inset` |
| `grid-cols-[...]` | Would have tripped the arbitrary-value rule | needed a named `gridTemplateColumns.action` |
| `max-w-line-sm` | The years field was silently full-width | `line-sm` was in `width` only, not `maxWidth` |

**The pattern never varies: a token existing in one Tailwind scale is no
evidence it exists in a sibling scale.**

---

## 4. The fact audit

Every number in user-visible copy, checked against `PLATFORM-FACTS.md`:

| Figure | Source | Where |
|---|---|---|
| 30 seconds | pro accept timer | Pro 11, 12, 31 |
| 3 pros | notified per job | Pro 12 |
| 15% | CFC commission | Pro 22, 23, 32, onboarding |
| 20 jobs | commission-free onboarding offer | Pro 10, 22, 32, onboarding |
| CGST 9% + SGST 9% | GST on the platform fee | Pro 19, 22, 23, 32 |
| 48 hours | payout window | Pro 10, 19, 22, 24, 25, 32 |
| 100 m | GPS proof radius | Pro 13, 15, 18, 32, 35 |
| 2.5 | auto-block rating | Pro 26, 30, 34, 35 |
| 50% | customer advance on a quote | Pro 16, 17 |
| ₹5,000 | phone-confirmation threshold | Pro 16 |
| 2 photos | minimum on a quotation | Pro 16, 32, 35 |
| 15 minutes | admin quotation window | Pro 16, 17 |

The only two figures the audit could not place were `90000 12345` — the phone
placeholder in a form field. Not a claim.

**No screen states an earnings figure, a payout minimum, or a penalty amount**,
because the agreement gives none of the three. See `PRO-OPEN-ITEMS.md` §1.

---

## 5. Accessibility

| Check | Result |
|---|---|
| Icon-only buttons and links without `aria-label` | **0** |
| Decorative icons marked `aria-hidden="true"` | **138** |
| The 30-second countdown | `role="timer"`, announcing at start, 10s and 5s rather than every second |
| Colour-only status | none — every state carries a text label as well |

The countdown deserves a note: announcing every second would make the rest of
the dialog unreadable to a screen reader, and announcing nothing would hide the
deadline. It speaks at the points a decision changes.

---

## 6. Responsive

Structural rules, checked statically across all 33 page files.

| Rule | Result |
|---|---|
| No page container capped below 640px | **pass** — every screen is `max-w-detail` or wider |
| Fixed bottom bars clear the tab strip | **pass** — `pro-action-bar` uses `inset.tab-bar` (80px) |
| Primary actions at 56px, not the 44px minimum | **25** `size="pro"` actions |
| Explicit touch targets ≥ 44px | **23** |
| Table columns hidden below a container width | **0** |

That last one is deliberate. The admin panel shipped a table whose only
**Assign** button disappeared at exactly the width where it was needed, because
`hideBelow` measures the **container**, not the viewport, and the container had
shrunk. Nothing in the pro app hides a column: every column earns its place at
every size or it is not a column.

### What static checks cannot prove

Whether it *looks* right at 390 / 768 / 1280. The structure is correct and the
tokens all resolve; the remaining risk is aesthetic, and the dashboard is the
screen worth a human eye first because it sets the visual language the other 34
inherit.

---

## 7. Business rules verified against the running app

Not assumed — each was checked through the real mock layer, at its boundary.

| Rule | Verification |
|---|---|
| 15% commission, first 20 jobs free | Job 20 free, job 21 charged. **71,429 gross values** all reconcile; the fee never exceeds gross |
| GST is **not** a pro deduction | `MoneyBreakdown` has no prop for it. Treating it as one would cost each pro **₹270 on a ₹1,500 job** |
| 2 before-photos on a quotation | Rejects at 0 and 1 with the exact shortfall, accepts at 2 |
| Phone confirmation **above** ₹5,000 | ₹5,000 exactly → no call. ₹5,001 → call |
| 100 m GPS gate | Exactly 100 m passes, 100.5 m rejects. **No fix still completes** |
| Offer withholds private data | Address, coordinates and phone all `null` before accept; all released on accept |
| Tab badges match their lists | Exact across all four tabs |
| Rating bars average to the headline | Verified across six pros; counts sum to total, no negatives |
| Chart agrees with its own headline | Exact across today, week and month — **after fixing a ₹1,205 disagreement** |
| Pro sees only pro support tickets | Zero customer-raised tickets leak through |
| Profile edit cannot touch admin-owned fields | Bio, years and area changed; **name and skills did not** |
| Every document rejection carries a reason | And no approval carries one — **after fixing a fixture contradiction** |
| Bank details validated | IFSC, account number and UPI against **17 cases**, all correct |
| Golden Rules state no invented amount | Verified: no rupee figure in any rule or penalty step |

---

## 8. What remains

Nothing blocking. The open items are in `PRO-OPEN-ITEMS.md`:

- **5 client decisions** — the Golden Rules wording, the penalty schedule, the
  payout minimum, partner commission rates, and what "first 20 jobs" counts.
  All five are built so the answer drops in as data.
- **7 spec clauses** that cannot be honoured literally on the web, each built as
  the closest honest thing and saying so on screen.
- **Dark mode and multi-language**, both parked with the client.

One thing worth raising: **clause 4.6 names five languages for customer screens
only.** The pro app is not in that clause at all — so pro-app translation is not
a deferred commitment but an expectation with no contractual backing. A pro
workforce in Tiruchirappalli is arguably more likely to need Tamil than the
customers are, so the clause may have this backwards.
