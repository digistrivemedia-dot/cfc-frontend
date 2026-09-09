"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * A code the customer reads out, rather than types.
 *
 * The opposite job from an OTP input: this is the number a customer shows a
 * professional to close a job, so it is optimised for being read aloud across
 * a room and copied down correctly — large, widely spaced, grouped in threes.
 *
 * Hidden by default. The code is the only thing standing between "work done"
 * and "work paid for", so it should not be sitting on screen while the phone
 * is face-up on a table. Revealing it is a deliberate act, and the label says
 * when to do it.
 */
export function OtpDisplay({
  code,
  /** Shown under the digits. Say when to share it, not what it is. */
  hint,
  /** Starts revealed. For a screen where the code is the whole point. */
  defaultVisible = false,
  className,
}: {
  code: string;
  hint?: string | undefined;
  defaultVisible?: boolean | undefined;
  className?: string | undefined;
}) {
  const [visible, setVisible] = React.useState(defaultVisible);

  // Grouped in threes: a six-digit run is read back wrong more often than two
  // groups of three, which is why every bank does it this way.
  const groups = React.useMemo(() => {
    const mid = Math.ceil(code.length / 2);
    return [code.slice(0, mid), code.slice(mid)];
  }, [code]);

  return (
    <div
      className={cn(
        "rounded-card border border-clock-line bg-clock-subtle p-4 text-center",
        className,
      )}
    >
      <div className="flex items-center justify-center gap-3">
        {visible ? (
          <p
            className="tabular text-display font-semibold tracking-widest text-ink"
            // Read as one number, not as two words.
            aria-label={`Your code is ${code.split("").join(" ")}`}
          >
            {groups[0]}
            <span className="px-2 text-ink-faint" aria-hidden="true">
              ·
            </span>
            {groups[1]}
          </p>
        ) : (
          <p
            className="tabular text-display font-semibold tracking-widest text-ink-faint"
            aria-hidden="true"
          >
            ••• •••
          </p>
        )}

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide the code" : "Show the code"}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            "text-ink-muted transition-colors duration-fast hover:bg-surface hover:text-ink",
          )}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {hint !== undefined && (
        <p className="mt-2 text-caption text-ink-muted">{hint}</p>
      )}
    </div>
  );
}
