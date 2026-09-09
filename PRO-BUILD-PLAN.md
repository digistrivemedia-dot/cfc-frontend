# CFC Pro App — Build plan, 35 screens

> Written before any code. The point of this document is that there are **no
> revision rounds**: every screen has its layout decided, its data source named,
> its numbers sourced, and its responsive behaviour specified *here*, so the
> build is transcription rather than invention.
>
> Source of screens: `SCREEN-INVENTORY.md` § 4.2 (35 screens).
> Source of every number: `PLATFORM-FACTS.md`. Nothing else.

---

## What this app is

A **responsive web app**, same as the consumer app — not a phone-shaped mock.
But the Pro app's centre of gravity is genuinely different from the consumer's,
and that changes the layout rules:

| | Consumer | Pro |
|---|---|---|
| Where it is used | Sofa, desk, commute | **Standing in a stairwell, one hand, in sunlight** |
| Session shape | Browse → decide → book | **Glance → act in 30 seconds** |
| Desktop reality | Genuine — people book on laptops | Rare, but real for **Associate / Major Partners** managing a team |
| Dominant control | Cards and links | **One big button** |

So: mobile-first is not a slogan here, it is the product. But the desktop
layout is not an afterthought either, because a Major Partner runs their
operation from a laptop. The rule below (§ Layout doctrine) resolves this.

---

## Layout doctrine — decided once, applied 35 times

These are the decisions that stop screen-by-screen re-litigation.

### 1. Three widths, one set of rules

390 / 768 / 1280. At **1280 the app is a real desktop layout**: a persistent
left rail, content in a `max-w-screen-xl` column, and action panels docked
right instead of stuck to the bottom edge.

### 2. The shell is a rail on desktop, tabs on mobile

The consumer app uses a top bar + bottom tabs. The Pro app **must not copy
that**, because a pro's job list is a working surface they return to all day,
and the primary control (`GO ONLINE`) needs a permanent home.

- **Mobile (`< md`)**: bottom tab bar — Home · Jobs · Earnings · Profile.
  The online/offline state lives in a compact pill in the top bar.
- **Desktop (`md+`)**: fixed left rail, 240px, with the **online toggle at the
  top of the rail** as a real switch, plus the same four destinations and a
  notifications entry.

One component, `pro-shell.tsx`, renders both. Built in Phase 1, touched
essentially never again.

### 3. Every action bar becomes a docked panel at `lg:`

A pro screen almost always ends in one decision — Accept, I'm Here, Complete,
Submit. On mobile that is a **sticky bottom action bar**; at `lg:` it becomes a
**sticky right-hand card** (320px) beside the content. Same component,
`pro-action-bar.tsx`, one prop.

This single decision is what makes the app read as a web app rather than a
stretched phone, and it is why it is decided here rather than per screen.

### 4. Touch targets use `coarse:`, not `md:`

Already in the preset. A pro on a tablet gets large hit areas; a partner in a
narrow desktop window keeps tight ones. Minimum 44px, `h-touch`.

### 5. Outdoor legibility is a real constraint

A pro reads this screen at arm's length in daylight. Therefore:
- Primary action buttons are `h-touch-lg` and never icon-only.
- No information carried by colour alone — every status has a label.
- Money is `tabular` and at least `text-body`; never `text-caption`.

### 6. Destructive and irreversible actions confirm

`Mark Complete`, `Decline`, `Submit for Approval` and `Request payout` all pass
through `AlertDialog`. A pro who fat-fingers "Complete" on a job they haven't
done has a penalty problem, not a UI problem.

---

## Numbers this app is allowed to state

Straight from `PLATFORM-FACTS.md`. Every one appears on a Pro screen:

| Fact | Value | Screens |
|---|---|---|
| Accept timer | **30 seconds**, countdown, auto-reject on timeout | 12 |
| Auto offline | offline on accept, online on completion | 11, 13, 19 |
| CFC commission | **15%**, **first 20 jobs at 0%** | 19, 22, 23 |
| GST | CGST 9% + SGST 9%, **platform fee only — never the pro's fee** | 19, 22, 23 |
| Payout | daily option, auto-transfer **within 48 hours** of completion | 19, 24, 25 |
| GPS proof | pro must be **within 100 m** to mark complete | 15, 18 |
| Before-photos on a quotation | **minimum 2**, none = auto-reject | 16 |
| Quotation window | **15 minutes** for admin decision | 16, 17 |
| Phone confirmation | quotes **above ₹5,000** | 16 |
| Auto-block | rating **below 2.5** | 26, 30, 34 |
| Reviews | **OTP-gated** | 18, 30 |
| Pros notified per job | **3 nearest, first to accept wins** | 12 |

**Not allowed** (no source): number of pros on the platform, average pro
earnings, "top 10%" style rankings, any city as scope, payout minimum
threshold — screen 24 asks for a "minimum threshold" and the agreement never
gives one. That becomes an open item, not an invented ₹500.

---

## The 3 Golden Rules problem — flagged now, not at Phase 8

Screen 35 is "CFC 3 Golden Rules, penalty structure, sign-off confirmation".
**The agreement names neither the three rules nor the penalty amounts.**
`PLATFORM-FACTS.md` has a penalty *mechanism* (warnings, deductions, auto-block
below 2.5) but no schedule of offences and amounts.

I will build screen 35 as a real, complete Code of Conduct screen structured
around the three rules the agreement's own behaviour implies — punctuality,
OTP-and-photo proof of work, and conduct in the customer's home — with the
penalty column reading **"Set by admin"** and pulling from the warnings data
rather than hardcoding rupee figures. It goes into `PRO-OPEN-ITEMS.md` as the
first client question. No invented penalty amounts.

---

## Where the inventory fights the web platform

Each is resolved here so it never becomes a mid-build surprise:

| Screen | Inventory says | Reality | What I build |
|---|---|---|---|
| 4 | "OTP auto-read" | Android SMS Retriever | `autocomplete="one-time-code"` + WebOTP behind a capability guard. No fake autofill. |
| 12 | "Full-screen popup, 30s countdown" | A web app can't wake a sleeping phone | Full-screen `Dialog` with a real 30s countdown, driven by the scenario harness. Push notification is FCM = backend. Says so. |
| 14 | "Google Maps turn-by-turn" | Maps SDK out of frontend scope, no key | Hand off to the device: `google.com/maps/dir/?api=1&destination=…`. That is genuinely the right answer even in production — you don't rebuild turn-by-turn. Plus existing `MapView` for the in-app preview. |
| 15, 18 | "GPS proof active" | `navigator.geolocation` works, but 100 m needs a real fix | Use the real Geolocation API, show live distance-to-customer, and **block Complete when outside 100 m** with the reason on screen. Permission-denied is a designed state, not a crash. |
| 6 | "Aadhaar front/back, PAN, selfie" | Real KYC upload is backend + storage | Real file inputs with client-side type/size validation and preview. Upload posts to the mock. Camera capture via `capture="environment"`. |
| 13 | "Chat on WhatsApp" | Works on web | `wa.me/<phone>` deep link. Real. |
| 19, 23 | Earnings breakdown | — | Computed by a single shared function so pro-side and admin-side can never disagree. See below. |
| 31 | Push notifications | FCM = backend | In-app notification list, real. A note that push delivery awaits the backend. |
| 33 | "Language" | Parked with the client | Same treatment as consumer Settings: real control, saved, labelled honestly. |

---

## The one piece of real logic: pro earnings

This is the money path and the thing most likely to be quietly wrong, so it
gets built first (Phase 2) with the arithmetic pinned:

```
gross          = what the customer paid for the pro's work
cfcFee         = 15% of gross  — but 0% while the pro's completed-job count < 20
net            = gross - cfcFee
```

**GST is not deducted from the pro.** CGST 9% + SGST 9% apply to the *platform
fee charged to the customer*, which is a different number from the CFC
commission taken from the pro. On a pro screen GST is a **note**, not a
deduction line — stating it as a deduction would understate the pro's earnings
and is exactly the class of error that cost ₹279/booking on the consumer side.

Lands as `packages/mocks/src/api/pro-earnings.ts` + `packages/types/src/pro-earnings.ts`,
with the free-first-20 boundary verified at jobs 19, 20 and 21.

---

## Phases

Ten phases. Each ends with the screens *finished* — not stubbed and revisited.
**Typecheck and lint run once, in Phase 10**, as instructed.

### Phase 1 — Shell, foundation, and the pro session
**Screens: none directly. Everything after depends on it.**

- `pro-shell.tsx` — bottom tabs (mobile) / left rail (desktop), per doctrine § 2.
- `pro-action-bar.tsx` — sticky bottom → docked right at `lg:`, per doctrine § 3.
- `pro-session.ts` — who is signed in, and the **online/offline state**, in
  sessionStorage. The consumer app's `signIn`/`signOut` pattern, reused.
- `(app)/layout.tsx`, `(auth)/layout.tsx`, route group skeleton for all 35 so
  no link in the app ever 404s while later phases land.
- PWA `manifest.json` for pro (consumer already has one; pro has none).
- Money/date formatters reused from `@cfc/ui` — nothing new.

### Phase 2 — Earnings engine + Home / Dashboard
**Screens 10, 11**

The dashboard is the screen the client will look at first, so it is built
second, immediately after the shell, on top of real arithmetic.

- `pro-earnings.ts` (types + mocks) per § above. Verified at the 20-job boundary.
- **Screen 10** — today's earning card, the **GO ONLINE** button as the single
  dominant control, live job feed, four quick stats (completed, pending,
  rating, total earned), support entry.
  Desktop: three-column grid — earnings + toggle left, job feed centre, stats
  right. Not a stretched phone.
- **Screen 11** — the toggle is a full-screen confirm on mobile, an inline
  switch on desktop. States the auto-offline-on-accept rule plainly, because a
  pro who doesn't know that rule thinks the app broke.

### Phase 3 — The accept path
**Screens 12, 13, 14**

The 30-second path. The highest-stakes UI in the product.

- **12** — full-screen job alert, real 30s countdown with a ring, service /
  customer / distance / **net earning** (not gross — a pro decides on net),
  ACCEPT dominant, DECLINE deliberately quiet. Auto-reject at zero. States
  "3 pros notified, first to accept".
- **13** — On The Way. Navigate / Call / WhatsApp / **I'm Here**. Address, ETA,
  customer name. `I'm Here` is the action bar.
- **14** — map preview via `MapView` + a real hand-off to the device's maps app.

### Phase 4 — Work, quotation, completion
**Screens 15, 16, 17, 18, 19**

- **15** — in progress. Before-photo upload, extra charges, GPS distance live,
  Complete Job gated on the 100 m rule.
- **16** — quotation: description, material list (add/remove rows, live total),
  labour, **before-photos with the minimum-2 rule enforced in the UI**, the
  ₹5,000 phone-confirmation notice, the 15-minute window stated.
- **17** — quotation status: pending / approved / rejected with reason, and the
  15-minute clock while pending.
- **18** — complete: customer OTP input (reuse the auth OTP field), before/after
  photo review, final amount, GPS check, confirm dialog.
- **19** — completed: **gross → CFC fee → net**, the 48-hour credit note, the
  GST clarification, auto-online notice, rating prompt.

### Phase 5 — Jobs list and job detail
**Screens 20, 21**

- **20** — tabs Active / Upcoming / Completed / Cancelled. Mobile: cards.
  Desktop: `DataTable`, because a partner scanning 40 jobs needs a table.
  Both from one data source; not two implementations of the same screen.
- **21** — full job info, customer contact, checklist, notes, photo grid.
  `DetailShell` on desktop, stacked cards on mobile — and **not** `DetailShell`
  inside a `Sheet`, which is the trap that crushed the admin support screen.

### Phase 6 — Money
**Screens 22, 23, 24, 25**

- **22** — earnings: Today / Week / Month, `LineChart`, full breakdown, and the
  first-20-jobs banner while it applies.
- **23** — transaction history, per-job settlement, reusing `WalletEntry`.
- **24** — payout: daily trigger, bank/UPI selection, status. The **minimum
  threshold has no source** → the UI reads it from the mock config and the
  number goes to `PRO-OPEN-ITEMS.md`.
- **25** — pending payments, with the 48-hour rule as the explanation for why
  something is pending.

### Phase 7 — Profile, services, availability
**Screens 26, 27, 28, 29**

- **26** — profile: photo, rating badge, verified tag, **CFC Pro ID**, skills.
- **27** — edit profile.
- **28** — my services: per-service pricing, enable/disable. Pricing is
  admin-managed per `PLATFORM-FACTS.md`, so the pro's control here is
  availability, and where a rate is admin-fixed the UI says so rather than
  showing an editable field that silently won't save.
- **29** — weekly availability grid, off-days, holiday mode. The one genuinely
  desktop-friendly screen: 7×N grid at `md:`, day-accordion on mobile.

### Phase 8 — Reviews, notifications, support, settings
**Screens 30, 31, 32, 33**

- **30** — reviews, average, response option, and the **2.5 auto-block**
  threshold shown as a real warning when the rating approaches it.
- **31** — notifications: job alerts, payouts, announcements, warnings.
- **32** — help: FAQ, raise ticket, call helpline. Reuses `my-support`.
- **33** — settings: notifications, language (parked, honest), deactivation.

### Phase 9 — Onboarding, auth, compliance
**Screens 1–9, 34, 35**

Deliberately last. It is the longest linear stretch and the least likely to
change, and building it after the app exists means the "Approval Pending"
screen can link to something real.

- **1** splash (gated on a localStorage flag, not shown every visit)
- **2** login · **3** register · **4** OTP · **5** profile setup
- **6** documents · **7** bank/UPI · **8** terms · **9** approval pending
- **34** warnings and penalties · **35** Code of Conduct (see § Golden Rules)

### Phase 10 — Verification, once
As instructed, all checks batched here:

```
pnpm typecheck                 # 6/6 packages, then 7 with pro
pnpm lint --filter @cfc/pro
pnpm dev:pro                   # port 3001
```

Plus:
1. No horizontal scroll at 390 on any of 35 screens
2. Touch targets ≥ 44px on every primary action
3. 1280 is a desktop layout on every screen, not a centred phone
4. `window.__cfc.setScenario("slow"|"empty"|"error")` on every list screen
5. Every number traced to `PLATFORM-FACTS.md`
6. **Dead-class sweep** — grep the built CSS for every spacing class used, since
   an off-scale class emits nothing with no error. This is the check that
   caught 29 dead classes in the admin app.
7. `PRO-OPEN-ITEMS.md` finalised.

---

## Reuse — what I am *not* rebuilding

Confirmed present and directly usable:

**Types** — `ProListItem`, `ProDetail`, `ProDocument`, `ProWarning`, `Payout`,
`WalletEntry` (already carries `grossPaise` and `feePaise` per credit — built
for exactly screen 23), `Booking`, `Quotation`, `Notification`.

**Mocks** — `getPro`, `getProWarnings`, `getPayouts`, `getWalletEntries`,
`getJobFeed`, `getBooking(s)`, `getQuotation(s)`, `getNotifications`,
`getSupportFaqs`/`getMyTickets`/`raiseTicket`, `getSlots`, `getProReviews`,
`sendOtp`/`verifyOtp`.

**UI** — `Button`, `Input`, `Badge`, `Tabs`, `Switch`, `Sheet`, `Dialog`,
`AlertDialog`, `Calendar`, `DataTable`, `DetailShell`, `MapView`,
`PhotoGrid`, `OtpDisplay`, `StarRating`/`StarRatingInput`, `Timeline`,
`InlineAlert`, `FormShell`/`FormField`, `EmptyState`/`ErrorState`/
`LoadingState`, `StatCard`, `LineChart`/`BarChart`, `Accordion`,
`SnapScroller`, `Combobox`, `Toaster`.

**New primitives needed — four, and only four:**

| Primitive | Phase | Why nothing existing fits |
|---|---|---|
| `CountdownRing` | 3 | Screen 12's 30 seconds. Nothing timed exists. |
| `MoneyBreakdown` | 4 | gross → fee → net, used on 19, 22, 23. One component so the three can't disagree. |
| `PhotoCapture` | 4 | Camera-or-file with preview and validation. `PhotoGrid` displays; nothing captures. |
| `WeekGrid` | 7 | Screen 29's availability grid. |

Everything else is composition.

---

## What "no revisions" depends on

Being honest about the two things that could still force rework:

1. **The Golden Rules and penalty schedule** (screen 35) and the **payout
   minimum** (screen 24) are client answers. I build both so the answer drops
   in as data, not as a rebuild — but I cannot invent them.
2. **Screenshot review.** The plan removes *structural* revisions. Taste is
   still taste, and a look at Phase 2's dashboard before Phase 3 starts is
   cheap insurance — the dashboard sets the visual language the other 33
   screens inherit.
