"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@cfc/ui";
import { Logo } from "@/components/logo";

/**
 * The shell around every onboarding screen.
 *
 * Deliberately not the consumer's `AuthShell`, which was rebuilt for a
 * modal-first flow: a customer signs in mid-booking and should not lose the
 * page they were on. A pro's onboarding is the opposite shape — a **linear
 * nine-step journey ending in a KYC review** that they may abandon and return
 * to days later, and that cannot be raised over anything because there is
 * nothing behind it yet.
 *
 * So this shell does the one thing the consumer's does not need to: it shows
 * where the pro is in the sequence. Registration flows are abandoned when
 * someone cannot tell how much is left, and "Aadhaar, PAN, bank details and a
 * selfie" is a lot to ask of someone who has no idea whether they are a third
 * of the way in or a tenth.
 *
 * ## Navy, unlike the consumer's canvas
 *
 * The pro app's chrome is navy throughout — rail, top bar, browser theme
 * colour. Onboarding on white canvas would read as a different product, and
 * the first impression of the app is exactly where that matters.
 */

/**
 * The nine onboarding steps, in order.
 *
 * `1` (splash) is not here: it is a routing decision the pro never interacts
 * with, and counting it would make the progress indicator lie about how much
 * work is left.
 */
export const ONBOARDING_STEPS = [
  { key: "register", label: "Your details" },
  { key: "otp", label: "Verify number" },
  { key: "profile", label: "Profile" },
  { key: "documents", label: "Documents" },
  { key: "bank", label: "Payment" },
  { key: "terms", label: "Terms" },
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]["key"];

export function OnboardingShell({
  children,
  heading,
  subheading,
  step,
  backHref,
}: {
  children: React.ReactNode;
  heading: string;
  subheading?: string | undefined;
  /** Omitted on screens outside the sequence — login, approval pending. */
  step?: OnboardingStep | undefined;
  backHref?: string | undefined;
}) {
  const index =
    step === undefined
      ? -1
      : ONBOARDING_STEPS.findIndex((s) => s.key === step);

  return (
    <div className="flex min-h-screen flex-col bg-structure">
      {/* Brand, and the way back. */}
      <header className="flex h-bar shrink-0 items-center gap-3 px-4 md:px-6">
        {backHref !== undefined ? (
          <Link
            href={backHref}
            aria-label="Go back"
            className={cn(
              "flex size-touch shrink-0 items-center justify-center rounded-control",
              "text-on-structure-muted transition-colors duration-fast",
              "hover:bg-structure-raised hover:text-on-structure",
            )}
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        ) : (
          <span className="flex items-center gap-2">
            <Logo className="size-6 text-brand" />
            <span className="text-heading font-semibold tracking-tight text-on-structure">
              CFC Pro
            </span>
          </span>
        )}
      </header>

      {/* Where they are. Omitted outside the sequence. */}
      {index >= 0 && <StepBar index={index} />}

      <main className="flex flex-1 flex-col px-4 py-6 md:px-6">
        <div className="mx-auto w-full max-w-detail">
          <h1 className="text-title font-semibold text-on-structure md:text-display">
            {heading}
          </h1>
          {subheading !== undefined && (
            <p className="mt-2 max-w-prose text-small text-on-structure-muted md:text-body">
              {subheading}
            </p>
          )}

          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

/**
 * The progress indicator.
 *
 * Two presentations, because six labelled steps do not fit across 390px and
 * dropping to numbers alone loses the information that makes the bar worth
 * having — a pro wants to know what is *coming*, not only how many boxes
 * remain.
 *
 *   Mobile  — a filled bar plus "Step 3 of 6 · Documents". The current step is
 *             named; the rest are implied.
 *   Desktop — all six as labelled dots, so the whole sequence is legible and a
 *             pro can see that "Documents" is followed by only two more.
 */
function StepBar({ index }: { index: number }) {
  const total = ONBOARDING_STEPS.length;
  const current = ONBOARDING_STEPS[index];
  const percent = Math.round(((index + 1) / total) * 100);

  return (
    <div className="shrink-0 border-b border-structure-line px-4 pb-4 md:px-6">
      {/* Mobile. */}
      <div className="md:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-caption font-medium text-on-structure">
            Step {index + 1} of {total}
            {current !== undefined && (
              <span className="font-normal text-on-structure-muted">
                {" · "}
                {current.label}
              </span>
            )}
          </p>
          <p className="tabular text-caption text-on-structure-faint">
            {percent}%
          </p>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-pill bg-structure-raised"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label="Onboarding progress"
        >
          <div
            className="h-full rounded-pill bg-brand transition-size duration-base"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Desktop. */}
      <ol className="hidden items-center gap-2 md:flex">
        {ONBOARDING_STEPS.map((s, i) => {
          const done = i < index;
          const active = i === index;
          return (
            <li key={s.key} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full",
                  "text-caption font-semibold",
                  done
                    ? "bg-brand text-on-action"
                    : active
                      ? "bg-brand text-on-action"
                      : "border border-structure-line text-on-structure-faint",
                )}
                aria-hidden="true"
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "min-w-0 truncate text-caption",
                  active
                    ? "font-semibold text-on-structure"
                    : done
                      ? "text-on-structure-muted"
                      : "text-on-structure-faint",
                )}
              >
                {s.label}
              </span>
              {i < ONBOARDING_STEPS.length - 1 && (
                <span
                  className={cn(
                    "h-px min-w-0 flex-1",
                    done ? "bg-brand" : "bg-structure-line",
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * A card on the navy ground.
 *
 * Onboarding forms sit on `surface` rather than directly on navy, because a
 * form field on a dark ground needs either a light field or a dark one with a
 * carefully tuned border, and the design system's inputs are built for light
 * surfaces. Fighting that would mean either off-token colours or unreadable
 * fields.
 */
export function OnboardingCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-4 md:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
