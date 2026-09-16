# CityFamilyCare — consumer home page

Two builds of the same page, generated from one source so they never drift apart.

| File | What it is |
|---|---|
| `cfc-home.html` | Single file, no build step, no CDN. Double-click it to show the client. |
| `cfc-nextjs/` | Next.js 15 App Router project. `npm install && npm run dev` |

---

## The design decisions, so you can defend them

**One brand colour, not ten.** Everything on the page is built from five values pulled
out of the app Figma:

```
teal      #0FB3A6   brand, primary buttons, every accent
teal deep #07837A   hover + text on tinted backgrounds
navy      #0B2239   all body text, the pro band, the footer
blue      #2456D6   a second tint so the category grid isn't monotone
paper     #F5F8FA   section separation, with #E3EAF0 hairlines
```

No orange anywhere, per the client. Colour is rationed on purpose — when a page uses
three hues with discipline it reads expensive; when it uses ten it reads like a template.

**One typeface.** Plus Jakarta Sans, 400 to 800. Display sizes are tracked tight
(`-0.035em`), body is left at normal. Headline uses `clamp()` so it scales without
breakpoint jumps.

**One bold object.** The search bar is the only element with a hard offset shadow and a
2px black border. Everything else — cards, tiles, buttons — is quiet around it. That's
the thing the eye lands on, and it's also the thing the client's users came for.

**Motion is rationed too.** Three hero cards drift on a slow loop, the category tiles and
the trust stats reveal once on scroll, the testimonials run on a CSS marquee that pauses on
hover, and the mic pulses while listening. Nothing else animates on entry —
fade-up-on-every-section is the giveaway that a page was generated rather than designed.
`prefers-reduced-motion` kills all of it.

---

## Section order and why

1. **Header** — logo, city switcher, nav, primary CTA. Sticky, gains a hairline on scroll.
2. **Hero** — offer pill, headline, sub, search with voice, popular chips, trust stats.
   The visual is a live-booking collage (assigned pro + ETA + fixed price + confirmation)
   rather than a stock photo, because trust is what actually sells this category.
3. **Service grid** — 12 categories with starting prices on the tile itself.
4. **Promo banners** — three offers: FIRST20, the annual CFC Care plan, off-peak pricing.
5. **Most booked this week** — snap-scrolling rail with rating, bookings, duration, price.
6. **How it works** — three numbered steps (numbered because it genuinely is a sequence).
7. **Why CFC** — six proof points in a bordered grid, not six floating shadow cards.
8. **Join as a pro** — full-bleed navy band with earnings stats. The colour break here
   is what stops the page feeling like one long white scroll.
9. **Testimonials** — marquee of real-sounding reviews with city names.
10. **Cities**, then **footer**, plus a sticky mobile action bar below 900px.

Search and search-results are separate screens in your scope doc (#8, #9) — the hero bar
is wired to take the query, so point it at `/search?q=` when those exist.

---

## Voice search

`#micBtn` uses the Web Speech API (`SpeechRecognition`, `lang: en-IN`) where the browser
supports it — Chrome and Edge do, Safari and Firefox don't. Where it doesn't, it falls
back to a scripted demo so the client never sees a dead button in a review call. Swap
`runDemo()` for your real handler when the backend is ready.

---

## Responsive

Breakpoints at 1080, 900 and 620px. Three things change shape rather than just shrinking:

- the hero collage becomes a vertical stack (overlapping cards do not work at 390px);
- the popular-search chips become a horizontal scroller instead of wrapping to three rows;
- a sticky bottom action bar appears, and the nav moves into a full-screen sheet.

Checked for horizontal overflow at 390 / 768 / 1440.

---

## Where to plug in real data

Everything is static markup. The three arrays worth lifting into props or a CMS first:

- category tiles (`.cat-grid`) — name, icon id, starting price, optional badge
- most-booked rail (`.rail`) — title, rating, booking count, duration, price, icon id
- testimonials (`.marquee-track`) — quote, name, locality, city

Icons are a single inline SVG sprite at the top of the page (`<symbol id="i-…">`), so
adding a category is one symbol plus one tile. No icon library, no font, no network call.

## Notes on the Next.js build

`app/page.tsx` holds the markup; every interaction lives in `app/interactions.js` behind
one `useEffect` that returns its own cleanup, so it's Strict-Mode safe. If you'd rather
have idiomatic React state for the menu and the mic, that's a contained refactor — the
markup doesn't change.

---

## Round two: what changed

The first pass got the look right. This pass makes it behave like a product rather than
a picture of one.

**Live search with a real suggestion list.** A 26-service catalogue sits behind the hero
bar. Typing filters on service name *and* category, so "clean" surfaces sofa shampooing
too, and the matched substring is highlighted. Full keyboard support — arrow keys, Enter,
Escape — with `role="combobox"` / `role="listbox"` wiring. Empty state suggests plainer
wording and gives the support number instead of a dead end. Focus with an empty box shows
the five most-booked services. This is effectively scope screen #8 living inside the hero.

**City picker instead of a decorative chip.** Eleven cities in a popover, a "use my
current location" row, and picking one updates the header *and* the "Most booked in ___
this week" heading. On mobile it becomes a fixed sheet rather than a popover that hangs
off the screen edge.

**The hero card runs the booking it is describing.** The ETA counts down, the progress
bar advances, and the card flips to "Rajesh is at your door / work started at 10:34 AM"
before looping. That single detail communicates the whole product promise faster than the
headline does. Frozen entirely under `prefers-reduced-motion`, and paused when the tab is
hidden.

**Counters that count.** The four trust stats and the two earnings figures animate once on
reveal, with Indian digit grouping and tabular numerals so nothing jitters.

**Rail upgrades.** Drag-to-scroll with the mouse, a live progress thumb under the cards,
and arrows that disable at each end instead of clicking into nothing.

**An FAQ that earns its place.** Six real objections — vetting, hidden charges, warranty,
cancellation, damage, Sunday availability — answered plainly, and mirrored into
`FAQPage` structured data.

**SEO and machine-readability.** Canonical, Open Graph and Twitter tags, font preconnects,
and JSON-LD covering `Organization`, `WebSite` with a `SearchAction` (so Google can show a
sitelinks search box) and the `FAQPage`. Next.js gets the same via the Metadata API.

**Accessibility.** Skip link, focus trap in the mobile sheet, `aria-live` on the voice
status so screen readers hear what was heard, real `<button>` elements everywhere, visible
focus rings, and no horizontal overflow at 390 / 768 / 1440.

### Still on the table

- Real routing for search → results (scope screens #8 and #9)
- Slot picker and address capture, so the hero can genuinely book in 60 seconds
- Self-hosted font subset to drop the Google Fonts round trip entirely
- A dark theme; every colour is already a token, so it is a variables-only change

---

# Screen 2 — the signed-in home page

`cfc-home-signed-in.html`, and `app/home/page.tsx` in the Next.js project.

Same tokens, same footer, same category tiles — pulled from the signed-out page at build
time, so a change to a category or a footer link updates both pages automatically and they
can never drift.

## The rule this screen follows

Everything that exists to *convince a stranger* is gone: how it works, why CFC,
testimonials, the cities list, the FAQ, the "join as a pro" band, the marketing hero.
Aarthi is already convinced. Keeping that content after login is the most common mistake
in this category — it puts a billboard between the customer and the thing they came to do.

## Navbar, rebuilt

Logo, address selector, a search field that now lives permanently in the bar, then
notifications, cart with a live count, and an account menu — bookings, saved addresses,
payment methods, CFC Care, refer and earn, help, settings, log out. Below 620px the
wordmark drops, the address chip truncates, and search moves to its own row.

## Brand-new account, handled as an invitation

She has no history, so there is nothing to personalise with. Instead of a shrug, the page
gives her a job:

- a three-step setup list — account created (done), add your address, book your first
  service — where each step completes in place;
- the address panel opens inline, saves as Home / Work / Other, and updates the header
  chip the moment it is saved;
- FIRST20 presented as something she already owns rather than an ad;
- the category grid promoted to the top, because with no history it *is* the navigation;
- an empty bookings state that explains what will appear there later, and a button out of it.

## The cart actually works

Add from a service card or straight from a search result. Quantity steppers in both places
stay in sync, the trash icon replaces minus at quantity one, the drawer computes FIRST20 at
20% capped at ₹300, and checkout refuses to proceed without an address — it sends her back
to the address step instead of failing at the payment screen. On mobile a cart bar rises
above the tab bar with the count and the post-discount total.

## Mobile

Tab bar — Home, Bookings, Help, Account — with the cart promoted to its own sticky bar,
which is how Indian consumers expect a multi-item cart to behave.

## What is deliberately stubbed

Slot picker, address autocomplete, category listing pages, notifications and payments all
show a toast saying so, rather than pretending. The moment you have endpoints, the only
files to touch are `interactions.js` for state and `page.tsx` for markup.
