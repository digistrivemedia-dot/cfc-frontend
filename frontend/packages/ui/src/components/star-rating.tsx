import { Star } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * A rating, shown.
 *
 * Display only — the interactive version a customer submits (Customer 30)
 * arrives with that screen and will share this file.
 *
 * Two sizes, because a rating appears in two very different jobs: inline
 * beside a service name, where it is a supporting figure, and standalone on a
 * review, where it is the point.
 *
 * Half stars are rendered by clipping a filled star rather than by a separate
 * glyph, so 4.5 reads as four and a half rather than rounding to a lie in
 * either direction. The number beside it is authoritative; the stars are the
 * thing the eye reads first.
 */
export function StarRating({
  /** 0-5. Rendered to one decimal beside the stars. */
  value,
  /** Shown in brackets after the rating, e.g. "128". Omit for none. */
  count,
  size = "sm",
  /** Hides the numeric value, leaving only the stars. */
  starsOnly = false,
  className,
}: {
  value: number;
  count?: number | undefined;
  size?: "sm" | "md";
  starsOnly?: boolean | undefined;
  className?: string | undefined;
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const starClass = size === "sm" ? "size-3" : "size-4";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        size === "sm" ? "text-caption" : "text-small",
        className,
      )}
      // One label for the whole control: five separate star images announce as
      // noise, and the number is what a reader actually wants.
      role="img"
      aria-label={
        count === undefined
          ? `Rated ${clamped.toFixed(1)} out of 5`
          : `Rated ${clamped.toFixed(1)} out of 5 from ${count} reviews`
      }
    >
      <span className="flex shrink-0 items-center gap-px" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, clamped - i));
          return (
            <span key={i} className="relative inline-flex">
              <Star className={cn(starClass, "text-border-strong")} />
              {fill > 0 && (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className={cn(starClass, "fill-star text-star")} />
                </span>
              )}
            </span>
          );
        })}
      </span>

      {!starsOnly && (
        <span className="tabular font-medium text-ink" aria-hidden="true">
          {clamped.toFixed(1)}
        </span>
      )}
      {!starsOnly && count !== undefined && (
        <span className="tabular text-ink-muted" aria-hidden="true">
          ({count})
        </span>
      )}
    </span>
  );
}
