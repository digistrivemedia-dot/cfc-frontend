# CFC Consumer — Remaining Screens

**16 screens across 12 phases.** One phase = one screenful of related work.

No typecheck between phases. No commits. Both run once at the end.

---

## Where we are

| Done | Screen | PDF |
|---|---|---|
| ✅ | Service Detail | 12 |
| ✅ | Categories + Sub-category | 10, 11 |
| ✅ | Search | 8, 9 |
| ✅ | Pro Profile | 13 |
| ✅ | Browse | 7 |
| ✅ | Auth (login, register, OTP, forgot) | 3–6 |
| ✅ | Signed-in home | — |

**Remaining: 16 files, ~7,400 lines.** None carry a single `cfc-*` class today.

---

## The standard — not repeated per phase

These are settled. They apply to every screen below without being restated:

- **Page sits on the wash**, sections alternate. No flat white column.
- **Panels are `cfc-card`**, not bordered boxes.
- **Orange is rationed** — one mark per screen, on the thing that persuades or warns. Never two.
- **Teal is the action colour.** Blue is a tint, and the one non-teal action surface.
- **Solid fills with white glyphs.** A pale wash with tinted type is the washed-out treatment the colour spec rejects.
- **Every state carries a badge** — live, pending, done, failed. No status as plain grey text.
- **Cards hover**: teal edge, lift, shadow.
- **Money is `cfc-price`.** Never body text.
- **Empty states are a way forward**, not a dead end.
- **Controls are 44px.** Native radios and checkboxes are replaced — `accent-color` leaves the browser's dark ring.
- **Every class is checked against the served CSS.** This preset silently compiles unknown classes to nothing.
- **Mobile is the same flow as desktop**, not a different one.

---

## Phase 1 — Cart (14)
`cart/page.tsx` · 308 lines

The screen between browsing and paying, and the only one that shows what a customer is about to spend. Line items as cards, quantity steppers matching Service Detail, the coupon field, and a summary that makes the total unambiguous. Empty state routes to Categories.

## Phase 2 — Booking: date, slot, address (15, 16, 17)
`book/[id]/page.tsx` · 1,124 lines

The largest file in the app. Slot grid on the `.cfc-row` selected pattern, saved addresses as selectable cards, the add-address form. **Scope: 3-click booking is a named deliverable — the click count must not rise.**

## Phase 3 — Checkout steps (18, 19, 20, 21)
`book/[id]/checkout-steps.tsx` · 970 lines

Summary, coupon, payment, confirm. **Scope: the platform fee must be shown clearly at checkout, and GST applies to the platform fee only — never to the Pro's fee.** Payment methods on the selected-row pattern. Desktop gets a summary rail; mobile stacks.

## Phase 4 — Booking confirmed (21)
`book/[id]/confirmation.tsx` · 188 lines

**Scope: Pro assigned, live tracking enabled, ETA shown.** The success moment — the one screen where a little celebration is right. Booking ID, what happens next, and a route into tracking.

## Phase 5 — My Bookings (25)
`bookings/page.tsx` · 289 lines

**Scope: tabs — Upcoming / Ongoing / Completed / Cancelled.** Tabs carry counts; each booking is a card with a status badge. Four empty states, not one.

## Phase 6 — Booking detail (26)
`bookings/[id]/page.tsx` · 439 lines

**Scope: full info, cancel/reschedule, contact Pro.** Status timeline, the Pro's card, the money breakdown, and actions that are clearly actions. Two columns on desktop.

## Phase 7 — Tracking and in-progress (27, 28, 29)
`bookings/[id]/track/page.tsx` · 346 lines

**Scope: real-time map, Pro location pin, ETA countdown, job status timeline, before/after photos, OTP shown to Pro, job timer.** Three PDF screens in one route, driven by status. `MapView` is shared — styled around, never inside. The ETA pill is one of the four places orange is spent.

## Phase 8 — Quotation flow (22, 23, 24)
`quotes/[id]/page.tsx` · 454 lines

**Scope: full quotation details, material list, before-photos, accept with 50% advance, decline, ask a question.** CFC's differentiator and the only flow with no mockup. **The advance-vs-balance split is the one thing that must not be ambiguous** — a customer must never confuse "₹2,000 now" with "₹4,000 total". Minimum 2 before-photos are mandatory per §3.2, so the layout must hold them.

## Phase 9 — Review and invoices (30, 31, 32)
`bookings/[id]/review/page.tsx` · 265 · `bookings/[id]/invoice/page.tsx` · 352

**Scope: star rating OTP-gated, feedback chips. Customer invoice: service, Pro, total paid, payment mode. Tax invoice: platform fee, CGST 9%, SGST 9%, PDF download.**

Two things beyond styling: a **print stylesheet** — invoices are the one screen people print, and nobody has written one — and the **Internal Settlement layer must never appear**; it is Admin-only per §3.4.

## Phase 10 — Profile, addresses, wallet (33, 34, 35, 36, 37)
`profile/page.tsx` · 594 · `addresses/page.tsx` · 477 · `wallet/page.tsx` · 423

**Scope: avatar, name, phone, area, stats. Editable fields, photo upload. Saved addresses add/edit/delete. Balance, add money, transaction history covering payments, refunds and wallet credits.**

Also fixes the long-standing type error at `addresses/page.tsx:80` (`body` passed where `description` is expected).

## Phase 11 — Refer, notifications, support (38, 39, 40, 41, 42)
`refer/page.tsx` · 305 · `notifications/page.tsx` · 293 · `support/page.tsx` · 606

**Scope: referral code, share link, rewards tracker. All alerts — bookings, offers, quotations, reminders. FAQ accordion, raise ticket, call helpline, in-app chat, AI assistant.**

Notifications need typed rows — a booking alert and an offer are not the same object. Support carries three PDF screens; I will confirm whether the ticket thread and the AI assistant are real surfaces or stubs, and report rather than invent.

## Phase 12 — Settings, legal, and the sweep (43, 44)
`settings/page.tsx` · 331 · `legal/[doc]/page.tsx` · 134

**Scope: notifications, language, dark mode, logout. Legal pages, version info.**

Then across all 16: every screen at 360 / 620 / 900 / 1280 / 1920, focus rings, empty and loading states, reduced-motion, and a check that no screen carries two orange marks.

**Language stays untouched** — another team owns it. The switcher shows five languages as unavailable and that is correct.

---

## After Phase 12

- `pnpm typecheck` and `pnpm lint` on all three apps
- `pnpm build` on all three
- **Pro and Admin verified unchanged** — nothing in `packages/` is edited in any phase
- Parked items reported for your decision
- Commits and push **only on your explicit word**

---

## Parked, not invented

Where a screen needs a decision I cannot take from the PDF, the code, or the approved home page, I build around it and report it. Known already:

| Item | Why |
|---|---|
| AI assistant (42) | PDF says "integrated progressively" — full screen or widget is unstated |
| Support ticket thread (41) | May be FAQ + helpline only |
| Dark mode (43) | Listed in scope; no palette exists for it |
| Transaction history (37) | Confirm it covers refunds and non-wallet payments |

---

*12 phases. Awaiting your word on how to execute.*
