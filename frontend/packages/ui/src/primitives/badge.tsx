import * as React from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/**
 * Status pill.
 *
 * Neutral is the default and most statuses keep it. Approved, pending,
 * completed, offline, cancelled, draft — none of these earn a colour, because a
 * table where twenty rows are coloured is a table where nothing stands out. The
 * DOT carries the reading: filled for an active state, hollow for an inactive
 * one. Shape first, colour last.
 *
 * Three tones spend colour, and only these three:
 *
 *   live      something is happening right now — a pro is online, a job is in
 *             progress, tracking is live. A state, never an outcome.
 *   clock     a countdown is running — an SLA window, an accept timer, an
 *             expiring slot. Amber means "this expires", not "this is bad".
 *   critical  money lost or access revoked — blocked, failed, penalty applied,
 *             a negative balance, an overdue job.
 *
 * The working target is at most four coloured rows in any twenty. If a screen
 * exceeds that, the tone mapping is wrong, not the target.
 *
 * A screen never picks a tone directly. The domain badges in
 * components/status-badge.tsx map a status to a tone in one place, so the same
 * status is never coloured two ways on two screens.
 */
const badgeVariants = cva(
  [
    "inline-flex items-center gap-2 rounded-pill px-2 py-px",
    "text-caption font-medium whitespace-nowrap",
  ],
  {
    variants: {
      tone: {
        neutral: "bg-neutral-subtle text-neutral",
        live: "bg-live-subtle text-live-ink",
        clock: "bg-clock-subtle text-clock-ink",
        critical: "bg-critical-subtle text-critical-ink",
        /** @deprecated Use `live`. Kept so unmigrated screens still build. */
        success: "bg-live-subtle text-live-ink",
        /** @deprecated Use `clock`. */
        warning: "bg-clock-subtle text-clock-ink",
        /** @deprecated Use `critical`. */
        danger: "bg-critical-subtle text-critical-ink",
        /** @deprecated Use `clock`. */
        gain: "bg-clock-subtle text-clock-ink",
        /** @deprecated Use `live`, or `neutral` with a filled dot. */
        active: "bg-action-subtle text-action-press",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Renders a leading dot. `true` fills it, `"hollow"` outlines it.
   *
   * This is what lets a neutral pill still say something: filled means the
   * state is active, hollow means it is not. Two greys, two meanings, no colour
   * spent.
   */
  dot?: boolean | "hollow" | undefined;
  /** Turns the pill into a removable filter chip. */
  onRemove?: (() => void) | undefined;
  /** Accessible label for the remove button, e.g. "Remove area filter". */
  removeLabel?: string | undefined;
}

export function Badge({
  className,
  tone,
  dot,
  onRemove,
  removeLabel = "Remove",
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "size-2 shrink-0 rounded-full",
            dot === "hollow"
              ? "border border-current bg-transparent"
              : "bg-current",
          )}
        />
      )}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="-mr-1 rounded-pill p-px text-current transition-colors duration-fast hover:bg-surface"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

export { badgeVariants };
