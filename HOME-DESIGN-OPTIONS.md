# Consumer Home — three design directions

Working record so the chosen one can be rebuilt exactly. Written 2026-09-09.

The customer lands on `/home`. The original screen was rejected as "useless":
nine stacked sections of equal weight, gradient boxes instead of the 22 real
photographs sitting unused in `public/`, placeholder testimonials that rendered
the words "Sample content", and no search input anywhere on the page.

---

## Shared foundations (in all three, keep whichever wins)

These are fixes, not stylistic choices. They stay regardless of the direction.

| Fix | Why |
|---|---|
| **Sub-categories drive browsing, not categories** | The five categories are admin buckets: "Home & Maintenance" holds 12 of 15 services, "Event & Function" and "Business & Others" hold none. The old grid rendered 3 tiles, one of which was almost everything. The nine sub-categories (Electrical & AC, Cleaning, Plumbing, Beauty, Nursing…) are what people actually book, and were shown nowhere. |
| **Real photographs** | 15 service images + 7 category images already existed and were entirely unused. |
| **A working search input** | The old hero's "Search" button navigated to `/search` to do what it could have done itself. |
| **Placeholder testimonials deleted** | Flagged `REVIEWS_ARE_PLACEHOLDER`, printed "Sample content" on the landing page. Invented social proof is worse than none. |
| **Navbar rebuilt** | Fake search (a link styled as a field) → real input. Second nav row of 4 links → account dropdown, ~48px back on every screen. Added a real `tel:` Help link. |
| **`outline-focus`, never `ring-focus`** | `ring-focus` generates **zero CSS** — the preset defines `outlineColor.focus`, not a ring colour. Still broken in 5 places in `packages/ui`, affecting all three apps. Not yet fixed. |

### Two token traps that caused real bugs

- **`max-w-line-*` are text-measure tokens, not containers.** `line-2xl` is
  **256px**. Using it on the hero form collapsed the search input to a ~40px
  box (the "WT" box in the screenshot). Use `max-w-screen-sm` (640px) /
  `max-w-screen-md` (768px) for layout.
- **Spacing scale is closed**: `0 1 2 3 4 5 6 8 12 px touch touch-lg panel`.
  `pb-16`, `mt-10`, `pl-9` silently generate nothing. The ESLint rule catches
  these — trust it.

---

## Design A — Search-first marketplace

**Pattern:** Urban Company / Amazon. Get to a booking as fast as possible.

**Structure**
1. Short hero — real search box + location + 3 promises. No photograph.
2. "What do you need help with?" — 10 sub-category photo tiles, 2/3/5 cols.
3. Most booked — horizontal scroller of service cards.
4. Offers — banner carousel.
5. Browse by category — quiet pill strip (demoted).
6. Trust strip (4-up) + Join as Pro.

**Verdict:** rejected. "Not so good." Functional but plain — the flat hero gave
the page nothing to lead with.

---

## Design B — Editorial storefront

**Pattern:** Airbnb / premium retail. Establish the brand, then sell.

**Structure**
1. Full-bleed photographic hero, dual gradient overlay, search *inside* the
   image, `fetchPriority="high"` (it is the LCP). Live "Now serving {area}"
   chip; starting price computed from real data.
2. "Browse every service" — 10 sub-category tiles on a white band directly
   under the hero, so someone who knows what they want does not scroll past
   editorial rows to find it.
3. Most booked this month.
4. Offers.
5. **Originally** four intent-named bands (Home essentials / A cleaner home /
   Make it yours / Personal care). **Revised after screenshot** to one
   filterable shelf with chips — see below.
6. "Why City Family Care" — bordered 4-up grid, placed *after* prices, which
   is when trust becomes the question.
7. Categories as a quiet pill strip. Join as Pro.

**Fixed after the first screenshot**
- Hero search collapsed to a "WT" box → `max-w-line-2xl` (256px) replaced with
  `max-w-screen-sm`. Same bug in 3 other places.
- Page was **5535px tall**. Four bands of near-identical cards → one filterable
  grid. Roughly halved.
- Duplicate cards: "Salon at home", "Men's grooming", "Nurse home care" each
  rendered in both *Most booked* and *Personal care*. Now once.
- Ragged rows: "Make it yours" had 2 cards in a 4-wide row, "Personal care" 3.
  A filtered grid reflows.
- Sub-category scrim `0.92/0.55` drowned the photos → `0.88/0.35`, fading to
  fully transparent.

**Status:** current state of `/home`.

---

## Design C — Utility dashboard

**Pattern:** Swiggy / Zomato. The page adapts to who is looking.

**Structure**
1. Compact search + location bar.
2. **Returning customer only:** active booking tracker (pro, ETA, live link)
   and a "Book again" row from history.
3. Sub-category grid.
4. Most booked.
5. Offers, trust, Join as Pro.

**Trade-off:** the most useful long-term, because home stays relevant after the
first booking instead of being a permanent front door. Costs the most to build
— needs booking state and a first-time-vs-returning distinction.

---

## THE BLOCKER — applies to every design

**All 15 service photographs are the same shoot.** Same man, same teal polo,
same apartment. 13 unique files, visually interchangeable. So any layout that
shows more than four service cards reads as one repeating image, and no
arrangement fixes it.

Three ways out, client's call:
1. Source varied stock, one distinct photo per service.
2. Drop photos from service cards — a clean typographic card with price and
   rating often reads *more* premium than repetitive imagery.
3. Leave it, if real photography is coming from the client anyway.

---

## Files involved

| File | Role |
|---|---|
| `apps/consumer/src/app/(app)/home/page.tsx` | The page itself |
| `apps/consumer/src/components/home-hero.tsx` | Hero (differs per design) |
| `apps/consumer/src/components/subcategory-tile.tsx` | Photo tile, shared |
| `apps/consumer/src/components/consumer-nav.tsx` | Rebuilt navbar, shared |
| `apps/consumer/src/components/consumer-footer.tsx` | Already good, untouched |
| `apps/consumer/src/app/(app)/layout.tsx` | Mounts nav + footer, untouched |
