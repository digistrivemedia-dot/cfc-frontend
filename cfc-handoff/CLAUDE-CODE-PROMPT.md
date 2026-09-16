# Handing these two pages to Claude Code

## Step 1 — get the files into your repo

Download `cfc-handoff.zip` and unzip it at the root of your Next.js project so you have:

```
your-project/
├── app/                  ← your existing app
├── reference/            ← from the zip
│   ├── cfc-home.html
│   ├── cfc-home-signed-in.html
│   └── cfc-nextjs/
│       ├── app/globals.css
│       ├── app/layout.tsx
│       ├── app/page.tsx
│       ├── app/interactions.js
│       ├── app/home/page.tsx
│       └── app/home/interactions.js
└── package.json
```

`reference/` is read-only source of truth. Claude Code copies *out* of it and never
edits it. Keep it in the repo until the port is verified, then delete it if you want.

## Step 2 — open Claude Code in VS Code and paste the prompt below

Paste it as one message. Claude Code reads from disk, which is the entire reason the copy
comes out identical — it is transcribing, not composing.

If your app lives in `src/app/` instead of `app/`, change the two paths in the
**Placement** section before pasting. Everything else stays as-is.

## Step 3 — verify before you accept

Run `npm run dev` and open both routes side by side with the two HTML files in another
tab. They should be indistinguishable. The verification checklist is in the prompt, so
Claude Code will walk it itself, but check it yourself too.

---

# THE PROMPT — copy everything below this line

---

You are porting two finished, approved pages into this Next.js app. They already exist as
working code in `reference/`. Your job is to move them in **exactly**. This is a
transcription task, not a design task.

Read these files first, in full, before writing anything:

- `reference/cfc-nextjs/app/globals.css`
- `reference/cfc-nextjs/app/layout.tsx`
- `reference/cfc-nextjs/app/page.tsx` — the signed-out home page
- `reference/cfc-nextjs/app/interactions.js`
- `reference/cfc-nextjs/app/home/page.tsx` — the signed-in home page
- `reference/cfc-nextjs/app/home/interactions.js`

`reference/cfc-home.html` and `reference/cfc-home-signed-in.html` are the same two pages as
standalone files. Open them in a browser to check visual parity when you are done. Do not
port from the HTML — port from the `.tsx` files.

## Hard rules

**1. Every character of copy is fixed.** Headlines, body text, button labels, prices,
names, city names, FAQ answers, toast strings, `aria-label`s, `placeholder`s, footer links,
the professional's name, the customer's name, the referral code, the phone number. Do not
rephrase, shorten, expand, Americanise or "fix" anything. Indian-English and Indian
number formatting are deliberate: `1.2L+`, `₹38,400`, `12.4k bookings`, `₹79 per kg`,
`1800 XXX 4567`. The `&#8377;` entities are rupee signs — leave them encoded.

**2. Every CSS value is fixed.** Copy `globals.css` across whole and unmodified. Do not
convert it to Tailwind, CSS modules, styled-components, or anything else. Do not reorder,
rename, merge or prune tokens, and do not delete rules that look unused — the two pages
share one stylesheet. The palette is exactly five values and must not gain a sixth:

```
--teal      #0fb3a6
--teal-deep #07837a
--ink       #0b2239
--blue      #2456d6
--paper     #f5f8fa
```

There is no orange anywhere on either page. If you find yourself adding a colour, stop.

**3. Keep the inline SVG sprite.** Each page opens with a `<svg class="sprite">` block of
`<symbol>` definitions referenced by `<use href="#i-...">`. Keep it exactly where it is.
Do not replace it with `lucide-react`, `react-icons`, or any icon package.

**4. Keep the interaction files as they are.** Both `interactions.js` files export one
function that wires up the page and returns a cleanup function. Each page calls it from a
single `useEffect(() => initX(), [])`. Do not refactor that into React state, do not split
it into hooks, do not convert it to TypeScript. It is Strict-Mode safe as written.

**5. Add no dependencies.** These pages use React and nothing else. No animation library,
no UI kit, no icon package, no state manager.

**6. Change no structure.** Do not extract components, do not create a `components/`
folder, do not split a page into sections files, do not reorder sections, do not add or
remove a section. The markup nests exactly as it does in the source.

## Placement

| From | To |
|---|---|
| `reference/cfc-nextjs/app/globals.css` | `app/globals.css` |
| `reference/cfc-nextjs/app/page.tsx` | `app/page.tsx` |
| `reference/cfc-nextjs/app/interactions.js` | `app/interactions.js` |
| `reference/cfc-nextjs/app/home/page.tsx` | `app/home/page.tsx` |
| `reference/cfc-nextjs/app/home/interactions.js` | `app/home/interactions.js` |

Also copy `app/interactions.d.ts` and `app/home/interactions.d.ts` if they are present in
the reference — they type the `.js` imports for TypeScript.

For `app/layout.tsx`: if this project already has a root layout, **merge** rather than
overwrite. Take from the reference layout the `globals.css` import, the `metadata` object
(title, description, canonical, Open Graph, Twitter), the `viewport` export, and the
JSON-LD `<script type="application/ld+json">` block in `<body>`. Keep whatever providers,
fonts or wrappers this project already has.

Routing: `/` is the signed-out page, `/home` is the signed-in page. Leave them both
publicly reachable for now — do not add auth middleware, redirects, or a session check. I
will gate `/home` myself once auth exists.

## Section checklist

After porting, confirm every one of these is present, in this order.

**`/` — signed-out home**

1. Skip link
2. Sticky header — logo, city picker (11 cities plus "Use my current location"), nav links Services / How it works / CFC Care plans / Work with us, Log in, Book a service, hamburger
3. Full-screen mobile menu sheet
4. Hero — FIRST20 pill, headline "Book a verified pro for anything your home needs.", sub-paragraph, search bar with mic and suggestion dropdown, four popular chips, four trust stats (1.2L+ / 4.8 / 6,400 / 11), and the floating card collage: Rajesh Kumar with a counting-down ETA, the ₹499 price card, the booking-confirmed card
5. Category grid — 12 tiles with starting prices
6. Three promo banners — FIRST20, One plan for the whole year, Mornings cost less
7. "Most booked in {city} this week" — 6-card rail with progress bar and arrows
8. "Three steps, about a minute" — 3 numbered steps
9. "Why families keep calling us back" — 6 bordered cells
10. Navy "Your skill. Your hours. Our customers." band — 4 stats
11. Testimonial marquee — 6 quotes
12. FAQ — 6 `<details>` items
13. Cities strip — 11 cities plus "Request your city"
14. Footer — 4 columns, iOS and Android buttons, legal bar
15. Sticky mobile action bar

**`/home` — signed-in home**

1. Skip link
2. App bar — logo, address chip, persistent search with mic and suggestions, notification bell, cart with count badge, account menu (My bookings, Saved addresses, Payment methods, CFC Care plan, Refer and earn, Help centre, Settings, Log out)
3. Mobile-only search row
4. Welcome band — "Welcome to CFC, Aarthi.", 3-step setup list, inline address panel with Home / Work / Other tags, FIRST20 offer card
5. "What do you need first?" — the same 12 category tiles, with no `rv` reveal classes
6. "Popular in {city} this week" — rail with add-to-cart controls
7. "Your bookings" — empty state with inline SVG illustration, beside the CFC Care side card
8. Refer-and-earn strip with code AARTHI200
9. Dark help strip
10. Footer — same as the signed-out one, with "Work with us" replaced by "Refer and earn" and "Press" by "Contact us"
11. Cart drawer plus scrim
12. Toast
13. Sticky cart bar, and tab bar with Home / Bookings / Help / Account

## Verification — run all of these and report results

1. `npm run build` completes with no type errors and no ESLint failures.
2. `npm run dev`, then open `/` and `/home` next to `reference/cfc-home.html` and
   `reference/cfc-home-signed-in.html`. They must look identical.
3. Browser console is clean on both routes — no errors, no React key or hydration warnings.
4. No horizontal scrollbar at 390px, 768px and 1440px on either route. Check with
   `document.documentElement.scrollWidth` against the viewport width.
5. On `/`: type "clean" in the hero search and confirm the dropdown filters with the match
   highlighted; arrow keys and Enter select. Open the city picker and switch to Chennai —
   the "Most booked in ___" heading must follow. Watch the hero card ETA count down.
   Open and close a FAQ item. Scroll the services rail with the arrows.
6. On `/home`: add two services to the cart, change a quantity, confirm FIRST20 shows 20%
   capped at ₹300. Press "Choose a slot" *without* saving an address — it must close the
   drawer and send you to the address step rather than proceeding. Then save an address and
   confirm the header chip updates.
7. Confirm the string `orange` and any `#f`/`#e` warm hex do not appear in `globals.css`.

## Do not

- Do not "improve" the copy, the spacing, the colours or the animations.
- Do not add a dark mode, a loading skeleton, or new sections.
- Do not swap the fonts. `Plus Jakarta Sans` is imported at the top of `globals.css`.
- Do not add `localStorage`, analytics, or tracking.
- Do not touch anything in `reference/`.

If something genuinely will not work in this project — a version conflict, a name clash
with an existing file, a conflicting layout — stop and tell me what the conflict is and
what you propose. Do not resolve it by rewriting the page.
