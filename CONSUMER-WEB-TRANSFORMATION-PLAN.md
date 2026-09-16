# CFC Consumer — Web Transformation Plan

**Scope:** Redesign all 43 remaining consumer screens as a responsive **web application**
on the approved design system, without touching Pro or Admin.

**Status:** Awaiting approval. No code written yet.
**Date:** 2026-09-16
**Target:** `frontend/apps/consumer` only.
**Revision:** v3 — scope re-read from the PDF; parking rule added (see §10).

---

## 1. What we are doing, in one paragraph

The signed-out home page and the signed-in home page are approved and built on a CSS
design system (`.cfc-page` vocabulary + design tokens). The other 43 screens are built
on raw Tailwind utilities and look visibly different — flatter, greyer, and composed
like an admin console rather than a consumer marketplace. This plan migrates those 43
screens onto the same approved system, screen by screen, in 12 phases (0–11), following the
PDF's Customer App screen inventory (screens 1–44).

**We are not changing the colour palette.** Every colour in the client's mockups already
exists in the code. The gap is *how the colours are spent* and *how pages are composed* —
not which colours exist.

---

## 2. Reference hierarchy — read this before any design decision

This ordering is the most important thing in the plan. Getting it backwards produces
phone layouts on a web app.

### 1st — The approved home page is the DESIGN AUTHORITY

`src/app/(home)/page.tsx` + `home/page.tsx` + `home-pages.css`.

**Everything about how a screen looks comes from here:** composition, layout, section
rhythm, band alternation, card construction, typography, spacing, motion, hover
behaviour, responsive approach. It is built, approved, and real.

When any question arises about how a screen should look, the answer is "how does the
home page do it?"

### 2nd — The 4 client mockups are a COLOUR REFERENCE

They are phone mockups made to communicate the palette. **Their layouts are NOT the
target.** We do not copy their composition onto web screens.

What we take from them:
- Confirmation that the two-colour system (`#02BABC` cyan / `#2464D0` blue) is applied
  app-wide, not just on home
- The 3-and-3 alternating tile rotation
- **Three genuinely useful patterns:** solid-blue trust chip among outline chips; the
  selected-package row; the cyan-tinted outline button

What we ignore: their screen layouts, their information hierarchy, their phone-shaped
proportions.

### 3rd — The PDF is the SCOPE REFERENCE

Which 44 screens exist and what each must contain. Not a design reference.

### Target: a WEB APPLICATION

Real breakpoints, hover states, focus rings, keyboard navigation, print stylesheets,
desktop layouts. The PDF says "screens" because it was written for a mobile app. This
is not that.

---

## 2A. Scope facts taken directly from the PDF

Re-read from the agreement, not from memory. These are requirements, not inventions.

### The customer product is a WEB APPLICATION

| PDF location | What it says |
|---|---|
| §1.1 Applications | Customer App **+ PWA** |
| §1.2 Tech Stack | **PWA (Customer Web) — Next.js** |
| §2 User Roles, Tier 1 | "Books services via app **or PWA**" |
| §4.1 heading | Customer App (Android + iOS **+ PWA**) — 44 screens |
| Short overview | "**Mobile responsiveness**" listed as a named deliverable |

The 44 screens are explicitly in scope for the PWA. "Proper web application with proper
mobile responsiveness" is what the agreement asks for.

### Booking flow — §3.1, a 3-CLICK TARGET

| Step | Screen | Action |
|---|---|---|
| 1 | Service Select | Customer picks category → service. Search or browse grid |
| 2 | Service Details + Slot | View price, inclusions, warranty. Pick date/time slot |
| 3 | Address + Contact | Confirm location. Saved address or new pin |
| 4 | Payment Summary | **Platform fee shown.** Coupon applied. UPI/Card/COD |
| 5 | Booking Confirmed | Pro assigned. Live tracking enabled. ETA shown |

**"3-click booking" is a named deliverable (§1, item 1).** Any redesign that adds steps
or taps between service and checkout violates scope. This constrains Phase 3.

### Quotation flow — §3.2, customer-facing parts

- Customer receives quotation notification; views details **and photos**
- Accepts (**pays 50% advance**) or Declines
- Balance payment collected on completion; invoice auto-generated

Rules that must be visible to the customer: minimum **2 before-photos** are mandatory on
any quote (so the screen must display them), and quotes above ₹5,000 carry extra approval.

### Billing — §3.4, the customer sees exactly two of three layers

| Layer | Who sees it | Contents |
|---|---|---|
| **Customer Invoice** | Customer | Service name, Pro name, total paid, payment mode, CFC branding |
| **Tax Invoice** | Customer + Admin | Service fee, platform fee, **CGST @9%, SGST @9%**, total payable |
| Internal Settlement | **Admin only** | — **must never appear on a consumer screen** |

**GST is applied on the platform fee only — not on the Pro's professional fee.** The
invoice screens must present this correctly. Platform fee is "shown clearly to customer
at checkout" (§3.4).

### Named consumer features in scope (§1)

3-click booking · live tracking · quotation flow · wallet · PWA support · voice search ·
AI chat assistant · refer & earn · coupons/promotions · ratings & reviews (OTP-gated) ·
notifications (FCM push + SMS) · 50+ admin-managed service categories.

**Nothing hardcoded:** "All categories, sub-categories, services, and pricing are created
and managed entirely by the Admin. No services are hardcoded" (§1.3). Layouts must
therefore survive variable category counts and name lengths.

### Explicitly OUT of scope for this work

- **Multi-language (clause 4.6)** — handled by another team. We build nothing for it.
  *One design consequence only:* layouts must not break when text expands later, so no
  fixed-width buttons and no text baked into images. Costs nothing now; expensive to
  retrofit across 43 screens.
- Backend, API, database, payments integration — separate workstreams
- Pro app and Admin panel — different team, and rule 1 protects them

---

## 3. Evidence this approach is sound

Measured from the codebase, not assumed:

| Check | Result |
|---|---|
| CSS files in the consumer app | **2** (`brand.css` 232 lines, `home-pages.css` 1,765 lines) — no per-page CSS |
| Class reuse when the signed-in home was migrated | **63 of 74 = 85% reused**, only 11 new |
| Raw hex colours in the 43 screens | **0** (2 grep hits are inside comments) |
| Token-based utility usages | **~700** across 37 files |
| Naming convention | BEM-style families: `pro-*` (36), `rail-*` (28), `bk-*` (25), `cart-*` (23) |

The 85% reuse figure is the important one: a second page built on this system needed
almost no new CSS. That is a working design system, not per-page styling.

---

## 4. Hard constraints

Non-negotiable, every phase.

1. **Never edit `frontend/packages/`.** `@cfc/ui` (57 components) and `@cfc/tokens` are
   shared by Pro and Admin, built by another team. All overrides happen inside
   `apps/consumer`.
2. **No new colours.** Every fill resolves to an existing token. Enforced by lint
   (Phase 0), not by discipline.
3. **Presentation only.** Data flows through `@cfc/mocks` with `@cfc/types`. No screen's
   data logic, routing, or state machine changes. **Restyle in place — never rewrite a
   file from scratch.**
4. **Web, not mobile.** See §2.
5. **Orange stays rationed.** Badges only (`20% OFF`, `MOST BOOKED`, `NEW`, live-ETA pill).
6. **No GitHub push without explicit approval.** See Phase 11.
7. **Nothing hardcoded (§1.3).** Categories, services and pricing are Admin-managed and
   fully dynamic. Layouts must survive a variable number of categories and long service
   names — no grid that only works at exactly 12 tiles, no label assumed to fit one line.
8. **Text-expansion safe.** Another team adds languages later. No fixed-width buttons, no
   text baked into images, no single-line assumptions. This is layout hygiene, not i18n
   work — we build no translation system.

### 4.1 Breakpoint constraint

Breakpoints live in the **shared** `packages/config/tailwind-preset.js`
(`sm:640 md:768 lg:1024 xl:1280`). The home page CSS breaks at **1080 / 900 / 620**.

Rule 1 forbids editing the shared preset. So:
- New CSS uses the home page's 1080/900/620 media queries.
- Consumer-only breakpoints are **added** via `theme.extend.screens` in
  `apps/consumer/tailwind.config.js` (`cfc-sm: 620px`, `cfc-md: 900px`, `cfc-lg: 1080px`).
  Extending is additive and cannot affect Pro or Admin.
- As screens migrate from Tailwind to CSS classes, the mismatch disappears.

**This fixes a live bug:** at ~700px the header switches to mobile layout while the page
body is still desktop, because the two systems disagree on where to break.

---

## 5. The design gap, in measured numbers

**Baseline re-measured against the current working tree on 2026-09-16.**
These are the figures Phase 11's reuse report is measured against.

```
text-ink          207  ┐
text-ink-muted    179  ├─ ~390 uses of grey/navy text on white
bg-surface        101  ┘
text-action        75     teal as a text accent
bg-action-subtle   48
text-ink-faint     47
border-action      39
bg-action          32  ┐
bg-clock            5  ├─ ~45 uses of saturated fill
text-promo          7  │
bg-structure        1  ┘
```

The 43 screens are **grey-on-white with teal accents**. The home page is **a sequence of
coloured bands with white cards floating on them**. Identical colours; opposite ratio.

> **Note on re-measurement.** A review flagged these as stale (claiming 68 / 1). Re-run
> against the current working tree, `bg-action` is 32 and `text-promo` is 7 — unchanged.
> The figures above are current. Re-measure again at Phase 0 start if further edits land
> before work begins.

### The home page's actual mechanism — band alternation

| Section | Background |
|---|---|
| Hero | Pale teal wash `#F1FAFB` |
| Offer strip | **Deep navy band**, full-bleed |
| Browse categories | White |
| Promo cards | Pale teal band, holding teal/blue/blue cards |
| Most booked | White, cards on pale blue-grey media panels |
| Three steps | Pale teal band |
| Why CFC | White |
| Join as a Pro | **Deep blue band** + bright stat tiles |
| Reviews | Pale teal band |
| FAQ | White |
| App download | Pale teal band |
| Footer | **Deep navy** |

The page never runs two white sections together. This is what stops a 6,000px scroll
reading as one flat sheet — and it is exactly what the 43 screens lack.

---

## 6. Screen inventory — PDF mapping

All 44 PDF screens covered by 29 files (~13,400 lines). Web routes correctly collapse
several mobile "screens" into one route with steps or tabs.

| PDF # | Screen | File | Lines | Phase |
|---|---|---|---|---|
| 1 | Splash | `(auth)/splash/page.tsx` | 156 | 8 |
| 2 | Onboarding Walkthrough | `(auth)/onboarding/page.tsx` | 436 | 8 |
| 3 | Login | `(auth)/login/page.tsx` | 192 | 8 |
| 4 | Register | `(auth)/register/page.tsx` | 186 | 8 |
| 5 | OTP Verification | `(auth)/otp/page.tsx` | 273 | 8 |
| 6 | Forgot Password | `(auth)/forgot-password/page.tsx` | 139 | 8 |
| 7 | Home | `(app)/browse/page.tsx` | 1,003 | 2 |
| 8, 9 | Search + Results | `(app)/search/page.tsx` | 777 | 2 |
| 10, 11 | Category + Sub-category | `(app)/categories/page.tsx` | 607 | 2 |
| 12 | Service Detail | `(app)/service/[id]/page.tsx` | 726 | 2 (pilot) |
| 13 | Pro Profile | `(app)/pro/[id]/page.tsx` | 460 | 2 |
| 14 | Select Service Options | `(app)/cart/page.tsx` | 308 | 3 |
| 15, 16, 17 | Date/Slot + Address | `(app)/book/[id]/page.tsx` | 1,123 | 3 |
| 18–21 | Summary, Coupon, Payment | `(app)/book/[id]/checkout-steps.tsx` | 967 | 3 |
| 21 | Booking Confirmation | `(app)/book/[id]/confirmation.tsx` | 188 | 3 |
| 22, 23, 24 | Quotation flow | `(app)/quotes/[id]/page.tsx` | 454 | 5 |
| 25 | My Bookings | `(app)/bookings/page.tsx` | 289 | 4 |
| 26 | Booking Detail | `(app)/bookings/[id]/page.tsx` | 439 | 4 |
| 27, 28, 29 | Tracking / In-progress | `(app)/bookings/[id]/track/page.tsx` | 346 | 4 |
| 30 | Rate & Review | `(app)/bookings/[id]/review/page.tsx` | 265 | 6 |
| 31, 32 | Customer + Tax Invoice | `(app)/bookings/[id]/invoice/page.tsx` | 352 | 6 |
| 33, 34, 35 | Profile, Edit, Addresses | `(app)/profile/page.tsx` | 594 | 7 |
| 35 | My Addresses | `(app)/addresses/page.tsx` | 476 | 7 |
| 36, 37 | Wallet + Transactions | `(app)/wallet/page.tsx` | 423 | 7 |
| 38 | Refer & Earn | `(app)/refer/page.tsx` | 305 | 7 |
| 39 | Notifications | `(app)/notifications/page.tsx` | 293 | 7 |
| 40, 41, 42 | Help, Tickets, AI Assistant | `(app)/support/page.tsx` | 606 | 7 |
| 43, 44 | Settings + Legal | `(app)/settings/page.tsx` | 331 | 7 |
| 44 | Legal documents | `(app)/legal/[doc]/page.tsx` | 134 | 7 |

**Gaps to confirm in Phase 7:**
- #42 AI Chat Assistant — inside `support/page.tsx`; verify it is a real surface
- #41 Support ticket thread — verify the thread exists, not just FAQ + helpline
- #37 Transaction History — verify it covers refunds and non-wallet payments

---

## PHASE 0 — Foundation & restructure

**No visible screen changes. Everything after depends on this.**

### 0.1 Split the CSS into layers

`home-pages.css` is 1,765 lines in one file. Adding 43 screens makes it unmaintainable.
Restructure by role (standard ITCSS layering):

```
src/styles/
├── tokens.css      ← colour, type, shadow, spacing (from brand.css)
├── primitives.css  ← buttons, chips, inputs, badges
├── patterns.css    ← cards, rows, banners, tiles, selected states
├── layout.css      ← bands, grids, page rhythm, wrappers
└── pages/
    └── home.css    ← genuinely home-only (hero, marquee, pro-band)
```

**Rule:** a class lives in `pages/` only if it cannot appear on a second screen.

> ### ⚠ THIS IS THE RISKIEST STEP IN THE ENTIRE PLAN
>
> `AppShell` imports `home-pages.css`, and **all 43 screens render inside `AppShell`**
> (verified: `(app)/layout.tsx` line 15). Splitting this file therefore affects all 44
> screens, not just the two home pages.
>
> **Verification gate — all six must render identically before proceeding:**
> 1. `/` (signed-out home)
> 2. `/home` (signed-in home)
> 3. `/categories`
> 4. `/wallet`
> 5. `/bookings`
> 6. `/service/[id]`
>
> Screenshot before and after. Any visual difference = revert and re-approach. This is a
> pure refactor; zero visual change is the only acceptable outcome.

### 0.2 Build the six patterns

Three from the mockups (colour reference), three from the home page (design authority).

1. **`.chip-outline` / `.chip-solid`** — when three trust badges sit in a row, the most
   important (verification/insurance) is solid blue with white text; the other two
   outline. Not all three identical.
2. **`.pkg-row` selected state** — cyan border, faint cyan-tinted fill, filled radio dot.
   Currently ad-hoc in **24 places**. Becomes one named pattern. This is the slot
   picker's core interaction.
3. **`.info-banner`** — quiet informational banner, distinct from the offer CTA banner.
   Uses existing `--color-border-soft`; **no new hex** (the audit proposed `#E7EEF3`,
   which breaks its own "no new colours" rule — rejected).
4. **`.btn-outline`** — cyan border, cyan text, *faintly cyan-tinted* fill. Current
   `.btn-ghost` is `background: #fff`, which renders flatter than the client's design.
   A real shipped discrepancy, confirmed in code.
5. **Band alternation** — `.sec-white` / `.sec-wash` / `.sec-deep`, alternating by default.
6. **Tile rotation** — 3-and-3 teal/blue alternating plates for any icon grid.

Every pattern ships with defined **desktop behaviour**, not just mobile.

### 0.3 Guardrails

- **Stylelint rule** — build fails on a raw hex outside `tokens.css`.
- **Pattern reference page** at `/dev/patterns` — every component in every state on one
  page. How the system gets reviewed without clicking through 43 screens.
- **Consumer-only breakpoints** via `theme.extend.screens` (§4.1).

### 0.4 Fix the known defect

`(app)/addresses/page.tsx:80` — `body` prop passed where `description` is expected.
Pre-existing TypeScript error. Fixed here so the baseline is clean.

**Exit:** six pages pixel-identical · pattern page renders all six patterns · stylelint
passes · **visual check by you**.

---

## PHASE 1 — Shell & navigation  *(AUDIT, DO NOT REBUILD)*

> **These components already exist and work:** `AppShell`, `app-header`, `site-footer`,
> `cfc-sprite`, `CartBar`. **Audit and fix them. Do not rebuild.** Rebuilding working
> shell code is how the header broke twice in earlier sessions.

The actual work:
- **Resolve the breakpoint mismatch (§4.1)** — this is the real deliverable
- Mobile bottom nav: filled-cyan active tab (from mockup colour reference)
- Desktop header: verify location picker, search, account menu across widths
- Skip-to-content link, focus management on route change

**Exit:** shell correct at 360/620/900/1280/1920 · no layout shift between breakpoints ·
keyboard navigable · **visual check by you**.

---

## PHASE 2 — Home & Discovery (PDF 7–13)

~3,570 lines. Highest-traffic path after the home page.

| Screen | Work |
|---|---|
| **#12** Service Detail (726 ln) — **PILOT** | Built on home page composition. Uses trust-chip row, `.pkg-row` package selector, media panel |
| **#7** Browse (1,003 ln) | Band alternation; tile rotation on the category grid |
| **#8, 9** Search + Results (777 ln) | Result cards on media panels; filter/sort as desktop sidebar, sheet on mobile |
| **#10, 11** Categories (607 ln) | 3-and-3 tile rotation |
| **#13** Pro Profile (460 ln) | Verified badge, rating block, review list |

**Service Detail runs first as the pilot** — it exercises four of the six patterns. You
review it against the home page's design language before the other 42 screens proceed.

**Exit:** every screen has ≥1 band change · no screen is one flat white column ·
**visual check by you**.

---

## PHASE 3 — Booking flow (PDF 14–21)

~2,580 lines. **Revenue path — highest care. Styling only; step logic untouched.**

| Screen | Work |
|---|---|
| **#14** Cart (308 ln) | Line items, quantity, price summary |
| **#15–17** Date/Slot/Address (1,123 ln) | Slot grid using `.pkg-row`; address cards; map pin |
| **#18–21** Checkout (967 ln) | Desktop: summary rail beside steps. Mobile: stacked. **Platform fee shown clearly (§3.4)** |
| **#21** Confirmation (188 ln) | Success tick, booking ID panel card, info banner, outline + solid button pair. **Pro assigned, live tracking enabled, ETA shown (§3.1 step 5)** |

> **Scope constraint — §3.1 "3-click booking" is a named deliverable.** The redesign must
> not add steps, taps or screens between service selection and checkout. If a design
> improvement would lengthen the path, it does not ship. Count the clicks before and after.

**Exit:** full booking completes at every breakpoint · **click count not increased** ·
platform fee visible at checkout · no data/step regression · **visual check by you**.

---

## PHASE 4 — Bookings & tracking (PDF 25–29)

| Screen | Work |
|---|---|
| **#25** My Bookings (289 ln) | Tabs (Upcoming/Ongoing/Completed/Cancelled); cards on bands |
| **#26** Booking Detail (439 ln) | Two-column on desktop; status timeline |
| **#27–29** Tracking (346 ln) | Live map, ETA pill (rationed orange), timeline, before/after photos |

`MapView` comes from `@cfc/ui` — style **around** it, never inside it.

**Exit:** map responsive without overflow · timeline legible on mobile · **visual check**.

---

## PHASE 5 — Quotation flow (PDF 22–24)

454 lines. CFC's genuine differentiator.

- **#22** Quotation Received — material list, **before-photos (minimum 2 are mandatory per
  §3.2, so the layout must display at least two)**, labour cost, full breakdown
- **#23** Quotation Accept — **50% advance payment**, Decline, Ask a Question
- **#24** Accepted Confirmation — advance paid, balance due, Pro start time

**No client mockup exists for these screens — which is fine.** The home page is the
design authority and covers them fully, exactly as it covers every other screen.

**One thing worth your eye before the build:** the advance-vs-balance money split. A
customer must never confuse "₹2,000 now" with "₹4,000 total." That is an
information-hierarchy decision, not a design-system gap. A quick layout review before
styling 454 lines around it.

**Exit:** amounts unambiguous at every breakpoint · money layout reviewed by you first.

---

## PHASE 6 — Post-service & billing (PDF 30–32)

| Screen | Work |
|---|---|
| **#30** Rate & Review (265 ln) | Star rating (yellow — its only use), feedback chips. **OTP-gated per §1 item 19** |
| **#31, 32** Invoices (352 ln) | **Customer Invoice:** service name, Pro name, total paid, payment mode, CFC branding. **Tax Invoice:** service fee, platform fee, CGST 9%, SGST 9%, total payable. PDF download |

> **Scope constraint — §3.4.** GST applies to the **platform fee only**, never to the
> Pro's professional fee. And the third billing layer, **Internal Settlement, is
> Admin-only — it must never appear on a consumer screen.** Verify both while restyling.

**Web-specific:** invoices need a **print stylesheet** — a browser-only concern the mobile
team never faced. `@media print`: hide chrome, black-on-white, no page-break inside a
table row.

**Exit:** invoice prints correctly to A4 · GST breakdown readable · **visual check**.

---

## PHASE 7 — Account & support (PDF 33–44)

~3,000 lines. Largest screen count, lowest risk — mostly lists and forms.

| Screens | Files |
|---|---|
| **#33–35** Profile, Edit, Addresses | `profile/` (594), `addresses/` (476) |
| **#36, 37** Wallet + Transactions | `wallet/` (423) |
| **#38** Refer & Earn | `refer/` (305) |
| **#39** Notifications | `notifications/` (293) |
| **#40–42** Help, Tickets, AI Assistant | `support/` (606) |
| **#43, 44** Settings + Legal | `settings/` (331), `legal/` (134) |

Confirm the three inventory gaps from §6.

**Exit:** forms usable on desktop (not stretched full-width) · gaps confirmed or logged ·
**visual check**.

---

## PHASE 8 — Onboarding & auth (PDF 1–6)

~1,382 lines. Deliberately last — **splash is a mobile concept** and its web fate is
decided with full context.

| Screen | Decision |
|---|---|
| **#1** Splash (156 ln) | Recommend: not a route on web. Demote or remove — **your call** |
| **#2** Onboarding (436 ln) | Recommend: first-visit only, not a permanent route — **your call** |
| **#3–6** Login, Register, OTP, Forgot | Centred card on a branded band |

**Exit:** auth works at every breakpoint · splash/onboarding decision recorded.

---

## PHASE 9 — Responsive sweep, accessibility & polish

Cross-cutting pass over all 44 screens. **Design work ends here.**

- **Breakpoints:** 360 / 620 / 900 / 1280 / 1920 on every screen
- **Motion:** consistent reveal/hover; `prefers-reduced-motion` honoured
- **Accessibility:** focus rings, WCAG AA contrast, keyboard nav, landmarks, alt text
- **States:** loading skeletons, empty states, error states — per screen
- **Print:** invoices verified
- **Dead CSS removal:** Tailwind utilities orphaned by migration

**Exit:** no horizontal scroll at any width · AA contrast · reduced-motion clean.

---

## PHASE 10 — Parked decisions  *(YOUR CALL — RUNS BEFORE VERIFICATION)*

The parking lot, emptied. Everything from Phases 0–9 that needed your decision rather
than mine is settled here, together, before anything is verified or pushed.

**This phase is a conversation, not a build.** We go through the list, you decide, and
only then does anything get built — and only what you approve.

It sits before verification deliberately: a decision here may change code, and that code
must be inside the Phase 11 typecheck and build.

### Already parked (known at planning time)

| # | Item | Why parked | Source |
|---|---|---|---|
| P1 | **Multi-language** — JSON translations, 5 languages, no-restart switch | **Another team owns this.** We build nothing. Settings already shows the 5 languages as unavailable | Clause 4.6 |
| P2 | **Splash screen (#1) on web** | Splash is a mobile concept. Recommend demote or remove — your business call | PDF #1 |
| P3 | **Onboarding walkthrough (#2) on web** | Recommend first-visit only, not a permanent route — your call | PDF #2 |
| P4 | **AI Chat Assistant (#42)** | PDF says "integrated progressively based on platform usage." Full screen or widget? Scope unclear | PDF #42, §1 item 16 |
| P5 | **Support ticket thread (#41)** | Verify whether a real thread exists or only FAQ + helpline | PDF #41 |
| P6 | **Transaction History (#37)** | Verify it covers refunds and non-wallet payments, not just wallet | PDF #37 |
| P7 | **Figma small-element values** | Chip border weights, "Most Popular" badge. Needs the editable Figma, not a screenshot | Clause 4.7 |
| P8 | **Quotation money layout** | Advance vs. balance hierarchy — an opinion call, not a system gap | PDF §3.2 |
| P9 | **Voice search UI** | Named in scope; PDF specifies Android native speech. Web equivalent is a different mechanism | §1 item 15 |
| P10 | **PWA install / offline behaviour** | "PWA support" is named in scope but never specified. Manifest? Install prompt? Offline? | §1 item 1, §1.2 |

Items P4–P6 and P9–P10 may resolve themselves during the relevant phase once I read the
code. Anything that resolves gets struck off with a note, not silently dropped.

### Growing list

Each phase adds any new parked item here with: what it is, why it needed you, what I did
in the meantime, and what changes if you decide differently.

**Exit:** every parked item decided, or explicitly deferred past handover by you.

---

## PHASE 11 — Verification & GitHub  *(REQUIRES YOUR EXPLICIT APPROVAL)*

> ## 🔒 NOTHING IN THIS PHASE RUNS WITHOUT YOUR EXPLICIT GO-AHEAD
>
> **No push to GitHub. No remote operation of any kind.** Phases 0–9 commit locally only.
> This phase begins only when you say so, in words, at the time.

### 11.1 Full verification suite — deferred here deliberately

Typecheck, lint and build are **slow**, so they are not run per-change during Phases 0–9.
They all run here, clean, before anything reaches GitHub:

- `pnpm typecheck` — all three apps
- `pnpm lint` — all three apps
- `pnpm build` — all three apps
- **Pro and Admin render unchanged** — proves rule 1 held

**This may surface issues accumulated across ten phases. Budget real time for it rather
than assuming it passes.**

### 11.2 Documentation

- **44-row traceability table** — every PDF screen → route → phase → status. Answers
  "the contract says 44 screens, the app has 29 routes."
- **Reuse report** — new vs. reused classes per phase, measured against the §5 baseline.
  A phase adding 40 new classes means the system is failing.
- **Design system doc** — the six patterns, tokens, when to use each.

### 11.3 Commit and push

- Phases 0–9 each end with **one local commit** — ten reviewable commits, each a working
  app. A senior cannot review one enormous diff.
- Branch off `main`; never commit directly to it.
- **Push only after you say so.**

**Exit:** all 44 traced · three apps build clean · Pro/Admin unaffected · **you approve
the push**.

---

## 7. Per-phase working method

Every phase, without exception:

1. **Read** the screen fully before editing. Understand its data and states.
2. **Restyle in place.** Never rewrite from scratch — that is how data logic breaks.
3. **Reuse first.** Check `patterns.css` before writing any new class.
4. **Verify** at all five breakpoints.
5. **Park, never invent.** Anything needing your decision goes to Phase 10 (§7A). Build
   around it and carry on.
6. **Commit locally** at phase end. No push.
7. **Report**: screens done, classes reused vs. new, **anything parked to Phase 10**.

**Visual check by you at the end of every phase.** Exit criteria are not a substitute for
you looking at it. An earlier session broke typography on 40 screens and it was only
caught because you sent a screenshot.

Typecheck and lint are **not** run per-phase — they are slow and are deferred to Phase 11.

---

## 7A. The parking rule — never invent, always park

**Standing instruction from the client.** This governs every phase.

When something comes up that needs a decision I cannot take from the PDF, the code, or
the approved home page, I do **not**:

- guess at an answer
- invent a feature or a rule
- add something "sensible" on my own assumption
- stop the phase and wait

I **park it in Phase 10** (the parking lot), note it in the phase report, build everything
around it, and carry on. You decide the parked items when you are ready — all at once, not
scattered across ten interruptions.

### What gets parked

| Type | Example |
|---|---|
| Needs your business decision | Should splash exist as a web route? |
| Another team owns it | Multi-language (clause 4.6) |
| Scope is ambiguous in the PDF | Is #42 AI Assistant a full screen or a widget? |
| Needs an asset I do not have | Exact chip border weight — needs the Figma |
| Would change agreed scope | Anything adding a step to the 3-click flow |

### What does NOT get parked

Things the PDF, the code, or the home page already answer. Those I decide and proceed —
parking them would just be asking you questions you have already answered.

---

## 8. Risk register

| Risk | Mitigation |
|---|---|
| **CSS split breaks 43 screens** (highest risk) | Six-page verification gate in Phase 0 |
| Breaking Pro/Admin via shared packages | Rule 1; verified in Phase 11 |
| Rebuilding working shell code | Phase 1 is audit-only, explicitly marked |
| Breaking booking/payment logic | Phase 3 is styling-only |
| CSS growing unmaintainable | Phase 0 layer split; reuse tracked per phase |
| Design drift across 43 screens | `/dev/patterns` as single source of truth |
| Colour drift | Stylelint fails the build on raw hex |
| Deferred verification hiding issues | Phase 11 budgets real time for it |
| Unreviewable diff | One commit per phase |

---

## 9. Open items

1. **Figma access** — the colour audit notes the Figma file (not a screenshot) is the
   only reliable source for small elements (chip border weights, "Most Popular" badge).
   **Not a blocker:** every large element resolves to an existing token.
2. **Splash/onboarding on web** — recommendation in Phase 8, your decision.
3. **Three inventory gaps** (#37, #41, #42) — confirmed in Phase 7.
4. **Quotation money layout** — brief review with you before Phase 5 builds.

---

## 10. Review amendments incorporated in v2

| # | Amendment | Where |
|---|---|---|
| 1 | Re-measure §5 colour counts | §5 — re-measured; 32/7 confirmed current |
| 2 | Widen Phase 0 gate beyond the two home pages | Phase 0 — six-page gate, `AppShell` dependency verified |
| 3 | Phase 1 is audit, not rebuild | Phase 1 — marked explicitly |
| 4 | Commit per phase, no push until told | §7, Phase 11 |
| 5 | Separate GitHub phase, approval-gated | Phase 11 |
| 6 | Defer typecheck/lint to the last phase | §7, Phase 11.1 |
| 7 | Correct the mockups' role — colour not layout | §2 — reference hierarchy |
| 8 | Soften Phase 5 — no mockup is not a gap | Phase 5 |
| 9 | Visual check per phase, not just exit criteria | §7 |
| 10 | **Do not invent — work from the PDF scope** | §2A, re-read from the agreement |
| 11 | **Multi-language is another team's** | §2A out-of-scope; layout hygiene only |
| 12 | **Park, never invent** — questions go to a parking lot, not a guess | §7A + Phase 10 |
| 13 | Parked decisions settled **before** verification and push | Phase 10 → Phase 11 order |

---

## 11. Suggested start

**Phase 0, then Service Detail (#12) as the pilot.**

Service Detail exercises four of the six patterns. You review it against the **home
page's design language** before committing to the remaining 42 screens.

If the pilot is right, the rest is repetition of a proven pattern.

---

*Awaiting approval. No code will be written until this plan is approved.*
*No GitHub operation will occur without separate, explicit approval at Phase 11.*
