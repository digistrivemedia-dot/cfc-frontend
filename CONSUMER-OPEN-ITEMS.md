# CFC Consumer — Open items

Things flagged while building, to be worked through **after all 44 screens
exist**. Nothing here blocks the next screen.

Last updated: 2026-09-09 · after C15 (Screens 40-44) — all 44 built

---

## 1. Needs a decision from the client

These are gaps in what the agreement documents, not gaps in the build. Each
one would mean putting a promise on screen that support has to honour, so none
of them is invented.

| # | Question | Where it bites | Raised at |
|---|---|---|---|
| 1.1 | **What is the cancellation and refund policy?** How late can a customer cancel, and what is refunded? | Service detail FAQs, Booking detail (26), My Bookings (25) | C4 |
| 1.2 | **What happens if the pro does not arrive?** | Same FAQs, Live tracking (27) | C4 |
| 1.3 | **Are the reviews real?** The fixture copy is written by us and the screen labels it as sample content. Flipping `REVIEWS_ARE_PLACEHOLDER` to `false` removes the label and turns on the "Verified" badges. | Home (7), Service detail (12), Pro profile (13) | C1 |
| 1.4 | **Is `?role=pro` on the register screen the right destination** for the Join-as-Pro banner, or should it link to a separate pro-signup flow? | Home (7) | C1 |
| 1.5 | **How far ahead can a customer book?** The calendar is capped at 30 days as a guess. | Slot selection (15) | C5 |
| 1.9 | **The legal documents need real wording.** Terms, privacy and refund policy are drafted by the client's lawyer, not by us. Writing plausible legal text would be the most dangerous invention in this build — it is binding, and a refund clause we made up commits the business to honouring it. Each document currently states its own headings and says the wording is pending. | Legal (44) | C15 |
| 1.8 | **What are the referral terms?** PLATFORM-FACTS documents no programme — no reward, no minimum spend, no cap. ₹100 per referral above a ₹500 booking is a placeholder shape, labelled as such on screen. Flip `REFERRAL_TERMS_ARE_PLACEHOLDER` once set. | Refer and earn (38) | C13 |
| 1.7 | **Is there a customer-side deadline on a quotation?** The 15-minute window is documented as an admin rule ("pro cannot wait longer", Admin 4/5). No customer deadline is stated, so no countdown is shown. | Quotation flow (22, 23) | C9 |
| 1.6 | **Are two-hour arrival windows right?** 08:00–20:00 in 2-hour blocks is assumed, not documented. | Slot selection (15) | C5 |

---

## 2. Spec clauses we cannot honour as written

Each is a case where the inventory describes a native app feature or data the
platform does not hold. Flagged rather than faked.

| # | Clause | Why | Current behaviour |
|---|---|---|---|
| 2.1 | **Screen 9 — "sort by distance"** | No geo data on services, and no customer location. Sorting by a made-up distance puts a false number in front of someone choosing between services. | Sort by rating, price and popularity. Distance absent. |
| 2.2 | **Screen 5 — "OTP auto-read"** | Android SMS Retriever API. The web equivalent (WebOTP) is Chrome-on-Android only and needs the SMS formatted with the origin. | `autocomplete="one-time-code"` so the keyboard offers it. No fake auto-fill animation. |
| 2.3 | **Screens 7, 8 — "voice search"** | Web Speech API: Chrome/Edge/Safari only, never Firefox. | Mic renders **only** where the API exists. Language `en-IN`. |
| 2.4 | **Screen 21 — "Add to Calendar"** | No web API for it. | Planned: `.ics` download + Google Calendar URL. Both work everywhere. |
| 2.5 | **Screen 27 — "real-time map"** | Google Maps SDK is out of frontend scope; no API key. | `MapView` from `@cfc/ui`, built to be swapped for the SDK. |
| 2.6 | **Screen 32 — "PDF download"** | Invoices are generated server-side per the agreement. | Planned: print-styled route + `window.print()`, replaced by the backend endpoint. |
| 2.7 | **Screen 42 — "AI Chat Assistant"** | No model, no endpoint, no budget stated anywhere. | Planned: chat shell with a scripted mock responder. **Client must be told this is a UI shell awaiting a backend.** |
| 2.8 | **Screen 20 — "Razorpay integration"** | Frontend only, no keys. | Planned: method picker + a stand-in dialog driven by the scenario control. |
| 2.9 | **Screen 16 — "detect location"** | The browser Geolocation API returns coordinates, not an address. Turning one into the other needs a geocoding service we do not have. | Sets the map pin and says so in a toast: *"Pin set. Please still type the address."* It does not pretend to fill the form. |
| 2.25 | **Screen 42 — AI assistant is a UI shell** | No model, no endpoint, no budget stated anywhere. | Scripted keyword replies over a real chat UI, with an alert saying plainly it *"cannot see your bookings or make changes"*. **The client must be told this awaits a backend.** `AI_ASSISTANT_IS_SHELL` gates the notice. |
| 2.26 | **Screen 43 — language switcher** | The five languages are clause 4.6 and the translation bundle is another team's scope. | The sheet lists all five with English selected and the rest marked *Soon*. Not a switcher that offers four options doing nothing. |
| 2.27 | **Screen 43 — dark mode toggle** | `darkMode` is declared in the preset but `tokens.css` has no dark block, so `data-theme="dark"` changes nothing today. | The toggle is wired, persists to localStorage, and **sets `data-theme` anyway** so it works the moment the tokens land. Labelled *Coming soon*. See 3.2. |
| 2.28 | **Screen 44 — app rating CTA** | A web app has no store listing to link to. | Points at rating a completed booking instead, which is a real action that helps a real professional. |
| 2.23 | **Screen 36 — "add money"** | No payment gateway and no keys. | Amount presets are real and reviewable; an `InlineAlert` states plainly that the gateway is not connected and nothing will be charged. No card form that leads nowhere. |
| 2.24 | **Screen 38 — native share** | `navigator.share` is the OS share sheet on Android and iOS Safari, absent on most desktops. | The Share button renders only where the API exists; **Copy link** is always offered as the path that works everywhere. `navigator.clipboard` also needs a secure context, so that is guarded too. |
| 2.20 | **Screen 34 — "photo upload"** | There is no file store, and accepting a file that goes nowhere is worse than not offering it. | The button is present but disabled, with the reason stated: *"Photo upload arrives with the media integration."* Avatars fall back to initials. |
| 2.21 | **Screen 34 — phone number not editable** | The number is the login identity. Changing it is an OTP flow of its own, not a text field. | Shown, disabled, with *"This is how you sign in. Contact support to change it."* A field that looks editable but silently is not is worse. |
| 2.22 | **Screen 35 — add/edit lives in the booking flow** | The address form already exists at `/book/[id]?step=address`. Duplicating it here would give two implementations of one form to keep in step. | The profile sheet lists and deletes; a link sends the customer to book, where they add one. Revisit if the client wants add-from-profile. |
| 2.19 | **Screen 13 — no "book this professional"** | Auto-assign offers a job to the three nearest pros and the first to accept wins. A customer cannot request a specific one. | The profile answers *"who is coming?"*, not *"who should I choose?"*, and ends with a link to browse services. A book-this-pro button would fail every time it was pressed. |
| 2.17 | **Screen 32 — "PDF download"** | The agreement says the invoice PDF is auto-generated per booking, which is a backend job. | A print-styled route plus `window.print()`. That produces a real PDF via the browser dialog on every platform — more use than a button that does nothing. Replaced by the endpoint when it lands. |
| 2.18 | **Screen 32 — the tax breakdown is derived, not stored** | A completed booking carries only `totalPaise`; the fee and GST split is not persisted on it. | Recomputed with the same `priceBooking` checkout used, against `svc_01`. **The real endpoint must return the stored breakdown** — otherwise a fee change would retroactively alter old invoices. Flagged for the backend team. |
| 2.15 | **Screen 23 — "Ask a question"** | There is no message thread on a quotation in the data model, and showing a chat with no reply coming is worse than saying what happens. | A Sheet takes the question and says plainly: *"Our team will read your question and call you."* The pro is not messaged directly. |
| 2.16 | **Screen 22 — "Notification"** | Push notification delivery is a backend concern; nothing dispatches one. | The quotation route exists and is linkable. A nav badge count is available via `getPendingQuotationCount` but not yet wired into the shell. |
| 2.13 | **Screen 27 — "real-time" position** | `MapView` is a styled canvas, and the pro's position comes from a fixture. Nothing streams. | The pin renders at its given position and the panel says so: *"Live position updates once the Maps integration is connected."* The ETA counts down locally from the API estimate. |
| 2.14 | **Screen 29 — "job timer"** | The inventory names a timer. There is no job start timestamp separate from the event log, and timing a job from the customer side implies a precision the platform does not track. | The timeline shows when work started, via `formatSchedule`. No running clock. |
| 2.11 | **Screen 26 — "reschedule"** | Wired to `/book/[id]?reschedule=1`, but that flow does not yet read the flag — it starts a fresh booking rather than moving an existing one. | Link is in place; the reschedule path lands with a later phase. |
| 2.12 | **Screens 26, 28 — job photos** | The fixture paths point at images that do not exist, and a grid of broken-image icons reads as a fault. | Tinted panels with an `aria-label`. The real photo grid with a lightbox arrives with Customer 28. |
| 2.10 | **Screen 16 — "map pin"** | Placing a pin by dragging needs the Maps SDK. | `MapView` shows the selected address centred, confirming rather than setting. The customer corrects the text instead. |

---

## 3. Deferred by decision

| # | Item | Note |
|---|---|---|
| 3.1 | **Multi-language** (EN/TA/KN/HI/TE, clause 4.6) | Another team. We keep copy as JSX text in screen files so a later extraction pass is mechanical. |
| 3.2 | **Dark mode** (Screen 43) | Parked. `darkMode` is declared in the preset but `tokens.css` has **no dark block**, so `data-theme="dark"` toggles nothing today. Adding it is a values-only edit to one file — but it affects the **admin app too**, so it is a shared decision. Four rules are being followed meanwhile so the cost stays low: role-named colours only, never a background token as a foreground, no assumed lightness, and any new token gets both values at once. |
| 3.3 | **PWA service worker** | Manifest added in Phase 0. Offline shell comes after the last screen. |

---

## 4. Technical debt to clear at the end

| # | Item | Detail |
|---|---|---|
| 4.1 | **Extract `OtpInput`** | `(auth)/otp/page.tsx` hand-rolls a 6-digit input. It works, so this is opportunistic — but Screen 29 needs an `OtpDisplay` (the code the customer *shows* the pro), and the two should be siblings in `@cfc/ui`. |
| 4.2 | **`ServiceCard` uses a raw `<img>`** | Deliberate — the card lives in `@cfc/ui`, which must not depend on `next/image`. Revisit if image performance becomes a real problem. |
| 4.3 | **Admin: `/bookings?tab=map` never rebuilt** | Phase 10 of the admin plan was skipped. Still on its original build. See `ADMIN-PENDING.md`. |
| 4.4 | **Admin: keyboard walkthrough** | Not done across the 49 screens. See `ADMIN-PENDING.md`. |

---

## 5. Design-system traps found the hard way

Recorded because each cost real debugging time, and each will happen again to
whoever works on this next. **All of these fail silently** — no error, no
warning, the style simply does not exist.

| # | Trap | Example |
|---|---|---|
| 5.1 | **Off-scale spacing generates no CSS.** `spacing` is *replaced*, not extended, so anything outside `0 1 2 3 4 5 6 8 12 px touch panel` produces nothing. | `pl-9` left the search icon sitting on top of the placeholder text. `pb-20` meant the mobile tab bar overlapped page content on every screen. |
| 5.2 | **A token name ending in a breakpoint name breaks the parser.** `top-bar-lg` is ambiguous to Tailwind and generates nothing — even unprefixed. | Renamed to `bar-tall`. **Never name a token `-sm`/`-md`/`-lg`** if it will be used with an inset or position utility. |
| 5.3 | **Heights are not shared with insets.** `h-bar` existing does not give you `top-bar`. | `top-bar` was dead until the value was added to `inset` as well. |
| 5.4 | **Opacity modifiers do not work on colour tokens.** Tokens are authored as hex, so `bg-surface/95` produces nothing. | The old nav had `backdrop-blur` behind a fully opaque bar. |
| 5.5 | **A background token used as a foreground inverts in dark mode.** | Four instances of `text-surface` on filled buttons in `@cfc/ui`, fixed in Phase 0. `--color-on-action` exists for this. |
| 5.6 | **`DetailShell` splits at `lg:`, a *viewport* query.** Inside a drawer on a wide screen it reserves a 320px rail in a 448px panel. | Crushed the admin support sheet's content to ~40px. Not used in consumer. |

### The lint rule that was itself broken

The `no-restricted-syntax` rule meant to catch trap 5.1 had single-backslash
escapes in a JS string:

```
(?:^|\s)  →  (?:^|s)      needs a literal "s" before the class
\b        →  a backspace   can never match
```

**That rule was dead for the entire admin build.** Every off-scale class found
by hand — the sidebar with no width, the avatars with no size, the collapsed
switch — the rule meant to catch them was doing nothing.

Fixed with lookarounds (the original also could not match a class in the
*middle* of a string) and verified against 11 cases: 5 that must catch, 6 that
must pass. It immediately found **29 more dead classes** — 16 in consumer, 13
in admin.

**Lesson:** a lint rule that has never failed is not necessarily working. Prove
a new rule catches a planted violation before trusting it.

---

## 6. Verified and deliberately left alone

Noted so nobody "fixes" these later.

| Item | Why it is correct |
|---|---|
| `grid-cols-6` on the OTP row | Six digit boxes. Correct at 390px. |
| `grid-cols-5` on the 2FA QR grid | A drawn QR placeholder inside an 80px box. |
| `grid-cols-4` on the payments date segments | Labels are short — "Today", "7 days", "30 days", "All time" — and fit at ~85px each. |
| `grid-cols-3` on the service image tiles | Three square upload tiles, ~110px each at 390px. |
| Splash redirect | Already gates on a `localStorage` flag and sends returning users to `/home`. A plan review suggested "fixing" this; it was already right. |
