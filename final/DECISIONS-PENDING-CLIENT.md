# Decisions taken locally that still need the client's word

Things built a particular way because a deadline needed a decision, where the
client has not actually said which way he wants it. Each one records what was
shipped, what the alternative is, and how to switch.

---

## 1. Teal text contrast — SHIPPED AS THE CLIENT'S EXACT COLOUR

**Decision:** teal text on white uses the client's exact `#02BABC`, the same
value as the fills. No darker variant anywhere.

**Date:** 2026-09-15

**Why:** two versions have already been rejected for not looking vibrant enough.
A teal in the text that is not his exact hex risks a third rejection on the same
grounds, and there is no time left for that. Matching his Figma exactly is the
priority.

**What the alternative was.** `final/cfccolors-spec.md` §6 proposes a darker
`#017E80` for text only, keeping `#02BABC` for fills. The reason is contrast:

| Use | Colour | Contrast on white | WCAG AA needs |
|---|---|---|---|
| Teal text (shipped) | `#02BABC` | about 2:1 | 4.5:1 for body text |
| Teal text (alternative) | `#017E80` | passes | 4.5:1 |

Fills are unaffected either way - white text on a `#02BABC` button is fine. The
issue is only thin coloured letters on a white background: readable on a phone,
faint on a large monitor, in sunlight, or for older eyes.

**The risk we accepted.** The page as shipped would fail an accessibility audit
on teal body text. If the agency's client ever commissions one, this is a
finding. It is a deliberate trade, not an oversight.

**How to switch.** One line in
`frontend/apps/consumer/src/app/(home)/home-pages.css`:

```css
--teal-ink: #02BABC;   /* shipped: client's exact teal */
--teal-ink: #017E80;   /* accessible: passes AA on white */
```

Every piece of teal text on the home page resolves through `--teal-ink`, so
changing that one value switches the whole page. Fills use `--cyan` and do not
move.

**To raise with the client:** show both side by side on a large screen. The
visual difference is small; the readability difference is not.

---

## 2. Referral figures - PLACEHOLDER

The home page offer card states "₹100 for every friend who books above ₹500",
taken from `packages/mocks/src/api/referral.ts`
(`rewardPerReferralPaise: 10_000`, `minimumBookingPaise: 50_000`).

That file sets `REFERRAL_TERMS_ARE_PLACEHOLDER = true`, so these are the app's
own working figures, not terms the client has signed off. They replaced an
invented "₹2,499 a year CFC Care plan" that had no source at all, so this is an
improvement, but the numbers still need confirming before launch.

---

## 3. Testimonials - FABRICATED, LEFT IN PLACE ON REQUEST

Six named customers with real neighbourhoods (Meera Sundaram / Indiranagar,
Arvind Raghavan / Anna Nagar, Farhan Khan / Jayanagar, Priya Nair / Kakkanad,
Sowmya Venkatesh / RS Puram, Deepak Jain / Gachibowli).

CFC has not launched, so no real customer has used it. `PLATFORM-FACTS.md`
forbids claiming figures or facts that are not documented, and invented reviews
attributed to named people in named localities are the strongest form of that.

Left in place because the owner said they would be handled separately. One of
them also still refers to "the CFC Care plan", a product that no longer appears
anywhere on the page after the offer card was replaced.

---

## 4. Category "HOT" badges - CURATED, NOT DERIVED

**Decision:** the four HOT badges on the home page category tiles are a fixed,
hand-picked list - Plumbing, Appliance, Beauty, Carpentry.

**Date:** 2026-09-15

**Where:** `frontend/apps/consumer/src/app/(home)/use-catalogue.ts`, the
`const hot = new Set([...])` line.

**Why it is not derived.** It began as "the busiest sub-categories by total
`bookingCount`". That looked principled but was not: those counts come from a
seeded random generator in `packages/mocks/src/fixtures/catalog.ts`
(`Math.floor(20 + rand() * 400)`), so "busiest" meant "whatever the seed
produced". It could not be aimed at a particular tile, and it would shuffle if
the seed or the catalogue ever changed. The client asked for specific tiles, so
the list is now explicit and honest about being a merchandising choice.

**The risk.** A hardcoded badge can drift from reality. Once real booking data
exists, a tile could carry "HOT" while barely being booked.

**What to do at launch.** Either point this back at real booking volume, or
have the client confirm the four tiles as a deliberate merchandising decision
and keep it fixed. It should not be left as-is by accident.

**One related note.** An earlier version used three labels in three colours -
orange HOT, teal TOP RATED, blue NEW. The teal badge sat on a teal icon tile
and was effectively invisible, which defeats the point of a badge. One label in
orange is the only pairing that reads against every tile.

---

## 4. Service photography - PLACEHOLDER CASTING

The "Most booked" rail now renders real photographs from
`public/mock/services/`. The owner confirmed the current images are intentional
placeholders and will be replaced.

Worth recording why they cannot ship as they are: of the six inspected, five
show Western models in Western homes (AC repair, deep cleaning, tap washer,
sofa cleaning, pest control, nurse home care). Only `salon-at-home-women.jpg`
shows a South Asian client. They also read as one AI generation batch - same
lighting, same marble-and-glass interiors.

The card falls back to its icon whenever a service has no image, so replacing
them is only a matter of dropping new files into `public/mock/services/` under
the same names. No code change.
