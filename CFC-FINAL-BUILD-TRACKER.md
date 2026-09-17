# CFC Consumer — Final Build Tracker

**The colour law, and the screen-by-screen progress.**

Two things live here: the palette every screen is built from, and a checklist
you can read at a glance to see what is done. Updated as each phase lands.

---

# PART 1 — THE PALETTE

Every value below is read from the code, not from a screenshot. `foundation.css`
holds the raw palette; `brand.css` maps it onto the app's semantic tokens.

## 1.1 Teal — the action colour

| Token | Hex | Where it goes |
|---|---|---|
| `--teal` / `bg-action` | **#02BABC** | Primary buttons, selected states, icon plates, active chips |
| `--color-action-hover` | **#07D2CE** | Hover — **lighter**, never darker |
| `--teal-deep` | **#01A09E** | Pressed state, focus rings |
| `--teal-wash` / `bg-action-subtle` | **#E2F7F7** | Card grounds, selected rows, quiet chips |
| `--color-action-line` | **#B6E5E6** | Borders on anything teal-tinted |

**Rule.** Teal is the default for anything a customer acts on. A screen with no
teal has no obvious next step.

**Hover lightens.** The client's spec forbids darkening a coloured control —
`#02BABC` → `#07D2CE`, plus a coloured glow.

## 1.2 Blue — the tint, and the one non-teal surface

| Token | Hex | Where it goes |
|---|---|---|
| `--blue` / `bg-clock` | **#2464D0** | Every third icon plate, the solid trust chip, panel headers |
| `--blue-wash` / `bg-clock-subtle` | **#E9F0FC** | Alternating tile grounds |
| `--panel-l` | **#C3E9F2** | Card media panels — the mockup's own value |
| `--ocean` | **#015EA3** | Offer banner only. Small areas. |

**Rule.** Blue is a tint, not a second brand. It exists so a twelve-tile grid is
not monotone, and so one surface can be marked without competing with teal.

## 1.3 Orange — rationed

| Token | Hex | Where it goes |
|---|---|---|
| `--orange` / `bg-promo` | **#F47B20** | **One mark per screen** |
| `--color-promo-subtle` | **#FDF0E6** | The pill behind an orange figure |

**Rule — the one most often broken.** The approved home page spends orange in
**four places across 6,000px**. It marks what must not read as teal: a badge, a
live ETA, the number a page is about.

**Never** on a primary button, a link, or more than one mark on a screen. If
almost everything is orange, orange means nothing.

**Legitimate spends so far:** Most booked · Top rated · HOT · live ETA · the
cart's "YOUR CART" eyebrow · a from-price pill.

## 1.4 Yellow — stars only

| Token | Hex | Where |
|---|---|---|
| `--yellow` / `text-star` | **#F5A623** | Rating stars. Nothing else, ever. |

## 1.5 Ink — text

| Token | Hex | Contrast on white | Use |
|---|---|---|---|
| `--color-ink` | **#0E2A47** | 14.6:1 | Headings, body, any figure that matters |
| `--color-ink-muted` | **#4A6484** | **6.2:1** | Secondary text, labels, meta |
| `--color-ink-faint` | **#64809E** | **4.6:1** | The quietest tier — captions, legal |

**Both muted tokens were changed.** They were `#6A83A0` (3.91:1) and `#8fa3b8`
(2.59:1) — **both failed WCAG AA**, and at 12px the faint one was genuinely
hard to read past forty. 51 usages of faint, 96 places where caption sat in
muted grey: it read as washed out across the whole app.

## 1.6 Grounds

| Token | Hex | Use |
|---|---|---|
| `--color-surface` | **#ffffff** | Cards, panels |
| `--color-canvas` / `--paper` | **#F1FAFB** | The page — the approved hero ground |
| `--color-neutral-subtle` | **#f5f8fa** | Disabled surfaces, skeletons |
| `--color-structure` | **#0E2A47** | Deep bands. **At most one per screen.** |
| `--color-border` | **#E3ECF4** | Hairlines |

## 1.7 The ratio that decides whether a screen looks dull

Measured on the 43 untouched screens:

```
grey / navy text on white   ~390 usages
saturated colour fills       ~45 usages
```

**That ratio is the whole problem.** The approved home page is coloured bands
with white cards floating on them; an untransformed screen is grey-on-white
with teal accents. Same paint, opposite amount on the walls.

**Before calling a screen done, count its colour.** If it has more than five
greys and fewer than three saturated fills, it will read as washed out however
correct the tokens are.

## 1.8 The standing rules

1. **Solid fills with white glyphs.** A pale wash with tinted type is the
   washed-out treatment the colour spec rejects outright.
2. **Every state carries a badge** — live, pending, done, failed. Never status
   as plain grey text.
3. **Cards hover**: teal edge, lift, shadow. White-on-white gives the cursor
   nothing to answer.
4. **Money is `cfc-price`**, never body text.
5. **Controls are 44px** (`h-touch`). Native radios and checkboxes are replaced
   — `accent-color` leaves the browser's own dark ring.
6. **Empty states are a way forward**, never a dead end.
7. **Verify every class against the served CSS.** This preset silently compiles
   unknown classes to nothing. Already caught: `text-white`, `border-1.5`,
   `px-1.5`, `rounded-lg`, `h-11`, `gap-1.5`, `size-7`, `max-w-line-lg`,
   `bg-panel`, `z-dropdown`.
8. **Mobile is the same flow as desktop**, not a different one.

---

# PART 2 — PROGRESS

## Done

| Screen | PDF | Notes |
|---|---|---|
| ✅ Signed-out home | — | Approved by client. The design authority. |
| ✅ Signed-in home | — | Prototype cart, toast, tab bar and drawer removed; Add wired to the real cart |
| ✅ Browse | 7 | Banded, panels carded |
| ✅ Search | 8, 9 | Banded, results carded |
| ✅ Categories | 10 | Rebuilt: grouped catalogue, pricing preview, earned badges |
| ✅ Sub-category | 11 | Rebuilt: hero strip, sibling menu, sort menu, explore block |
| ✅ Service Detail | 12 | Pilot. Trust chips, radio rebuilt, image ratio per device |
| ✅ Pro Profile | 13 | Banded, panels carded |
| ✅ Auth — login, register, OTP, forgot | 3–6 | Shell rebuilt, brand panel, back control, contrast |
| ✅ **Phase 1 — Cart** | **14** | Line totals fixed, summary itemised, blue panel head, media panel |
| ✅ **Phase 2 — Date, slot, address** | **15, 16, 17** | Step indicator, slot grid, address rows |

## Remaining

| Phase | Screen | PDF | Status |
|---|---|---|---|
| 3 | Checkout steps — summary, coupon, payment | 18, 19, 20 | ✅ Blue money panel, total at display weight, 44px payment rows |
| 4 | Booking confirmed | 21 | ✅ Teal reference head, code at display weight, labelled fields |
| 5 | My Bookings | 25 | ✅ Banded, carded, **orange "Rate this"** — the one outstanding task |
| 6 | Booking detail | 26 | ✅ Banded, panels carded |
| 7 | Tracking + in-progress | 27, 28, 29 | ✅ **ETA countdown now orange** — a legitimate spend per scope |
| 8 | Quotation flow | 22, 23, 24 | ✅ **Advance at display weight, balance quiet beneath** — the split is now unambiguous |
| 9 | Review + invoices | 30, 31, 32 | ✅ Banded; invoice prints white with no page padding |
| 10 | Profile, addresses, wallet | 33–37 | ✅ Banded, carded, balance panel strengthened |
| 11 | Refer, notifications, support | 38–42 | ✅ **Orange referral code**, **orange offer notifications** |
| 12 | Settings, legal | 43, 44 | ✅ Banded; legal measure fixed 320px → 65ch |

**All 12 phases applied.** Typecheck clean; every route returns 200.

## Scope constraints, per phase

- **3** — platform fee shown clearly; **GST on the platform fee only**, never the Pro's fee
- **4** — Pro assigned, tracking enabled, ETA shown
- **7** — the live-ETA pill is a legitimate orange spend
- **8** — minimum **2 before-photos** mandatory; advance vs balance must be unambiguous
- **9** — **Internal Settlement is Admin-only** and must never render; invoices need a print stylesheet
- **12** — language is another team's; the switcher correctly shows five as unavailable

## Deferred to the end

Typecheck · lint · build on all three apps · Pro and Admin verified unchanged ·
commits and push **only on explicit approval**.

## Post-phase pass

| Item | Status |
|---|---|
| **AI assistant → widget** (42) | ✅ Floating control on every signed-in screen; suppressed on /support and through checkout; lifts clear of the checkout bar |
| **Profile colour pass** | ✅ Icon plates on rows, teal stat icons, greys 11 → 9 |
| **Settings colour pass** | ✅ Icon plates (teal + blue), stronger section heads, greys 10 → 8 |
| **Wallet orange** | ✅ "Earn by referring" — SOLID `bg-promo` with white glyphs. The first pass used `bg-promo-subtle` + `text-promo`, which beside a solid teal button read as disabled — the exact treatment §1.8.1 rejects |
| **Profile reachable** | ✅ The account menu had no "My profile" entry at all; /profile could only be reached by typing the URL. Added, and the identity plate is itself a link |
| **One customer, one name** | ✅ Header and signed-in home hardcoded "Aarthi Subramanian"/"AS" while /profile read `getConsumerProfile()` — two screens naming the customer differently. Both now read the mock's module state |
| **Support strengthened** | ✅ Helpline card at 2px edge with the number at body weight |
| **Refer tracker** | ✅ Icons off `ink-faint` (2.6:1) onto teal |
| **Mobile overflow** | ✅ Profile stat values step `text-body` → `text-heading` at `sm`; a wallet balance overflowed a 110px cell at 360px |
| **Mobile sweep M1-M3** | ✅ Measured at 360x740 in a real mobile browser across 17 routes, not read off class names. Horizontal scroll 1 → 0 routes; clipped text 30 → 0; tap targets under 44px ~120 → 4; text under 11.5px 13 → 1. See `CFC-MOBILE-RESPONSIVE-PLAN.md` |
| **Notifications bell gated** | ✅ Rendered to signed-out visitors, unread dot and all, pointing at a route behind `RequireAccount` — same fault class as the hardcoded name |

**Still short of the standard:** Profile sits at 9 greys / 2 fills and Refer at
6 / 2. Both are improved but neither clears the §1.7 test. They are list
screens with genuinely little to colour — worth a second look rather than
forcing fills that are not earned.

## Parked — decisions, not inventions

| Item | Status |
|---|---|
| Invoice PDF (32) | ⏸ Awaiting confirmation |
| Dark mode (43) | ⏸ Awaiting confirmation |
| Splash + onboarding (1, 2) | ❌ Not on web — confirmed |
| Support ticket thread (41) | May be FAQ + helpline only |
| Transaction history (37) | Confirm it covers refunds and non-wallet payments |

---

*Updated as each phase lands.*
