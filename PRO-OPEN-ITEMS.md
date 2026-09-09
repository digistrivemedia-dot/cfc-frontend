# CFC Pro App — Open items

> Things flagged during the build rather than invented. Each one is either a
> client answer, a spec clause that cannot be honoured as written on the web, or
> a deliberate deferral.
>
> Kept as we go, per the working agreement: flag it here, finish the screens,
> then work through this list.

---

## 1. Client decisions — the app cannot make these up

### 1.1 The CFC 3 Golden Rules (Pro 35) — **built, awaiting the client's wording**
The inventory asks for "CFC 3 Golden Rules, penalty structure, sign-off
confirmation". **The agreement names neither the three rules nor any penalty
amount.** `PLATFORM-FACTS.md` has the penalty *mechanism* (warnings, deductions,
auto-block below 2.5 rating) but no schedule of offences and rupee figures.

**What was built instead of inventing them.** The three rules are derived from
what the platform already enforces in code, and each cites the mechanism behind
it:

1. **Turn up, on time, every time** — the 30-second accept window, the
   auto-reject on timeout.
2. **Prove the work** — the 100 m GPS gate, the customer's completion OTP, the
   before/after photos, the minimum-2 rule on quotations.
3. **Behave as a guest in someone's home** — the rating that gates dispatch and
   auto-blocks below 2.5.

The three existing warning reasons in the fixture — lateness, missing GPS proof,
unprofessional conduct — map onto exactly these three, which is reasonable
evidence the derivation is right rather than arbitrary.

**No rupee figures anywhere.** Each rule's consequence says the office sets the
deduction per incident, which is true. `PENALTY_AMOUNTS_NOT_SET` is a flag in
`pro-conduct.ts`; clearing it and adding a table is a one-file change.

One component renders both Pro 8 (accepting) and Pro 35 (reading), word for
word — a professional who signed one wording and later read another would have
a legitimate grievance.

**Still needed from the client:** the three rules as they want them worded, and
the penalty schedule if one exists.

### 1.2 Payout minimum threshold (Pro 24) — **built, awaiting the figure**
The inventory says "minimum threshold". No figure exists anywhere in the
agreement.

Built as `PAYOUT_MINIMUM_PAISE` in `pro-earnings.ts`, currently **0**, and the
screen renders no threshold line at all while it is zero. Setting it to a real
value makes the line appear and gates the button, with no code change. A screen
stating "minimum ₹500" that the client never agreed to is a commitment made by
a developer.

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

### 1.5 A pro serves several areas, but the record holds one
`ProListItem.area` is a single string, and Pro 5 and 27 both ask for "service
area selection" — plural in practice, because a pro who will travel to three
neighbourhoods is under-served by a field holding one.

The form collects several and writes the first back as their primary, so the
screen is honest about intent while the current data shape is respected.
**Needed from the backend:** `areas: string[]` on the pro record, and
confirmation that dispatch matches against all of them rather than just the
primary.

### 1.6 Account deactivation (Pro 33)
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
- **Multi-language.** Clause 4.6 names **customer** screens only — the pro app
  is not in that clause at all, so pro-app translation is not a deferred
  commitment but an expectation with no contractual backing. Pro 33 says the
  app is English for now rather than offering options that do nothing. Strings
  kept extractable regardless. **Worth raising with the client:** a pro
  workforce in Tiruchirappalli is more likely to need Tamil than the customers
  are, so the clause may have this backwards.

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

### 4.4 The earnings chart and its headline disagreed — caught in Phase 6
`getEarningsSummary` counted from the **start of the calendar week/month**;
`getEarningsSeries` walked back a **fixed 7 or 30 days**. Both are defensible
windows, and that was exactly the problem: on a Wednesday the chart summed nine
days against a headline covering three, so the same screen showed ₹4,192 in the
chart and ₹2,987 as the total — a ₹1,205 disagreement about the pro's own
income.

Fixed by making the series use the summary's own cutoff. Verified: net and job
count now agree exactly across today, week and month.

**The general lesson:** two functions that each independently decide what "this
week" means will eventually disagree. One of them has to own the window.

### 4.5 `max-w-line-sm` generated no CSS — caught in Phase 7
`line-sm` (96px) exists in `width` but **not** in `maxWidth`. Tailwind does not
share the two scales, so `max-w-line-sm` emitted nothing and the
years-of-experience field on Pro 27 was silently full-width instead of capped.

Added to `maxWidth`. This is the **third** instance of the same family in this
build (`bottom-tab-bar`, then `grid-cols-[...]` needing a named template, now
this one), and the pattern is always the same: **a token existing in one Tailwind
scale is no evidence at all that it exists in a sibling scale.** `width`,
`maxWidth`, `padding`, `inset` and `height` are five separate maps.

The Phase 10 sweep greps the built CSS for every spacing and sizing class the
app uses, which is how all three were found.

### 4.6 A cross-role support leak — caught in Phase 8
`getMyTickets()` hard-filters to `fromRole === "customer"`. Calling it from the
pro app — the obvious reuse, since the function is generically named — would
have shown a professional **other people's support tickets, subject lines and
all.**

The customer fixture includes *"Pro did not arrive at scheduled time"*. A
complaint about a professional, visible to professionals.

Fixed with `getProTickets(proId)`, filtering to `fromRole === "pro"` and
reusing the same `stripInternal` projection so agents' internal notes never
reach a pro either. Verified: zero customer-raised tickets in the pro list.

**The lesson:** a function named `getMy…` in a shared package has an implicit
"my" baked into it. Reusing one across roles is how a leak ships.

### 4.7 A document could be rejected with no reason — caught in Phase 9
The pro fixture drew **two independent `rand()` values** per document: one
deciding the status, another deciding whether a rejection reason attached. They
disagreed about half the time, producing:

- documents **rejected with no reason at all** — on the approval screen that is
  a demoralising dead end, and the pro has no idea what to re-upload
- documents marked **approved that carried a rejection reason** — nonsense

Fixed to one draw per document with the reason derived from the status, and the
reasons made document-specific ("the PAN number could not be read", "the address
side is cut off") because "blurred" tells a pro nothing about what to do
differently. Verified: every rejection now carries a reason and no approval
does.

**The lesson:** two random draws deciding two halves of one fact will disagree.
Derive the second from the first.

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
- **Available to withdraw is kept separate from earned.** Money inside the
  48-hour settlement window has not cleared, and one merged "balance" would
  offer a pro an amount they cannot actually take. Verified: the pending figure
  on the balance equals the pending list's own total.
- **"Payout requested", never "paid".** A screen claiming a bank transfer is
  complete when it has only been initiated produces a support call the moment
  the pro checks their account.
- **A ₹0 CFC fee renders as ₹0 with its reason, never as a blank cell.** A blank
  is indistinguishable from data that failed to load, and the one thing a pro
  must never wonder about their settlement is whether part of it is missing.
- **An overdue settlement is treated as the platform's failure, not a rounding
  error.** Past 48 hours the pro is owed money against a stated commitment, so
  those rows sort to the top, colour `critical`, and carry the support route.
- **Service rates are read-only, with their owner named.** The agreement is
  unambiguous that the admin owns all pricing, so Pro 28 shows the rate as a
  fact rather than an editable field. An editable price that silently cannot
  save would have a pro set ₹800, take a job at ₹499, and conclude the platform
  was underpaying them. Verified: every rate matches the admin catalogue's own
  `basePricePaise`, and the net follows the 15% rule exactly.
- **Pro 28 shows what the customer pays AND what the pro keeps.** A pro
  deciding whether to keep a service switched on is deciding on the second
  number; making them apply 15% in their head is a cruelty with no purpose.
- **Editing a profile cannot touch admin-owned fields.** `updateProProfile`
  accepts only bio, experience, areas, phone and UPI. Verified through the real
  mutation: bio, years and primary area changed; **name and skills did not.**
- **Holiday mode is a separate state from "all seven days off".** A pro away
  for a week who cleared their schedule would have to rebuild it from memory on
  return. Holiday mode suspends the week without destroying it. Verified: the
  schedule survives the toggle intact.
- **Switching every service off is allowed, and warned about.** It is a
  legitimate thing to want for a day and a terrible thing to do by accident, so
  the screen states plainly that no jobs will arrive — even while online.
- **The rating is shown with the 2.5 auto-block threshold attached.** A pro at
  2.7 is one bad week from losing their account, and a bare number does not
  convey that. The threshold is never hidden.
- **A pro sees only pro-raised support tickets.** Verified after fixing the
  cross-role leak above — zero customer tickets in the pro list.
- **The rating breakdown's bars average exactly to its headline.** Verified
  across six pros: counts sum to the total, no negatives, and the mean derived
  from the bars equals the number printed above them. A distribution that
  contradicts its own average is the first thing anyone checks.
- **The distribution is shown, not just the average.** Four 5-star jobs and one
  1-star average to 4.2 — and so do five 4-star jobs. Only one of those pros
  has a problem to fix, and only the breakdown shows which.
- **Reviews are labelled as examples while `REVIEWS_ARE_PLACEHOLDER` is true.**
  One flag, shared with the consumer side. Presenting invented reviews as a
  pro's actual record is the exact failure that got the consumer home page
  rebuilt.
- **Job alerts cannot be switched off in Settings.** A pro who turned them off
  would stop receiving work and would not connect the two — they would conclude
  the platform had stopped sending jobs. The switch is present, locked on, and
  points at the two correct controls: going offline, or holiday mode.
- **Notifications are generated from the pro's real record.** A pro with no
  warnings sees no warning notification; a blocked pro sees the notice that
  explains it. Verified: warning rows match `warningCount`, plus the block
  notice where applicable. A static list would contradict the profile screen
  one tap away.
- **Warnings are their own notification kind, never grouped.** The customer's
  `AppNotification` union has no warning at all, and filing one under
  "reminder" would bury the most consequential message this app delivers.
- **The pro FAQ answers pro questions.** Twelve entries, each a rule the app
  enforces somewhere — "why did I go offline after accepting", "is GST taken
  out of my payment", "why can I not mark this job complete". Most of this
  app's rules are invisible until they bite; a well-aimed FAQ is cheaper than
  the support call it prevents.
- **One helpline number, re-exported rather than duplicated.** A pro and a
  customer ringing different numbers is a real operational problem, and two
  constants is how that happens.
- **Deactivation is a request with the active-job count shown.** A pro with
  jobs booked cannot simply vanish — a customer is expecting them tomorrow.
- **Bank details are validated before they can cost anyone anything.** IFSC
  shape, account-number length, and the account number entered **twice** with
  paste blocked on the confirmation — a banking convention that exists because
  a single field silently accepts a plausible wrong answer. A wrong IFSC does
  not fail now, it fails when the first payout is attempted days later, with
  the pro chasing it. All three validators verified against 17 cases.
- **The onboarding intro states no earnings figure.** Nothing in the agreement
  supports "earn ₹40,000 a month", and a platform that opens with an invented
  number has set the tone for everything after it. The commission-free first
  jobs and the 48-hour payout are real documented terms.
- **Pro 6 tells the pro why each document is wanted, next to the box that
  wants it.** This is the most invasive screen in the app; a vague reason gets
  it abandoned more slowly than no reason.
- **`uploadDocument` always returns `pending`.** A screen that ticked a
  document green on upload would teach the pro the review is automatic, then
  contradict itself on the approval screen. A person reviews these.
- **Pro 9 promises no KYC turnaround time.** The agreement gives none, so the
  screen says what happens rather than when, and offers the helpline with its
  hours. "Within 24 hours" against no documented commitment would be a
  developer inventing an SLA.
- **Pro 9 shows per-document status, not one global spinner.** A pro whose
  Aadhaar passed and whose selfie failed needs to know that, or they re-do all
  four.
- **"Auto-read OTP" is honest.** `autoComplete="one-time-code"` plus WebOTP
  behind an `"OTPCredential" in window` guard, with an abort controller so an
  abandoned listener does not block the next request. No fake auto-fill
  animation: a pro who watches an app pretend to read their SMS and then types
  it anyway has learnt the app lies about small things.
- **Pro 8 asks for two acknowledgements, not one "I agree".** They are the two
  things that most surprise a new pro — that proof is required, and that
  warnings are real — so a pro has to read far enough to know what the second
  refers to. A deliberate friction.
- **Registration picks services from the catalogue, never free text.** A pro
  typing "AC repair" against a catalogue entry named "AC service & repair"
  would be matched to zero jobs, and nobody would find out for a week.
- **Pro 34 shows a ₹0 penalty as ₹0.** Rendering nothing would leave a pro
  unsure whether money was taken.
- **A clean disciplinary record is stated out loud.** "No warnings on your
  account" rather than an empty list — a pro who has done nothing wrong should
  be told so.
- **Offline is the default on app open.** A pro who has not said they are ready
  should not be in the dispatch pool — being alerted for a job they cannot take
  costs them a penalty, not just an annoyance.
