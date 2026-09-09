# Consumer web — entry architecture

Decided 2026-09-09, after the client saw the login page and the entry flow.

## The problem

The consumer app was built as a phone app that happens to run in a browser.
`/` redirected to `/splash`, which after 1.8 s sent a first-time visitor to
`/onboarding` (three slides) and then to `/login`.

So someone who searched Google for "AC repair Trichy", clicked the result, and
landed on `cityfamilycare.in` was shown, in order:

1. A branded splash screen.
2. Three walkthrough slides.
3. A login form.

They never saw a service, a price, or a reason to trust the business. On a
website that is not an onboarding flow, it is a bounce. The homepage **is** the
sales pitch; the visitor is a stranger who has to be convinced before they will
even consider giving a phone number.

## The rule

> **Browsing is public. Committing requires an account.**

A visitor can reach the homepage, browse categories, open a service, see prices,
read what is included, and add to a cart — all signed out. Authentication is
demanded at the point of commitment (checkout / booking), not at the door, and
when it is demanded it appears as a **modal over the page they were already on**,
so their place and their cart are never lost.

This is how every marketplace on the web works, and it is what the client
referenced with MV Cleaning Services.

## What changes

| Route | Before | After |
|---|---|---|
| `/` | redirect → `/splash` | **the public homepage** |
| `/splash` | forced entry gate | kept, mobile-app shell only, not in the web path |
| `/onboarding` | forced on first visit | kept, reachable, never blocks entry |
| `/login` | full-page wall, reached before content | a **modal**, opened by an action that needs an account; full page kept for direct links and password managers |
| `/home` | the real homepage, behind auth | folds into `/` |

**No screen from the inventory is deleted.** Customer 1 (Splash), 2 (Onboarding),
3 (Login), 4 (Register), 5 (OTP) and 6 (Forgot Password) all still exist and are
all still reachable. Only the *trigger* changes: they stop being a gate and
become a response to intent.

## Why the login page itself was wrong

The screenshot showed the two-column `AuthShell`: a tall navy marketing panel
on the left repeating the value proposition, and a small form on the right.

Three things wrong with it:

1. **It re-sells to someone who has already decided.** A person at the login
   screen does not need to be told about the 30-day warranty; they came to sign
   in. The marketing panel is for the homepage.
2. **It is a full-page interruption.** Signing in mid-booking should not throw
   the page away.
3. **Cheap execution.** Glass cards, blurred orbs and a dot grid, most of which
   generated no CSS at all — `bg-white/10`, `rounded-2xl`, `text-white`,
   `shadow-lg` and `backdrop-blur-md` are not in this closed design system, so
   the panel rendered as flat navy with dark, near-illegible text.

The reference (MV Cleaning Services) does the sane thing: a centred card, a
logo, one field, one button, a line of reassurance. Ours should be that, but
better — and usually shown as a modal rather than a page.

## Target quality bar

The client's words: **10× better than MV Cleaning Services**, in UI and UX.

What MV does well, and we must match:
- Homepage is public and sells immediately.
- Services are grouped in labelled sections with real photos, prices, and an
  **Add** button on every card.
- A persistent cart.
- "How it works", testimonials, FAQ, and a real footer.
- Login is one small centred card.

Where we should beat it:
- Real search that filters as you type, not a decorative field.
- Prices with variants shown honestly ("from ₹499"), not a flat number that
  changes at checkout.
- A live-tracking story no cleaning site has.
- Trust built on documented facts (KYC, 30-day warranty, fixed pricing) rather
  than invented review counts.
- Accessibility and dark-theme correctness throughout.

## Open blocker

All 15 service photographs are the same shoot — same model, same teal polo,
same apartment. Any grid of service cards reads as one repeated image. Needs
either varied photography or typographic cards without photos.
