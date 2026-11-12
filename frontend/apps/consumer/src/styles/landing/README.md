# `styles/landing/` — the approved marketing pages' stylesheet

**If you are new here and wondering why this folder exists while the rest of
the app has no CSS files at all: that is the right question, and this is the
answer.**

## What this styles

Two pages, and nothing else:

| Route | File |
|---|---|
| `/` (signed out) | `app/(home)/page.tsx` |
| `/` (signed in) and `/home` | `app/(home)/home/page.tsx` |

Plus the chrome those two share — the header, the footer, the app shell.

Every rule is scoped under `.cfc-page` (or `.cfc-chrome`, an alias that carries
the tokens **without** the bare-element resets). Nothing here can reach the 21
screens under `app/(app)/`, which are styled entirely with Tailwind.

## Why it is not Tailwind like everything else

These pages came from a standalone HTML prototype that the client reviewed and
signed off on. The design is the approved artefact, and this stylesheet *is*
that design — not a re-interpretation of it.

Converting it was attempted and measured. The finding:

- **392 rules** are live on the landing page
- They use **149 distinct numeric values**, of which **71 appear exactly once**
- The prototype is on a **2px grid**; this repo's Tailwind preset is on a
  **4px grid and deliberately closed** ("4px base. Nothing between these
  steps." — `packages/config/tailwind-preset.js`)

A value used once cannot earn a meaningful token name, so it converts to an
arbitrary value. The honest before-and-after:

```css
/* here */
.cfc-page .hero { padding: 54px 0 64px; background: #F1FAFB; }
```

```jsx
/* converted */
<section className="pt-[54px] pb-16 bg-[#F1FAFB] max-cfc-md:pt-[34px]">
```

Same numbers, harder to scan, and now spread across JSX instead of grouped
with the rest of the hero's rules. The conversion was stopped because it made
the code worse, not better. That was a deliberate decision, not unfinished
work.

## What DID get fixed

The genuine problems in these pages were addressed:

- **`interactions.js` (462 lines) is gone.** It drove these pages by reaching
  into the DOM directly — `classList.toggle`, `textContent`, `style.width` —
  on elements React also rendered. Two systems writing the same nodes is how
  you get bugs that cannot be reproduced. It is 11 React hooks now
  (`app/(home)/use-landing.ts`).
- **Search suggested services the app does not sell.** It matched against a
  hardcoded list of 24 services with invented prices, separate from the
  catalogue. It reads `suggestServices()` now, like every other screen.
- **Inline styles halved**, 16 → 8. The 8 that remain are values that change at
  runtime (a scroll-progress percentage cannot be a class) or `objectFit` on
  `next/image`.
- **Design tokens added** for the 2px rhythm this page needs
  (`p-marketing-sm`, `gap-marketing-lg`), and max-width breakpoint variants
  (`max-cfc-sm`, `max-cfc-md`, `max-cfc-lg`) matching this stylesheet's own
  620 / 900 / 1080 breakpoints.

Every change was verified by reading back the browser's **computed style** for
every element at nine viewport widths — 360, 390, 619, 620, 768, 900, 901,
1080, 1280 — and comparing property by property against a baseline. Result:
zero differences. Not a screenshot diff; the resolved CSS.

## If you need to change something here

1. **Read the value back from the browser, not from the file.** This repo's
   Tailwind preset compiles unknown class names to **nothing, silently**.
   `text-white`, `bottom-40`, `z-raised`, `min-h-touch` and `py-3.5` have all
   done this, and `tsc` passed every time.
2. **`foundation.css` restyles bare elements** (`h1`, `p`) under `.cfc-page`.
   That is why `app-shell.tsx` wraps the signed-in screens in `cfc-chrome`
   instead — it carries the tokens without the resets. Do not widen that scope.
3. **The breakpoints here are 620 / 900 / 1080**, not Tailwind's
   640 / 768 / 1024. Use `cfc-sm` / `cfc-md` / `cfc-lg` (or their `max-`
   forms) for anything that has to agree with this stylesheet.

## Files, in load order

| File | Lines | What |
|---|---|---|
| `index.css` | ~720 | Entry point. `@import`s the rest, then the shared chrome and the signed-in sections |
| `foundation.css` | 189 | Tokens, resets, bare-element rules. **Widest reach — change last** |
| `primitives.css` | 44 | Buttons, icons, the wrap container |
| `chrome.css` | 310 | Header, footer, app shell, reveal animations |
| `home-page.css` | 686 | The signed-out landing page's own sections |

`styles/patterns.css` is **not** part of this folder — it is imported by the
root layout and serves the `(app)` screens.

## Why the signed-in styles share `index.css`

An obvious tidy-up would be to move the signed-in home's rules
(`.welcome`, `.setup-row`, `.tabbar`, the help strip) into their own file. That
was measured and deliberately not done.

**Nineteen classes are used by both pages** — `hdr-in`, `menu`, `loc-pop`,
`loc-opt`, `chip`, `btn-sm`, `logo-text`, `bk-foot`, `bk-rank`, `pro-steps`,
`pro-cap`, `sec-link`, `card-price`, `empty`, `sk`, `bk-sk`, `cat-sk`,
`loc-detect`, `loc` — and the responsive `@media` blocks at the end of the file
set rules for both pages inside the same queries.

Splitting means either duplicating those nineteen across two files, or adding a
third "shared" file and hand-splitting every media query three ways. More
places for the two pages to drift apart, and nothing a reader gains that a
comment does not give them. The boundary is marked in `index.css` instead.

## What was removed

Three blocks, each verified dead before deletion — markup gone from every
`.tsx`, `.ts` and `.js` file, and a Tailwind-styled replacement confirmed in
git history:

| Removed | Replaced by |
|---|---|
| Cart drawer (`.cart`, `.cart-item`, `.cart-foot`, …) | `components/cart-bar.tsx` (markup went in `680b756`) |
| Toast (`.toast`) | the `sonner` library, exported as `toast` from `@cfc/ui` |
| Sticky cart bar (`.cartbar`, …) | `components/cart-bar.tsx` (`857830e`) |

76 lines. Each removal point is marked inline saying what replaced it, so the
next reader does not have to re-derive it from git.

A further 179 rules match nothing on the signed-out page. **They were checked
and kept** — 67 of the classes involved are still referenced by the signed-in
home or the `(app)` screens, and the rest only appear in a state the page can
reach (a search with no results, a popover open, a specific viewport). A rule
that matches nothing in one snapshot is not dead; only a class with no
reference anywhere in the source is.

## Also fixed

`.rv-2`, `.rv-4` and `.rv-6` were **unscoped**. The rules were written two per
line:

```css
.cfc-page .rv-1 { transition-delay: .07s; } .rv-2 { transition-delay: .14s; }
```

The `.cfc-page` prefix applies only to the first selector on a line, so those
three were global — any element anywhere in the app with `rv-2` picked up a
transition delay. Nothing in `app/(app)` used them, so it never showed, but it
was one class name away from doing so. Now one rule per line.
