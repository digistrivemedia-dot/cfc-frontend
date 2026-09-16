# CFC consumer — design system

Written for: whoever transforms the remaining consumer screens (including a
future session of Claude starting with no memory of this work).

Derived from the finished, client-approved home page
(`apps/consumer/src/app/(home)/`), not from a style guide written in advance.
Every value below was read out of a real file. Where a rule exists because
something was rejected, the rejection is recorded — the reason is the useful
part, not the value.

**Scope: the consumer app only.** Pro and Admin are accepted and must not
change. That is a property of the import graph, not a convention — see §8.

---

## 0. The one thing to read if you read nothing else

**Pale grounds. Coloured objects.**

The page is white or near-white almost everywhere. Colour appears in *small,
contained things* sitting on top: stat cards, icon tiles, pills, badges,
buttons. Colour is never the ground under a whole section.

This single rule is what two rejected versions got wrong, in opposite
directions:

- **Rejection 1** — dark navy bands. The page "read as dark".
- **Rejection 2** — a full-bleed saturated teal slab for the pro section. It
  broke the page's rhythm: one loud section between two pale ones.

Both were fixed the same way: make the ground pale, move the colour into the
objects on it.

The inverse mistake is just as bad and was made once during the build: a
**white card on a tinted band**. The client's reference does the opposite —
a **tinted panel on a white page**. If you are unsure which way round a panel
goes, the tint belongs to the panel, not the section.

---

## 1. Colour

### 1.1 The palette

Sampled from the client's Figma (`final/cfccolors-spec.md`) and shipped in
`(home)/home-pages.css`.

| Role | Hex | Used for |
|---|---|---|
| Teal | `#02BABC` | The brand. Primary buttons, icon tiles, confirm ticks. |
| Teal hover | `#07D2CE` | **Lighter** than the base. See §3.2. |
| Teal press | `#01A09E` | |
| Teal wash | `#E2F7F7` | Pale teal fills: eyebrows, pills, icon plates. |
| Blue | `#2464D0` | The second hue. Alternates with teal so neither forms a block. |
| Blue wash | `#E9F0FC` | |
| Ocean | `#015EA3` | The offer strip only. Small areas. |
| Panel light | `#C3E9F2` | Card media panels. |
| Orange | `#F47B20` | Rationed. Badges and one eyebrow. See §1.3. |
| Yellow | `#F5A623` | Rating stars only. |
| Ink | `#0E2A47` | Headings and body. |
| Ink-2 | `#2F4E76` | Secondary text. |
| Muted | `#6A83A0` | Captions, meta. |
| Paper | `#F1FAFB` | The hero ground. |
| Line | `#E3ECF4` | Borders. |
| Line soft | `#F0F5FB` | Inner dividers. |

### 1.2 Section grounds, in page order

White is the default. The tinted sections exist to break a long scroll, not to
decorate.

| Section | Ground |
|---|---|
| Hero | `#F1FAFB` |
| Offer strip | white |
| Categories | white |
| Care / Most booked | `#ECF9FA` |
| How it works | white |
| Why CFC / Testimonials | `#F7FCFD` |
| Pro band | white (the **panel** inside is `#EEF4FC`) |
| FAQ | white |
| Cities / app panel | white (the **panel** inside is `#EEF4FC`) |
| Footer | `#F5FAFC` |

Note the pattern at the bottom: the last three sections are all white, and the
two panels carry their own tint. That is deliberate — it was the fix for a
colour seam where a tinted band met the white FAQ above it and the footer band
below it.

### 1.3 Teal and blue alternate; orange is rationed

Wherever there is a repeating grid of coloured objects, **every third one goes
blue**:

```css
.cat:nth-child(3n+2) .cat-ic   { background: var(--blue); }
.why-cell:nth-child(3n+2) .ic-box { background: var(--blue); }
.step:nth-child(2) .step-n     { background: var(--blue); }
.pstat:nth-child(2), .pstat:nth-child(3) { background: var(--blue); }
```

Blue is a **tint, not a second brand**. It exists so a twelve-tile grid is not
monotone. It never leads a CTA — with one exception, the Android store button,
which the reference shows in solid blue.

**Orange is spent about four times on the whole page.** HOT badges, the "most
booked" badge, the pro-band eyebrow, the live-ETA pill. Its job is to mark what
must *not* read as teal.

**The trap that caused a rejection:** a teal badge on a teal icon tile is
invisible. The client's words were *"what kind of designer you are… to add top
rated new and everything in those blue colors"*. An earlier version had three
badge labels in three colours — orange HOT, teal TOP RATED, blue NEW. The teal
one vanished. **One label, in orange, is the only pairing that reads against
every tile.**

### 1.4 No gradients on fills

`final/cfccolors-spec.md` §1 forbids it outright. Flat solid fills only. Two
gradient fills and a radial hero glow were removed to satisfy this.

Gradients remain legal for *scrims* over photographs, where they are doing a
legibility job rather than a decorative one.

---

## 2. Contrast — a known, accepted failure

Teal text on white (`#02BABC`) measures about **2:1**. WCAG AA asks 4.5:1.
White text on a teal fill measures about **2.9:1** against a 4.5:1 bar.

This is **shipped deliberately**, not overlooked. Two versions were already
rejected for not being vibrant enough, and matching the client's exact hex was
judged to matter more than the contrast gap.

Every piece of teal text resolves through one variable, so it is a one-line
switch if the client ever revisits:

```css
--teal-ink: #02BABC;   /* shipped: client's exact teal */
--teal-ink: #017E80;   /* accessible: passes AA on white */
```

Recorded in `final/DECISIONS-PENDING-CLIENT.md` §1. **Do not "fix" this
quietly** — it is a decision, and changing it changes the client's brand colour.

---

## 3. Interaction

### 3.1 Hovers are quiet

```css
/* the house hover */
border-color: var(--teal);
box-shadow: 0 4px 12px -6px rgba(16, 41, 76, .22);
```

A thin teal border and a small **neutral** lift. That is all.

**What this replaced, and why:** every control used to fire a 2px teal inset
ring *plus* a saturated teal glow (`rgba(2,186,188,.78)`). Two treatments doing
one job. The client called it *"very kind of cheap"*. Seven rules were calmed
at once — `.city`, `.chip`, `.mic`, `.rail-btn`, `.loc`, `.btn-ghost`,
`.app-btn`. **No inset rings anywhere on the page.**

### 3.2 Coloured buttons lighten on hover, never darken

`final/cfccolors-spec.md` §3. A coloured control moves to a *lighter* shade and
gains a coloured glow:

```css
.btn-primary        { background: #02BABC; }
.btn-primary:hover  { background: #07D2CE;   /* lighter */
                      box-shadow: 0 10px 26px -8px rgba(2,186,188,.75); }
```

This was violated twice — once in `home-pages.css` and once in `brand.css`,
where `--color-action-hover` was set to a *darker* teal. Both corrected.

### 3.3 Overlays must leave hit-testing when hidden

**This caused a real, user-visible bug**: every CTA in the home page header was
dead. The mobile sheet is `position: fixed; inset: 0; z-index: 90` and was
hidden by `transform: translateY(-101%)` **alone**. A transform moves an element
visually but leaves it catching clicks, so an invisible full-viewport layer sat
above the header swallowing everything.

**Any overlay hidden by transform or opacity must also set:**

```css
visibility: hidden; pointer-events: none;
transition: transform .42s var(--ease), visibility 0s linear .42s;
```

and restore both on `.open` with `visibility 0s` so the animation still plays.

---

## 4. Shape and depth

| Token | Value |
|---|---|
| `--r-sm` | 10px |
| `--r-md` | 14px |
| `--r-lg` | 20px |
| `--r-xl` | 28px |

Shadows are **neutral at rest** — colour only ever appears in a hover glow:

```css
--shadow-card:  0 2px 10px rgba(16, 41, 76, .06);
--shadow-lift:  0 10px 30px -14px rgba(16, 41, 76, .32);
--shadow-float: 0 22px 48px -22px rgba(16, 41, 76, .38);
```

---

## 5. Type

```css
h1 { clamp(2.1rem, 1.15rem + 3.1vw, 3.75rem); weight 800; tracking -.035em }
h2 { clamp(1.5rem, 1.05rem + 1.5vw, 2.25rem); weight 700; tracking -.028em }
h3 { 1.0625rem; weight 700 }
```

Tracking tightens as size grows. `clamp()` rather than breakpoints, so the
headline scales continuously and needs no `md:` variant.

---

## 6. Mobile

`--pad` drops 24px → **18px** at ≤620px, so `.wrap` gives **376px** of usable
width on a 412px phone.

**Every boxed section gets a 16–20px inset at ≤620px.** The audit that produced
this found seven boxes still carrying desktop or tablet padding on a phone —
`.offer-strip-in` was at 34px sides, spending 18% of the screen on empty margin.

| Box | Mobile padding |
|---|---|
| `.app-panel` | `28px 20px` |
| `.pro-in` | `32px 20px` |
| `.offer-strip-in` | `24px 20px` |
| `.faq details` | `2px 16px` |
| `.why-cell` | `22px 20px 20px` |
| `.promo` | `22px 20px 20px`, `min-height: 0` |
| `.step` | `22px 20px 20px` |
| `.pstat` | `16px` |

Decorative discs scale down too — a 260px circle sized for a desktop strip
swamps the box at phone width.

**Two breakpoints only:** ≤900px (tablet, grids collapse) and ≤620px (phone).
There are two separate `@media (max-width: 620px)` blocks in the file; the
second is later in source order, so rules there win at equal specificity.

---

## 7. Honesty rules

`PLATFORM-FACTS.md` governs. CFC has not launched.

- **No invented figures.** "Over 6,400 pros" and "average monthly earnings" were
  removed — nobody has signed up yet. What replaced them are *documented terms
  of the deal*: 0% commission on the first 20 jobs, 15% after, 48-hour payouts,
  MRP on parts.
- **Prices come from the catalogue**, never typed. A tile quoting a price the
  customer cannot then book at is the exact failure this prevents.
- **Ratings that don't exist render as "New"**, not as a fabricated score.
- Testimonials are written copy, currently labelled as samples. Recorded in
  `DECISIONS-PENDING-CLIENT.md` §3.

---

## 8. Applying this to the other 43 screens

**This is where it gets dangerous.** The home page and the rest of the app use
two different styling mechanisms.

| | Home page | The other 43 |
|---|---|---|
| Mechanism | Plain scoped CSS, `.cfc-page` prefix | Tailwind, closed preset |
| File | `(home)/home-pages.css` | utility classes in each `.tsx` |
| Values | literal hex | semantic tokens |

**You cannot copy CSS across.** You translate rules into preset tokens.

### 8.1 The lever: `brand.css`

`apps/consumer/src/app/brand.css` redefines the shared tokens for the consumer
app only, using `html:root` (one element selector heavier than `:root`) so it
wins regardless of where the bundler puts it.

It is imported by `apps/consumer/src/app/layout.tsx` **and by nothing else**.
Verified: zero references to `brand.css`, `home-pages.css` or `cfc-page` in Pro,
Admin or `packages`. That is why editing it cannot reach the accepted apps.

**One variable repaints all 43 screens.** 248 usages across 37 files resolve
through `--color-action`.

### 8.2 Token mapping

As of 2026-09-15 `brand.css` is unified with the home page:

| Home page value | Tailwind token | Utility |
|---|---|---|
| `#02BABC` teal | `--color-action` / `--color-brand` | `bg-action`, `text-action` |
| `#07D2CE` hover | `--color-action-hover` | `hover:bg-action-hover` |
| `#E2F7F7` wash | `--color-action-subtle` | `bg-action-subtle` |
| `#2464D0` blue | `--color-clock` | `bg-clock` ⚠️ see below |
| `#E9F0FC` blue wash | `--color-clock-subtle` | `bg-clock-subtle` |
| `#0E2A47` ink | `--color-ink` | `text-ink` |
| `#6A83A0` muted | `--color-ink-muted` | `text-ink-muted` |
| `#F1FAFB` paper | `--color-canvas` | `bg-canvas` |
| `#E3ECF4` line | `--color-border` | `border-border` |
| `--r-lg` 20px | `--radius-card` | `rounded-card` |
| `--r-md` 14px | `--radius-control` | `rounded-control` |

### 8.3 Traps

**⚠️ `clock` is blue on consumer and amber everywhere else.** In
`packages/tokens` `--color-clock` is `#b8790f`, an amber for SLA timers.
`brand.css` overrides it to `#2464D0` for consumer only. The name reads wrong.
Do not "correct" it in the shared tokens — that repaints Pro and Admin.

**⚠️ The closed scale silently emits nothing.** `spacing`, `colors` and
`fontSize` are **replaced**, not extended. An off-scale class like `w-56` or
`gap-1.5` produces *no CSS at all* — no error, the element just has no size.
This has already shipped bugs twice. The lint rules in
`packages/config/eslint-app.js` catch the known cases; trust them.

Real spacing steps: `0 1 2 3 4 5 6 8 12 16 20 24` (4px…96px), plus `touch`
(44px), `touch-lg` (56px), `panel`.

**⚠️ There is no `bg-orange` or `bg-yellow`.** The orange badges and yellow
stars have **no preset equivalent**. Options: add tokens to `brand.css`
(consumer-only, safe) or keep those elements in scoped CSS. Adding a token is
preferred — decide before the first screen that needs a badge.

**⚠️ Display type above 44px.** The preset tops out at `display-lg` (44px). The
home page's hero goes to 60px via `clamp()`. `brand.css` already provides
`.text-hero` and `.text-section` classes for exactly this. Use them; do not add
preset entries.

**⚠️ Opacity modifiers don't work on these colours.** `bg-action/90` generates
nothing, because tokens are authored as hex rather than HSL channels. Use a
dedicated token.

### 8.4 Screens are tools, not pitches

The home page is a shopfront and is allowed to be loud. A booking flow, a wallet
or a settings page is a **tool**. Same palette, quieter application: fewer
coloured objects, more white, colour reserved for the primary action and for
status.

Do not carry the hero's 60px display type or the marquee into a form.

---

## 9. Verification, every time

1. **Read the screen's current markup before changing it.** Do not assume.
2. **Grep any new utility class against the preset** before using it. The closed
   scale fails silently.
3. Check the rendered page, not just the file — `curl` the route and the
   emitted stylesheet.
4. **Never run `next build` while the dev server is running.** Both write to
   `apps/consumer/.next`; they corrupt each other's manifests and the dev server
   dies with opaque `ENOENT` errors on random routes. This happened. Stop the
   server first, or don't build.
5. Confirm scope: `git status --porcelain apps/pro apps/admin packages` should
   show only the two pre-existing preset files.
6. **Nothing is pushed.** The repo is connected to Vercel and a push goes
   straight to the client's review environment. Everything stays local until the
   owner says otherwise.

---

## 10. Open items

- **Footer service names** — currently derived from the live catalogue
  ("Cleaning", "Electrical & AC"). The client's HTML says "Home Cleaning",
  "AC Repair & Service", "Salon for Women". Changing them means editing the
  catalogue, which also changes the category grid. Undecided.
- **`.pstat` mobile padding** is 16px where the other boxes are 20px. Minor.
- **The signed-in home** (`(home)/home/page.tsx`, route `/home`) shares this
  stylesheet and has had no visual review.
- **Service photography** — placeholders, wrongly cast. See
  `DECISIONS-PENDING-CLIENT.md` §4.
