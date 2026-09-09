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
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* The mark is a link home. Someone who reached a login page by accident
          — or who wants to look around before committing — must be able to
          leave without using the browser's back button. */}
      <header className="flex h-bar-lg shrink-0 items-center px-4 md:px-6">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 rounded-control",
            "transition-opacity duration-fast hover:opacity-80",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          <Logo className="size-mark text-action" />
          <span className="text-heading font-semibold tracking-tight text-ink">
            City Family Care
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

            {/* The card. A border and a small shadow, not a floating slab —
                the page behind it is plain canvas, so it does not need to
                fight for separation. */}
            <div className="rounded-card border border-border bg-surface p-6 shadow-sm md:p-8">
              <h1 className="text-title font-semibold tracking-tight text-ink">
                {heading}
              </h1>
              {subheading && (
                <p className="mt-2 text-small leading-relaxed text-ink-muted">
                  {subheading}
                </p>
              )}

              <div className="mt-6">{children}</div>
            </div>

            {showAssurance && (
              <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {ASSURANCES.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 text-caption text-ink-muted"
                  >
                    <Icon
                      className="size-4 shrink-0 text-action"
                      aria-hidden="true"
                    />
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
