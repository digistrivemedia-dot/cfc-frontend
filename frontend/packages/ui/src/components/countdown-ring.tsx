"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import { usePrefersReducedMotion } from "../lib/use-prefers-reduced-motion";

/**
 * A countdown, as a ring around its own number.
 *
 * Built for the pro app's job alert (Pro 12), where the agreement gives a pro
 * **30 seconds** to accept before the job goes to someone else. That deadline
 * is real money, so the display has three jobs and all three matter:
 *
 *   1. **Say the number.** A ring alone tells you time is passing, not how
 *      much is left. The digits are the primary information.
 *   2. **Be readable at a glance.** The ring is the peripheral signal — a pro
 *      glancing up from a phone sees how much is gone without reading.
 *   3. **Never mislead.** It counts down against a real clock rather than
 *      ticking a counter, so a backgrounded tab or a throttled timer cannot
 *      leave it showing 18 seconds when 3 remain.
 *
 * ## Why wall-clock rather than a decrementing counter
 *
 * `setInterval` in a background tab is throttled to once a second at best and
 * frequently much worse. A counter that decrements per tick therefore *drifts*,
 * and drifts in the direction that hurts: it shows more time than exists. Every
 * frame here recomputes from `Date.now()` against a fixed deadline, so the
 * display is either correct or the timer has already fired.
 *
 * ## Colour
 *
 * `clock` (amber) throughout, which is this design system's "a countdown is
 * running" tone, turning `critical` in the last few seconds. Amber does not
 * mean "bad" here — it means "this expires".
 */

export interface CountdownRingProps {
  /** Total window, in seconds. 30 for a job alert. */
  seconds: number;
  /** Fired once, when the window closes. */
  onExpire?: (() => void) | undefined;
  /** Below this many seconds remaining, the ring turns critical. */
  urgentAt?: number | undefined;
  /** Pauses the countdown — an accepted job should not keep ticking. */
  paused?: boolean | undefined;
  className?: string | undefined;
}

/** Geometry of the SVG. Fixed, because the ring is a fixed-size component. */
const SIZE = 96;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownRing({
  seconds,
  onExpire,
  urgentAt = 10,
  paused = false,
  className,
}: CountdownRingProps) {
  const reduceMotion = usePrefersReducedMotion();

  // The deadline is fixed the moment the component mounts. Everything else is
  // derived from it, which is what makes the display drift-proof.
  const deadlineRef = React.useRef<number>(Date.now() + seconds * 1000);
  const [remaining, setRemaining] = React.useState(seconds);

  // `onExpire` is held in a ref so a caller passing an inline arrow does not
  // restart the countdown on every render — which would make the timer never
  // finish.
  const onExpireRef = React.useRef(onExpire);
  React.useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  React.useEffect(() => {
    if (paused) return;

    let frame = 0;
    let fired = false;

    const tick = () => {
      const left = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
      setRemaining(left);

      if (left <= 0) {
        if (!fired) {
          fired = true;
          onExpireRef.current?.();
        }
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [paused]);

  // Ceiling, so a pro sees "1" for the whole final second rather than a "0"
  // sitting there while the window is technically still open.
  const display = Math.ceil(remaining);
  const urgent = remaining <= urgentAt;
  const fraction = Math.max(0, Math.min(1, remaining / seconds));

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: SIZE, height: SIZE }}
      // One live region for the whole control. `assertive` because a closing
      // window is not something to mention when convenient — but see the
      // announcement text below, which is deliberately not every second.
      role="timer"
      aria-live="assertive"
      aria-atomic="true"
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
        // Rotated so the ring drains from twelve o'clock, which is what
        // everyone reads as "a timer".
        className="-rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className={urgent ? "stroke-critical-subtle" : "stroke-clock-subtle"}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          className={urgent ? "stroke-critical" : "stroke-clock"}
          // No CSS transition: the value is recomputed every frame, so the
          // motion is already smooth. A transition on top would lag behind the
          // real deadline and show more time than remains.
          style={reduceMotion ? { transition: "none" } : undefined}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "tabular text-title font-semibold leading-none",
            urgent ? "text-critical-ink" : "text-clock-ink",
          )}
        >
          {display}
        </span>
        <span className="mt-px text-caption text-ink-muted">sec</span>
      </div>

      {/* What a screen reader actually hears. Announcing every second would
          make the rest of the dialog unreadable, so it speaks at the points a
          decision changes: the start, ten seconds, and five. */}
      <span className="sr-only">
        {display === seconds
          ? `${seconds} seconds to accept this job`
          : display === 10 || display === 5
            ? `${display} seconds left`
            : ""}
      </span>
    </div>
  );
}
