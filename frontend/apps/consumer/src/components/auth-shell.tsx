"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Headset,
  IndianRupee,
  MapPin,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { cn } from "@cfc/ui";
import { Logo } from "@/components/logo";

/**
 * The shell around every auth screen.
 *
 * WHAT WAS WRONG
 *
 * **The card was 640px wide.** `max-w-detail` is a measure sized for article
 * text, and it was holding one phone-number field. On a desktop the input
 * floated in a half-empty box and the form looked lost inside its own
 * container.
 *
 * **Mobile was an afterthought.** The main was `items-start` and only centred
 * at `md:`, so on a phone the card sat jammed under the header with the whole
 * lower half of the screen empty.
 *
 * **Three trust badges sat under every form.** A person looking at a login
 * form has already decided; the code's own comment admitted they read as
 * filler on the OTP step. They are gone, replaced by one quiet line.
 *
 * WHAT IT IS NOW
 *
 * One column on a phone, centred, at a width where a phone-number field and a
 * six-box OTP row both sit comfortably. At `lg` it becomes two columns: a
 * brand panel carrying the reassurance, and the form beside it - so a desktop
 * is its own layout rather than a phone layout stretched wide.
 */

interface AuthShellProps {
  children: React.ReactNode;
  heading: string;
  subheading?: string | undefined;
  backHref?: string | undefined;
  backLabel?: string | undefined;
  /**
   * Kept for the OTP step, which passes `false`. The brand panel is hidden
   * there: someone mid-flow does not need re-selling, and on a phone it would
   * push the code boxes below the fold.
   */
  showAssurance?: boolean | undefined;
  /**
   * Expands each assurance with a line of explanation. On by default; /login
   * turns it off, because a returning customer already knows all three and
   * its card is short enough that the panel does not look thin without them.
   */
  detailedAssurance?: boolean | undefined;
  /**
   * The four-item row under the assurance cards. On by default; /login turns
   * it off, because with three detailed cards the panel already reaches the
   * card's height and the extra row runs past its bottom edge.
   */
  showExtras?: boolean | undefined;
}

/* Three claims, with sub-copy available.

   Whether the `body` line shows depends on WHO is reading. A returning
   customer at /login already knows what CFC is, so three paragraphs of
   explanation beside a single phone field is text nobody reads. Someone at
   /register has not bought anything yet, and there the taller card leaves the
   panel looking thin without it.

   The copy stays short and factual - what the claim means, nothing invented
   around it. */
const ASSURANCES = [
  {
    icon: BadgeCheck,
    title: "Verified professionals",
    body: "KYC completed and skills checked before their first job.",
  },
  {
    icon: Wallet,
    title: "Fixed prices",
    body: "The price you see is the price you pay.",
  },
  {
    icon: ShieldCheck,
    title: "30-day warranty",
    body: "Covered for 30 days after the visit.",
  },
] as const;

export function AuthShell({
  children,
  heading,
  subheading,
  backHref,
  backLabel = "Back",
  showAssurance = true,
  detailedAssurance = true,
  showExtras = true,
}: AuthShellProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* The header shares the CONTENT container, not the viewport.

          It was `px-4 md:px-6 lg:px-8` on a full-width bar while everything
          below sits in a centred `max-w-screen-lg`. On any screen wider than
          that container the logo sat hard against the left edge with the
          headline beginning far to its right - two different left margins on
          one screen. The inner div matches the grid below it exactly, so the
          logo now starts on the same line as the panel headline. */}
      <header className="shrink-0 px-4 md:px-6 lg:px-8">
        <div className="mx-auto flex h-bar-lg w-full max-w-screen-lg items-center">
          {/* The mark is a link home: someone who reached a login page by
              accident must be able to leave without the browser's back
              button. */}
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 rounded-control",
              "transition-opacity duration-fast hover:opacity-80",
              "focus-visible:outline-none focus-visible:outline-focus",
            )}
          >
            <span className="grid size-touch place-items-center rounded-control bg-action text-on-action shadow-sm">
              <Logo className="size-5" />
            </span>
            {/* The lockup carries its tagline here as it does on the marketing
                header (`.logo-tag`, "Verified home services"). It was the
                wordmark alone, so the same brand appeared two different ways
                depending on which page you arrived from. */}
            <span className="leading-tight">
              <span className="block text-heading font-extrabold tracking-tight text-ink">
                CityFamilyCare
                <sup className="ml-px align-super text-caption font-extrabold tracking-wider text-promo">
                  CFC
                </sup>
              </span>
              <span className="block text-caption font-semibold uppercase tracking-wider text-ink-muted">
                Verified home services
              </span>
            </span>
          </Link>
        </div>
      </header>

      {/* TOP-ALIGNED, not vertically centred.

          `items-center` on a `flex-1` main centres the whole layout in
          whatever height is left. On /login, whose card is short, that reads
          fine. On /register the card is much taller, so centring pushed it
          DOWN - the heading started halfway down the screen and the last two
          fields fell below the fold, which is the empty space at the top of
          the screenshot.

          `pt-4` keeps it close under the header. A short card now sits high
          rather than floating in the middle, which is also the more
          conventional place for a form to start. */}
      <main className="flex flex-1 justify-center px-4 pb-8 pt-4 md:px-6 lg:px-8">
        <div
          className={cn(
            // `items-start`, not `items-center`: the panel should begin level
            // with the card, not float against the middle of it. On /register
            // the card is tall enough that centring dropped the headline well
            // below the card's own heading.
            // `gap-10` -> `lg:gap-14`. The assurance cards are capped at 30rem
            // and the panel column is wider than that, so at gap-10 the widest
            // card ended close enough to the login card that the two read as
            // one block with a seam. A little more air separates them without
            // the columns drifting apart.
            "grid w-full max-w-screen-lg items-start gap-8 lg:gap-12",
            showAssurance ? "lg:grid-cols-2" : "lg:max-w-md",
          )}
        >
          {/* ── The brand panel, desktop ──────────────────────────────────
              The headline is capped to a measure so it breaks where the
              sentence does, not mid-phrase, and the feature titles are stepped
              down to `text-small` so the heading leads instead of competing
              with three items set at the same weight. */}
          {showAssurance && (
            /* `pt-2`, not `pt-6`. The offset existed to drop the headline
               toward the card's own h1, but the card now opens with a back
               button, so its heading sits ~68px lower - and chasing that left
               the panel starting well below the card's top edge, which is the
               misalignment on screen. Near the top and let the card's chrome
               absorb the difference. */
            <section className="hidden lg:block lg:pt-2">
              {/* No width cap at all.

                  `max-w-line-2xl` was applied here as if it were a text
                  measure. It is not: `line-*` are SKELETON widths - line-md is
                  128px and line-2xl is 256px - so the headline was crushed
                  into a 256px column and broke after every second word. The
                  grid column already sets a sensible measure. */}
              {/* Orange on the PHRASE, not the whole headline.

                  The approved home page does exactly this - `.hero h1 em` and
                  `.welcome h1 em` both set one span of the headline in orange
                  and leave the rest in ink. Colouring the whole line would
                  turn a heading into a banner, and orange is the app's
                  rationed accent: it marks the words that carry the promise,
                  which here is what CFC removes. */}
              {/* Between the two display scales.

                  `text-section` tops out at 36px, which beside a 420px card
                  read as a subheading rather than as the page's statement.
                  `text-hero` is the next step up but reaches 60px - far too
                  large next to a form. This sits between them and keeps the
                  hero's tighter tracking, which is what stops a heading this
                  size looking slack. */}
              {/* "without the guesswork" named a problem and left the reader
                  to infer the fix. "booked in minutes" names the thing the
                  account actually gets them, which is what the screen is
                  asking them to create - and it is the promise the three
                  cards below then back up. */}
              <h2 className="text-section text-ink">
                Home services,{" "}
                <span className="text-promo">booked in minutes.</span>
              </h2>
              {/* `max-w-detail` (640px), NOT `max-w-prose` - that is 320px in
                  this preset, sized for empty-state copy, and would squeeze
                  this strapline into a column half the width it needs. The
                  arbitrary 46ch this replaced is banned by the house lint
                  rule, which is what failed the production build. */}
              {/* Reworded off the headline. It opened "One account to book…"
                  under a headline ending "booked in minutes", which said the
                  same word twice in two lines. */}
              <p className="mt-4 max-w-detail text-body leading-relaxed text-ink-muted">
                One account for every job — track it live, pay after the work
                is done, and know who is arriving before they knock.
              </p>

              {/* Cards, not floating text.

                  These were an icon and a label on the bare page, directly
                  above a row that HAS a rule and columns - so the structured
                  thing sat under the unstructured one and the panel read as
                  two unrelated blocks. On a white surface with a hairline they
                  become objects, matching how every other list in the app is
                  built, and the plates have a ground to sit on.

                  Alignment follows the content: one line centres against the
                  plate, two lines align to the top or the plate floats against
                  the middle of the block. */}
              <ul className="mt-8 space-y-3">
                {ASSURANCES.map(({ icon: Icon, title, body }, i) => (
                  <li
                    key={title}
                    className={cn(
                      "flex gap-3 rounded-card border border-border bg-surface p-4",
                      "max-w-detail shadow-sm",
                      // Hover: a teal edge and a real lift, matching every
                      // other card in the app. White-on-white gave the cursor
                      // nothing to respond to, so the cards read as inert.
                      "transition-all duration-base",
                      "hover:-translate-y-1 hover:border-action hover:shadow-md",
                      detailedAssurance ? "items-start" : "items-center",
                    )}
                  >
                    {/* Solid plates, alternating teal and blue, as the
                        approved grid does. A pale wash with tinted type is the
                        washed-out treatment the colour spec rejects. */}
                    <span
                      className={cn(
                        "grid size-tile shrink-0 place-items-center rounded-control text-on-action",
                        i === 1 ? "bg-clock" : "bg-action",
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-body font-bold text-ink">{title}</h3>
                      {detailedAssurance && (
                        <p className="mt-1 text-small leading-relaxed text-ink-muted">
                          {body}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* A quiet closing row, desktop only.

                  The panel is shorter than the card on every one of these
                  screens, so the column ran out well above the card's foot and
                  left a band of empty page under the last assurance. These
                  four are facts already true elsewhere in the app rather than
                  new claims, set small and muted so the row fills the space
                  without competing with the three items above it.

                  Not on mobile: there the panel is the compact strip above the
                  card, and a second row of anything would push the form down
                  the screen. */}
              {/* A 2x2 GRID, not a wrapping row.

                  `flex-wrap` let the four items break wherever they ran out of
                  width, which put three on one line and orphaned "7 AM - 11 PM
                  support" alone underneath - a ragged block rather than a
                  designed one. Two columns give four equal cells, and the
                  labels align down the left edge of each. */}
              {/* The rule is capped to the content, and the gap tightened.

                  `border-t` on a full-width grid drew a line all the way to
                  the column edge - which on a wide screen ran under the card
                  and read as overlapping it. `max-w-detail` ends the rule
                  where the text above it ends.

                  `gap-x-6` also pushed the second column far right of the
                  first, leaving a hole after "30-day warranty"; the columns
                  now sit close enough to read as one block. */}
              {/* No rule now that the three above are carded. A hairline under
                  a stack of bordered cards would be a fourth edge in the same
                  column - the cards already mark where the list ends. */}
              {showExtras && (
              <ul className="mt-6 grid max-w-detail grid-cols-2 gap-x-4 gap-y-3 px-1">
                {[
                  { icon: Clock, label: "Same-day slots" },
                  { icon: IndianRupee, label: "Pay after the job" },
                  { icon: MapPin, label: "Live tracking" },
                  { icon: Headset, label: "Support 7 AM – 11 PM" },
                ].map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 text-caption font-semibold text-ink-muted"
                  >
                    <Icon
                      className="size-4 shrink-0 text-action"
                      aria-hidden="true"
                    />
                    <span className="truncate">{label}</span>
                  </li>
                ))}
              </ul>
              )}
            </section>
          )}

          {/* ── The form ──────────────────────────────────────────────────
              420px, not 640px. Wide enough for a phone field and a six-box
              OTP row, narrow enough that neither floats in its own container. */}
          {/* `lg:ml-auto`, not `lg:mx-0`.

              The card is capped at 28rem inside a column wider than that, and
              `mx-0` pinned it to the column's LEFT edge - hard against the
              gap, with the spare width spilling off the right of the page. It
              now sits at the right edge, so that spare width becomes the gap
              between the assurance cards and the form. Raising `gap-14` did
              nothing for the same reason: the gap was already there, on the
              wrong side of the card. */}
          <div className="mx-auto w-full max-w-md lg:ml-auto lg:mr-0">
            <div className="overflow-hidden rounded-card border border-border bg-surface shadow-lg">
              {/* A teal edge, so the card is anchored to the brand rather than
                  floating as a neutral box. */}
              <div className="h-1 bg-action" aria-hidden="true" />

              <div className="p-6 md:p-8">
                {/* BACK, INSIDE THE CARD.

                    It was `text-small text-ink-muted` sitting OUTSIDE the card
                    - small grey text on a pale ground, reading as page
                    furniture rather than as a control, and easy to miss
                    entirely for anyone whose eyesight is less than perfect.

                    It is now a bordered 44px control at the top of the card,
                    in full ink, at the touch-target minimum. */}
                {backHref && (
                  <button
                    type="button"
                    onClick={() => router.push(backHref)}
                    className={cn(
                      "mb-5 inline-flex h-touch items-center gap-2 rounded-control border border-border",
                      "bg-surface pl-2 pr-4 text-small font-semibold text-ink",
                      // Orange on hover. Teal is this screen's action colour -
                      // the Send OTP button, the +91 cell, both links - so a
                      // teal hover here read as one more of the same. Orange
                      // is used nowhere else on the card, which makes the one
                      // control that leaves the page unmistakable.
                      "transition-colors duration-fast",
                      "hover:border-promo hover:bg-promo-subtle hover:text-promo",
                      "focus-visible:outline-none focus-visible:outline-focus",
                    )}
                  >
                    <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
                    {backLabel}
                  </button>
                )}

                <h1 className="text-title font-extrabold tracking-tight text-ink">
                  {heading}
                </h1>
                {subheading && (
                  <p className="mt-2 text-small leading-relaxed text-ink-muted">
                    {subheading}
                  </p>
                )}

                <div className="mt-6">{children}</div>
              </div>
            </div>

            {/* MOBILE TRUST STRIP.

                The brand panel is `hidden lg:block`, so below 1024px this
                column was the whole page: one card floating on an empty
                ground with nothing above or below it. That is why the phone
                looked unfinished next to the desktop.

                Not the full three-paragraph panel - that would push the form
                below the fold. Three items, icon over label, in a row. */}
            {showAssurance && (
              <ul className="mt-5 grid grid-cols-3 gap-2 lg:hidden">
                {ASSURANCES.map(({ icon: Icon, title }, i) => (
                  <li
                    key={title}
                    className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface p-3 text-center"
                  >
                    <span
                      className={cn(
                        "grid size-tile place-items-center rounded-control text-on-action",
                        i === 1 ? "bg-clock" : "bg-action",
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="text-caption font-bold leading-tight text-ink">
                      {title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
