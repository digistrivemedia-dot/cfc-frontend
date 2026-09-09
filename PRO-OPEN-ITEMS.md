# CFC Pro App — Open items

> Things flagged during the build rather than invented. Each one is either a
> client answer, a spec clause that cannot be honoured as written on the web, or
> a deliberate deferral.
>
> Kept as we go, per the working agreement: flag it here, finish the screens,
> then work through this list.

---

## 1. Client decisions — the app cannot make these up

### 1.1 The CFC 3 Golden Rules (Pro 35) — **blocking that screen's content**
The inventory asks for "CFC 3 Golden Rules, penalty structure, sign-off
confirmation". **The agreement names neither the three rules nor any penalty
amount.** `PLATFORM-FACTS.md` has the penalty *mechanism* (warnings, deductions,
auto-block below 2.5 rating) but no schedule of offences and rupee figures.

Built as a complete screen with the penalty column reading "Set by admin" and
sourced from the warnings data. **Needed from the client:** the three rules as
they should be worded, and the penalty schedule.

### 1.2 Payout minimum threshold (Pro 24)
The inventory says "minimum threshold". No figure exists anywhere in the
agreement. The screen reads it from mock config rather than hardcoding ₹500.
**Needed:** the actual minimum, or confirmation there isn't one.

### 1.3 Commission on Associate / Major Partners
`PLATFORM-FACTS.md` says Major Partner has a "negotiated commission", and
Admin 29 offers "special rates for partners". The Pro app currently applies the
flat 15%. **Needed:** whether a partner's own pros settle at 15% or at the
negotiated rate, and who absorbs the difference.

### 1.4 What "first 20 jobs" counts
The onboarding offer is a real documented term. Ambiguity: is it the first 20
jobs *ever*, or 20 within some window? Implemented as first-20-ever, which is
the plain reading. **Needed:** confirmation, since it is money.

### 1.5 Account deactivation (Pro 33)
"Account deactivation" is listed. Whether a pro can self-deactivate, or must
request it from an admin, is not stated — and it matters, because a pro with
active jobs cannot simply vanish. Built as a request, not an instant switch.

---

## 2. Spec clauses that cannot be honoured literally on the web

Each is built as the closest thing that genuinely works, and says so on screen
rather than pretending.

| # | Screen | Clause | What was built |
|---|---|---|---|
| 2.1 | Pro 4 | "OTP auto-read" | Android SMS Retriever is native-only. `autocomplete="one-time-code"` plus WebOTP behind a capability guard. No fake autofill animation. |
| 2.2 | Pro 12 | "Full-screen popup" job alert | A web app cannot wake a sleeping phone; that needs FCM, which is backend. Full-screen dialog with a real 30-second countdown, driven by the scenario harness. |
| 2.3 | Pro 14 | "Google Maps turn-by-turn" | Handed to the device via a maps deep link. This is the right answer in production too — nobody should rebuild turn-by-turn inside a web app. |
| 2.4 | Pro 15, 18 | "GPS proof active", within 100 m | Real `navigator.geolocation`. Live distance shown, Complete blocked outside 100 m. Permission-denied is a designed state. **Browser GPS is less accurate than native**, so the 100 m gate may need a tolerance the client sets. |
| 2.5 | Pro 6 | Aadhaar / PAN / selfie upload | Real file inputs, client-side type and size validation, preview, `capture="environment"`. Actual KYC storage is backend. |
| 2.6 | Pro 31 | Push notifications | In-app list is real. Push *delivery* is FCM = backend. |
| 2.7 | Pro 33 | Language | Parked with the client, same as consumer Settings. Real control, saved, labelled honestly. |

---

## 3. Deferred deliberately

- **Dark mode.** Parked with the client for the whole platform. Pro screens use
  semantic tokens only, so it lands as a token swap rather than a rewrite.
- **Multi-language.** Clause 4.6 names customer screens only; the pro app is
  not in that clause. Strings kept extractable regardless.

---

## 4. Design-system findings from this build

Recorded because they are the class of bug that produces **no error at all**.

### 4.1 `bottom-tab-bar` generated no CSS — caught before it shipped
`tab-bar` (80px) existed in `padding` only. Tailwind does not share padding
values with `inset`, so `bottom-tab-bar` — which the pro action bar depends on
to sit above the tab strip — silently generated nothing. Added to `inset`.
Verified present in the built CSS.

Same family as the 29 dead classes found in the admin app and the lint rule that
had been dead for the entire admin build. **A class that looks plausible and
emits nothing is the default failure mode of this design system.**

### 4.2 Tokens added for the pro app
All verified present in the built CSS bundle, not assumed:
`h-touch-lg` (56px primary action), `padding.rail`, `padding.action-bar`,
`inset.rail`, `inset.tab-bar`, `width.action-panel`,
`gridTemplateColumns.action`, and a `pro` size on `Button`.

### 4.3 `Button` gained a `pro` size rather than 20 screens hand-patching
56px and `text-heading`. `lg` is 48px, which is right for a desktop form and
too small for a one-handed press in daylight where the wrong button costs money.

---

## 5. Verified, and deliberately left alone

- **The earnings engine.** Verified before any screen used it: job 20 free /
  job 21 charged, 15% exact across four job values, and 71,429 gross values all
  reconcile with the fee never exceeding gross.
- **GST is not a pro deduction.** Treating CGST+SGST as coming out of the pro's
  earning would cost each pro **₹270 on a ₹1,500 job**. It is a note on pro
  screens, never a deduction line. (`PLATFORM-FACTS.md`: GST applies to the
  platform fee charged to the customer.)
- **A job's address and the customer's phone are `null` until accepted.** Three
  pros are alerted per job and one accepts; releasing the exact address to all
  three would hand a customer's door number to two people who never came. The
  offer carries area and distance, which is what the decision actually needs.
- **Customer names are shortened to a first name plus an initial** on jobs, for
  the same reason.
- **Offline is the default on app open.** A pro who has not said they are ready
  should not be in the dispatch pool — being alerted for a job they cannot take
  costs them a penalty, not just an annoyance.
