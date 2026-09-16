"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, ShieldCheck, Wallet } from "lucide-react";
import { cn } from "@cfc/ui";
import { Logo } from "@/components/logo";

/**
 * The shell around every auth screen.
 *
 * Rebuilt. The previous version was a two-column page: a tall navy marketing
 * panel on the left repeating the value proposition, and a small form on the
 * right. Three things were wrong with it.
 *
 * **It re-sold to someone who had already decided.** A person looking at a
 * login form does not need to be told about the 30-day warranty — they came to
 * sign in. Marketing belongs on the homepage, which is now the front door.
 *
 * **It was a full-page interruption.** Signing in during a booking threw away
 * the page the customer was on. Auth is now usually raised as a modal over
 * that page (see `AuthDialog`); this shell serves direct links, password
 * managers and deep links, so it has to stand alone but must not shout.
 *
 * **It was built out of classes this design system does not have.**
 * `bg-white/10`, `rounded-2xl`, `text-white`, `shadow-lg` and `backdrop-blur-md`
 * generate no CSS here — the palette, radii and shadows are closed scales — so
 * the "glassmorphism" rendered as flat navy with dark, barely legible text.
 * Everything below is a real token.
 *
 * What is left is what the job needs: the mark, one heading, the form, and a
 * single line of reassurance. Centred, on canvas, at a width where a phone
 * number field is comfortable and nothing else competes.
 */

interface AuthShellProps {
  children: React.ReactNode;
  heading: string;
  subheading?: string | undefined;
  backHref?: string | undefined;
  backLabel?: string | undefined;
  /**
   * Hidden on the OTP step: a customer who has already typed their number is
   * mid-flow, and three trust badges under the code boxes read as filler.
   */
  showAssurance?: boolean | undefined;
}

const ASSURANCES = [
  { icon: ShieldCheck, label: "30-day warranty" },
  { icon: BadgeCheck, label: "Verified pros" },
  { icon: Wallet, label: "Fixed prices" },
] as const;

export function AuthShell({
  children,
  heading,
  subheading,
  backHref,
  backLabel = "Back",
  showAssurance = true,
}: AuthShellProps) {
  const router = useRouter();

  return (
    // bg-canvas is #F1FAFB, the approved hero ground, so the plane the card
    // sits on is the same one the home page opens with.
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* The mark is a link home. Someone who reached a login page by accident
          — or who wants to look around before committing — must be able to
          leave without using the browser's back button. */}
      <header className="flex h-bar-lg shrink-0 items-center px-4 md:px-6">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-control",
            "transition-opacity duration-fast hover:opacity-80",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          {/* The approved lockup, matching the home page header: the mark on a
              filled teal tile, the wordmark set tight as one word, and CFC as a
              true orange superscript. It was a bare teal glyph beside "City
              Family Care" in three words - a different brand presentation on
              the screen a customer reaches directly from that header. */}
          <span className="grid size-touch place-items-center rounded-control bg-action text-on-action shadow-sm">
            <Logo className="size-5" />
          </span>
          <span className="text-heading font-extrabold tracking-tight text-ink">
            CityFamilyCare
            <sup className="ml-px align-super text-caption font-extrabold tracking-wider text-promo">
              CFC
            </sup>
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 md:items-center md:pb-panel md:pt-0">
        <div className="w-full max-w-screen-sm">
          <div className="mx-auto w-full max-w-detail">
            {backHref && (
              <button
                type="button"
                onClick={() => router.push(backHref)}
                className={cn(
                  "mb-4 inline-flex items-center gap-1 rounded-control py-1",
                  "text-small text-ink-muted",
                  "transition-colors duration-fast hover:text-ink",
                  "focus-visible:outline-none focus-visible:outline-focus",
                )}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {backLabel}
              </button>
            )}

            {/* The card, given the weight the approved design gives its
                floating surfaces. It was a flat white rectangle with a hairline
                and a near-invisible shadow: correct tokens, no presence. The
                home page lifts anything that floats above the page plane
                (--shadow-float on the hero card, the cart, the popovers), and
                this card is the only object on the screen. */}
            <div className="overflow-hidden rounded-card border border-border bg-surface shadow-lg">
              {/* A teal hairline across the top, echoing the filled mark above
                  it, so the card is anchored to the brand rather than floating
                  as a neutral box. */}
              <div className="h-1 bg-action" aria-hidden="true" />

              <div className="p-6 md:p-8">
                <h1 className="text-title font-extrabold tracking-tight text-ink md:text-title-lg">
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

            {/* A SOLID blue glyph plate on a white pill, which is how the
                approved home page makes a small object read as bright: colour
                goes on the object, not behind the text.

                These were pale-blue text on a #E9F0FC wash - a near-white
                ground under low-contrast type, which is exactly why the row
                looked dull and washed out. The label now sits in full ink on
                white, and the colour does its work in the plate beside it. */}
            {showAssurance && (
              <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {ASSURANCES.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className={cn(
                      "flex items-center gap-2 rounded-pill border border-border bg-surface",
                      "py-1 pl-1 pr-4 text-caption font-bold text-ink shadow-sm",
                    )}
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-clock text-on-action">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    {label}
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
