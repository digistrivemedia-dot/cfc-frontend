"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/**
 * A code the user types in, one digit per box.
 *
 * The counterpart to `OtpDisplay`, which shows a code to be read aloud. This is
 * for entering one, and it is needed in two places that look similar and are
 * not:
 *
 *   auth      — a code the platform sent to this device by SMS
 *   Pro 18    — a code the CUSTOMER reads out to close a job
 *
 * The second case is why `autoComplete` is a prop rather than always
 * `one-time-code`. A browser offering to autofill the SMS it just received
 * would be filling in the wrong code entirely on the completion screen — the
 * code there belongs to the customer standing in front of the pro, not to the
 * pro's own phone. Offering an autofill that is guaranteed wrong is worse than
 * offering none.
 *
 * Behaviour that a plain row of inputs does not give you, and that a pro
 * entering a code one-handed in someone's hallway needs:
 *
 *   - typing advances, backspace on an empty box retreats
 *   - pasting a whole code fills every box, not just the first
 *   - arrow keys move between boxes
 *   - a non-digit is dropped rather than shown then rejected
 */

export interface OtpInputProps {
  value: string;
  onChange: (next: string) => void;
  length?: number | undefined;
  /**
   * `"one-time-code"` for a code sent to THIS device. `"off"` for a code read
   * aloud by someone else — see above.
   */
  autoComplete?: "one-time-code" | "off" | undefined;
  /** Fired when the last box is filled. Saves a pro reaching for Submit. */
  onComplete?: ((code: string) => void) | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  /** Labels the group for a screen reader. */
  label: string;
  className?: string | undefined;
}

export function OtpInput({
  value,
  onChange,
  length = 4,
  autoComplete = "one-time-code",
  onComplete,
  disabled = false,
  invalid = false,
  label,
  className,
}: OtpInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Held in a ref so an inline arrow from the caller does not re-fire the
  // completion on every render.
  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const digits = React.useMemo(
    () => Array.from({ length }, (_, i) => value[i] ?? ""),
    [value, length],
  );

  const set = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onCompleteRef.current?.(clean);
  };

  const focus = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  const handleChange = (i: number, raw: string) => {
    const typed = raw.replace(/\D/g, "");
    if (typed === "") return;

    // A whole code typed or autofilled into one box fills the rest.
    if (typed.length > 1) {
      set(value.slice(0, i) + typed);
      focus(i + typed.length);
      return;
    }

    const next = digits.slice();
    next[i] = typed;
    set(next.join(""));
    if (i < length - 1) focus(i + 1);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i] === "" && i > 0) {
        // Empty box: clear the previous one and step back, which is what
        // everyone expects and what a naive implementation gets wrong.
        e.preventDefault();
        const next = digits.slice();
        next[i - 1] = "";
        set(next.join(""));
        focus(i - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(i + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted === "") return;
    set(pasted);
    focus(Math.min(pasted.length, length - 1));
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex gap-2", className)}
      onPaste={handlePaste}
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          // `one-time-code` on every box makes some browsers autofill the whole
          // code into the first; the paste handler above then distributes it.
          autoComplete={i === 0 ? autoComplete : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`${label}, digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          // Selecting on focus means typing over a filled box replaces it
          // rather than being ignored for exceeding maxLength.
          onFocus={(e) => e.target.select()}
          className={cn(
            "size-tile-lg min-w-0 flex-1 rounded-control border text-center",
            "tabular text-title font-semibold text-ink",
            "transition-colors duration-fast",
            invalid
              ? "border-critical bg-critical-subtle"
              : "border-border bg-surface",
            "focus:border-action focus:outline-none focus:ring-2 focus:ring-focus",
            "disabled:bg-disabled disabled:text-disabled-ink",
          )}
        />
      ))}
    </div>
  );
}
