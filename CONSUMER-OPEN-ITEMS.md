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

---

## 7. Found during the phased optimisation pass (2026-09-09)

A screen-by-screen sweep of all 44 consumer screens, run in phases after every
screen existed. Everything below was found by reading the code rather than by
trusting a comment, and each item is either fixed here or flagged for the
client.

### 7a. Fixed in this pass

| # | What was wrong | Why it mattered | Fix |
|---|---|---|---|
| 7.1 | **`/cart` was a 404.** The header basket button linked to a route that did not exist. | Adding to the basket worked, the count went up, and clicking it produced a dead end — the whole Add-to-cart feature terminated in an error page. | Built the basket screen: line items, quantity steppers, remove, sticky summary. |
| 7.2 | **`AuthDialog` was built but never mounted.** Only self-referenced. | The whole "browsing is public, committing needs an account" rule was unenforced — there was no gate anywhere. | Mounted at the point of commitment (cart checkout) and inside `RequireAccount`. |
| 7.3 | **`AuthDialog` never signed anyone in.** It verified the OTP, closed, and left the session untouched. | A customer completed a sign-in and the header still said *Log in*. | Calls `signIn()` before continuing. |
| 7.4 | **Seven screens leaked another customer's data to signed-out visitors** — `/bookings`, `/wallet`, `/profile`, `/refer`, `/notifications`, `/support` tickets, `/book/[id]`. They fetched personal data with no session check. | A stranger arriving from a search result saw a wallet balance, a booking history and a referral code that were not theirs. | One `RequireAccount` guard, with a per-screen promise ("Sign in to see your bookings" vs "…your wallet"). |
| 7.5 | **`/support` was over-gated in the first fix.** | The FAQ and helpline are the two things a stranger with a problem most needs; requiring an account turns a question into a lost customer. | Only the personal ticket threads are gated. FAQ and helpline stay public. |
| 7.6 | **The service detail sticky bar was offset by a hardcoded 56px** for the mobile tab bar. | The tab bar became signed-in-only when the session landed, so for a guest — most first-time visitors — the price bar floated 56px above nothing. | Offset is session-aware. |
| 7.7 | **17 screens each added `pb-tab-bar`**, while `AppMain` also adds it session-aware. | Guests got dead space at the foot of every screen; signed-in customers got double padding. | Removed all 17. One source of truth in `AppMain`. |
| 7.8 | **The catalogue was not shoppable.** Add buttons existed only on the home screen; `/categories`, `/search` results and `/service/[id]` had none. | The screens where a customer actually decides could not collect anything, so a multi-service basket meant bouncing through detail pages. | All three use the cart-aware card. Service detail offers **Book now** and **Add to basket** side by side. |
| 7.9 | **No quantity anywhere.** Screen 14 asks for it. | Two bathrooms or three ACs could not be booked in one visit. | Stepper on the slot step, state in `?qty=`, capped at 6. **Only the work multiplies** — visit charge and platform fee do not, because a pro makes one trip. |
| 7.10 | **The footer was `hidden md:block`.** | It is where a customer checks the business is real before handing over an address and a card — hidden from the ~90% of visitors who arrive on a phone, and a signed-out visitor has no tab bar either, so they had no phone number, service area or legal links anywhere. | Shows at every width, condensing rather than disappearing. |
| 7.11 | **The area picker was signed-in only.** | *"Do you operate where I live?"* is the first question a stranger has, and they will not create an account to find out. | Area belongs to the visit, not the account. Public, persisted, on desktop and mobile. |
| 7.12 | **A "Help" button in the header dialled a phone.** Never in the inventory. | It wore the word *Help* and opened a dialler instead of the help screen. | Removed. Support is a menu item pointing at `/support` (Customer 40); the number lives in the footer and on the support screen, labelled as a number. |
| 7.13 | **`getConsumerProfile` threw a 404 under the `empty` scenario.** | The home screen fetches it alongside the catalogue in one `Promise.all`, so that one rejection blanked categories, services and banners — the whole page rendered empty under `__cfc.empty()`. | Returns a genuine new customer instead. "Empty" means no history, never no account. |
| 7.14 | **A competitor's advert was on the front page.** `promo-cleaning.png` was finished ad art carrying another company's branding ("SPARKLE & SHINE", "HOME GLOW"), its own feature list and its own app-download CTA. | It would have shipped as CFC's hero image. | Replaced with a real photograph of the work. **`promo-salon.png` and `promo-ac.png` carry the same problem and are unused — they should be deleted.** |

### 7b. Still open — needs the client or the backend

| # | Item | Detail |
|---|---|---|
| 7.15 | **Add-ons (Screen 14) are not buildable.** | The inventory asks the customer app for "variant picker, add-ons, quantity". Variants and quantity now exist. But **Admin 27 defines only** *Name, description, images, variants, inclusions, warranty info* — there is no way for an admin to create an add-on, so a customer-facing picker would edit data that cannot exist. Either Admin 27 gains an add-ons editor, or the clause is dropped. **Not invented.** |
| 7.16 | **Every service photograph is the same shoot.** | Fifteen images, one model, one polo shirt, one apartment. Any grid of more than four cards reads as one repeated picture, which is the single biggest remaining constraint on how good the catalogue can look. Needs either varied photography or a typographic card without images. |
| 7.17 | **`promo-salon.png` and `promo-ac.png` should be deleted.** | Same competitor branding as 7.14. Currently unused but sitting in `/public` where someone will reach for them. |
| 7.18 | **`ring-focus` generates no CSS anywhere in `@cfc/ui`.** | The preset defines `outlineColor.focus`, not a ring colour, so five focus rings in the shared library are invisible. Affects **all three apps**, not just consumer. New consumer code uses `outline-focus`; the library still needs the fix. |

---

## 8. Phase 6 — verification sweep (2026-09-09)

The last phase of the optimisation pass: no new features, only proving the
previous five did what they claimed.

### Results

| Check | Result |
|---|---|
| Typecheck — `@cfc/types`, `@cfc/mocks`, `@cfc/ui`, `@cfc/consumer` | **4/4 clean** |
| Lint — `@cfc/ui`, `@cfc/consumer` | **2/2 clean** |
| Every route returns 200 | **27/27** |
| Runtime errors in rendered HTML | **0** |
| Every static internal link resolves | **14/14** |
| Unwired `<Button>` across all files | **0** |
| Production build | **26 routes compiled** |

### Found and fixed during the sweep

| # | What | Why it mattered |
|---|---|---|
| 8.1 | **`ring-focus` on the search input** (`/search`) | Verified against compiled CSS: **0 rules**. The input's focus ring was invisible — a real keyboard-accessibility defect, not a style nit. Replaced with `outline-focus`. This is 7.18 biting in consumer code; the five occurrences in `@cfc/ui` are still open. |
| 8.2 | **Arbitrary grid track** `lg:grid-cols-[1fr_320px]` (`/cart`) | Compiles, but the design system's scale is closed and a one-off arbitrary track quietly becomes the house style. Replaced with `lg:grid-cols-3` + `lg:col-span-2`. |
| 8.3 | **A lint error in `@cfc/ui`** | `photo-capture.tsx` carried `eslint-disable-next-line @next/next/no-img-element` — a Next rule, in a framework-agnostic package with no Next plugin. The *comment* was the error. The `<img>` itself is correct: it renders an object URL that `next/image` cannot handle. |

### Deliberately not flagged

| Item | Why it is correct |
|---|---|
| The disabled "Change photo" button on `/profile` | Disabled **with the reason on screen** — *"Photo upload arrives with the media integration."* That is the honest pattern, not a dead button. |
| `/settings` is public | Language, dark mode and notification preferences are per-device and mean something before there is an account. Only the sign-out button is session-gated. |
| `/legal/*` is public | Terms and privacy must be readable without an account. |
| `max-w-screen-md` on profile, invoice, track, wallet, refer | Reading and receipt screens, not catalogues. A 1280px-wide invoice is worse than a 768px one. |

---

## §9 — Screens 7–13 audit ("Home & Discovery"), 2026-09-10

A screen-by-screen pass over Customer 7–13, driven by a full-page screenshot of
the home screen. Every Tailwind class in the consumer app was compiled against
the real preset to find utilities that silently generate no CSS, which is how
the first two items below were found rather than guessed at.

### Fixed

| # | Screen | Issue | Fix |
|---|---|---|---|
| 9.1 | — | **RETRACTED — this was a false alarm of mine, not a bug.** I reported that `tabular` generated no CSS, based on a probe that compiled the Tailwind preset in isolation. `.tabular` is in fact a hand-authored rule in `packages/ui/src/styles.css:29` which the probe never loaded. It sets `font-variant-numeric: tabular-nums` **and** `font-feature-settings: "tnum"` — strictly more than the Tailwind utility — and the house rule is to apply it "through this class, never ad hoc". A 326-line rewrite to `tabular-nums` was made and then fully reverted. **Lesson for future audits: compile the probe against the app's real CSS entry, not the preset alone, or hand-written `@layer` rules read as dead.** |
| 9.2 | 12 Service detail | Rendered `<div className="aspect-card bg-action-subtle" />` — a blank teal box — where the photo belongs, while passing `imageUrls[0]` to the basket on the same screen. | New `ServiceGallery`: real photo, thumbnail strip when >1 image, `onError` fallback. |
| 9.3 | 12 Service detail | "Recent reviews" called `getReviews(4)` — the newest reviews on the **whole platform**, contradicting the service-specific star rating directly above them. | New `getServiceReviews(name)` / `getServiceReviewCount`. Reviews fixture rewritten to generate per service (66 reviews, every service covered, verified by executing the fixture). |
| 9.4 | All service lists | All 16 services shared one description: *"Professional {name}, done right the first time…"* — repeated verbatim on every card in the grid. | Per-service copy for all 16. Claims nothing beyond the platform's existing documented promises; invents no timings, chemicals or brands. Verified: 0 boilerplate, 0 fallbacks, no two services share a description. |
| 9.5 | 7 Home | Filter strip silently removed 5 sections with no count, no label and no way to clear. | Filter summary bar (count + "Clear filter") and a real empty state when a filter matches nothing. |
| 9.6 | 7 Home | "Most booked" repeated four cards already shown in the shelves above — same services twice on one page. | Reshaped into a compact ranked strip (`RankedServiceRow`): social proof, not a second catalogue. |
| 9.7 | 10 Categories | Depth-1 was a plain icon list while the home page sold the same categories with photographs. | `CategoryCard` with artwork, gradient wash and live service counts. |
| 9.8 | 10 Categories | `category.serviceCount` (stored) disagreed with the home page's derived counts for the same category. | Both screens now count from the live catalogue. |
| 9.9 | 10 Categories | No sort at all on a category with 8 sub-categories. | Sort added, in the URL, same vocabulary as search. |
| 9.10 | 8/9 Search | Sort was component state — reset on every new search and dropped from shared links. | Moved to `?sort=`, carried across refinements. |
| 9.11 | 9 Search | Search field was `md:hidden`, leaving desktop with no visible input to refine a query on the results page. | Field shown at every width; back button stays mobile-only. |
| 9.12 | 8 Search | Empty trending rendered a bare heading with nothing under it. | Section hides when empty; a browse-the-catalogue line appears when there is nothing to suggest. |
| 9.13 | 13 Pro profile | `photoUrl` was on `PublicPro` and never rendered — every pro showed initials. | `AvatarImage` when present, initials as fallback. |
| 9.14 | 13 Pro profile | Skill tags were dead badges. | Linked into the catalogue. |
| 9.15 | 7 Home | Store badges styled as buttons that did nothing. | Plainly marked "Soon", no button affordance. |

### Dead-CSS findings from the full compile audit

Every class token in the consumer app (1,218) was compiled against the preset.
Beyond `tabular`, five utilities generated no CSS at all:

| # | Class | Where | Consequence | Fix |
|---|---|---|---|---|
| 9.16 | `md:top-bar-lg` | category strip, cart, search | **The home screen's category strip was pinned at `top-0` on desktop**, sliding under the header. The preset documents this exact trap: a utility ending in a breakpoint name is ambiguous to Tailwind's parser. | `md:top-bar-tall` |
| 9.17 | `max-h-menu` | area picker | `menu` is a `minWidth` token; there is no `maxHeight` of that name, so the dropdown had no cap and a long area list ran off the viewport. | `max-h-block-sm` (256px — the token the preset documents for dropdowns) |
| 9.18 | `animate-in` | booking confirmation | Never defined anywhere. The success tick had no animation, and the `usePrefersReducedMotion` guard around it was guarding nothing. | Defined `cfc-pop-in` keyframe + `animation.in` in the preset. |
| 9.19 | `font-bold` | home | The weight scale stops at `semibold`. | `font-semibold` |
| 9.20 | `bottom-16` | splash | Off the closed spacing scale. | `bottom-12` |

### Mobile responsiveness

| # | Issue | Fix |
|---|---|---|
| 9.21 | **The mobile header is ~104px** (a 56px brand row *plus* a search-and-area row), but the category strip and the search bar both stuck at 56px or `top-0` — so on a phone **both scrolled underneath the header and vanished**. The strip is the navigation spine of the home screen. | `ConsumerMobileTopBar` measures itself with a `ResizeObserver` and publishes `--cfc-mobile-bar`; the strip and the search bar offset by it, with `md:!top-bar-tall` taking over on desktop. Measured rather than hardcoded, because the header height depends on the controls inside it. |
| 9.22 | Loading skeletons did not match the grids they stood in for (categories: `sm:grid-cols-2` vs content `grid-cols-2 sm:grid-cols-3`; service: fixed `h-block-md` vs `aspect-card`), so the page reflowed the moment data arrived — worst on the slowest connections. | Skeletons now mirror their real grid and aspect ratio. |

### Verification performed

- `tsc --noEmit` clean: consumer, admin, pro, `@cfc/ui`, `@cfc/mocks`
- `next lint --max-warnings 0` clean: consumer, admin, pro
- `next build` succeeded: consumer (27 routes), admin, pro
- Full Tailwind compile audit re-run after the fixes: no dead utility classes
  remain in the consumer app. Remaining probe matches are all non-classes —
  `.tabular` (a real hand-authored rule, see 9.1), CSS variable names, import
  paths, `sms:`/`tel:` URLs, Button variant names, and token names quoted
  inside explanatory comments.
- Fixtures executed, not just read: 66 reviews across 16 services with no gaps
  and unique ids; 16 unique descriptions with no boilerplate; every referenced
  image confirmed present on disk

### Still open (needs client/backend, unchanged from §7b)

7.15 add-ons · 7.16 repetitive photography · 7.17 delete competitor-branded
`promo-salon.png` / `promo-ac.png` · 7.18 `ring-focus` in `@cfc/ui`

---

## §10 — Brand teal switched to the Figma colour (2026-09-10)

### What changed

The consumer app's teal fills now use **`#00b8c4`**, the colour approved in the
client's Figma, instead of the shared `#0891a0`.

Implemented as a consumer-scoped override in
`apps/consumer/src/app/brand.css`, imported from the consumer root layout. It
redefines `--color-action` and its hover/press/subtle/line companions. **Nothing
in `packages/tokens` was touched**, so the Pro and Admin apps keep the shared
palette — verified: Pro still serves `--color-action: #0891a0`.

88 fill usages across the consumer app resolve through this one variable, so no
call site changed.

### The trade-off, recorded deliberately

**White text on `#00b8c4` measures 2.43:1.** WCAG asks 3.0:1 for large bold text
and 4.5:1 for ordinary text, so white button labels meet neither bar and will
look washed out in bright daylight.

This was an informed decision, not an oversight. Both alternatives were built
and compared side by side before choosing:

| Option | Ratio | Verdict |
|---|---|---|
| `#00b8c4` + white label — **shipped** | 2.43:1 | Exact Figma colour; fails contrast |
| `#00b8c4` + navy `#0e1f3d` label | 6.75:1 | Same exact teal, passes at every size |
| `#009aa6` + white label | 3.40:1 | Passes; slightly darker than Figma |

The client approved the Figma colour and matching it was judged to matter more
than the contrast gap. Comparison page:
`scratchpad/teal-compare.html`.

### If this is revisited

**The cheapest fix is the label, not the teal.** Changing `--color-on-action` to
`#0e1f3d` in `brand.css` takes the identical background from 2.43:1 to 6.75:1 —
one line, and the Figma colour is untouched.

Worth knowing: this is the specific thing app-store accessibility reviews and
public-sector procurement checks flag. Cheap now, expensive after launch.

### A design-system trap found doing it

The override initially used `:root` and **silently did nothing.** Next hoists CSS
imports and bundles them in its own order, so importing `brand.css` *after*
`@cfc/ui/styles.css` did not put it later in the output — the shared `:root`
landed second and won on source order.

Fixed with `html:root`, which is one element selector heavier and therefore wins
on **specificity** regardless of bundler order. Verified in the served CSS.

**The lesson:** import order is not cascade order once a bundler is involved. An
override that depends on source order is an override that will eventually stop
working without an error.
