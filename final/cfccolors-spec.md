# CFC — Colour Specification

Everything below is extracted from the working `cfc-home.html`. Every brand hex was
sampled pixel-by-pixel out of the client's own Figma export, not chosen by eye.

**Four rules that must not be broken:**

0. **Bright, never dull.** Every colour that fills a shape — button, tile, badge, band,
   card header — must be a vivid, saturated colour. No greyed-down, washed-out, muted or
   "sophisticated" tones. No dark navy or charcoal fills. The client rejected two earlier
   versions for exactly this. See §0 for the measured proof and the test to re-run.
1. **No gradients.** Every fill is a flat solid colour. The only `linear-gradient` allowed
   in the stylesheet is the transparency mask on the testimonial marquee.
2. **Hover always brightens, never darkens.** A coloured element moves to a *lighter*
   shade. A white element stays white and gains a teal ring plus a teal glow.
3. **Orange appears four times on the whole page.** Nowhere else.

---

## 0. The brightness rule, with numbers

Every brand fill in this page measures 70–99% saturation in HSL. That is the bar. If a new
colour is added and it measures below 60%, it is dull and does not belong.

| Hex | Role | Saturation | |
|---|---|---|---|
| `#02BABC` | teal fills | 98% | vivid |
| `#07D2CE` | teal hover | 94% | vivid |
| `#2464D0` | blue fills | 70% | vivid |
| `#3C80F0` | blue hover | 86% | vivid |
| `#015EA3` | offer strip | 99% | vivid |
| `#F47B20` | orange accent | 91% | vivid |
| `#FF9440` | orange hover | 100% | vivid |
| `#F5A623` | stars | 91% | vivid |
| `#C3E9F2` | card tint | 64% | clean, not grey |
| `#E2F7F7` | pale wash | 57% | clean, not grey |

**The one exception, and it is not a loophole.** Text greys are deliberately low
saturation: `--ink-2` 43%, `--muted` 22%, placeholder 31%, separator dots 39%. These are
contrast tools, not brand colours. Saturating them would make the page harder to read, not
brighter. **Never apply a grey to a fill, and never apply a brand colour to caption text.**

**Test to re-run after any change.** Convert every hex used as a `background` to HSL. Fills
must be ≥60% saturation, or ≥95% lightness if it is a near-white section surface. Anything
landing in between — a 30–50% saturation mid-tone — is the dull zone and must be replaced.

---

## 1. Tokens — paste this into `globals.css`

```css
:root {
  /* ---- brand: sampled from the client's Figma ---- */
  --cyan:      #02BABC;  /* his category tiles + confirm tick */
  --cyan-d:    #01A09E;  /* reserved darker teal */
  --cyan-l:    #E2F7F7;  /* pale teal wash */
  --blue:      #2464D0;  /* his blue category tiles */
  --blue-d:    #1B4FA8;  /* blue text on light pills */
  --blue-l:    #E9F0FC;  /* pale blue wash */
  --ocean:     #015EA3;  /* his offer-banner blue — SMALL AREAS ONLY */
  --panel:     #83CBE1;  /* his service-detail header */
  --panel-l:   #C3E9F2;  /* his ₹499 price chip */
  --teal-ink:  #017E80;  /* teal TEXT only — see note in §6 */

  /* ---- accents, rationed ---- */
  --orange:    #F47B20;  /* 4 uses only */
  --yellow:    #F5A623;  /* rating stars only */

  /* ---- neutrals ---- */
  --ink:       #0E2A47;  /* headings + body */
  --ink-2:     #2F4E76;  /* secondary text */
  --muted:     #6A83A0;  /* captions, meta */
  --line:      #E3ECF4;  /* borders, dividers */
  --line-2:    #F0F5FB;  /* faint dividers */
  --white:     #fff;

  /* ---- hover-only brights (not tokens, used inline) ---- */
  /* #07D2CE  brighter teal — primary button hover */
  /* #3C80F0  brighter blue — blue button hover, 3rd offer card */
  /* #FF9440  brighter orange — orange button hover */

  /* ---- section backgrounds ---- */
  /* #F1FAFB  hero            */
  /* #FFFFFF  default section */
  /* #ECF9FA  teal-tint section (Top Services) */
  /* #F7FCFD  grey-tint section (Why CFC, Testimonials) */
  /* #F5FAFC  footer          */
  /* #F1F7FC  app-download panel */

  /* ---- shadows: neutral, never coloured at rest ---- */
  --sh-sm: 0 2px 10px rgba(16, 41, 76, .06);
  --sh-md: 0 10px 30px -14px rgba(16, 41, 76, .32);
  --sh-lg: 0 22px 48px -22px rgba(16, 41, 76, .38);
}
```

---

## 2. Every element, mapped

### Header
| Element | Colour |
|---|---|
| Bar background | `rgba(255,255,255,.92)` + blur |
| Logo tile | `--cyan` fill, white icon |
| Logo wordmark | `--ink` |
| Logo `CFC` superscript | `--orange` ← **orange use 1 of 4** |
| Logo sub-label "HOME SERVICES" | `--muted` |
| Location pill | `--cyan-l` bg, `--cyan-d` text |
| Nav links | `--ink-2`, hover `--blue` |
| "Log in" button | white bg, `--line` 2px border, `--ink` text |
| "Book Now" button | `--cyan` bg, white text |
| Burger (mobile) | `--cyan-l` bg, `--cyan-d` icon |

### Hero
| Element | Colour |
|---|---|
| Section background | `#F1FAFB` flat |
| "20% OFF" chip | `--orange` bg, white text ← **orange 2 of 4** |
| Chip container | white, `--sh-sm` |
| `h1` | `--ink`; the word "anything" `--teal-ink` |
| Sub-paragraph | `--ink-2` |
| Search bar | white bg, `--sh-md`; focus border `--cyan` 2px |
| Search icon | `--cyan-d` |
| Placeholder | `#9CB2CB` |
| Mic button | `--cyan-l` bg, `--cyan-d` icon; recording `--cyan-d` bg, white icon |
| "Search" button | `--cyan` bg, white text |
| Trending chips | white bg, `--ink-2` text, `--sh-sm` |
| Stat numbers | `--teal-ink` (all four, same colour) |
| Stat labels | `--muted` |

### Hero tracking card
| Element | Colour |
|---|---|
| Card | white, `--sh-lg` |
| "BOOKING CONFIRMED" pill | `--cyan-l` bg, `--teal-ink` text |
| Date line | `--muted` |
| Service name | `--ink` |
| Price ₹499 | `--teal-ink` |
| Struck ₹699 | `#A7BBD1` |
| Divider | `--line` |
| Avatar "RK" | `--blue` bg, white text |
| Star | `--yellow` |
| Pro meta line | `--muted` |
| **Completed step dot + connector** | `--cyan` |
| **Active step ring + inner dot** | `--orange` ← **orange 3 of 4** |
| **Live ETA number ("32 min")** | `--orange`, `font-variant-numeric: tabular-nums` |
| Future step dot | white fill, `--line` border |
| Completed/active step label | `--ink` |
| Future step label | `--muted` |
| Footer caption | `--muted`, dashed `--line` top border |
| Photo frame | `--sh-lg`, radius 30px |
| Photo fallback colour (behind the image) | `#DCEBF7` |

### Offer strip (the wide banner)
| Element | Colour |
|---|---|
| Background | `--ocean` — **the only place `--ocean` is used** |
| Heading + body | white / `rgba(255,255,255,.88)` |
| Decorative circles | `rgba(255,255,255,.12)` and `.09` |
| "FIRST20" chip | white bg, `--ocean` text |

### Category tiles (12)
| Element | Colour |
|---|---|
| Card | white, `--sh-sm` |
| Icon tile — Cleaning, AC, Pest, Carpenter, Water Purifier | `--cyan` bg, white icon |
| Icon tile — Plumbing, Electrician, Appliance, Salon, Painting, Laundry, Packers | `--blue` bg, white icon |
| Title | `--ink` |
| "From ₹399" | `--muted` |
| "HOT" badge | `--orange` bg, white text ← **orange 4 of 4** |

### Service cards (Top Services rail)
| Element | Colour |
|---|---|
| Section background | `#ECF9FA` |
| Card | white, `--sh-sm` |
| Media panel — cards 1, 3, 5 | `--panel-l` bg, `#046B75` icon |
| Media panel — cards 2, 4, 6 | `--blue-l` bg, `#17418F` icon |
| Circle behind icon | `rgba(255,255,255,.85)` |
| "MOST BOOKED" badge | `--orange` bg, white text |
| Title | `--ink` |
| Rating star | `--yellow`; rating number `--ink` |
| Meta text | `--muted`; separator dots `#C6D5E6` |
| Divider | dashed `--line` |
| Price | `--ink`; sub-line `--muted` |
| "Book Now" | `--cyan` bg, white text |
| Rail arrows | white bg, `--blue` icon, `--sh-sm` |

### How it works
| Element | Colour |
|---|---|
| Card | white, `--sh-sm` |
| Number 1 | `--cyan` |
| Number 2 | `--blue` |
| Number 3 | `--cyan` |
| Title `--ink`, body `--muted` | |

### Why CFC
| Element | Colour |
|---|---|
| Section background | `#F7FCFD` |
| Card | white, `--sh-sm` |
| Icon tiles | alternate `--cyan` and `--blue`, white icons |
| Title `--ink`, body `--muted` | |

### Offers row (3 cards)
| Card | Background | Pill |
|---|---|---|
| First booking 20% off | `--cyan` | white bg, `--teal-ink` text |
| CFC Care | `--blue` | white bg, `--blue-d` text |
| Mornings cost less | `#3C80F0` | white bg, `--blue-d` text |

Body text on all three: `rgba(255,255,255,.9)`. Decorative circle `rgba(255,255,255,.14)`.

### Join as Pro band
| Element | Colour |
|---|---|
| Band | `--cyan` — **a big bright teal block, not a dark one** |
| Eyebrow pill | `rgba(255,255,255,.22)` bg, white text |
| Heading | white; body `rgba(255,255,255,.9)` |
| Stat tiles | `rgba(255,255,255,.22)` |
| "Join as a professional" | white bg, `--ocean` text |
| "See how earnings work" | `rgba(255,255,255,.16)` bg, white text, `rgba(255,255,255,.45)` border |

### Testimonials
| Element | Colour |
|---|---|
| Section background | `#F7FCFD` |
| Card | white, `--sh-sm` |
| Stars | `--yellow` |
| Quote text | `--ink-2` |
| Avatars 1, 3, 5 | `--cyan` |
| Avatars 2, 4, 6 | `--blue` |
| Name `--ink`, location `--muted` | |

### App panel + cities
| Element | Colour |
|---|---|
| Panel | `#F1F7FC` |
| "Get the Android app" | `--blue` bg, white text |
| "Get the iOS app" | white bg, `--line` border |
| City pills | white bg, `--ink-2` text, `--sh-sm` |
| "+ Request your city" | `--cyan-l` bg, `--teal-ink` text |

### Footer
| Element | Colour |
|---|---|
| Background | `#F5FAFC` |
| Headings `--ink`, links `--muted`, link hover `--blue` | |
| Social tile 1 | `--cyan` |
| Social tile 2 | `--blue` |
| Social tile 3 | `#3C80F0` |
| Top border on bar | `--line` |

### Mobile tab bar
| Element | Colour |
|---|---|
| Background | `rgba(255,255,255,.97)` + blur |
| Inactive tab | `--muted` |
| Active tab | `--cyan-d` |

---

## 3. Hover states — every one brightens

```css
/* coloured buttons: move to a LIGHTER shade + coloured glow + 2px lift */
.btn-cyan:hover   { background: #07D2CE; box-shadow: 0 10px 26px -8px rgba(2,186,188,.75); }
.btn-blue:hover   { background: #3C80F0; box-shadow: 0 10px 26px -8px rgba(36,100,208,.70); }
.btn-orange:hover { background: #FF9440; box-shadow: 0 10px 26px -8px rgba(244,123,32,.70); }

/* white elements can't get brighter than white — they keep their white
   background and gain a 2px teal ring inside plus a teal glow */
.chip:hover, .city:hover, .rail-btn:hover {
  background: #fff;
  color: var(--teal-ink);
  box-shadow: 0 0 0 2px var(--cyan) inset, 0 10px 24px -8px rgba(2,186,188,.78);
}
.btn-line:hover { background: #fff; border-color: var(--cyan); color: var(--teal-ink);
                  box-shadow: 0 10px 26px -8px rgba(2,186,188,.72); }
.loc:hover      { background: var(--cyan-l);
                  box-shadow: 0 0 0 2px var(--cyan) inset, 0 10px 24px -8px rgba(2,186,188,.78); }

/* cards: lift + teal-tinted shadow + brighten the coloured tile inside */
.cat:hover  { transform: translateY(-5px); background: #fff;
              box-shadow: 0 14px 30px -12px rgba(2,186,188,.45); }
.cat:hover .cat-ic { filter: brightness(1.12) saturate(1.10); }
.card:hover { transform: translateY(-5px); box-shadow: 0 16px 34px -14px rgba(2,186,188,.48); }
.card:hover .card-media { filter: brightness(1.05) saturate(1.08); }
.why:hover  { transform: translateY(-4px); box-shadow: 0 14px 30px -12px rgba(2,186,188,.40); }

/* white pills on colour, and social tiles */
.offer .pill:hover { transform: translateY(-2px); box-shadow: 0 10px 24px -8px rgba(255,255,255,.7); }
.socials a:hover   { filter: brightness(1.15) saturate(1.1); transform: translateY(-2px); }
```

**Verification the developer should run.** For each interactive element, read
`getComputedStyle(el).backgroundColor` at rest and on hover and compare relative
luminance. No element may come out darker. Expected result:

```
Book Now        0.358 -> 0.506   brighter
Log in          1.000 -> 1.000   unchanged + glow
Trending chip   1.000 -> 1.000   unchanged + glow
City pill       1.000 -> 1.000   unchanged + glow
Rail arrow      1.000 -> 1.000   unchanged + glow
Location pill   0.894 -> 0.894   unchanged + glow
Category tile   1.000 -> 1.000   unchanged + glow
```

---

## 4. Orange — the complete list

Orange `#F47B20` appears in exactly four places. If a fifth appears, it is a bug.

1. The `CFC` superscript in the logo
2. The "20% OFF" chip in the hero
3. The "HOT" tile badge and the "MOST BOOKED" card badge
4. The live ETA number and its timeline dot — the one value on the page that changes

Yellow `#F5A623` is used only for rating stars. Nothing else.

---

## 5. Scale discipline — the rule that caused a redesign

`--ocean` `#015EA3` is the client's own banner colour, and it is correct at small scale.
When it was used on two full-width bands the page read as dark and the client rejected it.
**Keep `--ocean` to the single compact offer strip.** Large areas take `--cyan`.

The same logic governs `--panel` `#83CBE1`: it is the client's service-detail header and
is reserved for that screen. The home page uses the lighter `--panel-l` `#C3E9F2` on card
media instead.

---

## 6. The one deliberate deviation

The client's teal `#02BABC` as *text* on white scores roughly 2:1 contrast — legible on a
phone mockup, a failure in an accessibility audit and hard to read on a large monitor.

- **Fills stay at his exact `#02BABC`.** Tiles, buttons, bands — unchanged.
- **Teal text uses `#017E80`.** Prices, the highlighted word in the headline, eyebrow
  labels, stat numbers.

Side by side they read as the same teal. If the client insists on one value everywhere,
change `--teal-ink` to `#02BABC` — but raise it with him first.

---

## 7. Forbidden

- **No dull, muted, greyed-down or desaturated fills.** Nothing in the 25–60% saturation
  band as a background. If it looks "tasteful and understated", it is wrong for this client.
- **No dark fills.** No navy, charcoal, near-black or deep slate panels. The darkest fill
  permitted on the page is `#015EA3`, and only on the one compact offer strip.
- No gradient on any fill.
- No violet, pink, green, indigo, amber or sky. They were removed from the stylesheet
  entirely, not just left unused.
- No dark navy section backgrounds. Every section is white or a near-white tint.
- No hover state that darkens.
- No new hex value that does not appear in this document.