# CFC Consumer — Mobile Responsiveness Plan

**Three phases. Every item below was measured at 360×740 in a real mobile
browser, not read off class names.**

Method: Chromium at 360px wide, `isMobile: true`, touch enabled, across 17
routes. Measured actual layout boxes — not source classes — for horizontal
overflow, clipped text, font size and tap-target size.

---

## What the audit actually found

### The one bug causing horizontal page scroll

Only the signed-out landing page scrolls sideways. Traced to a single element:

```
header scrollW=404  clientW=360      ← the header is 44px too wide
  button#burger  right=404  w=42     ← this is why
```

`.burger` is `display: none` at desktop and switched on below 900px, but
nothing reduces the header's other contents to make room for it, so it is
pushed 44px past the right edge and drags the whole document with it.

**Every other route measured `scrollW=360` — no horizontal scroll.**

### False positives I ruled out (no work needed)

Two findings looked alarming and are correct behaviour. Recording them so
nobody "fixes" them later:

| Finding | Why it is fine |
|---|---|
| `.bk` cards at `right=632` on /home | The rail is a horizontal scroller — `.bk` carries `scroll-snap-align: start`. Cards are *meant* to sit past the fold. |
| `.marquee-track` at `w=1782` | Parent `.marquee` measured `overflowX=hidden`, `right=360`. Fully contained. |

I verified both in the browser rather than assuming.

### The header, on all 17 routes

This is the finding that matters most, because it is on **every screen**:

```
CLIPPED  b#addrTitle   "Add your address"  wants 111px, has 52px
CLIPPED  span#addrSub  "Set your location" wants  88px, has 52px
TAP      a.logo  38x38  — the brand name and tagline are GONE
```

At 360px the address button renders as **"Add your a…" / "Set your locati…"**.
Neither line survives. And `home-pages.css:579` hides `.logo-text` outright
below 620px, so the app you just spent a phase getting the tagline onto shows
no brand name at all on a phone.

### Tap targets under 44px

WCAG 2.5.5 and both platform guidelines want 44px. Measured heights:

| Control | Size | Route |
|---|---|---|
| `a.sec-link` "See all 16 services" | 122×**25** | /, /home |
| `button` "Show all 5 reviews" | 113×**18** | /service/:id |
| `button` "Browse services instead" | 150×**18** | /profile, /wallet, /bookings, /notifications, /addresses |
| `button#login-forgot-password` | 170×**18** | /login |
| `button#register-go-login` "Log in" | 37×**18** | /register |
| footer links "Cleaning", "About CFC" | ~60–96×**18** | all |
| `a.btn-sm` "Book Now" / "Add" | ×**38** | /, /home |
| `button.chip` "AC service" | 97×**36** | / |

`button#register-go-login` at **37×18** is the worst in the app — it is the
only route from Register to Log in.

### Text below 11.5px

| Size | Element | Where |
|---|---|---|
| **8px** | `sup` "CFC" | every screen |
| **9px** | `.pro-cap` "Assigned. Arriving in uniform" | / |
| **9px** | `.cat-tag-hot` "HOT" | / |
| **10px** | `.bk-rank` "#1 this week" / "MOST BOOKED" | /, /home |
| **10px** | `em#etaLabel` "On the way to your address" | / |
| **10px** | `p` "From ₹799" | /, /home |
| **11px** | `.cfc-badge` "30-day warranty", "Most booked" | /service/:id, /categories |
| **11px** | `h4` "We are live in these cities" | / |

A price at 10px and a warranty badge at 11px are the two that cost bookings.

### Popover 2px over

`#locPop` measured `w=362` against a 360px viewport.

---

# PHASE M1 — Structural. ✅ DONE

Fixes the things that are broken, not merely tight.

| # | Fix | File |
|---|---|---|
| 1 | **Burger pushed off-screen.** Give the signed-out header the same `min-width: 0` / flex discipline the signed-in one has, so the burger sits inside 360px. Kills the app's only horizontal scroll. | `styles/chrome.css` |
| 2 | **Address button unreadable.** 52px of text room is not a label. Drop `addrSub` below 620px and let `addrTitle` take the full width — one readable line beats two truncated ones. | `(home)/home-pages.css` |
| 3 | **Brand name missing on mobile.** Show `.logo-name` below 620px; keep only `.logo-tag` hidden. Restores the identity work from the last phase. | `(home)/home-pages.css` |
| 4 | **`#locPop` 2px over.** `width: min(362px, calc(100vw - 24px))`. | `styles/chrome.css` |

**Verified:** `scrollW === 360` on **17/17** routes. Clipped text **30 → 0**.

**What changed from the plan as written**, because measuring beat predicting:

- **M1.1** root cause was not the burger itself. `.hdr-actions` had no
  `margin-left: auto` once `.nav` was hidden, while `.logo` sat at a rigid
  190px under `flex-shrink: 0`. Fixed by pinning `.hdr-actions` right and
  letting the logo and location pill be the flexible ones.
- **M1.3 was reversed after measuring.** Restoring the wordmark on the
  signed-in bar left `.addr-btn` — which is `flex: 1 1 0%` — with 50px of box
  and SIX pixels of text. The wordmark stays hidden there and the address
  label gets the width; the signed-out header, which has no cart, alerts or
  account chip, keeps its wordmark. Two headers, two budgets.
- **M1.4 needed no change.** `#locPop` measured 362px only because the burger
  bug had shifted its anchor. Once M1.1 landed it measured 342px. Fixing it
  separately would have been work against a symptom.
- **One extra fix, not in the plan.** The signed-out header rendered the
  notifications bell — unread dot and all — pointing at a route behind
  `RequireAccount`. Same class of fault as the hardcoded name: a personal
  control offered to somebody with no account. Gating it also bought back the
  36px the address label needed, since "Sign in" (76px) is wider than the
  avatar (40px) it replaces.

---

# PHASE M2 — Touch. ✅ DONE

Grouped by cause, so each is one edit rather than twenty.

| # | Fix | Scope |
|---|---|---|
| 5 | **Inline text buttons at 18px.** "Browse services instead", "Show all 5 reviews", "Can't access your number?", "Log in", "Create an account". Add `min-height: 44px` + vertical padding on mobile — appearance unchanged, hit area tripled. | shared pattern, ~6 files |
| 6 | **`register-go-login` at 37×18.** The only way back to Log in. Pad to 44px. | `auth-shell.tsx` |
| 7 | **`.sec-link` "See all 16 services" at 25px.** Repeated per section. | `styles/primitives.css` |
| 8 | **`.btn-sm` at 38px.** "Book Now", "Add", "Add address". Step to 44px below 620px only — desktop density is deliberate and stays. | `styles/primitives.css` |
| 9 | **`.chip` at 36px** and **footer links at 18px.** | `chrome.css`, `home-page.css` |

**Verified:** TAP findings **~120 → 4**.

Used the preset's own `coarse:` variant, which is a POINTER query rather than
a width one — a narrow desktop window keeps the tight spacing, and only a
finger gets 44px.

**The 4 that remain, and why each is deliberate:**

| Finding | Size | Why it stands |
|---|---|---|
| "Terms of Service" ×2 | 95×36 | Sits INSIDE a legal sentence. `coarse:py-2` is the largest step before the line breaks. Raised from 15px. |
| "Electrical repair" | 130×21 | A card title whose media panel above it is already a full-size link to the same route. Padding it would push the card's text layout around to reach a destination that is already comfortably tappable. |
| "Browse services" | 127×32 | `EmptyState` in `frontend/packages/ui`, hardcoded `size="sm"`. **Another team's package — the hard rule says never edit it**, and changing it would move Pro and Admin too. |

Two Tailwind classes were caught compiling to nothing before they shipped:
`py-3.5` and `min-h-touch` — neither key exists in the closed scale. This is
Rule 7 doing its job.

---

# PHASE M3 — Legibility. ✅ DONE

Raising type on mobile only. Desktop sizes are approved and do not move.

| # | Fix | Detail |
|---|---|---|
| 10 | **Prices at 10px** — "From ₹799". → 12px. Money is never the smallest text on a screen. | `home-page.css` |
| 11 | **Badges at 9–11px** — "HOT", "#1 this week", "MOST BOOKED", "30-day warranty", "Most booked". → 11.5px floor. These are the earned-trust marks; unreadable, they are decoration. | `home-page.css`, `patterns.css` |
| 12 | **`.pro-cap` at 9px** and **`#etaLabel` at 10px** → 11.5px. | `home-page.css` |
| 13 | **`h4` "We are live in these cities" at 11px** → 12px. | `chrome.css` |
| 14 | **`sup` "CFC" at 8px.** Decorative, not read as text — raise to 9px and confirm it still sits correctly against the wordmark. | `chrome.css` |

**Verified:** TINY findings **13 → 1**, and the one that remains is the `sup`
the plan already carved out.

Every readable string on a phone is now **12px or larger**. Raised: prices
(10 → 12), the earned badges "HOT" / "#1 this week" / "MOST BOOKED" (9-10 →
12), `.cfc-badge` "30-day warranty" / "Most booked" (11 → 12), the
live-tracking caption and step labels (9-10 → 12), "onwards, taxes included"
(11 → 12), the city-picker heading (11 → 12) and the tracking card's service
name (10 → 12).

`sup` "CFC" went 8 → 9px rather than to 12. It is a trademark mark beside the
wordmark, not a string anyone reads, and at 12px it would stop being a
superscript. 9px is legible as a shape while staying subordinate.

**Checked for regressions, since larger type is how layouts break:** all 16
routes still measure `scrollW === 360`, clipped text is still 0, and the
assistant widget still lands fully inside the viewport at 56x56.

---

## Constraints carried from the main tracker

- **Consumer app only.** `frontend/packages/` is another team's — never edited.
- **Mobile-only overrides.** Every change is inside a `max-width` query or a
  mobile-first Tailwind step. No approved desktop screen shifts by one pixel.
- **Closed preset.** Every new class verified against served CSS before it
  ships — this preset compiles unknown classes to nothing silently.
- **No commits.** Working tree only, as instructed.

## Re-audit harness

The measuring script is kept out of the repo, in the session scratchpad:
`mobile-audit.js` — 17 routes at 360×740, reporting overflow, clipped text,
tiny type and small tap targets. Re-run after each phase to confirm the count
falls rather than trusting the diff.

---

## Final state

| Measure | Before | After |
|---|---|---|
| Routes with horizontal scroll | 1 | **0** |
| Clipped text findings | 30 | **0** |
| Tap targets under 44px | ~120 | **4** (each deliberate, listed under M2) |
| Text under 11.5px | 13 | **1** (`sup`, deliberate) |

Typecheck clean. Every route returns 200. **Nothing committed** — all changes
are in the working tree.

### Not fixed, and why

- **"Browse services"** at 127x32 is `EmptyState` in `frontend/packages/ui`
  with a hardcoded `size="sm"`. That package belongs to the team building Pro
  and Admin; editing it would change their apps too. It needs raising by them,
  or a consumer-side wrapper if the client would rather not wait.
- **Card titles** at 21px are a second path to a destination whose media panel
  directly above is already a full-size link.

### Worth a decision

The signed-in header drops the "CityFamilyCare" wordmark on a phone and shows
only the teal mark, because the address control needs the width. The
signed-out header keeps the wordmark, having no cart, alerts or account chip
to fit. If the brand name matters more than the address label on a handset,
that trade can be reversed - it is one rule.

---

*Every number in this document was measured, not estimated.*
