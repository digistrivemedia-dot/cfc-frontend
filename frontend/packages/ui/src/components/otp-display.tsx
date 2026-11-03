"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * A code the customer reads out, rather than types.
 *
 * The opposite job from `OtpInput`: this is the number a customer shows a
 * professional at their door, so it is built to be **found in a second and
 * read aloud without a mistake** — one large digit per tile, widely spaced,
 * high contrast.
 *
 * ## Why tiles and not a line of text
 *
 * It was a single run of digits inside a tinted box, which is fine to look at
 * and poor to use: a customer glancing at a phone held at arm's length while
 * somebody waits needs the number to be the loudest thing on screen, and
 * adjacent digits in one string get transposed when read aloud. Separating
 * them is why every delivery and ride app does this, and the reason is
 * legibility under pressure rather than decoration.
 *
 * ## Hiding
 *
 * `hidden` is opt-in now rather than the default. A code that must be covered
 * is one the customer has to uncover at exactly the moment they are talking to
 * someone — two taps and a hunt. The completion code is worth protecting,
 * because it is what stands between "work done" and "work paid for". A start
 * code is not: it only begins a job the customer booked.
 */
export function OtpDisplay({
  code,
  /** Above the digits. Names the code so two cannot be confused. */
  title,
  /** Below. Say *when* to share it, not what it is. */
  hint,
  /** Covers the digits behind a reveal. For the completion code. */
  concealed = false,
  /** `action` for the start code, `clock` for the one that closes a job. */
  tone = "action",
  className,
}: {
  code: string;
  title?: string | undefined;
  hint?: string | undefined;
  concealed?: boolean | undefined;
  tone?: "action" | "clock" | undefined;
  className?: string | undefined;
}) {
  const [visible, setVisible] = React.useState(!concealed);

  const digits = code.split("");

  return (
    <div
      className={cn(
        "rounded-card border",
        tone === "clock"
          ? "border-clock-line bg-clock-subtle"
          : "border-action-line bg-action-subtle",
        className,
      )}
    >
      <div className="p-4 text-center">
        {title !== undefined && (
          <p
            className={cn(
              "text-caption font-semibold uppercase tracking-wide",
              tone === "clock" ? "text-clock-ink" : "text-action",
            )}
          >
            {title}
          </p>
        )}

        <div className="mt-3 flex items-center justify-center gap-2">
          {visible ? (
            <ol
              className="flex items-center gap-2"
              // Read as one number by a screen reader, not as four list items.
              aria-label={`Your code is ${digits.join(" ")}`}
            >
              {digits.map((digit, i) => (
                <li
                  key={`${i}-${digit}`}
                  aria-hidden="true"
                  className={cn(
                    "flex size-tile items-center justify-center rounded-control",
                    "border bg-surface shadow-sm",
                    "tabular text-title font-bold text-ink md:text-display",
                    tone === "clock" ? "border-clock-line" : "border-action-line",
                  )}
                >
                  {digit}
                </li>
              ))}
            </ol>
          ) : (
            <ol className="flex items-center gap-2" aria-hidden="true">
              {digits.map((_, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex size-tile items-center justify-center rounded-control",
                    "border border-border bg-surface",
                    "text-title font-bold text-ink-faint",
                  )}
                >
                  •
                </li>
              ))}
            </ol>
          )}

          {concealed && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide the code" : "Show the code"}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                "text-ink-muted transition-colors duration-fast",
                "hover:bg-surface hover:text-ink",
              )}
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          )}
        </div>

        {hint !== undefined && (
          <p className="mt-3 text-caption text-ink-muted">{hint}</p>
        )}
      </div>
    </div>
  );
}
